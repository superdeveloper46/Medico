import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { AlertService } from 'src/app/_services/alert.service';
import { MedicoApplicationUser } from 'src/app/administration/models/medicoApplicationUser';
import { Gender } from 'src/app/_classes/gender';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { UserService } from 'src/app/administration/services/user.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { AccountService } from 'src/app/_services/account.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Subscription } from 'rxjs';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { CompanyService } from 'src/app/_services/company.service';
import { CompanySearchFilter } from 'src/app/administration/models/companySearchFilter';
import { LookupModel } from 'src/app/_models/lookupModel';

@Component({
  selector: 'medico-application-user',
  templateUrl: './medico-application-user.component.html',
})
export class MedicoApplicationUserComponent
  extends BaseAdminComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  @ViewChild('userGrid', { static: false })
  userGrid!: DxDataGridComponent;
  @ViewChild('userForm', { static: false })
  userForm!: DxFormComponent;
  @ViewChild('userPopup', { static: false })
  userPopup!: DxPopupComponent;
  @ViewChild('resetPasswordForm', { static: false })
  resetPasswordForm!: DxFormComponent;
  //@ViewChild("extraFieldsTab") extraFieldsTab: ExtraFieldsTabComponent;

  isEscapeBtnEventHandlerSet = false;

  canRenderComponent = false;

  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;

  user: MedicoApplicationUser = new MedicoApplicationUser();

  genderValues: any[] = Gender.values;
  employeeTypes: any[] = EmployeeTypeList.values;

  userDataSource: any = {};
  roleDataSource: any = {};

  selectedUsers: Array<any> = [];

  isUserPopupOpened = false;

  isNewUser = true;
  isUserSet = false;

  isResetPasswordPopupOpened = false;
  resetPasswordModel: any = {};

  passwordFormatValidationMessage =
    "Passwords must be at least 6 characters. Password must have at least one non alphanumeric character. Passwords must have at least one digit ('0'-'9'). Passwords must have at least one upper and lowercase characters";
  companies: LookupModel[] = [];

  get nameSuffixes(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.nameSuffix
    );
  }

  get namePrefixes(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.namePrefix
    );
  }

  constructor(
    private alertService: AlertService,
    private userService: UserService,
    private companyService: CompanyService,
    private dxDataUrlService: DxDataUrlService,
    private appointmentService: AppointmentService,
    private selectableListService: SelectableListService,
    private accountService: AccountService,
    private companyIdService: CompanyIdService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();

    this.init();
  }

  get zipMask(): string {
    switch (this.user.zipCodeType) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      case ZipCodeType.NineDigit:
        return this.validationMasks.nineDigitZip;
    }
  }

  ngOnDestroy(): void {
    this.companyIdSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.subscribeToCompanyIdChanges();
  }

  resetUserPassword(): void {
    const validationResult = this.resetPasswordForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    const email = this.resetPasswordModel.email;
    const password = this.resetPasswordModel.newPassword;

    this.accountService
      .resetPassword(email, password)
      .then(result => {
        if (result) {
          this.resetPasswordModel = {};
          this.isResetPasswordPopupOpened = false;

          this.alertService.info('Password was reseted successfully');
        } else {
          this.alertService.error('Unable to reset password. Try again later.');
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  getState(state: any) {
    const stateValue = +state.value;
    return this.states.filter(t => t.value === stateValue)[0].name;
  }

  getCompany(company: any) {
    const companyValue = company.value;
    return this.companies.filter(t => t.id === companyValue)[0].name;
  }

  getEmployeeType(employeeTypes: any) {    
    if(typeof employeeTypes.value != 'undefined' && employeeTypes.value.length != 0) {
      const employeeTypesValues: number[] = employeeTypes.value;
      return employeeTypesValues.map(employeeTypeValue => this.employeeTypes.filter(t => t.value === employeeTypeValue)[0].name).join(',');
    }
    else {
      const employeeTypeValue = employeeTypes.data['employeeType'];
      return this.employeeTypes.filter(t => t.value === employeeTypeValue)[0].name;
    }
    
  }

  passwordComparison() {
    return this.user.password;
  }

  resetPasswordComparison() {
    return this.resetPasswordModel.newPassword;
  }

  validatePasswordComplexity(params: any) {
    const password = params.value;
    this.accountService.checkPasswordComplexity(password).then(validationResult => {
      const isValidationSucceeded = validationResult.isValid;

      params.rule.isValid = isValidationSucceeded;

      params.validator.validate();
    });

    return false;
  }

  validateEmailExistence(params: any) {
    const email = params.value;
    this.accountService
      .checkEmailExistance(email, this.companyId)
      .then(validationResult => {
        const isValidationSucceeded = validationResult.isValid;

        params.rule.isValid = isValidationSucceeded;

        params.validator.validate();
      });

    return false;
  }

  validatePassword(params: any) {
    const email = this.resetPasswordModel.email;
    const password = params.value;

    this.accountService.checkPassword(email, password).then(validationResult => {
      params.rule.isValid = validationResult;
      params.validator.validate();
    });

    return false;
  }

  onResetPassworPopupHidden() {
    this.resetPasswordModel = {};
  }

  openUserForm() {
    this.isUserSet = true;
    this.isUserPopupOpened = true;
    if (!this.isEscapeBtnEventHandlerSet)
      this.registerEscapeBtnEventHandler(this.userPopup);
  }

  onUserPopupHidden() {
    this.resetUserForm();
  }

  openResetPasswordPopup(user: any, $event: any): void {
    $event.stopPropagation();

    this.resetPasswordModel.email = user.email;

    this.isResetPasswordPopupOpened = true;
  }

  deleteUser(user: any, $event: any): void {
    $event.stopPropagation();

    const userId = user.id;
    const employeeType = user.employeeType;

    this.canDeactivateDeleteUser(userId, employeeType).then(canDelete => {
      if (!canDelete) {
        this.alertService.warning('User already is used. You cannot delete it.');
        return;
      }

      this.continueDeletingUser(userId);
    });
  }

  ngAfterViewInit(): void {
    // this.extraFieldsAppService
    //     .addExtraColumnsToGridIfNeeded(TableNames.employee, this.employeeDataGrid);
  }

  onUserSelected($event: any) {
    const user = $event.selectedRowsData[0];
    if (!user) return;

    const userId = user.id;

    this.userService
      .getById(userId)
      .then(user => {
        this.user = user;

        this.isNewUser = false;
        this.isUserSet = true;
        this.isUserPopupOpened = true;
      })
      .catch(error => {
        this.selectedUsers = [];
        this.alertService.error(error.message ? error.message : error);
      });
  }

  createUpdateUser() {
    const validationResult = this.userForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    // if (this.isNewUser) {
    //     this.user.companyId = this.companyId;
    // }

    this.userService
      .save(this.user)
      // .then(() => {
      //     return this.extraFieldsTab
      //         .saveExtraFields();
      // })
      .then(() => {
        this.userGrid.instance.refresh();

        this.resetUserForm();
        this.isUserPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private continueDeletingUser(userId: string): void {
    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the user ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.userService.delete(userId).then(() => {
          this.userGrid.instance.refresh();
        });
      }
    });
  }

  private init(): void {
    this.initUserDataSource();
    this.initRoleDataSource();
    this.initCompanies();
  }

  private initRoleDataSource(): void {
    this.roleDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('role'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  private initUserDataSource(): void {
    this.userDataSource = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('user'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private canDeactivateDeleteUser(userId: string, employeeType: number) {
    //1 - Physician
    //2 - Nurse
    if (employeeType === 1 || employeeType === 2) {
      return this.appointmentService
        .getByUserId(userId)
        .then(appointment => !appointment);
    }

    return Promise.resolve(true);
  }

  private resetUserForm() {
    this.isUserSet = false;
    this.isNewUser = true;
    this.selectedUsers = [];
    this.user = new MedicoApplicationUser();
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;

        this.initSelectableLists();

        if (this.userGrid && this.userGrid.instance) this.userGrid.instance.refresh();
      }
    });
  }

  private initSelectableLists() {
    const nameSuffixListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.nameSuffix,
      LibrarySelectableListIds.application.nameSuffix
    );

    const namePrefixListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.namePrefix,
      LibrarySelectableListIds.application.namePrefix
    );

    this.selectableListService
      .setSelectableListsValuesToComponent(
        [nameSuffixListConfig, namePrefixListConfig],
        this
      )
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initCompanies(): void {
    const companyFilter = new CompanySearchFilter();
    companyFilter.isActive = true;
    companyFilter.take = 100;

    this.companyService.getByFilter(companyFilter).then((c: any[]) => {
      this.companies = c;
    });
  }
  // onExtraFieldsTabCreated($event: any) {
  //     if ($event: any) {
  //         this.employeeCreationForm.items[0]["tabs"].push($event);
  //         this.employeeCreationForm.instance.repaint();
  //     }
  // }

  // private setLookupItemListValues() {
  //     const lookupItemListNames = [
  //         new LookupItemListMetadata("nameSuffix", true),
  //         new LookupItemListMetadata("namePrefix", true)
  //     ];

  //     this.lookupItemsAppService
  //         .setLookupItemLists(lookupItemListNames, this);
  // }
}
