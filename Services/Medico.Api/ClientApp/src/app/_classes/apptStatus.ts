export interface AppointmentStatus {
  id: string;
  status: string;
  createdBy: string;
  notes: string;
  sendEmail: boolean;
  emailContent: string | '';
}
