import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { BaseTemplateService } from './base-template.service';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { TemplateSearchFilter } from '../administration/models/templateSearchFilter';
import { TemplateGridItem } from '../_models/templateGridItem';
import { ArrayHelper } from '../_helpers/array.helper';
import { LookupModel } from '../_models/lookupModel';
import { PatientChartNode } from '../_models/patientChartNode';
import { TemplateNodeInfo } from '../patientChart/models/templateNodeInfo';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TemplateService extends BaseTemplateService {
  baseTemplateUrl: string = ApiBaseUrls.templates;

  constructor(http: HttpClient, config: ConfigService) {
    super(http, config);
  }

  importLibraryTemplates(
    companyId: string,
    libraryTemplateTypeId: string,
    libraryTemplateIds: string[]
  ) {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/companyId',
      value: companyId,
    });

    patchObject.push({
      op: 'add',
      path: '/libraryTemplateTypeId',
      value: libraryTemplateTypeId,
    });

    for (let i = 0; i < libraryTemplateIds.length; i++) {
      const libraryTemplateId = libraryTemplateIds[i];
      patchObject.push({
        op: 'add',
        path: '/libraryEntityIds/-',
        value: libraryTemplateId,
      });
    }

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseTemplateUrl}/imported-templates`,
        patchObject
      )
    );
  }

  syncWithLibraryTemplate(id: string, version: number) {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/version',
      value: version,
    });

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseTemplateUrl}/${id}/version`,
        patchObject
      )
    );
  }

  getChiefComplaintTemplates(
    chiefComplaintId: string,
    companyId: string
  ): Promise<TemplateGridItem[]> {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.chiefComplaintId = chiefComplaintId;
    templateFilter.companyId = companyId;

    return this.getByFilter(templateFilter);
  }

  getRequiredTemplates(companyId: string): Promise<TemplateGridItem[]> {
    const templateFilter = new TemplateSearchFilter();
    templateFilter.isRequired = true;
    templateFilter.isActive = true;
    templateFilter.companyId = companyId;

    return this.getByFilter(templateFilter);
  }

  removeDependentTemplates(
    dependentTemplates: LookupModel[],
    templateNodes: PatientChartNode[],
    templateListNodeValues: TemplateNodeInfo[]
  ) {
    const dependentTemplateIds = dependentTemplates.map(t => t.id);

    const templatesIndexesToDelete = templateListNodeValues.reduce(
      (indexesToDelete: number[], template, index) => {
        const templateId = template.id;
        const isTemplateDeletionNeeded = dependentTemplateIds.indexOf(templateId) !== -1;

        if (isTemplateDeletionNeeded) indexesToDelete.push(index);

        return indexesToDelete;
      },
      []
    );

    if (!templatesIndexesToDelete.length) return;

    ArrayHelper.deleteByIndexes(templateListNodeValues, templatesIndexesToDelete);
    ArrayHelper.deleteByIndexes(templateNodes, templatesIndexesToDelete);
  }
}
