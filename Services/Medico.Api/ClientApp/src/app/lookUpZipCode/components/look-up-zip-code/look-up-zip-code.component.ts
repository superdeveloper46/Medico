import { AfterViewInit, Component, ViewChild } from '@angular/core';
import {
  DxDataGridComponent,
  DxPopupComponent,
  DxFormComponent,
} from 'devextreme-angular';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { LookUpZipCode } from 'src/app/_models/lookUpZipCode';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyCreateUpdateTrackService } from 'src/app/_services/company-create-update-track.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { LookUpZipCodeService } from 'src/app/_services/lookUp-zipCode.service';
import { PatientIdentificationCodeType } from '../../models/enums/patientIdentificationCodeType';

@Component({
  selector: 'app-look-up-zip-code',
  templateUrl: './look-up-zip-code.component.html',
  styleUrls: ['./look-up-zip-code.component.sass'],
})
export class LookUpZipCodeComponent extends BaseAdminComponent implements AfterViewInit {
  @ViewChild('lookUpZipCodeDataGrid', { static: false })
  lookUpZipCodeDataGrid!: DxDataGridComponent;
  @ViewChild('lookUpZipCodePopup', { static: false })
  lookUpZipCodePopup!: DxPopupComponent;
  @ViewChild('lookUpZipCodeForm', { static: false })
  lookUpZipCodeForm!: DxFormComponent;

  lookUpZipCodeDataSource: any = {};

  selectedCompanys: Array<any> = [];

  lookUpZipCode: LookUpZipCode = new LookUpZipCode();
  isNewCompany = true;
  isCompanyPopupOpened = false;

  identificationCodeTypes = PatientIdentificationCodeType;

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private lookUpZipCodeService: LookUpZipCodeService,
    private companyCreateUpdateTrackService: CompanyCreateUpdateTrackService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();
    this.init();
  }

  get zipMask(): string {
    switch (this.lookUpZipCode.zipCodeTypeId) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      // case ZipCodeType.NineDigit:
      default:
        return this.validationMasks.nineDigitZip;
    }
  }

  isFiveDigitCode(zipCodeType: number): boolean {
    return zipCodeType === ZipCodeType.FiveDigit;
  }

  isNineDigitCode(zipCodeType: number): boolean {
    return zipCodeType === ZipCodeType.NineDigit;
  }

  openlookUpZipCodeForm() {
    this.isCompanyPopupOpened = true;
  }

  onCompanyPopupHidden() {
    this.resetCreateUpdateCompanyForm();
  }

  createUpdateLookUpZipCode() {
    const validationResult = this.lookUpZipCodeForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }
    // this.lookUpZipCode.zipCodeType === ZipCodeType.FiveDigit ? this.lookUpZipCode.zipCodeTypeId = 1 : 2;
    this.lookUpZipCode.aspNetUserId = '00000000-0000-0000-0000-000000000000';
    this.lookUpZipCode.companyId = '00000000-0000-0000-0000-000000000000';
    this.lookUpZipCode.createdBy = '00000000-0000-0000-0000-000000000000';
    this.lookUpZipCode.createdDate = '2022-02-04T15:37:48.097';
    this.lookUpZipCode.id =
      this.lookUpZipCode.id || '00000000-0000-0000-0000-000000000000';
    this.lookUpZipCode.name = undefined;
    this.lookUpZipCode.updateBy = '00000000-0000-0000-0000-000000000000';
    this.lookUpZipCode.updatedDate = '2022-02-04T16:56:49.633';

    this.lookUpZipCodeService
      .save(this.lookUpZipCode)
      .then(company => {
        this.lookUpZipCodeDataGrid.instance.refresh();
        this.resetCreateUpdateCompanyForm();
        this.isCompanyPopupOpened = false;
        this.companyCreateUpdateTrackService.emitCompanyChanges(company.id);
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  ngAfterViewInit(): void {
    this.registerEscapeBtnEventHandler(this.lookUpZipCodePopup);
  }

  deactivateCompany(company: any, $event: any) {
    $event.stopPropagation();
    const companyId = company.id;

    this.lookUpZipCodeService
      .getById(companyId)
      .then(company => {
        const confirmationPopup = this.alertService.confirm(
          `Are you sure you want to deactivate the "${company.name}" company ?`,
          'Confirm deactivation'
        );

        confirmationPopup.then(dialogResult => {
          if (dialogResult) {
            this.lookUpZipCodeService
              .save(company)
              .then(() => {
                this.lookUpZipCodeDataGrid.instance.refresh();
              })
              .catch(error =>
                this.alertService.error(error.message ? error.message : error)
              );
          }
        });
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  activateCompany(company: any, $event: any) {
    $event.stopPropagation();
    const companyId = company.id;

    this.lookUpZipCodeService
      .getById(companyId)
      .then(company => {
        const confirmationPopup = this.alertService.confirm(
          `Are you sure you want to activate the "${company.name}" company ?`,
          'Confirm activation'
        );

        confirmationPopup.then(dialogResult => {
          if (dialogResult) {
            this.lookUpZipCodeService
              .save(company)
              .then(() => {
                this.lookUpZipCodeDataGrid.instance.refresh();
              })
              .catch(error =>
                this.alertService.error(error.message ? error.message : error)
              );
          }
        });
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onCompanySelected($event: any) {
    const selectedCompany = $event.selectedRowsData[0];
    if (!selectedCompany) {
      return;
    }

    const selectedCompanyId = $event.selectedRowsData[0].id;
    this.lookUpZipCodeService
      .getById(selectedCompanyId)
      .then(company => {
        this.lookUpZipCode = company;
        this.isNewCompany = false;
        this.isCompanyPopupOpened = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  getState(data: any) {
    const stateNumber = data.state;
    return this.states.filter(s => s.value === stateNumber)[0].name;
  }

  private resetCreateUpdateCompanyForm() {
    this.lookUpZipCode = new LookUpZipCode();
    this.isNewCompany = true;
    this.selectedCompanys = [];
  }

  private init(): any {
    this.initCompanyDataSource();
  }

  private initCompanyDataSource(): void {
    this.lookUpZipCodeDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl(ApiBaseUrls.lookUpZipCode),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _ajaxOptions) => {},
        this
      ),
    });
  }
}
