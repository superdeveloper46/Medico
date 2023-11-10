import { BaseSearchFilter } from './baseSearchFilter';

export class SearchFilter extends BaseSearchFilter {
  take?: number;
  companyId?: string;
  isActive?: boolean;
  title?: string;
}
