import { SearchFilter } from './searchFilter';
export class TemplateSearchFilter extends SearchFilter {
  templateTypeId?: string;
  expressionId?: string;
  selectableListId?: string;
  chiefComplaintId?: string;
  excludeImported?: boolean;
  isRequired?: boolean;
}
