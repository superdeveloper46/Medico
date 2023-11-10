import { Patient } from './patient';

export class PatientInsurance extends Patient {
  patientId?: string;
  // caseNumber: string;
  // rqId: string;
  MRN?: string;
  FIN?: string;
  primaryInsuranceCompany: any;
  secondaryInsuranceCompany: any;
  primaryInsuranceGroupNumber?: string;
  secondaryInsuranceGroupNumber?: string;
  primaryInsuranceNumber?: string;
  secondaryInsuranceNumber?: string;
  providerId?: string;
  maId?: string;
}
