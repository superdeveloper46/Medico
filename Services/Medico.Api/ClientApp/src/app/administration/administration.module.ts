import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminComponent } from './components/admin/admin.component';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { CompanyManagementComponent } from './components/companyManagement/company-management.component';
import { CompanyComponent } from './components/companyManagement/company/company.component';
import { DxiItemModule } from 'devextreme-angular/ui/nested';
import { HttpClientModule } from '@angular/common/http';
import { CompanyService } from '../_services/company.service';
import { LocationService } from './services/location.service';
import { LocationComponent } from './components/companyManagement/location/location.component';
import { RoomComponent } from './components/companyManagement/room/room.component';
import { RoomService } from './services/room.service';
import { MedicoApplicationUserComponent } from './components/companyManagement/medico-application-user/medico-application-user.component';
import { UserService } from './services/user.service';
import { ShareModule } from '../share/share.module';
import { RoleComponent } from './components/companyManagement/role/role.component';
import { DxBoxModule, DxColorBoxModule, DxDateBoxModule, DxTagBoxModule } from 'devextreme-angular';

import { TemplateManagementComponent } from './components/templateManagement/template-management.component';
import { ConfigurationManagementComponent } from './components/configuration-management/configuration-management.component';
import { SelectableListCategoryComponent } from './components/templateManagement/selectable-list-category/selectable-list-category.component';
import { SelectableListComponent } from './components/templateManagement/selectable-list/selectable-list.component';
import { TemplateTypeComponent } from './components/templateManagement/template-type/template-type.component';
import { TemplateMappingComponent } from './components/templateManagement/template-mapping/template-mapping.component';
import { KeywordIcdCodeMappingComponent } from './components/templateManagement/keyword-icd-code-mapping/keyword-icd-code-mapping.component';
import { AdminTemplateComponent } from './components/templateManagement/admin-template/admin-template.component';
import { SelectableListCategoryService } from './services/selectable-list-category.service';
import { SelectableListService } from '../_services/selectable-list.service';
import { TemplateTypeService } from './services/template-type.service';
import { NgxMaskModule } from 'ngx-mask';
import { MedicationManagementComponent } from './components/medicationManagement/medication-management.component';
import { MedicationUpdateService } from './services/medication-update.service';
import { PhraseComponent } from './components/templateManagement/phrase/phrase.component';
import { PhraseService } from './services/phrase.service';
import { LibraryTemplateTypeService } from './services/library/library-template-type.service';
import { LibraryTemplateService } from './services/library/library-template.service';
import { TemplateImportComponent } from './components/templateManagement/template-import/template-import.component';
import { LibrarySelectableListCategoryService } from './services/library/library-selectable-list-category.service';
import { LibrarySelectableListService } from './services/library/library-selectable-list.service';
import { SelectableListImportComponent } from './components/templateManagement/selectable-list-import/selectable-list-import.component';
import { PatientChartManagementModule } from './components/patientChartManagement/patient-chart-management.module';
import { ExpressionsComponent } from './components/expressions-management/expressions.component';
import { ExpressionsBuilderComponent } from './components/expressions-management/expressions-builder/expressions-builder.component';
import { ReferenceTableComponent } from './components/expressions-management/reference-table/reference-table.component';
import { ReferenceTableImportComponent } from './components/expressions-management/reference-table-import/reference-table-import.component';
import { ExpressionImportComponent } from './components/expressions-management/expression-import/expression-import.component';
import { DependentTemplateListComponent } from './components/templateManagement/admin-template/dependent-template-list/dependent-template-list.component';
import { PhraseUsageComponent } from './components/templateManagement/phrase-usage/phrase-usage.component';
import { PhraseUsageService } from './services/phrase-usage.service';
import { PatientChartNodePhrasesComponent } from './components/templateManagement/phrase-usage/patient-chart-node-phrases/patient-chart-node-phrases.component';
import { TemplatePhrasesComponent } from './components/templateManagement/phrase-usage/template-phrases/template-phrases.component';
import { TemplatePhraseUsageListComponent } from './components/templateManagement/admin-template/template-phrase-usage-list/template-phrase-usage-list.component';
import { InsuranceCompanyComponent } from './components/insurance-company/insurance-company.component';
import { LabTestsManagementComponent } from './components/lab-tests-management/lab-tests-management.component';
import { EditorConfigComponent } from './components/editor-config/editor-config.component';
import { ProfileManagementComponent } from './components/profile-management/profile-management.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';
import { PhraseCategoryComponent } from './components/phrase-category/phrase-category.component';
import { CopyTemplateComponent } from './components/copy-template/copy-template.component';
import { VendorManagementComponent } from './components/vendor-management/vendor-management.component';
import { VitalSignsLookupComponent } from './components/vital-signs-lookup/vital-signs-lookup.component';
import { PreAuthManagementComponent } from './components/pre-auth-management/pre-auth-management.component';
import { IdentificationFormComponent } from '../lookUpZipCode/components/identification-form/identification-form.component';
import { AuditManagementComponent } from './components/audit-management/audit-management.component';
import { BusinessHoursManagementComponent } from './components/business-hours-management/business-hours-management.component';
import { AppointmentStatusColorManagementComponent } from './components/appointment-status-color-management/appointment-status-color-management.component';
import { ConfigSettingsComponent } from './components/configuration-management/config-settings/config-settings.component';
import { FileNameConventionComponent } from './components/configuration-management/fileName-convention/fileName-convention.component';
import { CredentialsComponent } from './components/configuration-management/credentials/credentials.component';
import { AdminNotificationComponent } from './components/configuration-management/adminNotification/admin-notification.component';
import { DefaultSettingsComponent } from './components/configuration-management/default-settings/default-settings.component';
import { SelectableListDatasourceComponent } from './components/configuration-management/selectableListDatasource/selectableList-datasource.component';
import { IncludeExcludeListComponent } from './components/configuration-management/include-exclude/include-exclude.component';
import {  } from 'devextreme-angular';
import { BusinessHoursService } from './services/business-hours.service';
import { HolidayHoursService } from './services/holiday-hours.service';

@NgModule({
  imports: [
    ShareModule,
    CommonModule,
    DxTreeViewModule,
    DxTabsModule,
    DxFormModule,
    DxiItemModule,
    DxButtonModule,
    HttpClientModule,
    DxDataGridModule,
    DxPopupModule,
    DxScrollViewModule,
    DxSelectBoxModule,
    DxCheckBoxModule,
    DxListModule,
    DxNumberBoxModule,
    DxRadioGroupModule,
    DxTextBoxModule,
    NgxMaskModule.forRoot(),
    DxFileUploaderModule,
    DxContextMenuModule,
    DxBoxModule,
    DxColorBoxModule,
    DxDateBoxModule,
    DxTagBoxModule,
    PatientChartManagementModule,
  ],
  declarations: [
    IdentificationFormComponent,
    AdminComponent,
    PreAuthManagementComponent,
    CompanyManagementComponent,
    CompanyComponent,
    LocationComponent,
    RoomComponent,
    MedicoApplicationUserComponent,
    RoleComponent,
    TemplateManagementComponent,
    SelectableListCategoryComponent,
    SelectableListComponent,
    AdminTemplateComponent,
    TemplateTypeComponent,
    TemplateMappingComponent,
    KeywordIcdCodeMappingComponent,
    MedicationManagementComponent,
    PhraseComponent,
    TemplateImportComponent,
    SelectableListImportComponent,
    ExpressionsComponent,
    ExpressionsBuilderComponent,
    ReferenceTableComponent,
    ReferenceTableImportComponent,
    ExpressionImportComponent,
    DependentTemplateListComponent,
    PhraseUsageComponent,
    PatientChartNodePhrasesComponent,
    TemplatePhrasesComponent,
    TemplatePhraseUsageListComponent,
    InsuranceCompanyComponent,
    LabTestsManagementComponent,
    EditorConfigComponent,
    VendorManagementComponent,
    ProfileManagementComponent,
    AuditLogComponent,
    PhraseCategoryComponent,
    CopyTemplateComponent,
    VitalSignsLookupComponent,
    AuditManagementComponent,
    BusinessHoursManagementComponent,
    AppointmentStatusColorManagementComponent,
    ConfigurationManagementComponent,
    ConfigSettingsComponent,
    FileNameConventionComponent,
    CredentialsComponent,
    AdminNotificationComponent,
    DefaultSettingsComponent,
    SelectableListDatasourceComponent,
    IncludeExcludeListComponent,
  ],
  providers: [
    CompanyService,
    LocationService,
    RoomService,
    UserService,
    SelectableListCategoryService,
    SelectableListService,
    TemplateTypeService,
    MedicationUpdateService,
    PhraseService,
    LibraryTemplateTypeService,
    LibraryTemplateService,
    LibrarySelectableListCategoryService,
    LibrarySelectableListService,
    PhraseUsageService,
    BusinessHoursService,
    HolidayHoursService,
  ],
})
export class AdministrationModule {}
