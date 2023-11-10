import { ConfigService } from './config.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LookupModel } from '../_models/lookupModel';
import { CreateUpdateExpressionModel } from '../_models/createUpdateExpressionModel';
import { ExpressionModel } from '../_models/expressionModel';
import { ImportedItemsSearchFilter } from '../administration/models/importedItemsSearchFilter';
import { ExpressionGridItemModel } from '../_models/expressionGridItemModel';
import { firstValueFrom } from 'rxjs';

export abstract class BaseExpressionService {
  protected abstract baseExpressionUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  getById(expressionId: string): Promise<ExpressionModel> {
    return firstValueFrom(
      this.http.get<ExpressionModel>(
        `${this.config.apiUrl}${this.baseExpressionUrl}/${expressionId}`
      )
    );
  }

  getExpressionReferenceTables(expressionId: string): Promise<LookupModel[]> {
    return firstValueFrom(
      this.http.get<LookupModel[]>(
        `${this.fullExpressionUrl}${expressionId}/reference-tables`
      )
    );
  }

  save(expression: CreateUpdateExpressionModel): Promise<CreateUpdateExpressionModel> {
    return firstValueFrom(
      this.http.post<CreateUpdateExpressionModel>(
        `${this.config.apiUrl}${this.baseExpressionUrl}/`,
        expression
      )
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}${this.baseExpressionUrl}/${id}`)
    );
  }

  getByFilter(
    searchFilter: ImportedItemsSearchFilter
  ): Promise<ExpressionGridItemModel[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<ExpressionGridItemModel[]>(
        `${this.config.apiUrl}${this.baseExpressionUrl}`,
        {
          params: queryParams,
        }
      )
    );
  }

  protected get fullExpressionUrl(): string {
    return `${this.config.apiUrl}${this.baseExpressionUrl}/`;
  }
}
