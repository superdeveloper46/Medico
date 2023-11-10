import { ConfigService } from './config.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SelectableListCategory } from '../administration/models/selectableListCategory';
import { SearchFilter } from '../administration/models/searchFilter';
import { firstValueFrom } from 'rxjs';

export abstract class BaseSelectableListCategoryService {
  abstract basedCategoryUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  activateDeactivateCategory(categoryId: string, isActive: boolean): Promise<any> {
    const patchObject = [
      {
        op: 'add',
        path: '/isActive',
        value: isActive,
      },
    ];

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.basedCategoryUrl}/${categoryId}`,
        patchObject
      )
    );
  }

  getByTitle(
    categoryTitle: string,
    companyId = ''
  ): Promise<SelectableListCategory | null> {
    const categoryTitleFilter = this.getCategoryTitleFilter(categoryTitle, companyId);

    return this.getByFilter(categoryTitleFilter).then(categories => {
      return categories[0];
    });
  }

  getById(id: string): Promise<SelectableListCategory> {
    return firstValueFrom(
      this.http.get<SelectableListCategory>(
        `${this.config.apiUrl}${this.basedCategoryUrl}/${id}`
      )
    );
  }

  save(category: SelectableListCategory): Promise<any> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}${this.basedCategoryUrl}`, category)
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}${this.basedCategoryUrl}/${id}`)
    );
  }

  private getByFilter(searchFilter: SearchFilter): Promise<SelectableListCategory[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<SelectableListCategory[]>(
        `${this.config.apiUrl}${this.basedCategoryUrl}`,
        {
          params: queryParams,
        }
      )
    );
  }

  private getCategoryTitleFilter(title: string, companyId = '') {
    const searchFilter = new SearchFilter();
    searchFilter.title = title;
    searchFilter.take = 1;

    if (companyId) searchFilter.companyId = companyId;

    return searchFilter;
  }
}
