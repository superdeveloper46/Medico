import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { BaseReferenceTableService } from './base-reference-table.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReferenceTableService extends BaseReferenceTableService {
  basedReferenceTableUrl: string = ApiBaseUrls.referenceTables;

  constructor(http: HttpClient, config: ConfigService) {
    super(http, config);
  }

  importLibraryReferenceTables(companyId: string, selectedReferenceTableIds: string[]) {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/companyId',
      value: companyId,
    });

    for (let i = 0; i < selectedReferenceTableIds.length; i++) {
      const referenceTableId = selectedReferenceTableIds[i];
      patchObject.push({
        op: 'add',
        path: '/libraryEntityIds/-',
        value: referenceTableId,
      });
    }

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.basedReferenceTableUrl}/imported-tables`,
        patchObject
      )
    );
  }

  syncWithLibraryReferenceTable(id: string, version?: number) {
    const patchObject = [];

    if (!version) version = 1;

    patchObject.push({
      op: 'add',
      path: '/version',
      value: version,
    });

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.basedReferenceTableUrl}/${id}/version`,
        patchObject
      )
    );
  }
}
