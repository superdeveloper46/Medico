import { PatientIdentificationCodeType } from './enums/patientIdentificationCodeType';

export class PatientIdentificationCodeApiModel {
  id?: string;
  prefix?: string;
  letterCode?: string;
  numericCode?: number;
  year?: number;
  month?: number;
  type?: PatientIdentificationCodeType;
  patientId?: string;
  companyId?: string;
  identificationCodeString?: string;
}
