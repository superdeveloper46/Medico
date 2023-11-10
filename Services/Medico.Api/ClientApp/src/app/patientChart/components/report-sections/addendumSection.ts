import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { StringHelper } from 'src/app/_helpers/string.helper';
import { ReportSectionTemplates } from './reportSectionTemplates';

export class AddendumSection implements IReportContentProvider {
  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const addendumNotes = this.getAddendumNotes(
      patientChartNodeReportInfo.patientChartNode
    );

    if (!addendumNotes) return Promise.resolve('');
    const addendumSectionContent = StringHelper.format(
      ReportSectionTemplates.rowTemplate,
      patientChartNodeReportInfo.patientChartNode.title,
      addendumNotes
    );

    return Promise.resolve(addendumSectionContent);
  }

  getAddendumNotes(patientChartNode: PatientChartNode): string {
    return patientChartNode.value ? patientChartNode.value : '';
  }
}
