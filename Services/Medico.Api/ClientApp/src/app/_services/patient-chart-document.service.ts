import { BasePatientChartDocumentService } from './base-patient-chart-document.service';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { Injectable } from '@angular/core';
import { PatientChartNode } from '../_models/patientChartNode';
import { PatientChartDocumentWithVersion } from '../_models/patientChartDocumentWithVersion';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { LookupModel } from '../_models/lookupModel';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientChartDocumentService extends BasePatientChartDocumentService {
  patientChartDocumentUrl: string = ApiBaseUrls.patientChartDocuments;

  constructor(http: HttpClient, config: ConfigService) {
    super(http, config);
  }

  getNodes(documentId: string): Promise<LookupModel[]> {
    return firstValueFrom(
      this.http.get<LookupModel[]>(
        `${this.config.apiUrl}${this.patientChartDocumentUrl}/${documentId}/nodes`
      )
    );
  }

  getByIdWithFilter(id: string): Promise<PatientChartDocumentWithVersion> {
    return firstValueFrom(
      this.http.get<PatientChartDocumentWithVersion>(
        `${this.config.apiUrl}${this.patientChartDocumentUrl}/${id}`
      )
    );
  }

  syncWithLibraryDocument(
    id: string,
    version: number | null,
    patientChartRootId: string
  ) {
    const patchObject = [];

    if (!version) version = 1;

    patchObject.push({
      op: 'add',
      path: '/version',
      value: version,
    });

    patchObject.push({
      op: 'add',
      path: '/patientChartRootNodeId',
      value: patientChartRootId,
    });

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.patientChartDocumentUrl}/${id}/version`,
        patchObject
      )
    );
  }

  importLibraryDocumentNodes(
    companyId: string,
    selectedListsIds: string[],
    patientChartRootNodeId: string
  ): Promise<PatientChartNode[]> {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/companyId',
      value: companyId,
    });

    patchObject.push({
      op: 'add',
      path: '/patientChartRootNodeId',
      value: patientChartRootNodeId,
    });

    for (let i = 0; i < selectedListsIds.length; i++) {
      const libraryListId = selectedListsIds[i];
      patchObject.push({
        op: 'add',
        path: '/libraryEntityIds/-',
        value: libraryListId,
      });
    }

    return firstValueFrom(
      this.http.patch<PatientChartNode[]>(
        `${this.config.apiUrl}${this.patientChartDocumentUrl}/imported-documents`,
        patchObject
      )
    );
  }
}
