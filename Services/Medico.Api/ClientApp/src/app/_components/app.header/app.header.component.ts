import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { AuthenticationService } from '../../_services/authentication.service';
import { Subscription } from 'rxjs';
import { Role, RouteRoles } from 'src/app/_models/role';
import { ServiceUnavailableTrackService } from 'src/app/_services/service-unavailable-track.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { AlertService } from 'src/app/_services/alert.service';
import { interval } from 'rxjs';
import {
  DxDataGridComponent,
  DxPopupComponent,
  DxFormComponent,
} from 'devextreme-angular';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { Company } from 'src/app/_models/company';
import { LookUpZipCode } from 'src/app/_models/lookUpZipCode';
import { CompanyCreateUpdateTrackService } from 'src/app/_services/company-create-update-track.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { LookUpZipCodeService } from 'src/app/_services/lookUp-zipCode.service';
import { StateList } from 'src/app/_classes/stateList';
import { MaskList } from 'src/app/_classes/maskList';
import { RegexRuleList } from 'src/app/_classes/regexRuleList';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { ZipCodeTypeList } from 'src/app/_classes/zipCodeTypeList';
import { PatientIdentificationCodeType } from '../../lookUpZipCode/models/enums/patientIdentificationCodeType';

@Component({
  selector: 'app-header',
  templateUrl: './app.header.component.html',
  styleUrls: ['./app.header.component.scss'],
})
export class AppHeaderComponent implements AfterViewInit, OnInit, OnDestroy {
  identificationCodeTypes = PatientIdentificationCodeType;

  company: Nullable<Company>;

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

  states: any[] = StateList.values;
  validationMasks: MaskList = new MaskList();
  regexRuleList: RegexRuleList = new RegexRuleList();
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  zipCodeTypes: any[] = ZipCodeTypeList.values;

  private subscription: Subscription = new Subscription();
  loading = false;
  counter = 0;
  oldCounter = 0;

  isAppointmentsLinkVisible = false;
  isPatientsLinkVisible = false;
  isAdministrationLinkVisible = false;
  isLogoutLinkVisible = false;
  isCompaniesManagementLinkVisible = false;
  isErrorLogsLinkVisible = false;

  isCompanySwitcherVisible = false;
  serviceUnavailableErrorHappened = false;
  email = '';
  // listOfData: any[];
  unread: any[] = [];
  tempData: any[] = [];
  isVisible = false;
  type = 'success';
  message = 'hello';

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private lookUpZipCodeService: LookUpZipCodeService,
    private authenticationService: AuthenticationService,
    private repository: RepositoryService,
    private serviceUnavailableTrackService: ServiceUnavailableTrackService,
    private companyCreateUpdateTrackService: CompanyCreateUpdateTrackService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    this.subscription.add(
      this.serviceUnavailableTrackService.serviceUnavailableErrorHappened.subscribe({
        next: () => (this.serviceUnavailableErrorHappened = true),
      })
    );
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
    this.lookUpZipCode.name = '';
    this.lookUpZipCode.updateBy = '00000000-0000-0000-0000-000000000000';
    this.lookUpZipCode.updatedDate = '2022-02-04T16:56:49.633';
    this.lookUpZipCodeService.save(this.lookUpZipCode).then(company => {
      this.lookUpZipCodeDataGrid.instance.refresh();
      this.resetCreateUpdateCompanyForm();
      this.isCompanyPopupOpened = false;
      this.companyCreateUpdateTrackService.emitCompanyChanges(company.id);
    });
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

  public bindNotificationCount() {
    this.loading = true;
    const apiUrl = `notification/getNotificationCount`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.counter = res.data.totalCount;
          if (this.counter > 0) {
            if (this.oldCounter === 0) {
              this.showToastr();
            }

            const newCount = this.counter - this.oldCounter;
            if (newCount > 0) {
              this.showToastr();
            }
          }
        } else {
          this.counter = 0;
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
    //commented out this need to implement signalr or websocket
    //setTimeout(() => {
    //  this.bindNotificationCount();
    //}, 10000);
  }

  private showToastr() {
    this.oldCounter = this.counter;
    this.isVisible = true;
    this.message = `${this.counter} unread messages.`;
  }

  bindNotifications() {
    this.loading = true;
    const apiUrl = `notification/header-notifications`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.unread = res.data as any[];
          this.tempData = res.data as any[];
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

  filter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.unread = this.tempData.filter(
      item =>
        item.description.toLowerCase().search(value.toLowerCase()) !== -1 ||
        item.title.toLowerCase().search(value.toLowerCase()) !== -1 ||
        item.entityStatus.toLowerCase().search(value.toLowerCase()) !== -1 ||
        item.createdOn.search(value) !== -1
    );
  }

  sort() {
    this.unread = this.unread.sort((a, b) => (a.id > b.id ? 1 : -1));
  }
  ngOnInit(): void {
    this.subscription.add(
      this.authenticationService.currentUser.subscribe(currentUser => {
        const isCurrentUserSuperAdmin =
          currentUser?.isUserInRole(Role.SuperAdmin) ?? false;

        this.isCompaniesManagementLinkVisible = isCurrentUserSuperAdmin;

        this.isErrorLogsLinkVisible = isCurrentUserSuperAdmin;

        this.isAdministrationLinkVisible =
          currentUser?.isUserHaveAtLeastOneRole(RouteRoles.administration) ?? false;

        this.isAppointmentsLinkVisible =
          currentUser?.isUserHaveAtLeastOneRole(RouteRoles.appointments) ?? false;

        this.isPatientsLinkVisible =
          currentUser?.isUserHaveAtLeastOneRole(RouteRoles.patientsManagement) ?? false;

        this.isLogoutLinkVisible = currentUser?.isUserHaveAtLeastOneRole([]) ?? false;

        this.isCompanySwitcherVisible = currentUser?.isAuthenticated ?? false;

        this.email = currentUser?.user.email ?? '';
      })
    );
  }

  protected registerEscapeBtnEventHandler(popup: DxPopupComponent) {
    popup.instance.registerKeyHandler('escape', (event: any) => {
      event.stopPropagation();
    });
  }

  ngAfterViewInit(): void {
    //interval(12000).subscribe(() => {
    //  this.bindNotificationCount();
    //  this.bindNotifications();
    //});
    // this.registerEscapeBtnEventHandler(this.lookUpZipCodePopup);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  logout($event: any): void {
    $event.preventDefault();
    this.authenticationService.logout().then(() => {
      location.reload();
    });
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

  onCompanySelected(_$event: any) {
    // const selectedCompany = $event.selectedRowsData[0];
    // if (!selectedCompany) {
    //   return;
    // }

    const selectedCompanyId = '00000000-0000-0000-0000-000000000000'; // login side thi je id male ne e
    this.lookUpZipCodeService
      .getByCompanyId(selectedCompanyId)
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

  commonText = (html: string) => {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const text = parsed.documentElement.textContent;
    if (text !== null && text.length > 100) {
      return parsed.documentElement.textContent?.substring(0, 100) + '...';
    }
    return text;
  };
}
