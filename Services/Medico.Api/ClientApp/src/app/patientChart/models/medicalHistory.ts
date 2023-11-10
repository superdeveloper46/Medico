export class MedicalHistory {
  id?: string;
  notes?: string;
  patientId?: string;
  diagnosis?: string;
  createDate?: any;
  includeNotesInReport: boolean;

  constructor() {
    this.createDate = new Date();
    this.includeNotesInReport = true;
  }
}
