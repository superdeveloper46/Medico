export interface PatientOrder {
  patientId: string;
  appointmentId?: string;
  notes?: string;
  referenceNo?: string;
  physicianId: string;
  insuranceId?: string;
  vendorId: number;
  dateOrdered: Date;
  attachmentId?: number;
  patientOrderItems: PatientOrderItem[];
  userIds?: string[];
  reminderDate?: Date | null;
}

export interface PatientOrderItem {
  labTestId: any;
  quantity?: number;
}
