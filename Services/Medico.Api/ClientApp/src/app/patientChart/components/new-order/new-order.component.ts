import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { PatientOrder, PatientOrderItem } from 'src/app/_models/patientOrder';
import { AlertService } from 'src/app/_services/alert.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { Subscription } from 'rxjs';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { AdminRichTextEditorComponent } from 'src/app/share/components/admin-rich-text-editor/admin-rich-text-editor.component';
import { PhraseSuggestionHelperComponent } from '../../patient-chart-tree/components/phrase-suggestion-helper/phrase-suggestion-helper.component';

export interface PreviewItem {
  id?: number;
  code_Desc?: string;
  code?: string;
  codeType?: string;
  testFee: number;
  notes?: string;
  category?: number;
  quantity?: number;
  vendorId?: number;
  vendorName?: string;
}

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss'],
})
export class NewOrderComponent implements OnInit {
  @Input() categoryId!: number;
  @Input() patientId?: string;
  @Input() appointmentId?: string;
  @Input() physicianId?: string;
  @Input() insuranceId?: string;
  @Input() userId!: Array<any>;
  @Input() overflowCategories: any;

  vendorId: any;
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  insuranceCompanies: Array<any> = [];

  @ViewChild('labTestForm', { static: false })
  labTestForm!: DxFormComponent;

  @ViewChild('newTestDescriptionRichTextEditor', { static: false })
  newTestDescriptionRichTextEditor!: AdminRichTextEditorComponent;

  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  maxLength = 1000;
  notes: string = '';
  referenceNo?: string;
  dateOrdered: string | number | Date = new Date();
  reminderDate: string | number | Date = new Date();
  mostOrdered: any = [];
  mostOrderedOverflow: any = [];
  labTest: any;
  loading = false;
  labTests: any[] = [];
  source: any[] = [];
  physicianData = [];
  vendorDdl = [];
  target: any[] = [];
  isPreviewPopupOpened = false;
  patientOrder?: PatientOrder;
  format = {
    add: 'Add',
    remove: 'Remove',
    all: 'All',
    none: 'None',
    direction: 'left-to-right',
    draggable: true,
    locale: undefined,
  };
  previewList: PreviewItem[] = [];

  cateogryData = [];

  procedureData = [];
  diagnosisData: any;

  userDataSource: any = {};
  userData: any;
  isPhrasesHelperVisible: boolean = false;
  isOverflowFavoritePopupOpened: boolean = false;
  needReminderDate: boolean = true;

  constructor(
    private repository: RepositoryService,
    private companyIdService: CompanyIdService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private repositoryService: RepositoryService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
    this.bindLabTests();
    this.bindMostOrdered();
    this.bindVendors();
    this.bindCategoryList();
    this.bindProcedureList();
    this.initInsuranceCompanyDataSource();
    this.bindDiagnosisList();
    this.bindEmployee();
  }

  bindMostOrdered() {
    this.loading = true;
    const apiUrl = `order/most-ordered?categoryId=${this.categoryId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.mostOrdered = res.data.slice(0, 5);
          this.mostOrderedOverflow = res.data.slice(5, res.data.length);
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

  bindEmployee() {
    this.loading = true;
    const apiUrl = `user/medico-staff?companyId=${this.companyId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        this.userDataSource = res;
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
        this.bindPhysician();
      }
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

  bindLabTests() {
    this.loading = true;
    const apiUrl = `order?categoryId=${this.categoryId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.labTests = res.data;
          // const i = 1;
          res.data.forEach((element: any) => {
            this.source.push({
              _id: element.id,
              _name: `${element.code_Desc} ${
                element.testCode == null ? '' : '(' + element.testCode + ')'
              }`,
            });
          });
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

  getCatName() {
    switch (this.categoryId) {
      case 1:
        return 'In House';
      case 2:
        return 'Lab Tests';
      case 3:
        return 'Imaging';
      default:
        return '';
    }
  }

  bindCategoryList() {
    this.loading = true;
    const apiUrl = `selectable-lists/categoryList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.cateogryData = JSON.parse(res.data[0].jsonValues);
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

  bindProcedureList() {
    this.loading = true;
    const apiUrl = `selectable-lists/procedureList/${this.companyId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          //this.procedureData = JSON.parse(res.data[0].jsonValues);
          this.procedureData = res.data;
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

  bindDiagnosisList() {
    this.loading = true;
    const apiUrl = `selectable-lists/diagnosisList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          //this.procedureData = JSON.parse(res.data[0].jsonValues);
          this.diagnosisData = JSON.parse(res.data[0].jsonValues);
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

  onNotesContentChanged(_e: any) {}

  updateFee($event: Event, id?: number) {
    const fee = (<any>$event.target).value;
    if (!fee || !id) return;

    const apiUrl = `order/editLabTestFee/${id}`;
    this.repository.update(apiUrl, { testFee: fee }).subscribe({
      next: data => {
        if (data) {
        } else {
          this.alertService.error('Error');
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

  /*************** Patient Orders **********/
  preview() {
    if (this.target.length === 0) {
      this.alertService.warning('Please choose atleast one Test to Order');
      return;
    }

    this.previewList = [];
    this.target.forEach(element => {
      const detail = this.labTests.filter((c: any) => c.id == element._id)[0];
      detail.quantity = 1;
      this.previewList.push(detail);
    });

    this.isPreviewPopupOpened = true;
  }

  openOverflowFavoriteModal() {
    this.isOverflowFavoritePopupOpened = true;
  }

  physicianError = false;
  doneClick() {
    if (this.previewList.length === 0) {
      this.alertService.warning('Please choose atleast one Test to Order');
      return;
    }

    if (!this.physicianId) {
      this.physicianError = true;
      return;
    } else {
      this.physicianError = false;
    }

    const patientOrderItems: PatientOrderItem[] = [];
    this.previewList.forEach(element => {
      patientOrderItems.push({
        labTestId: element.id,
        quantity: element.quantity,
      });
    });

    this.patientOrder = {
      patientId: this.patientId || '',
      attachmentId: 0,
      notes: this.notes,
      referenceNo: undefined,
      physicianId: this.physicianId,
      insuranceId: this.insuranceId,
      vendorId: 1,
      dateOrdered: this.dateOrdered as Date,
      patientOrderItems: patientOrderItems,
      userIds: this.userId,
      appointmentId: this.appointmentId,
    };

    if (this.needReminderDate) {
      this.patientOrder.reminderDate = this.reminderDate as Date;
    }

    this.loading = true;
    const apiUrl = `order/patientOrder`;
    this.repository.create(apiUrl, this.patientOrder).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.previewList = [];
          this.target = [];
          // this.selectedTabIndex = 1;

          // this.bindPatientOrders();
          // if (this.labOrderDataGrid && this.labOrderDataGrid.instance)
          //   this.labOrderDataGrid.instance.refresh();
          this.isPreviewPopupOpened = false;
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

  private initInsuranceCompanyDataSource(): void {
    this.repositoryService.getData(`insurance/company/dx/lookup`).subscribe({
      next: res => {
        this.insuranceCompanies = res.data;
      },
      error: error => {
        console.log(error);
      },
    });
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.newTestDescriptionRichTextEditor) {
      this.newTestDescriptionRichTextEditor.insertContent(`${$event}`);
    }
  }
}
