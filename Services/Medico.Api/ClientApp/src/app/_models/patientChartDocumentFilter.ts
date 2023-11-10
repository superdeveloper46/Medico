import { SearchFilter } from '../administration/models/searchFilter';

export class PatientChartDocumentFilter extends SearchFilter {
  patientChartDocumentNodes?: string[];
  restrictByPatientChartDocumentNodes?: boolean;
}
