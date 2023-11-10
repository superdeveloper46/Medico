export class AllegationsNotesStatus {
  id?: string;
  admissionId: string;
  isReviewed: boolean;

  constructor(admissionId = '', isReviewed = false) {
    this.admissionId = admissionId;
    this.isReviewed = isReviewed;
  }
}
