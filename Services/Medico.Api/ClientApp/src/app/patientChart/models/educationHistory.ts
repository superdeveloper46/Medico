export class EducationHistory {
  id?: string;
  patientId?: string;
  createDate?: any;
  degree?: string;
  yearCompleted?: number;
  notes?: string;
  includeNotesInReport: boolean;

  constructor() {
    this.createDate = new Date();
    this.includeNotesInReport = true;
  }
}
