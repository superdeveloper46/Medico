import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { DxiItemModule } from 'devextreme-angular/ui/nested';
import { HttpClientModule } from '@angular/common/http';
import { NgxMaskModule } from 'ngx-mask';
import { ShareModule } from 'src/app/share/share.module';
import { PatientChartManagementModule } from 'src/app/administration/components/patientChartManagement/patient-chart-management.module';
import { LibrarySelectableListCategoryService } from 'src/app/administration/services/library/library-selectable-list-category.service';
import { LibrarySelectableListService } from 'src/app/administration/services/library/library-selectable-list.service';
import { LibraryTemplateTypeService } from 'src/app/administration/services/library/library-template-type.service';
import { LibraryTemplateService } from 'src/app/administration/services/library/library-template.service';
import { LocationService } from 'src/app/administration/services/location.service';
import { MedicationUpdateService } from 'src/app/administration/services/medication-update.service';
import { PhraseUsageService } from 'src/app/administration/services/phrase-usage.service';
import { PhraseService } from 'src/app/administration/services/phrase.service';
import { RoomService } from 'src/app/administration/services/room.service';
import { SelectableListCategoryService } from 'src/app/administration/services/selectable-list-category.service';
import { TemplateTypeService } from 'src/app/administration/services/template-type.service';
import { UserService } from 'src/app/administration/services/user.service';
import { CompanyService } from 'src/app/_services/company.service';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { PatientInsuranceService } from 'src/app/_services/patient-insurance.service';
import { DxTabPanelModule, DxTextAreaModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { DocListComponent } from './doc-list/doc-list.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { DocPhysicianComponent } from './doc-physician/doc-physician.component';
import { PhysicianViewerComponent } from './physician-viewer/physician-viewer.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { AngularDualListBoxModule } from 'angular-dual-listbox';

@NgModule({
  imports: [
    ShareModule,
    CommonModule,
    FormsModule,
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
    DxTextAreaModule,
    NgxMaskModule.forRoot(),
    DxFileUploaderModule,
    DxContextMenuModule,
    DxTabPanelModule,
    PatientChartManagementModule,
    AngularEditorModule,
    AngularDualListBoxModule,
  ],
  declarations: [
    DocListComponent,
    AppointmentComponent,
    DocPhysicianComponent,
    PhysicianViewerComponent,
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
    PatientInsuranceService,
  ],
})
export class ParserModule {}
