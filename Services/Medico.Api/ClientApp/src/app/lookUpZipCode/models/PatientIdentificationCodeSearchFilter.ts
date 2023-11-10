import { BaseSearchFilter } from 'src/app/administration/models/baseSearchFilter';
import { PatientIdentificationCodeType } from './enums/patientIdentificationCodeType';

export class PatientIdentificationCodeSearchFilter extends BaseSearchFilter {
  companyId?: string;
  identificationCodeType?: PatientIdentificationCodeType;
}
