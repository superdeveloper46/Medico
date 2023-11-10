import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientSelectableRootComponent } from './components/patient-selectable-root/patient-selectable-root.component';
import { PatientSelectableListComponent } from './components/patient-selectable-list/patient-selectable-list.component';
import { PatientSelectableRangeComponent } from './components/patient-selectable-range/patient-selectable-range.component';
import { PatientSelectableDateComponent } from './components/patient-selectable-date/patient-selectable-date.component';
import { TemplateTypeMappingComponent } from './components/template-keyword-mapping-form/template-type-mapping/template-type-mapping.component';
import { KeywordMappingComponent } from './components/template-keyword-mapping-form/keyword-mapping/keyword-mapping.component';
import { TemplateKeywordMappingFormComponent } from './components/template-keyword-mapping-form/template-keyword-mapping-form.component';
import { ValueComponent } from './components/value-component/value.component';
import { DebounceClickDirective } from './directives/debounce-click.directive';
import { DragAndDropListComponent } from './components/drag-and-drop-list/drag-and-drop-list.component';
import { AdminSelectableRootComponent } from './components/admin-selectable-root/admin-selectable-root.component';
import { AdminSelectableDateComponent } from './components/admin-selectable-date/admin-selectable-date.component';
import { AdminSelectableListComponent } from './components/admin-selectable-list/admin-selectable-list.component';
import { DetailedTemplatePreviewComponent } from './components/detailed-template-preview/detailed-template-preview.component';
import { AdminRichTextEditorComponent } from './components/admin-rich-text-editor/admin-rich-text-editor.component';
import { AdminSelectableRangeComponent } from './components/admin-selectable-range/admin-selectable-range.component';
import { SelectabeListValuesComponent } from './components/selectabe-list-values/selectabe-list-values.component';
import { ReferenceTableListComponent } from './components/reference-table-list/reference-table-list.component';
import { ExpressionsProviderComponent } from './components/expressions-provider/expressions-provider.component';
import { PatientChartProviderComponent } from './components/patient-chart-provider/patient-chart-provider.component';
import { SelectableItemsEditorComponent } from './components/selectable-items-editor/selectable-items-editor.component';
import { ExpressionExecutionResultComponent } from './components/expression-execution-result/expression-execution-result.component';
import { ExpressionExecutionContextComponent } from './components/expression-execution-context/expression-execution-context.component';
import { AdminSelectableVariableComponent } from './components/admin-selectable-variable/admin-selectable-variable.component';
import { PatientSelectableVariableComponent } from './components/patient-selectable-variable/patient-selectable-variable.component';
import { PhraseSelectionFormComponent } from './components/phrase-selection-form/phrase-selection-form.component';
import { NotesEditorComponent } from './components/notes-editor/notes-editor.component';
import { LocaDatePipe, DatePipe, TimePipe, AgePipe } from './pipes/date.pipe';
import { NotSetPipe } from './pipes/not-set.pipe';
import { ObjectKeysPipe } from './pipes/object-keys.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { DatexPipe } from './pipes/datex.pipe';
import { FormsModule } from '@angular/forms';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { ReportNodeViewComponent } from 'src/app/patientChart/patient-chart-tree/components/report-node-view/report-node-view.component';

@NgModule({
  imports: [
    CommonModule,
    DxPopupModule,
    DxListModule,
    DxTextAreaModule,
    DxButtonModule,
    DxNumberBoxModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    DxDataGridModule,
    DxFormModule,
    DxRadioGroupModule,
    DxScrollViewModule,
    DxCheckBoxModule,
    FormsModule,
  ],
  declarations: [
    PatientSelectableRootComponent,
    PatientSelectableListComponent,
    PatientSelectableRangeComponent,
    PatientSelectableDateComponent,
    PatientSelectableVariableComponent,
    AdminSelectableRootComponent,
    AdminSelectableDateComponent,
    AdminSelectableListComponent,
    AdminSelectableVariableComponent,
    AdminSelectableRangeComponent,
    DetailedTemplatePreviewComponent,
    AdminRichTextEditorComponent,
    LocaDatePipe,
    DatePipe,
    DatexPipe,
    SafeHtmlPipe,
    TimePipe,
    AgePipe,
    NotSetPipe,
    ObjectKeysPipe,
    TemplateTypeMappingComponent,
    KeywordMappingComponent,
    TemplateKeywordMappingFormComponent,
    ValueComponent,
    DebounceClickDirective,
    DragAndDropListComponent,
    SelectabeListValuesComponent,
    ReferenceTableListComponent,
    ExpressionsProviderComponent,
    PatientChartProviderComponent,
    SelectableItemsEditorComponent,
    ExpressionExecutionResultComponent,
    ExpressionExecutionContextComponent,
    PhraseSelectionFormComponent,
    NotesEditorComponent,
    ReportNodeViewComponent
  ],
  exports: [
    AgePipe,
    TimePipe,
    DatePipe,
    DatexPipe,
    LocaDatePipe,
    NotSetPipe,
    SafeHtmlPipe,
    ObjectKeysPipe,
    PatientSelectableRootComponent,
    PatientSelectableListComponent,
    PatientSelectableRangeComponent,
    PatientSelectableDateComponent,
    PatientSelectableVariableComponent,
    TemplateKeywordMappingFormComponent,
    AdminSelectableRootComponent,
    AdminSelectableDateComponent,
    AdminSelectableListComponent,
    AdminSelectableRangeComponent,
    AdminSelectableVariableComponent,
    DetailedTemplatePreviewComponent,
    AdminRichTextEditorComponent,
    ValueComponent,
    DebounceClickDirective,
    DragAndDropListComponent,
    SelectabeListValuesComponent,
    ReferenceTableListComponent,
    ExpressionsProviderComponent,
    PatientChartProviderComponent,
    SelectableItemsEditorComponent,
    ExpressionExecutionResultComponent,
    ExpressionExecutionContextComponent,
    PhraseSelectionFormComponent,
    NotesEditorComponent,
    ReportNodeViewComponent
  ],
})
export class ShareModule {}
