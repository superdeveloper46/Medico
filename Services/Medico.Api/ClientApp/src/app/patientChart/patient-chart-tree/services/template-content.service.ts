import { Injectable } from '@angular/core';
import { ObjectHelper } from 'src/app/_helpers/object.helper';
import { PatientChartNodeManagementService } from '../../services/patient-chart-node-management.service';

@Injectable()
export class TemplateContentService {
  constructor(
    private patientChartNodeManagementService: PatientChartNodeManagementService
  ) {}

  getTemplatesContent(patientChart: any, templateType: string): string {
    const templateListSection = this.patientChartNodeManagementService.getByName(
      templateType,
      patientChart
    );

    let templatesContent = '';

    const templates = templateListSection?.children;

    if (templates?.length) {
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const isDetailedContentExist = !ObjectHelper.isObjectEmpty(template.value);
        template.value.detailedTemplateHtml;

        if (isDetailedContentExist) {
          templatesContent += ` ${template.value.detailedTemplateHtml}`;
        }
      }
    }

    return templatesContent;
  }
}
