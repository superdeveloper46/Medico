export class OccupationalHistory {
  id?: string;
  occupationalType?: string;
  start: any;
  end: any;
  disabilityClaimDetails?: string;
  workersCompensationClaimDetails?: string;
  employmentStatus?: string;
  notes?: string;
  patientId?: string;
  createDate?: any;
  includeNotesInReport: boolean;

  constructor() {
    this.createDate = new Date();
    this.includeNotesInReport = true;
  }
}
