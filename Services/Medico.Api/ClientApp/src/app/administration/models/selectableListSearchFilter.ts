import { SearchFilter } from './searchFilter';

export class SelectableListSearchFilter extends SearchFilter {
  categoryId?: string;
  librarySelectableListId?: string;
  librarySelectableListIds?: string[];
  excludeImported?: boolean;
}
