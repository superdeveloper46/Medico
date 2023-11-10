import { NgModule } from '@angular/core';
import { CompaniesManagementComponent } from './components/companies-management/companies-management.component';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { CommonModule } from '@angular/common';
import { NgxMaskModule } from 'ngx-mask';

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxPopupModule,
    DxScrollViewModule,
    DxFormModule,
    NgxMaskModule,
  ],
  declarations: [CompaniesManagementComponent],
  providers: [],
})
export class CompaniesManagementModule {}
