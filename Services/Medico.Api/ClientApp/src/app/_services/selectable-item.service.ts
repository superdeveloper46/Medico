import { Injectable } from '@angular/core';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { SelectableItemRequest } from '../_models/selectableItemRequest';
import { VariablesUniquenessCheckResult } from '../_models/variablesUniquenessCheckResult';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectableItemService {
  baseSelectableItemsUrl: string = ApiBaseUrls.selectableItems;

  constructor(private http: HttpClient, private config: ConfigService) {}

  checkNonUniqueSelectableVariables(
    htmlContent: string
  ): Promise<VariablesUniquenessCheckResult> {
    return firstValueFrom(
      this.http.post<VariablesUniquenessCheckResult>(
        `${this.config.apiUrl}${this.baseSelectableItemsUrl}/variables-uniqueness`,
        { templateContent: htmlContent }
      )
    );
  }

  getSelectableHtmlElementString(
    selectableItemRequest: SelectableItemRequest
  ): Promise<string> {
    const queryParams = new HttpParams({
      fromObject: selectableItemRequest.toQueryParams(),
    });

    return firstValueFrom(
      this.http.get<any>(`${this.config.apiUrl}${this.baseSelectableItemsUrl}`, {
        params: queryParams,
      })
    ).then(response => {
      return response.selectableItemHtmlString;
    });
  }
}
