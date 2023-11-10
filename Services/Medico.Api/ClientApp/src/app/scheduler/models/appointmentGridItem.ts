export class AppointmentGridItem {
  patientId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientDateOfBirth?: any;
  companyId?: string;
  locationId?: string;
  locationName?: string;
  physicianId?: string;
  physicianFirstName?: string;
  physicianLastName?: string;
  patientNameSuffix?: string;
  nurseId?: string;
  nurseFirstName?: string;
  nurseLastName?: string;
  roomId?: string;
  roomName?: string;
  startDate?: any;
  endDate?: any;
  date?: any;
  admissionId?: string;
  allegations?: string;
  appointmentStatus?: string;
  totalNumberOfPatientAppointments?: number;
  signingDate?: any;
  previousAppointmentDate?: any;
  appointmentPatientChartDocuments: any[] = [];
  MRN?: string;
}
