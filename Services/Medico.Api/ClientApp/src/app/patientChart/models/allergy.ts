export class Allergy {
  id?: string;
  reaction?: string;
  medication!: string;
  medicationNameId?: string;
  medicationClassId?: string;
  notes?: string;
  patientId?: string;
  createDate: any;
  includeNotesInReport: boolean;

  constructor() {
    this.createDate = new Date();
    this.includeNotesInReport = true;
  }
}
