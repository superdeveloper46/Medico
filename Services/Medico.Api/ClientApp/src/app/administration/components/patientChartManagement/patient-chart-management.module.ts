import { NgModule } from '@angular/core';
import { PatientChartManagementComponent } from './patient-chart-management.component';
import { SectionNodeFormComponent } from './section-node-form/section-node-form.component';
import { TemplateNodeFormComponent } from './template-node-form/template-node-form.component';
import { TemplateListNodeFormComponent } from './template-list-node-form/template-list-node-form.component';
import { DocumentNodeFormComponent } from './document-node-form/document-node-form.component';
import { PatientChartContextMenuService } from '../../services/patient-chart-context-menu.service';
import { PatientChartNodeManagementService } from 'src/app/patientChart/services/patient-chart-node-management.service';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxListModule } from 'devextreme-angular/ui/list';
import { CommonModule } from '@angular/common';
import { ShareModule } from 'src/app/share/share.module';
import { ChangeNodeTitleFormComponent } from './change-node-title-form/change-node-title-form.component';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import {
  DxTemplateModule,
  DxColorBoxModule,
  DxCheckBoxModule,
  DxNumberBoxModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { AuditItemColorComponent } from './audit-item-color/audit-item-color.component';

@NgModule({
  imports: [
    DxTreeViewModule,
    DxContextMenuModule,
    DxPopupModule,
    DxFormModule,
    DxSwitchModule,
    DxListModule,
    DxSelectBoxModule,
    DxTemplateModule,
    DxTagBoxModule,
    DxColorBoxModule,
    CommonModule,
    ShareModule,
    DxCheckBoxModule,
    DxTextBoxModule,
    DxNumberBoxModule,
  ],
  declarations: [
    PatientChartManagementComponent,
    SectionNodeFormComponent,
    TemplateNodeFormComponent,
    TemplateListNodeFormComponent,
    DocumentNodeFormComponent,
    ChangeNodeTitleFormComponent,
    AuditItemColorComponent,
  ],
  exports: [
    PatientChartManagementComponent,
    SectionNodeFormComponent,
    TemplateNodeFormComponent,
    TemplateListNodeFormComponent,
    DocumentNodeFormComponent,
    ChangeNodeTitleFormComponent,
    AuditItemColorComponent,
  ],
  providers: [
    PatientChartContextMenuService,
    PatientChartNodeManagementService,
    DxDataUrlService,
    DevextremeAuthService,
  ],
})
export class PatientChartManagementModule {}
