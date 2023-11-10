import { BaseSearchFilter } from './baseSearchFilter';

export class ImportedItemsSearchFilter extends BaseSearchFilter {
  companyId?: string;
  excludeImported?: boolean;
}
