import { Component, Input, ViewChild } from '@angular/core';
import { MeasurementSystem, VitalSignsConfig } from '../../classes/vitalSignsConfig';
import { DxFormComponent } from 'devextreme-angular/ui/form';

@Component({
  templateUrl: 'vital-signs-config.component.html',
  selector: 'vital-signs-config',
})
export class VitalSignsConfigComponent {
  @Input() vitalSignsConfig!: VitalSignsConfig;

  @ViewChild('vitalSignsConfigForm', { static: false })
  vitalSignsConfigForm!: DxFormComponent;

  units: any[] = [];

  constructor() {
    this.units = Object.values(MeasurementSystem).map(v => {
      return { id: v, value: v };
    });
  }
}
