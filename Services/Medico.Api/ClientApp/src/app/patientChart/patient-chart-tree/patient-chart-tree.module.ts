import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { TobaccoHistoryComponent } from './components/patient-history/tobacco-history/tobacco-history.component';
import { CommonModule } from '@angular/common';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxPopoverModule } from 'devextreme-angular/ui/popover';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { WebcamModule } from 'ngx-webcam';
import { DrugHistoryComponent } from './components/patient-history/drug-history/drug-history.component';
import { AlcoholHistoryComponent } from './components/patient-history/alcohol-history/alcohol-history.component';
import { MedicalHistoryComponent } from './components/patient-history/medical-history/medical-history.component';
import { SurgicalHistoryComponent } from './components/patient-history/surgical-history/surgical-history.component';
import { FamilyHistoryComponent } from './components/patient-history/family-history/family-history.component';
import { EducationHistoryComponent } from './components/patient-history/education-history/education-history.component';
import { OccupationalHistoryComponent } from './components/patient-history/occupational-history/occupational-history.component';
import { AllergyComponent } from './components/patient-history/allergy/allergy.component';
import { CareTeamManagement } from './components/patient-history/careTeamManagement/careTeamManagement.component';
import { DetailGridComponent } from './components/patient-history/careTeamManagement/detail-grid.component';
import { MedicationHistoryComponent } from './components/patient-history/medication-history/medication-history.component';
import { ReviewedMedicalRecordsComponent } from './components/patient-history/reviewed-medical-records/reviewed-medical-records.component';
import { ShareModule } from 'src/app/share/share.module';
import { PatientRichTextEditorComponent } from './components/patient-rich-text-editor/patient-rich-text-editor.component';
import { PatientChartTemplateComponent } from './components/patient-chart-template/patient-chart-template.component';
import { TemplateListComponent } from './components/template-list/template-list.component';
import { ChiefComplaintComponent } from './components/chief-complaint-chart-section/chief-complaint/chief-complaint.component';
import { PatientAllegationsComponent } from './components/chief-complaint-chart-section/patient-allegations/patient-allegations.component';
import { MissedKeywordsComponent } from './components/chief-complaint-chart-section/chief-complaint-management/chief-complaint-map-keywords/missed-keywords.component';
import { ChiefComplaintKeywordsComponent } from './components/chief-complaint-chart-section/chief-complaint-management/chief-complaint-keywords/chief-complaint-keywords.component';
import { ChiefComplaintManagementComponent } from './components/chief-complaint-chart-section/chief-complaint-management/chief-complaint-management.component';
import { ChiefComplaintMapKeywordsComponent } from './components/chief-complaint-chart-section/chief-complaint-management/chief-complaint-map-keywords/map-keywords.component';
import { AddTemplatesComponent } from './components/chief-complaint-chart-section/chief-complaint-management/add-templates/add-templates.component';
import { NewTemplateMappingComponent } from './components/chief-complaint-chart-section/chief-complaint-management/new-template-mapping/new-template-mapping.component';
import { VitalSignsComponent } from './components/vital-signs/vital-signs.component';
import { BaseVitalSignsComponent } from './components/base-vital-signs/base-vital-signs.component';
import { VitalSignsPanelComponent } from './components/vital-signs-panel/vital-signs-panel.component';
import { AssessmentComponent } from './components/assessment/assessment.component';
import { ScanDocumentComponent } from './components/scan-document/scan-document.component';
import { MedicationPrescriptionComponent } from './components/medication-prescription/medication-prescription.component';
import { VisionVitalSignsComponent } from './components/vision-vital-signs/vision-vital-signs.component';
import { AllegationsNotesStatusComponent } from './components/chief-complaint-chart-section/allegations-notes-status/allegations-notes-status.component';
import { PhraseSuggestionHelperComponent } from './components/phrase-suggestion-helper/phrase-suggestion-helper.component';
import { VitalSignsNotesComponent } from './components/vital-signs-notes/vital-signs-notes.component';
import { VitalSignsConfigComponent } from './components/vital-signs-config/vital-signs-config.component';
import { AddendumComponent } from './components/addendum/addendum.component';
import { ExistedTemplateMappingComponent } from './components/chief-complaint-chart-section/chief-complaint-management/existed-template-mapping/existed-template-mapping.component';
import { ReportNodeViewComponent } from './components/report-node-view/report-node-view.component';
import { PatientTemplateEditorComponent } from './components/patient-template-editor/patient-template-editor.component';
import { TemplateManualEditorComponent } from './components/template-manual-editor/template-manual-editor.component';
import { DuplicateSelectableItemsCheckerComponent } from './components/duplicate-selectable-items-checker/duplicate-selectable-items-checker.component';
import { DistanceTransformPipe } from './pipes/distance.pipe';
import { WeightTransformPipe } from './pipes/weight.pipe';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { PreviousChartComponent } from '../components/previous-chart/previous-chart.component';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { FormsModule } from '@angular/forms';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ProblemListComponent } from './components/problem-list/problem-list.component';
import {
    DevExtremeModule,
    DxAccordionModule,
    DxLoadIndicatorModule,
    DxLoadPanelModule,
    DxSliderModule,
    DxTemplateModule,
    DxSwitchModule
} from 'devextreme-angular';

@NgModule({
    imports: [
        ShareModule,
        CommonModule,
        FormsModule,
        DxDataGridModule,
        DxSelectBoxModule,
        DxFormModule,
        DxPopupModule,
        DxRadioGroupModule,
        DxPopoverModule,
        DxListModule,
        DxTextAreaModule,
        DxTabsModule,
        DxButtonModule,
        DxFileUploaderModule,
        WebcamModule,
        DxTabPanelModule,
        DxCheckBoxModule,
        DxScrollViewModule,
        EditorModule,
        RouterModule,
        DxAccordionModule,
        DxSliderModule,
        DxTemplateModule,
        DxLoadPanelModule,
        DxLoadIndicatorModule,
        DevExtremeModule,
        DxSwitchModule
    ],
  declarations: [
    MedicationPrescriptionComponent,
    TobaccoHistoryComponent,
    DrugHistoryComponent,
    AlcoholHistoryComponent,
    MedicalHistoryComponent,
    SurgicalHistoryComponent,
    FamilyHistoryComponent,
    EducationHistoryComponent,
    OccupationalHistoryComponent,
    AllergyComponent,
    CareTeamManagement,
    DetailGridComponent,
    MedicationHistoryComponent,
    ReviewedMedicalRecordsComponent,
    PatientRichTextEditorComponent,
    PatientChartTemplateComponent,
    TemplateListComponent,
    ChiefComplaintComponent,
    PatientAllegationsComponent,
    ChiefComplaintManagementComponent,
    ChiefComplaintMapKeywordsComponent,
    MissedKeywordsComponent,
    AddTemplatesComponent,
    ChiefComplaintKeywordsComponent,
    NewTemplateMappingComponent,
    VitalSignsComponent,
    BaseVitalSignsComponent,
    VitalSignsPanelComponent,
    AssessmentComponent,
    ScanDocumentComponent,
    VisionVitalSignsComponent,
    AllegationsNotesStatusComponent,
    PhraseSuggestionHelperComponent,
    VitalSignsNotesComponent,
    VitalSignsConfigComponent,
    AddendumComponent,
    ExistedTemplateMappingComponent,
    // ReportNodeViewComponent,
    PatientTemplateEditorComponent,
    TemplateManualEditorComponent,
    DuplicateSelectableItemsCheckerComponent,
    PreviousChartComponent,
    ProblemListComponent,
    DistanceTransformPipe,
    WeightTransformPipe,
  ],
  providers: [],
  exports: [
    MedicationPrescriptionComponent,
    TobaccoHistoryComponent,
    DrugHistoryComponent,
    AlcoholHistoryComponent,
    MedicalHistoryComponent,
    SurgicalHistoryComponent,
    FamilyHistoryComponent,
    EducationHistoryComponent,
    OccupationalHistoryComponent,
    AllergyComponent,
    CareTeamManagement,
    DetailGridComponent,
    MedicationHistoryComponent,
    ReviewedMedicalRecordsComponent,
    PatientRichTextEditorComponent,
    PatientChartTemplateComponent,
    TemplateListComponent,
    ChiefComplaintComponent,
    PatientAllegationsComponent,
    ChiefComplaintManagementComponent,
    ChiefComplaintMapKeywordsComponent,
    MissedKeywordsComponent,
    AddTemplatesComponent,
    ChiefComplaintKeywordsComponent,
    NewTemplateMappingComponent,
    VitalSignsComponent,
    BaseVitalSignsComponent,
    VitalSignsPanelComponent,
    AssessmentComponent,
    ScanDocumentComponent,
    AllegationsNotesStatusComponent,
    PhraseSuggestionHelperComponent,
    AddendumComponent,
    // ReportNodeViewComponent,
    PreviousChartComponent,
    DistanceTransformPipe,
    WeightTransformPipe,
  ],
})
export class PatientChartTreeModule {}
