import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { AlertService } from 'src/app/_services/alert.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { DxFormComponent } from 'devextreme-angular';
import { RepositoryService } from 'src/app/_services/repository.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { Subscription } from 'rxjs';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { CompanyIdService } from 'src/app/_services/company-id.service';

@Component({
  selector: 'app-lab-tests-management',
  templateUrl: './lab-tests-management.component.html',
  styleUrls: ['./lab-tests-management.component.sass'],
})
export class LabTestsManagementComponent extends BaseAdminComponent implements OnInit {
  @ViewChild('labTestDataGrid', { static: false })
  labTestDataGrid!: DxDataGridComponent;
  @ViewChild('labTestAddPopup', { static: false })
  labTestAddPopup!: DxPopupComponent;
  @ViewChild('labTestForm', { static: false })
  labTestForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;

  labTest: any;
  isLabTestFormOpened = false;
  labTestDataSource: any = {};
  loading = false;
  isNewlabTest = true;
  title = 'ADD ORDER';
  labTestId: any;
  categories: any[] = [];
  procedureData: any;
  labTestId1: any;
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  diagnosisData: any;
  vendorDdl: any;

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private companyIdService: CompanyIdService,
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();
    //this.init();
  }

  refreshLabTestDataGrid() {
    this.labTestDataGrid.instance.refresh();
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.bindProcedureList();
      }
    });
  }

  openLabTestForm() {
    this.title = 'ADD ORDER';
    this.isNewlabTest = true;
    this.labTest = {};
    this.isLabTestFormOpened = true;
  }

  createUpdateLabTest() {
    const validationResult = this.labTestForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    this.labTest.notes = this.notesEditor.content;

    const apiUrl = `order`;
    this.repositoryService.create(apiUrl, this.labTest).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isLabTestFormOpened = false;
          this.refreshLabTestDataGrid();
          this.bindLabTests();
        } else {
          this.alertService.error(res.message);
        }

        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  updateLabTest() {
    this.labTest.notes = this.notesEditor.content;
    const apiUrl = `order/editLabTest`;
    this.repositoryService.update(apiUrl, this.labTest).subscribe({
      next: data => {
        if (data) {
          this.alertService.info('Lab Test Updated Successfully');
          this.isLabTestFormOpened = false;
          this.refreshLabTestDataGrid();
          this.bindLabTests();
        } else {
          this.alertService.error('Error');
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  onNotesContentChanged(content: string) {
    this.labTest.notes = content;
  }

  // private init(): any {
  //   this.initLabTestDataSource();
  // }

  private initLabTestDataSource(): any {
    const _medicationUpdateItemStore = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('labTest'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });

    //this.labTestDataSource.store = medicationUpdateItemStore;
  }

  deleteLabTest(labTest: any) {
    this.isLabTestFormOpened = false;
    this.labTestId = labTest;
    this.deleteConfirm(this.labTestId);
  }

  deleteConfirm(args: any) {
    const apiUrl = `order/deleteLabTest/${args}`;
    this.repositoryService.delete(apiUrl).subscribe({
      next: data => {
        if (data) {
          this.alertService.info('Lab Test Deleted Successfully');
          this.refreshLabTestDataGrid();
          this.bindLabTests();
        } else {
          this.alertService.error('Error');
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  editTest(args: any) {
    this.isLabTestFormOpened = true;
    this.title = 'EDIT ORDER';
    this.isNewlabTest = false;
    const selectedlabTestId = args;
    this.labTestId1 = selectedlabTestId;
    this.bindDetails(selectedlabTestId);
  }

  private bindDetails(selectedlabTestId: any) {
    const apiUrl = `order/labTest/${selectedlabTestId}`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: data => {
        this.labTest = data[0];
        console.log(this.labTest);
        setTimeout(() => {
          this.notesEditor.insertContent(this.labTest.notes);
        }, 2000);
        this.isNewlabTest = false;
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

  private bindLabTests() {
    const apiUrl = `order/getAllLabTest`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.labTestDataSource = res.data;
        } else {
          this.alertService.error(res.message);
        }

        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  bindCategoryList() {
    this.loading = true;
    const apiUrl = `selectable-lists/categoryList`;
    this.repositoryService.getData(apiUrl).subscribe({
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

  bindDiagnosisList() {
    this.loading = true;
    const apiUrl = `selectable-lists/diagnosisList`;
    this.repositoryService.getData(apiUrl).subscribe({
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

  bindProcedureList() {
    this.loading = true;
    const apiUrl = `selectable-lists/procedureList/${this.companyId}`;
    this.repositoryService.getData(apiUrl).subscribe({
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

  bindVendors() {
    this.loading = true;
    const apiUrl = `vendorData/Get-Vendor`;
    this.repositoryService.getData(apiUrl).subscribe({
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

  ngOnInit(): void {
    this.bindLabTests();
    this.bindProcedureList();
    this.subscribeToCompanyIdChanges();
    this.bindCategoryList();
    this.bindDiagnosisList();
    this.bindVendors();
  }
}
