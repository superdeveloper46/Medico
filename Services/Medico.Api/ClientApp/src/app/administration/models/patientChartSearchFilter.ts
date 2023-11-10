import { SearchFilter } from './searchFilter';

export class PatientChartSearchFilter extends SearchFilter {
  excludeImported?: boolean;
  templateId?: string;
  templateTypeId?: string;
}
