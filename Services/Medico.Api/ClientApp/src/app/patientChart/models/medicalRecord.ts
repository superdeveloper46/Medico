export class MedicalRecord {
  id?: string;
  notes?: string;
  patientId?: string;
  documentType?: string;
  diagnosis?: string;
  createDate?: any;
  physicianId?: string;
  icdCode?: any;
  includeNotesInReport: boolean;
  assessment?: string;
  fileName?: string;
  documents?: any[];
  subject?: string;

  constructor() {
    this.createDate = new Date();
    this.includeNotesInReport = true;
  }
}
