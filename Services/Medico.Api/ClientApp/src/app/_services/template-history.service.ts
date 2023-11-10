import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { TemplateHistorySearchFilter } from '../_models/templateHistorySearchFilter';
import { TemplateHistory } from '../_models/templateHistory';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TemplateHistoryService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  get(searchFilter: TemplateHistorySearchFilter): Promise<TemplateHistory> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<TemplateHistory>(
        `${this.config.apiUrl}${ApiBaseUrls.templateHistory}`,
        {
          params: queryParams,
        }
      )
    );
  }
}
