import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorLogListComponent } from './components/error-log-list/error-log-list.component';
import { ErrorLogsRoutingModule } from './error-logs.routing.module';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';

@NgModule({
  declarations: [ErrorLogListComponent],
  imports: [
    CommonModule,
    ErrorLogsRoutingModule,
    DxDataGridModule,
    DxPopupModule,
    DxScrollViewModule,
    DxSelectBoxModule,
  ],
})
export class ErrorLogsModule {}
