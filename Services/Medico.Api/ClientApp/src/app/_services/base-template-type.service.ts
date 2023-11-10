import { TemplateTypeSearchFilter } from '../administration/models/templateTypeSearchFilter';
import { TemplateType } from '../_models/templateType';
import { HttpParams, HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { firstValueFrom } from 'rxjs';

export abstract class BaseTemplateTypeService {
  protected abstract basedTemplateTypeUrl: string;

  constructor(private http: HttpClient, private config: ConfigService) {}

  activateDeactivateTemplateType(
    templateTypeId: string,
    isActive: boolean
  ): Promise<any> {
    const patchObject = [
      {
        op: 'add',
        path: '/isActive',
        value: isActive,
      },
    ];

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.basedTemplateTypeUrl}/${templateTypeId}`,
        patchObject
      )
    );
  }

  getByName(templateTypeName: string, companyId = ''): Promise<TemplateType | null> {
    const templateTypeNameFilter = this.getTemplateTypeNameFilter(
      templateTypeName,
      companyId
    );

    return this.getByFilter(templateTypeNameFilter).then(templateTypes => {
      return templateTypes.length ? templateTypes[0] : null;
    });
  }

  getById(id: string): Promise<TemplateType> {
    return firstValueFrom(
      this.http.get<TemplateType>(
        `${this.config.apiUrl}${this.basedTemplateTypeUrl}/${id}`
      )
    );
  }

  getByTemplateId(templateId: string, companyId = ''): Promise<Nullable<TemplateType>> {
    const templateIdFilter = this.getByTemplateIdFilter(templateId, companyId);

    return this.getByFilter(templateIdFilter).then(templateTypes => {
      return templateTypes.length ? templateTypes[0] : null;
    });
  }

  save(templateType: TemplateType): Promise<any> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.config.apiUrl}${this.basedTemplateTypeUrl}`,
        templateType
      )
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}${this.basedTemplateTypeUrl}/${id}`)
    );
  }

  protected getByFilter(searchFilter: TemplateTypeSearchFilter): Promise<TemplateType[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<TemplateType[]>(`${this.config.apiUrl}${this.basedTemplateTypeUrl}`, {
        params: queryParams,
      })
    );
  }

  private getTemplateTypeNameFilter(templateTypeGeneratedName: string, companyId = '') {
    const searchFilter = new TemplateTypeSearchFilter();
    searchFilter.name = templateTypeGeneratedName;
    searchFilter.take = 1;

    if (companyId) searchFilter.companyId = companyId;

    return searchFilter;
  }

  private getByTemplateIdFilter(templateId: string, companyId: string) {
    const searchFilter = new TemplateTypeSearchFilter();
    searchFilter.templateId = templateId;
    searchFilter.take = 1;

    if (companyId) searchFilter.companyId = companyId;

    return searchFilter;
  }
}
