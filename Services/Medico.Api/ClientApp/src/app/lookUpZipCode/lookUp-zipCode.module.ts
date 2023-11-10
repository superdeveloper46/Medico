import { NgModule } from '@angular/core';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { CommonModule } from '@angular/common';
import { NgxMaskModule } from 'ngx-mask';
import { LookUpZipCodeComponent } from './components/look-up-zip-code/look-up-zip-code.component';
// import { IdentificationFormComponent } from './components/identification-form/identification-form.component';
import { PatientIdentificationCodeService } from './services/patient-identification-code.service';
import { PatientIdentificationNumericCodeService } from './services/patient-identification-numeric-code.service';

@NgModule({
  imports: [
    CommonModule,
    DxDataGridModule,
    DxPopupModule,
    DxScrollViewModule,
    DxFormModule,
    NgxMaskModule,
  ],
  declarations: [
    LookUpZipCodeComponent,
    // IdentificationFormComponent
  ],
  providers: [PatientIdentificationCodeService, PatientIdentificationNumericCodeService],
})
export class LookUpZipCodeModule {}
