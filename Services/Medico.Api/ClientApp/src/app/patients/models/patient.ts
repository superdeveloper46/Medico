import { ZipCodeType } from './zipCodeType';

export class Patient {
  id?: string;
  companyId?: string;
  firstName: string = '';
  lastName: string = '';
  middleName: string = '';
  gender?: number;
  dateOfBirth: any;
  maritalStatus?: number;
  ssn: string = '';
  primaryAddress: string = '';
  secondaryAddress: string = '';
  city: string = '';
  primaryPhone: string = '';
  secondaryPhone: string = '';
  email: string = '';
  zip: string = '';
  state?: number;
  patientInsuranceId?: string;
  zipCodeType: ZipCodeType;
  notes: string = '';
  password?: string;
  pharmacyInformation: string = '';
  primaryInsuranceInformation: string = '';
  secondaryInsuranceInformation: string = '';
  patientCommunicationMethod: string = '';
  patientCommunicationMethodArray: any;
  caseNumber?: string;
  rqid?: string;
  startDate: any;
  endDate: any;
  admissionDate: any;
  todaydate: any;
  fin?: string;
  mrn?: string;

  constructor() {
    this.zipCodeType = ZipCodeType.FiveDigit;
  }
}
