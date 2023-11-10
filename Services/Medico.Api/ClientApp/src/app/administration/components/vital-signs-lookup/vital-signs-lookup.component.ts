import { Component, ViewChild } from '@angular/core';
import {
  DxDataGridComponent,
  DxPopupComponent,
  DxFormComponent,
} from 'devextreme-angular';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { AlertService } from 'src/app/_services/alert.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { Gender } from 'src/app/_classes/gender';

@Component({
  selector: 'vital-signs-lookup',
  templateUrl: './vital-signs-lookup.component.html',
  styleUrls: ['./vital-signs-lookup.component.sass'],
})
export class VitalSignsLookupComponent extends BaseAdminComponent {
  @ViewChild('lookUpDataGrid', { static: false })
  lookUpDataGrid!: DxDataGridComponent;
  @ViewChild('lookUpCompAddPopup', { static: false })
  lookUpCompAddPopup!: DxPopupComponent;
  @ViewChild('lookUpForm', { static: false })
  lookUpForm!: DxFormComponent;

  lookUpData: any = {};
  selectedCategories: Array<any> = [];
  isLookupFormOpened = false;
  gender: any[] = Gender.values;
  lookUpDataSource: any = {};
  loading = false;
  isNewLookUp = true;

  title = 'ADD NEW LOOK-UP VALUE';
  companyId: any;
  varModifierList = [
    { name: 'YY', value: 'YY' },
    { name: 'IN', value: 'IN' },
    { name: 'MM', value: 'MM' },
  ];
  valUnitsList = [
    { name: '%', value: '%' },
    { name: 'L/s', value: 'L/s' },
    { name: 'bpm', value: 'bpm' },
    { name: 'mm Hg', value: 'mm Hg' },
  ];

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();
    this.init();
  }

  refreshInsCompDataGrid() {
    this.lookUpDataGrid.instance.refresh();
  }

  openForm() {
    this.title = 'ADD NEW LOOK-UP VALUE';
    this.isNewLookUp = true;
    this.lookUpData = { varModifier: 'YY', valUnits: '%' };
    this.isLookupFormOpened = true;
  }

  createUpdateLookUp() {
    const validationResult = this.lookUpForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }
    const apiUrl = 'vitalsigns-lookup';
    this.repositoryService.create(apiUrl, this.lookUpData).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isLookupFormOpened = false;
          this.refreshInsCompDataGrid();
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

  private init(): any {
    this.initLookUpDataSource();
  }

  private initLookUpDataSource(): any {
    const medicationUpdateItemStore = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('vitalsigns-lookup'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });

    this.lookUpDataSource.store = medicationUpdateItemStore;
  }

  deleteCompany(company: any) {
    this.isLookupFormOpened = true;
    this.companyId = company.id;
    this.title = 'DELETE LOOK-UP VALUE';

    this.bindDetails(this.companyId);
  }

  deleteConfirm() {
    const apiUrl = `vitalsigns-lookup/${this.companyId}`;
    this.repositoryService.delete(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.refreshInsCompDataGrid();
          this.isLookupFormOpened = false;
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

  onRowSelected($event: any) {
    this.title = 'EDIT LOOK-UP VALUE';
    const selectedCompany = $event.selectedRowsData[0];
    if (!selectedCompany) return;

    const selectedCompanyId = $event.selectedRowsData[0].id;

    this.bindDetails(selectedCompanyId);
  }

  deleteRow(_$event: any) {
    throw 'deleteRow is not implemented';
  }

  private bindDetails(selectedCompanyId: any) {
    const apiUrl = `vitalsigns-lookup/${selectedCompanyId}`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        if (res) {
          this.lookUpData = res.data;
          this.isNewLookUp = false;
          this.isLookupFormOpened = true;
        }

        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }
}
