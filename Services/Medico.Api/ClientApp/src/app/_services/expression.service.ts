import { BaseExpressionService } from './base-expression.service';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpressionService extends BaseExpressionService {
  protected baseExpressionUrl: string = ApiBaseUrls.expressions;

  constructor(http: HttpClient, config: ConfigService) {
    super(http, config);
  }

  importLibraryExpressions(companyId: string, selectedExpressionIds: string[]) {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/companyId',
      value: companyId,
    });

    for (let i = 0; i < selectedExpressionIds.length; i++) {
      const libraryListId = selectedExpressionIds[i];
      patchObject.push({
        op: 'add',
        path: '/libraryEntityIds/-',
        value: libraryListId,
      });
    }

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseExpressionUrl}/imported-expressions`,
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
        `${this.config.apiUrl}${this.baseExpressionUrl}/${id}/version`,
        patchObject
      )
    );
  }
}
