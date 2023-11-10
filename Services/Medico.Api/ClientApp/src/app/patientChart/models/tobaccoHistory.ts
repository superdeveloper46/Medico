export class TobaccoHistory {
  id?: string;
  status?: string;
  type?: string;
  amount?: number;
  use?: number;
  frequency?: string;
  length?: number;
  duration?: string;
  notes?: string;
  quit: boolean;
  statusLength?: number;
  createDate: any;
  patientId?: string;
  statusLengthType?: string;
  includeNotesInReport: Nullable<boolean>;

  constructor() {
    this.quit = false;
    this.createDate = new Date();
    this.includeNotesInReport = true;
  }
}
