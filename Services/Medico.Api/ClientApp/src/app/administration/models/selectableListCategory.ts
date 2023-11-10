export class SelectableListCategory {
  id?: string;
  companyId?: string;
  title?: string;
  isActive: boolean;
  version?: number;
  librarySelectableListCategoryId?: string;

  constructor() {
    this.isActive = true;
  }
}
