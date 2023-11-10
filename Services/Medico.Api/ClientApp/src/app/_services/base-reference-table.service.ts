import { ConfigService } from './config.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ReferenceTable } from '../administration/models/referenceTable';
import { ImportedItemsSearchFilter } from '../administration/models/importedItemsSearchFilter';
import { ReferenceTableGridItem } from '../administration/models/referenceTableGridItem';
import { firstValueFrom } from 'rxjs';

export abstract class BaseReferenceTableService {
  abstract basedReferenceTableUrl: string;

  constructor(protected http: HttpClient, protected config: ConfigService) {}

  getById(id: string): Promise<ReferenceTable> {
    return firstValueFrom(
      this.http.get<ReferenceTable>(
        `${this.config.apiUrl}${this.basedReferenceTableUrl}/${id}`
      )
    );
  }

  save(referenceTable: ReferenceTable): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.config.apiUrl}${this.basedReferenceTableUrl}`,
        referenceTable
      )
    );
  }

  getByFilter(
    searchFilter: ImportedItemsSearchFilter
  ): Promise<ReferenceTableGridItem[]> {
    const queryParams = new HttpParams({
      fromObject: searchFilter.toQueryParams(),
    });
    return firstValueFrom(
      this.http.get<ReferenceTableGridItem[]>(
        `${this.config.apiUrl}${this.basedReferenceTableUrl}`,
        { params: queryParams }
      )
    );
  }
}
