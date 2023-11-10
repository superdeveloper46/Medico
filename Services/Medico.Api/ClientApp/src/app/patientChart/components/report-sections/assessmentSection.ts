import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { StringHelper } from 'src/app/_helpers/string.helper';
import { ReportSectionTemplates } from './reportSectionTemplates';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { VitalSignsService } from '../../patient-chart-tree/services/vital-signs.service';

export class AssessmentSection implements IReportContentProvider {
  constructor(private vitalSignsService: VitalSignsService) {}

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const assessments = this.getAssessments(patientChartNodeReportInfo.patientChartNode);

    const problemListRequest = this.vitalSignsService.getProblemList(
      patientChartNodeReportInfo.appointmentId
    );

    if (!assessments) return Promise.resolve('');

    const patientChartNode = patientChartNodeReportInfo.patientChartNode;
    let assessmentsSectionContent = StringHelper.format(
      ReportSectionTemplates.rowTemplate,
      patientChartNode.title,
      assessments
    );
    const nodeId = patientChartNode.id;
    return Promise.all([problemListRequest]).then(result => {
      const [problemList] = result;

      const problemListString = this.getProblemList(problemList.data);

      assessmentsSectionContent = assessmentsSectionContent.replace(
        '<b>Assessment',
        "<b _pointer class='_template' id='" + nodeId + "'>Assessment"
      );

      return `${assessmentsSectionContent}${problemListString} `;
    });

    //return Promise.resolve(assessmentsSectionContent);
  }

  private getAssessments(assessmentsPatientChartNode: PatientChartNode): string {
    const updatedFlag = '_updated';
    const defaultFlag = '_default';
    const assessments = assessmentsPatientChartNode.value;

    if (!assessments || !assessments.length)
      return `<ul><li ${defaultFlag}>None</ul></li>`;

    let assessmentListItems = `<ul ${updatedFlag}>`;
    for (let i = 0; i < assessments.length; i++) {
      const assessment = assessments[i];
      assessmentListItems += `
                <li>
                    <div><b>${assessment.diagnosis}</b></div>
                    <div><i>Duration: </i>${DateHelper.getDate(
                      assessment.startDate
                    )} - ${DateHelper.getDate(assessment.endDate)}</div>
                    <div><i>Status: </i>${assessment.status} </div>
                    <div><i>Added By: </i>${assessment.employee} </div>
                    <div>${assessment.notes ? assessment.notes : ''}</div>
                </li>`;
    }
    return (assessmentListItems += '</ul>');
  }

  getProblemList(problemList?: any[]) {
    if (!problemList?.length) return '';

    const updatedFlag = '_updated';
    let assessmentListItems = `<strong>Problem List</strong><br> <ul ${updatedFlag}>`;

    for (let i = 0; i < problemList.length; i++) {
      const assessment = problemList[i];

      assessmentListItems += `
                  <li>
                      <div><b>${assessment.assessment}</b></div>
                      <div>Status: ${assessment.status} </div>
                      <div>${assessment.notes ? assessment.notes : ''}</div>
                  </li>`;
    }
    return `${assessmentListItems}</ul>`;
  }
}
