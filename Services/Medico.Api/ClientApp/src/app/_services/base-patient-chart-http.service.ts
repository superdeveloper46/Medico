import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { PatientChartNode } from '../_models/patientChartNode';
import { PatientChartDocumentFilter } from '../_models/patientChartDocumentFilter';
import { firstValueFrom } from 'rxjs';

export abstract class BasePatientChartHttpService {
  abstract patientChartUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  getByFilter(searchFilter: PatientChartDocumentFilter): Promise<PatientChartNode> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<PatientChartNode>(`${this.config.apiUrl}${this.patientChartUrl}`, {
        params: queryParams,
      })
    );
  }

  get(
    companyId = '',
    patientChartDocumentNodes: string[] | null = null
  ): Promise<PatientChartNode> {
    const searchFilter = new PatientChartDocumentFilter();
    if (companyId) searchFilter.companyId = companyId;

    if (patientChartDocumentNodes) {
      searchFilter.patientChartDocumentNodes = patientChartDocumentNodes;
      searchFilter.restrictByPatientChartDocumentNodes = true;
    }

    return this.getByFilter(searchFilter);
  }

  update(
    patientChart: PatientChartNode,
    companyId: string,
    patientChartDocumentId = ''
  ): Promise<PatientChartNode> {
    return firstValueFrom(
      this.http.post<PatientChartNode>(`${this.config.apiUrl}${this.patientChartUrl}`, {
        patientChart,
        companyId,
        patientChartDocumentId,
      })
    );
  }
}
