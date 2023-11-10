import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { PatientChartNode } from '../_models/patientChartNode';
import { LookupModel } from '../_models/lookupModel';
import { PatientChartSearchFilter } from '../administration/models/patientChartSearchFilter';
import { firstValueFrom } from 'rxjs';

export abstract class BasePatientChartDocumentService {
  abstract patientChartDocumentUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  getByTemplateUse(templateId: string, companyId = ''): Promise<LookupModel[]> {
    const filter = this.getByTemplateUseFilter(templateId, companyId);

    return this.getByFilter(filter);
  }

  getByTemplateTypeUse(templateTypeId: string, companyId = ''): Promise<LookupModel[]> {
    const filter = this.getByTemplateTypeUseFilter(templateTypeId, companyId);

    return this.getByFilter(filter);
  }

  getPatientChartDocumentCopy(patientChartDocumentId: string): Promise<PatientChartNode> {
    return firstValueFrom(
      this.http.get<PatientChartNode>(
        `${this.config.apiUrl}${this.patientChartDocumentUrl}/${patientChartDocumentId}/copy`
      )
    );
  }

  getByTitle(title: any, companyId = ''): Promise<LookupModel> {
    const searchFilter = this.getTitleFilter(title, companyId);

    return this.getByFilter(searchFilter).then(
      patientChartDocuments => patientChartDocuments[0]
    );
  }

  getByFilter(searchFilter: PatientChartSearchFilter): Promise<LookupModel[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });

    return firstValueFrom(
      this.http.get<LookupModel[]>(
        `${this.config.apiUrl}${this.patientChartDocumentUrl}`,
        {
          params: queryParams,
        }
      )
    );
  }

  protected getTitleFilter(title: string, companyId = '') {
    const searchFilter = new PatientChartSearchFilter();
    searchFilter.title = title;
    searchFilter.take = 1;

    if (companyId) searchFilter.companyId = companyId;

    return searchFilter;
  }

  private getByTemplateUseFilter(templateId: string, companyId = '') {
    const searchFilter = new PatientChartSearchFilter();
    searchFilter.templateId = templateId;

    if (companyId) searchFilter.companyId = companyId;

    return searchFilter;
  }

  private getByTemplateTypeUseFilter(templateTypeId: string, companyId = '') {
    const searchFilter = new PatientChartSearchFilter();
    searchFilter.templateTypeId = templateTypeId;

    if (companyId) searchFilter.companyId = companyId;

    return searchFilter;
  }
}
