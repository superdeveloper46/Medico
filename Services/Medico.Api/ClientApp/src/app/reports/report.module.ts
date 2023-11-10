import { NgModule } from '@angular/core';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxListModule } from 'devextreme-angular/ui/list';
import { ShareModule } from '../share/share.module';
import { CommonModule } from '@angular/common';
import { TimeTrackReportComponent } from './time-track-report/time-track-report.component';
import { ReportComponent } from './report/report.component';
import { HttpClientModule } from '@angular/common/http';
import {
  DxTreeViewModule,
  DxTabsModule,
  DxButtonModule,
  DxCheckBoxModule,
  DxNumberBoxModule,
  DxRadioGroupModule,
  DxTextBoxModule,
  DxFileUploaderModule,
  DxContextMenuModule,
  DxBoxModule,
} from 'devextreme-angular';
import { DxiItemModule } from 'devextreme-angular/ui/nested';
import { NgxMaskModule } from 'ngx-mask';
import { ReportRoutingModule } from './report-routing.module';
import { RouterModule } from '@angular/router';
import { DxPieChartModule } from 'devextreme-angular';

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
    RouterModule,
    ReportRoutingModule,
    DxPieChartModule,
  ],
  declarations: [ReportComponent, TimeTrackReportComponent],
  providers: [],
})
export class ReportModule {}
