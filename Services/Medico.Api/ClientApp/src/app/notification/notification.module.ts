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
  DxAccordionModule,
  DxButtonModule,
  DxDrawerModule,
  DxSchedulerModule,
  DxSliderModule,
  DxSpeedDialActionModule,
  DxTabPanelModule,
  DxTabsModule,
  DxTemplateModule,
  DxTileViewModule,
} from 'devextreme-angular';
import { AngularDualListBoxModule } from 'angular-dual-listbox';
import { DxFormModule } from 'devextreme-angular';
import { ShareModule } from 'src/app/share/share.module';
import { DxTreeListModule } from 'devextreme-angular';

import { NotificationComponent } from './notification.component';
import { RouterModule } from '@angular/router';
import { NotificationGridComponent } from './notification-grid/notification-grid.component';
import { NotificationCardComponent } from './notification-card/notification-card.component';
import { ReminderComponent } from './reminder/reminder.component';
import { SubTasksComponent } from './sub-tasks/sub-tasks.component';
import { PatientChartTreeModule } from '../patientChart/patient-chart-tree/patient-chart-tree.module';

@NgModule({
  declarations: [
    NotificationComponent,
    NotificationGridComponent,
    NotificationCardComponent,
    ReminderComponent,
    SubTasksComponent,
  ],
  providers: [],
  imports: [
    CommonModule,
    RouterModule,
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
    DxButtonModule,
    DxDrawerModule,
    DxTileViewModule,
    DxSpeedDialActionModule,
    DxSchedulerModule,
    DxTreeListModule,
    DxFormModule,
    DxAccordionModule,
    DxSliderModule,
    DxTemplateModule,
    PatientChartTreeModule,
  ],
})
export class NotificationModule {}
