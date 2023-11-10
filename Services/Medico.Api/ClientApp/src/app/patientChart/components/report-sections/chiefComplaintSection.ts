import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { StringHelper } from 'src/app/_helpers/string.helper';
import { ReportSectionTemplates } from './reportSectionTemplates';

export class ChiefComplaintSection implements IReportContentProvider {
  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const allegations = this.getAllegations(patientChartNodeReportInfo.patientChartNode);

    if (!allegations) return Promise.resolve('');
    const chiefComplaintSectionContent = StringHelper.format(
      ReportSectionTemplates.rowTemplate,
      'Allegations',
      allegations
    );

    return Promise.resolve(chiefComplaintSectionContent);
  }

  private getAllegations(allegationsPatientChartNode: PatientChartNode): string {
    const patientAllegationsSets =
      allegationsPatientChartNode.value.patientAllegationsSets;

    if (!patientAllegationsSets || !patientAllegationsSets.length)
      return '<ul><li>None</ul></li>';

    let allegations = '<ul>';

    for (let i = 0; i < patientAllegationsSets.length; i++) {
      const patientAllegationsSet = patientAllegationsSets[i];

      allegations += `<li><p>${patientAllegationsSet.allegations}</p></li>`;
    }

    return (allegations += '</ul>');
  }
}
