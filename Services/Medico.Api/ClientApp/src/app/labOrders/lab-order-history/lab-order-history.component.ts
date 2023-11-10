import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { Subscription } from 'rxjs';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { OrderSummary } from 'src/app/_models/orderSummary';
import { PatientSearchFilter } from 'src/app/_models/patientSearchFilter';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { PatientService } from 'src/app/_services/patient.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-lab-order-history',
  templateUrl: './lab-order-history.component.html',
  styleUrls: ['./lab-order-history.component.scss'],
})
export class LabOrderHistoryComponent implements OnInit {
  @ViewChild('labOrderDataGrid', { static: false })
  labOrderDataGrid!: DxDataGridComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;

  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  selectedOrders: any;
  labOrderDataSource: any = [];
  origDataSource: any = [];
  dataSource: any = [];
  data: any[] = [
    { Id: 0, Item_Name: 'Total Orders' },
    { Id: 1, Item_Name: 'Open' },
    { Id: 2, Item_Name: 'Completed' },
  ];
  orderSummary: OrderSummary = {
    total: 0,
    open: 0,
    completed: 0,
  };
  loading = true;
  patients: any = [];
  searchData: any = {};
  patientId: any = '';
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  isDetailPopupOpen = false;
  orderStatusList = [
    { id: 0, text: 'Open' },
    { id: 1, text: "Won't be Available" },
    { id: 2, text: 'Delayed' },
    { id: 3, text: 'Completed' },
  ];
  statusList: any = [];
  previewList: any[] = [];
  categories: any;
  categoryId: any = '';
  statusId: number = -1;

  dateOrdered: any;
  insuranceId: any;
  notes: any;
  vendorId: any;
  referenceNo: any;
  physicianId: any;
  orderId: any;
  physicianData: any;
  vendorDdl: any;
  insuranceCompanies: any;
  employeeList: any = [];

  constructor(
    private companyIdService: CompanyIdService,
    private patientService: PatientService,
    private repository: RepositoryService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dataSource = new DataSource({
      store: new ArrayStore({
        data: this.data,
        key: 'Id',
      }),
      group: 'City',
      searchExpr: ['Item_Name'],
    });
    // this.bindPatients();
    // this.bindPatientOrders();
    this.subscribeToCompanyIdChanges();
    this.bindStatus();
  }

  bindStatus() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageStatusList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.statusList = JSON.parse(res.data[0].jsonValues);
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

  bindPatientOrders() {
    const categoryId = this.categoryId || 'undefined';
    const statusId = this.statusId || 1;
    const physicianId = this.physicianId || 'undefined';

    this.loading = true;

    const apiUrl = `order/all/${this.companyId}/${categoryId}/${statusId}/${this.searchData.patientId}/${physicianId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.labOrderDataSource = res.data as any[];
          this.origDataSource = this.labOrderDataSource;

          this.orderSummary = {
            completed: this.labOrderDataSource.filter((c: any) => c.orderStatus === 3)
              .length,
            open: this.labOrderDataSource.filter((c: any) => c.orderStatus === 1).length,
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

  bindPatients() {
    const patientSearchFilter = new PatientSearchFilter();

    patientSearchFilter.companyId = this.companyId;
    patientSearchFilter.firstName = '';
    patientSearchFilter.lastName = '';
    patientSearchFilter.ssn = '';

    this.patientService.getByFilter(patientSearchFilter).then(patients => {
      patients.length ? (this.patients = patients) : (this.patients = null);
      this.patients.forEach((element: any) => {
        let dob = DateHelper.sqlServerUtcDateToLocalJsDate(element.dateOfBirth) || '';
        if (dob) dob = dob.toLocaleString();
        element.firstName = `${element.firstName} ${element.lastName} ${dob}`;
      });
    });
  }

  bindCategoryList() {
    this.loading = true;
    const apiUrl = `selectable-lists/categoryList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.categories = JSON.parse(res.data[0].jsonValues);
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

        this.bindPatients();
        this.bindCategoryList();
        this.bindPatientOrders();
        this.initInsuranceCompanyDataSource();
        this.bindPhysician();
        this.bindVendors();

        if (this.labOrderDataGrid && this.labOrderDataGrid.instance)
          this.labOrderDataGrid.instance.refresh();
      }
    });
  }

  getDataSource() {
    return this.dataSource;
  }

  openOrderForm() {
    this.router.navigate(['/view-lab-tests']);
  }

  onOrderSelected(event: any) {
    this.previewList = event.selectedRowKeys[0].orderItems;
    this.dateOrdered = event.selectedRowKeys[0].createdOn;
    this.insuranceId = event.selectedRowKeys[0].insuranceId;
    this.notes = event.selectedRowKeys[0].notes;
    this.vendorId = event.selectedRowKeys[0].vendorId;
    this.referenceNo = event.selectedRowKeys[0].referenceNo;
    this.physicianId = event.selectedRowKeys[0].physicianId;
    this.orderId = event.selectedRowKeys[0].orderId;
    this.isDetailPopupOpen = true;

    setTimeout(() => this.getNote(this.notes), 1000);
  }

  getNote(args: any) {
    if (this.notesEditor) {
      this.notesEditor.insertContent(args);
    }
  }

  listSelectionChanged(_e: any) {
    //this.currentHotel = e.addedItems[0];
  }

  onSearchFieldChanged(_e: any) {}

  onPatientNameChanged(e: any) {
    this.patientId = e.value || '';
    this.bindPatientOrders();
  }

  onCategoryChanged(e: any) {
    this.categoryId = e.value || '';
    this.bindPatientOrders();
  }

  onPhysicianChanged(e: any) {
    this.physicianId = e.value || '';
    this.bindPatientOrders();
  }

  onOrderStatusChanged(e: any) {
    this.statusId = e.value || -1;
    this.bindPatientOrders();
  }

  updateStatus() {
    this.notes = this.notesEditor.content;
    this.loading = true;
    const apiUrl = `order/update`;
    const data = {
      id: this.orderId,
      dateOrdered: this.dateOrdered,
      insuranceId: this.insuranceId,
      physicianId: this.physicianId,
      vendorId: this.vendorId,
      referenceNo: this.referenceNo,
      notes: this.notes,
      patientOrderItems: this.previewList,
    };

    this.repository.update(apiUrl, data).subscribe({
      next: res => {
        this.isDetailPopupOpen = false;
        if (res.success) {
          this.alertService.info(res.message);
          this.bindPatientOrders();

          // if (this.labOrderDataGrid && this.labOrderDataGrid.instance)
          //   this.labOrderDataGrid.instance.refresh();
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

  onNotesContentChanged(content: string) {
    this.notes = content;
  }
}
