import { StringHelper } from 'src/app/_helpers/string.helper';
import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { ReportSectionTemplates } from './reportSectionTemplates';
//this section is used fo DocumentNode, SectionNode, TemplateListNode types
export class ContainerSection implements IReportContentProvider {
  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const sectionContent = StringHelper.format(
      ReportSectionTemplates.titleTemplate,
      patientChartNodeReportInfo.patientChartNode.title
    );

    return Promise.resolve(sectionContent);
  }
}
