import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxPopoverModule } from 'devextreme-angular/ui/popover';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import {
  DxTabPanelModule,
  DxTabsModule,
  DxTextAreaModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { AngularDualListBoxModule } from 'angular-dual-listbox';
import { DxFormModule } from 'devextreme-angular';
import { ShareModule } from 'src/app/share/share.module';
import { LabOrderHistoryComponent } from './lab-order-history.component';
import { DxDateBoxModule } from 'devextreme-angular';

@NgModule({
  imports: [
    CommonModule,
    DxScrollViewModule,
    DxTreeViewModule,
    DxPopupModule,
    DxPopoverModule,
    ShareModule,
    DxTagBoxModule,
    DxSelectBoxModule,
    DxListModule,
    DxDataGridModule,
    FormsModule,
    AngularEditorModule,
    NgxDocViewerModule,
    DxTabPanelModule,
    DxTabsModule,
    AngularDualListBoxModule,
    DxFormModule,
    DxDateBoxModule,
    DxTextAreaModule,
    DxTextBoxModule,
  ],
  declarations: [LabOrderHistoryComponent],
  providers: [],
})
export class LabOrderModule {}
