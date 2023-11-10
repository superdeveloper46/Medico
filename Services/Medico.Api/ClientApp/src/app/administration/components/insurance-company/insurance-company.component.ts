import { Component, ViewChild } from '@angular/core';
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
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';

@Component({
  selector: 'app-insurance-company',
  templateUrl: './insurance-company.component.html',
  styleUrls: ['./insurance-company.component.sass'],
})
export class InsuranceCompanyComponent extends BaseAdminComponent {
  @ViewChild('insCompDataGrid', { static: false })
  insCompDataGrid!: DxDataGridComponent;
  @ViewChild('insCompAddPopup', { static: false })
  insCompAddPopup!: DxPopupComponent;
  @ViewChild('insuranceCompanyForm', { static: false })
  insuranceCompanyForm!: DxFormComponent;

  insuranceCompany: any = {};
  selectedCategories: Array<any> = [];
  isInsCompFormOpened = false;
  insCompDataSource: any = {};
  loading = false;
  isNewCompany = true;
  title = 'ADD INSURANCE COMPANY';
  companyId: string = '';

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
    this.insCompDataGrid.instance.refresh();
  }

  openInsCompForm() {
    this.title = 'ADD INSURANCE COMPANY';
    this.isNewCompany = true;
    this.insuranceCompany = {};
    this.isInsCompFormOpened = true;
  }

  createUpdateInsComp() {
    const validationResult = this.insuranceCompanyForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    const apiUrl = 'insurance/company';
    this.repositoryService.create(apiUrl, this.insuranceCompany).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isInsCompFormOpened = false;
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
    this.initInsCompDataSource();
  }

  private initInsCompDataSource(): any {
    const medicationUpdateItemStore = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('insurance/company'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });

    this.insCompDataSource.store = medicationUpdateItemStore;
  }

  deleteCompany(company: any) {
    this.isInsCompFormOpened = true;
    this.companyId = company.id;
    this.title = 'DELETE INSURANCE COMPANY';

    this.bindDetails(this.companyId);
  }

  deleteConfirm() {
    const apiUrl = `insurance/company/${this.companyId}`;
    this.repositoryService.delete(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.refreshInsCompDataGrid();
          this.isInsCompFormOpened = false;
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

  onCompanySelected($event: any) {
    this.title = 'EDIT INSURANCE COMPANY';
    const selectedCompany = $event.selectedRowsData[0];
    if (!selectedCompany) return;

    const selectedCompanyId = $event.selectedRowsData[0].id;

    this.bindDetails(selectedCompanyId);
  }

  private bindDetails(selectedCompanyId: any) {
    const apiUrl = `insurance/company/${selectedCompanyId}`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.insuranceCompany = res.data;
          this.isNewCompany = false;
          this.isInsCompFormOpened = true;
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

  get zipMask(): string {
    switch (this.insuranceCompany.lookUpZipCode.zipCodeTypeId) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      // case ZipCodeType.NineDigit:
      default:
        return this.validationMasks.nineDigitZip;
    }
  }
}
