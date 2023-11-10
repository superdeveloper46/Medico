export class MedicationPrescription {
  id?: string;
  patientId: string;
  admissionId: string;
  medicationNameId?: string;
  medication?: string;
  dose?: string;
  dosageForm?: string;
  route?: string;
  units?: string;
  dispense?: number;
  refills?: number;
  sig?: string;
  startDate: any;
  endDate: any;
  includeNotesInReport: Nullable<boolean>;
  notes: string = '';
  totalDays?: number;
  prn: boolean;
  assessment?: string;

  constructor(patientId = '', admissionId = '') {
    this.patientId = patientId;
    this.admissionId = admissionId;
    this.startDate = new Date();
    this.includeNotesInReport = true;
    this.prn = false;
  }
}
