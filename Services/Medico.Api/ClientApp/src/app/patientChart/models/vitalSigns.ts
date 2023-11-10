import { AngularDualListBoxModule } from "angular-dual-listbox";

export class VitalSigns {
  id?: string;
  admissionId?: string;
  patientId?: string;
  pulse?: number;
  systolicBloodPressure?: number;
  diastolicBloodPressure?: number;
  bloodPressureLocation?: string;
  bloodPressurePosition?: string;
  oxygenSaturationAtRest?: string;
  oxygenSaturationAtRestValue?: number;
  respirationRate?: number;
  createdDate: any;
  temperature?: number;
  unit?: string;

  constructor() {
    this.createdDate = new Date();
  }
}
