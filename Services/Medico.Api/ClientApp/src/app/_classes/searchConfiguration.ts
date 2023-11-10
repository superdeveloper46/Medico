export class SearchConfiguration {
  skipItemsCount = 0;
  takeItemsCount = 10;

  get pageSizeCount(): number {
    return this.takeItemsCount;
  }

  allowedPageSizes: Array<number> = [8, 12, 20];

  availableFilters: string[] = ['contains', '=', 'startswith'];

  availableDateFilters: string[] = ['equals'];
}
