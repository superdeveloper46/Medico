import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { OrderSummary } from 'src/app/_models/orderSummary';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-patient-orders',
  templateUrl: './patient-orders.component.html',
  styleUrls: ['./patient-orders.component.scss'],
})
export class PatientOrdersComponent implements OnInit {
  @ViewChild('labOrderDataGrid', { static: false })
  labOrderDataGrid!: DxDataGridComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;

  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() patientId?: string;
  @Input() appointmentId?: string;

  tabs: any[] = [
    {
      id: 0,
      text: 'New Order',
      icon: 'card',
      content: 'User tab content',
    },
    {
      id: 1,
      text: 'Past Orders',
      icon: 'folder',
      content: 'Comment tab content',
    },
  ];

  orderStatusList = [];

  selectedTabIndex = 0;
  selectedInnerTabIndex = 0;
  orderSummary: OrderSummary = {
    total: 0,
    open: 0,
    completed: 0,
  };
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  selectedOrders: any;
  labOrderDataSource: any = [];
  origDataSource: any = [];

  data: any[] = [
    { Id: 1, Item_Name: 'All Orders' },
    { Id: 2, Item_Name: 'In Process' },
    { Id: 3, Item_Name: 'Completed' },
  ];

  maxLength = 1000;
  // tabPanelIndex: number;
  loading = false;
  companyIdSubscription?: Subscription;
  isEditPopupOpened = false;
  previewData: any[] = [];
  previewItemData: any[] = [];
  insuranceCompanies: any[] = [];
  physicianData: any[] = [];
  vendorDdl: any[] = [];

  dateOrdered: any;
  insuranceId: any;
  notes: any;
  vendorId: any;
  referenceNo: any;
  physicianId: any;
  orderId: any;
  categories: any;
  categoryId: any;
  searchData: any = {};
  filterCategories: any;
  filterCategoryId: any;
  overflowCategories: any;
  updateHeader: string = '';

  constructor(
    private repository: RepositoryService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
    this.bindStatus();
  }

  bindStatus() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageStatusList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.orderStatusList = JSON.parse(res.data[0].jsonValues);
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.bindPatientOrders();
        this.initInsuranceCompanyDataSource();
        this.bindPhysician();
        this.bindVendors();
        this.bindCategoryList();

        if (this.labOrderDataGrid && this.labOrderDataGrid.instance)
          this.labOrderDataGrid.instance.refresh();
      }
    });
  }

  selectTab(e: any) {
    if (this.selectedTabIndex !== e.itemIndex) this.selectedTabIndex = e.itemIndex;

    if (this.selectedTabIndex === 0) {
    }
    if (this.selectedTabIndex === 1) {
      this.bindPatientOrders();
    }
  }

  selectInnerTab(e: any) {
    if (this.selectedInnerTabIndex !== e.itemIndex)
      this.selectedInnerTabIndex = e.itemIndex;
  }

  changeSelection(_e: any) {}

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }

  isInnerTabVisible(tabId: number) {
    return this.selectedInnerTabIndex === tabId;
  }

  onCategoryChanged(e: any) {
    this.filterCategoryId = e.value || 'undefined';
    this.bindPatientOrders();
  }

  bindPatientOrders() {
    this.loading = true;
    const apiUrl = `order/patientOrders/${this.companyId}/${this.patientId}/${this.filterCategoryId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.labOrderDataSource = res.data as any[];
          this.origDataSource = this.labOrderDataSource;

          this.orderSummary = {
            completed: this.labOrderDataSource.filter(
              (c: any) => c.orderStatus === 'Completed'
            ).length,
            open: this.labOrderDataSource.filter(
              (c: any) => c.orderStatus !== 'Completed'
            ).length,
            total: this.labOrderDataSource.length,
          };
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  filter(orderStatus: string) {
    this.labOrderDataSource = this.origDataSource;
    if (orderStatus === 'All') {
      this.labOrderDataSource = this.origDataSource;
    } else if (orderStatus === 'Completed') {
      this.labOrderDataSource = this.labOrderDataSource.filter(
        (c: any) => c.orderStatus === orderStatus
      );
    } else {
      this.labOrderDataSource = this.labOrderDataSource.filter(
        (c: any) => c.orderStatus !== 'Completed'
      );
    }
  }

  getOrder(id: string) {
    this.orderId = id;
    this.isEditPopupOpened = true;
    this.loading = true;
    const apiUrl = `order/getPatientOrders/${this.companyId}/${id}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.previewData = res.data as any[];
          this.previewItemData = this.previewData[0].orderItems;

          const orderData = this.previewData[0];

          this.insuranceId = orderData.insuranceId;
          this.physicianId = orderData.physicianId;
          this.dateOrdered = orderData.dateOrdered;
          setTimeout(() => {
            this.notesEditor.insertContent(orderData.notes);
          }, 1000);
          this.vendorId = orderData.vendorId;
          this.referenceNo = orderData.referenceNo;

          const dateObj = new Date(orderData.patientDateOfBirth);
          const options: any = { year: 'numeric', month: 'long', day: 'numeric' };

          this.updateHeader = `<b>Name</b>: ${
            orderData.patientName
          } <b>DOB</b>: ${dateObj.toLocaleDateString(
            'en-US',
            options
          )} <b>Location</b>: ${orderData.patientLocation}`;
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  updateStatus() {
    // this.notes = this.notesEditor.content;
    this.loading = true;
    const apiUrl = `order/update`;
    const data = {
      id: this.orderId,
      appointmentId: this.appointmentId,
      dateOrdered: this.dateOrdered,
      insuranceId: this.insuranceId,
      physicianId: this.physicianId,
      vendorId: this.vendorId,
      referenceNo: this.referenceNo,
      notes: this.notes,
      patientOrderItems: this.previewItemData,
    };

    this.repository.update(apiUrl, data).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isEditPopupOpened = false;
          this.bindPatientOrders();

          if (this.labOrderDataGrid && this.labOrderDataGrid.instance)
            this.labOrderDataGrid.instance.refresh();
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  deleteOrder(id: string) {
    const result = confirm('Are you sure you want to delete this record?');
    if (result) {
      this.loading = true;
      const apiUrl = `order/patient-order-delete/${id}`;

      this.repository.delete(apiUrl).subscribe({
        next: _res => {
          this.loading = false;
          this.bindPatientOrders();
        },
        error: _error => {
          this.alertService.error('Error');
          this.loading = false;
        },
      });
    }
  }

  onStatusChanged(_e: any) {}

  private initInsuranceCompanyDataSource(): void {
    this.repository.getData(`insurance/company/dx/lookup`).subscribe({
      next: res => {
        this.insuranceCompanies = res.data;
      },
      error: error => {
        console.log(error);
      },
    });
  }

  bindPhysician() {
    this.repository.getData(`user/ddl?empType=1&companyId=${this.companyId}`).subscribe({
      next: res => {
        this.physicianData = res.data;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  bindVendors() {
    this.loading = true;
    const apiUrl = `vendorData/Get-Vendor`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.vendorDdl = res.data;
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  bindCategoryList() {
    this.loading = true;
    const apiUrl = `selectable-lists/categoryList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          const data = JSON.parse(res.data[0].jsonValues);
          this.categories = data.slice(0, 15);
          this.overflowCategories = data.slice(15, data.length);
          this.filterCategories = data;
          this.filterCategories.splice(0, 0, {
            value: 'All',
            description: 'All Orders',
          });
          if (this.categories.length > 0) {
            this.categoryId = this.categories[0].value;
            this.filterCategoryId = this.filterCategories[0].value;
          }
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  onSearchFieldChanged(_e: any) {}

  onNotesContentChanged(content: string) {
    this.notes = content;
  }
}
