export class MedicationHistory {
  id?: string;
  createDate?: any;
  medication?: string;
  patientId: string;
  medicationNameId?: string;
  units?: string;
  dose?: string;
  route?: string;
  prn: boolean;
  medicationStatus?: string;
  notes?: string;
  dosageForm?: string;
  sig?: string;
  includeNotesInReport: boolean;
  provider?: string;

  constructor(patientId = '') {
    this.createDate = new Date();
    this.prn = false;
    this.patientId = patientId;
    this.includeNotesInReport = true;
  }
}
