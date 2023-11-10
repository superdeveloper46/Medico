import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientsManagementComponent } from './components/patients-management.component';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { NgxMaskModule } from 'ngx-mask';
import { ShareModule } from '../share/share.module';
import { PatientInsuranceService } from '../_services/patient-insurance.service';
import { PatientAppointmentsComponent } from './components/patient-appointments/patient-appointments.component';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { PatientChartTreeModule } from '../patientChart/patient-chart-tree/patient-chart-tree.module';
import { IdentificationFormComponent } from './components/identification-form/identification-form.component';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { PatientIdentificationCodeService } from './services/patient-identification-code.service';
import { PatientIdentificationNumericCodeService } from './services/patient-identification-numeric-code.service';
import { EditorModule } from '@tinymce/tinymce-angular';
import { FormsModule } from '@angular/forms';
import {DxScrollViewModule, DxTextBoxModule} from 'devextreme-angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DxPopupModule,
    DxFormModule,
    DxDataGridModule,
    NgxMaskModule.forRoot(),
    DxTabPanelModule,
    DxButtonModule,
    ShareModule,
    DxTextAreaModule,
    PatientChartTreeModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxRadioGroupModule,
    EditorModule,
    DxTextBoxModule,
    DxScrollViewModule
  ],
  declarations: [
    PatientsManagementComponent,
    PatientAppointmentsComponent,
    IdentificationFormComponent,
  ],
  providers: [
    PatientInsuranceService,
    PatientIdentificationCodeService,
    PatientIdentificationNumericCodeService,
  ],
  exports: [
    PatientChartTreeModule
  ]
})
export class PatientsModule {}
