import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentManagementComponent } from './components/content-management.component';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { LibraryTemplateComponent } from './components/library-template/library-template.component';
import { ShareModule } from '../share/share.module';
import { LibraryTemplateTypeComponent } from './components/library-template-type/library-template-type.component';
import { LibrarySelectableListCategoryComponent } from './components/library-selectable-list-category/library-selectable-list-category.component';
import { LibrarySelectableListComponent } from './components/library-selectable-list/library-selectable-list.component';
import { LibraryPatientChartDocumentComponent } from './components/library-patient-chart-document/library-patient-chart-document.component';
import { PatientChartManagementModule } from '../administration/components/patientChartManagement/patient-chart-management.module';
import { LibraryExpressionsComponent } from './components/library-expressions/library-expressions.component';
import { LibraryReferenceTableComponent } from './components/library-expressions/library-reference-table/library-reference-table.component';
import { LibraryExpressionsBuilderComponent } from './components/library-expressions/library-expressions-builder/library-expressions-builder.component';
import { LibrarySelectableListService } from 'src/app/administration/services/library/library-selectable-list.service';

@NgModule({
  imports: [
    CommonModule,
    ShareModule,
    DxTreeViewModule,
    DxDataGridModule,
    DxFormModule,
    DxCheckBoxModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxListModule,
    DxTabsModule,
    DxTextAreaModule,
    PatientChartManagementModule,
  ],
  declarations: [
    ContentManagementComponent,
    LibraryTemplateComponent,
    LibraryTemplateTypeComponent,
    LibrarySelectableListCategoryComponent,
    LibrarySelectableListComponent,
    LibraryPatientChartDocumentComponent,
    LibraryExpressionsComponent,
    LibraryReferenceTableComponent,
    LibraryExpressionsBuilderComponent,
  ],
  providers: [
    LibrarySelectableListService
  ],
})
export class ContentLibraryModule {}
