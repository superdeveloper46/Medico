import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { TemplateSearchFilter } from '../administration/models/templateSearchFilter';
import { TemplateGridItem } from 'src/app/_models/templateGridItem';
import { SortableItem } from '../share/classes/sortableItem';
import { Template } from '../_models/template';
import { firstValueFrom } from 'rxjs';

export abstract class BaseTemplateService {
  protected abstract baseTemplateUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  getFirstActiveBySelectableListId(selectableListId: string, companyId = '') {
    const firstActiveBySelectableListIdFilter =
      this.getFirstActiveBySelectableListIdFilter(selectableListId, companyId);

    return this.getByFilter(firstActiveBySelectableListIdFilter).then(
      templateGridItems => {
        return templateGridItems.length ? templateGridItems[0] : null;
      }
    );
  }

  getFirstBySelectableListId(selectableListId: string, companyId = '') {
    const firstBySelectableListIdFilter = this.getFirstBySelectableListIdFilter(
      selectableListId,
      companyId
    );

    return this.getByFilter(firstBySelectableListIdFilter).then(templateGridItems => {
      return templateGridItems.length ? templateGridItems[0] : null;
    });
  }

  getFirstByExpressionId(expressionId: string, companyId = '') {
    const firstByExpressionIdFilter = this.getFirstByExpressionIdFilter(
      expressionId,
      companyId
    );

    return this.getByFilter(firstByExpressionIdFilter).then(templateGridItems => {
      return templateGridItems.length ? templateGridItems[0] : null;
    });
  }

  getById(templateId: string) {
    return firstValueFrom(
      this.http.get<Template>(
        `${this.config.apiUrl}${this.baseTemplateUrl}/${templateId}`
      )
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}${this.baseTemplateUrl}/${id}`)
    );
  }

  save(template: Template): Promise<Template> {
    return firstValueFrom(
      this.http.post<Template>(`${this.config.apiUrl}${this.baseTemplateUrl}/`, template)
    );
  }

  activateDeactivateTemplate(templateId: string, isActive: boolean): Promise<any> {
    const patchObject = [
      {
        op: 'add',
        path: '/isActive',
        value: isActive,
      },
    ];

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseTemplateUrl}/${templateId}`,
        patchObject
      )
    );
  }

  reorderTemplates(sortableItems: SortableItem[]): Promise<any> {
    const patchObject = [];

    for (let i = 0; i < sortableItems.length; i++) {
      const sortableItem = sortableItems[i];
      patchObject.push({
        op: 'add',
        path: '/templatesOrders/-',
        value: {
          id: sortableItem.id,
          order: sortableItem.order,
        },
      });
    }

    return firstValueFrom(
      this.http.patch(`${this.config.apiUrl}${this.baseTemplateUrl}`, patchObject)
    );
  }

  getFirstActiveByTemplateTypeId(libraryTemplateTypeId: string, companyId = '') {
    const firstActiveByTemplateTypeIdFilter = this.getFirstActiveByTemplateTypeIdFilter(
      libraryTemplateTypeId,
      companyId
    );
    return this.getByFilter(firstActiveByTemplateTypeIdFilter).then(templateGridItems => {
      return templateGridItems.length ? templateGridItems[0] : null;
    });
  }

  getFirstByTemplateTypeId(
    libraryTemplateTypeId: string,
    companyId = ''
  ): Promise<Nullable<TemplateGridItem>> {
    const firstByTemplateTypeIdFilter = this.getFirstByTemplateTypeIdFilter(
      libraryTemplateTypeId,
      companyId
    );
    return this.getByFilter(firstByTemplateTypeIdFilter).then(templateGridItems => {
      return templateGridItems.length ? templateGridItems[0] : null;
    });
  }

  getByFilter(searchFilter: TemplateSearchFilter): Promise<TemplateGridItem[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<TemplateGridItem[]>(`${this.config.apiUrl}${this.baseTemplateUrl}`, {
        params: queryParams,
      })
    );
  }

  private getFirstActiveBySelectableListIdFilter(
    selectableListId: string,
    companyId = ''
  ) {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.selectableListId = selectableListId;
    templateFilter.isActive = true;
    templateFilter.take = 1;

    if (companyId) templateFilter.companyId = companyId;

    return templateFilter;
  }

  private getFirstByExpressionIdFilter(expressionId: string, companyId = '') {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.expressionId = expressionId;
    templateFilter.take = 1;

    if (companyId) templateFilter.companyId = companyId;

    return templateFilter;
  }

  private getFirstBySelectableListIdFilter(selectableListId: string, companyId = '') {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.selectableListId = selectableListId;
    templateFilter.take = 1;

    if (companyId) templateFilter.companyId = companyId;

    return templateFilter;
  }

  private getFirstByTemplateTypeIdFilter(libraryTemplateTypeId: string, companyId = '') {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.templateTypeId = libraryTemplateTypeId;
    templateFilter.take = 1;

    if (companyId) templateFilter.companyId = companyId;

    return templateFilter;
  }

  private getFirstActiveByTemplateTypeIdFilter(
    libraryTemplateTypeId: string,
    companyId = ''
  ) {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.templateTypeId = libraryTemplateTypeId;
    templateFilter.isActive = true;
    templateFilter.take = 1;

    if (companyId) templateFilter.companyId = companyId;

    return templateFilter;
  }
}
