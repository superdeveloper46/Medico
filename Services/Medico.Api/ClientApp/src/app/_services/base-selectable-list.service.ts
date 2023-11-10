import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { SelectableListValue } from '../_models/selectableListValue';
import { SelectableList } from '../_models/selectableList';
import { SelectableListSearchFilter } from '../administration/models/selectableListSearchFilter';
import { firstValueFrom } from 'rxjs';

export abstract class BaseSelectableListService {
  abstract baseSelectableListUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  getFirstActiveByCategoryId(categoryId: string, companyId = '') {
    const firstActiveByCategoryIdFilter = this.getFirstActiveByCategoryIdFilter(
      categoryId,
      companyId
    );

    return this.getByFilter(firstActiveByCategoryIdFilter).then(
      selectableLists => selectableLists[0]
    );
  }

  getFirstByCategoryId(categoryId: string, companyId = '') {
    const firstByCategoryIdFilter = this.getFirstByCategoryIdFilter(
      categoryId,
      companyId
    );

    return this.getByFilter(firstByCategoryIdFilter).then(
      selectableLists => selectableLists[0]
    );
  }

  getSelectableListValuesById(selectableListId: string): Promise<SelectableListValue[]> {
    return this.getById(selectableListId).then(
      selectableList => selectableList?.selectableListValues ?? []
    );
  }

  getById(selectableListId: string) {
    return firstValueFrom(
      this.http.get<SelectableList>(
        `${this.config.apiUrl}${this.baseSelectableListUrl}/${selectableListId}`
      )
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}${this.baseSelectableListUrl}/${id}`)
    );
  }

  save(template: SelectableList): Promise<SelectableList> {
    return firstValueFrom(
      this.http.post<SelectableList>(
        `${this.config.apiUrl}${this.baseSelectableListUrl}/`,
        template
      )
    );
  }

  activateDeactivateSelectableList(templateId: string, isActive: boolean): Promise<any> {
    const patchObject = [
      {
        op: 'add',
        path: '/isActive',
        value: isActive,
      },
    ];

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseSelectableListUrl}/${templateId}`,
        patchObject
      )
    );
  }

  getByTitle(title: any, companyId = ''): Promise<SelectableList> {
    const filter = this.getFirstByTitleAndCompanyIdFilter(title, companyId);
    return this.getByFilter(filter).then(selectableLists => selectableLists[0]);
  }

  getByFilter(searchFilter: SelectableListSearchFilter): Promise<SelectableList[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<SelectableList[]>(
        `${this.config.apiUrl}${this.baseSelectableListUrl}`,
        {
          params: queryParams,
        }
      )
    );
  }

  private getFirstByTitleAndCompanyIdFilter(title: string, companyId = '') {
    const selectableListFilter = new SelectableListSearchFilter();
    selectableListFilter.take = 1;
    selectableListFilter.title = title;

    if (companyId) selectableListFilter.companyId = companyId;

    return selectableListFilter;
  }

  protected getFirstByCompanyIdFilter(companyId: string) {
    const selectableListFilter = new SelectableListSearchFilter();
    selectableListFilter.take = 1;
    selectableListFilter.companyId = companyId;

    return selectableListFilter;
  }

  private getFirstByCategoryIdFilter(categoryId: string, companyId = '') {
    const selectableListFilter = new SelectableListSearchFilter();
    selectableListFilter.take = 1;
    selectableListFilter.categoryId = categoryId;

    if (companyId) selectableListFilter.companyId = companyId;

    return selectableListFilter;
  }

  private getFirstActiveByCategoryIdFilter(categoryId: string, companyId = '') {
    const selectableListFilter = new SelectableListSearchFilter();
    selectableListFilter.take = 1;
    selectableListFilter.categoryId = categoryId;
    selectableListFilter.isActive = true;

    if (companyId) selectableListFilter.companyId = companyId;

    return selectableListFilter;
  }
}
