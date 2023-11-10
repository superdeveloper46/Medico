export class VitalSignsNotes {
  id?: string;
  admissionId?: string;
  notes: string = '';
  includeNotesInReport: Nullable<boolean>;

  constructor() {
    this.includeNotesInReport = true;
  }
}
