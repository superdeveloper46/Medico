import { SearchFilter } from '../administration/models/searchFilter';

export class PatientSearchFilter extends SearchFilter {
  lastName?: string;
  firstName?: string;
  ssn?: string;
  dateOfBirth?: any;
}
