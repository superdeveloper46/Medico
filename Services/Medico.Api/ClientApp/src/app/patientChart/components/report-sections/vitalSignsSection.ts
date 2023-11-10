import { VitalSignsService } from '../../patient-chart-tree/services/vital-signs.service';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { BaseVitalSignsService } from '../../patient-chart-tree/services/base-vital-signs.service';
import { MedicalCalculationHelper } from 'src/app/_helpers/medical-calculation.helper';
import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { VisionVitalSignsService } from '../../patient-chart-tree/services/vision-vital-signs.service';
import { HtmlReportHelperService } from '../../services/html-report-helper.service';
import { BaseVitalSigns } from '../../models/baseVitalSigns';
import { VitalSigns } from '../../models/vitalSigns';
import { VisionVitalSigns } from '../../models/visionVitalSigns';
import { VitalSignsNotesService } from '../../patient-chart-tree/services/vital-signs-notes.service';
import { Constants } from 'src/app/_classes/constants';
import { StringHelper } from 'src/app/_helpers/string.helper';

export class VitalSignsSection implements IReportContentProvider {
  constructor(
    private vitalSignsService: VitalSignsService,
    private baseVitalSignsService: BaseVitalSignsService,
    private visionVitalsignsService: VisionVitalSignsService,
    private htmlReportHelperService: HtmlReportHelperService,
    private vitalSignsNotesService: VitalSignsNotesService
  ) {}

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const { admissionId, patientId } = patientChartNodeReportInfo;
    const nodeID = patientChartNodeReportInfo.patientChartNode?.id;
    const baseVitalSignsRequest = this.baseVitalSignsService.getByPatientId(patientId);
    const patientVisionVitalSignsRequest =
      this.visionVitalsignsService.getByPatientId(patientId);

    const vitalSignsNotesRequest =
      this.vitalSignsNotesService.getByAdmissionId(admissionId);

    const vitalSignsFromExpressions = this.vitalSignsService.getFromExpression(
      patientId,
      admissionId
    );

    return Promise.all([
      baseVitalSignsRequest,
      patientVisionVitalSignsRequest,
      vitalSignsNotesRequest,
      vitalSignsFromExpressions,
    ]).then(result => {
      const [
        baseVitalSigns,
        visionVitalSigns,
        vitalSignsNotes,
        vitalSignsFromExpressions,
      ] = result;

      let baseVitalSignsHtmlString = baseVitalSigns
        ? this.getBaseVitalSignsHtmlString(baseVitalSigns)
        : '';

      const vitalSingsHtmlStringExpr = !vitalSignsFromExpressions
        ? ''
        : this.getVitalSignsHtmlStringFromExpressions(vitalSignsFromExpressions);

      const visionVitalSignsHtmlString =
        !visionVitalSigns || !visionVitalSigns.length
          ? ''
          : this.getVisionVitalSignsHtmlString(visionVitalSigns);

      const vitalSignsNotesHtmlString =
        !vitalSignsNotes ||
        !vitalSignsNotes.includeNotesInReport ||
        !vitalSignsNotes.notes
          ? ''
          : this.getVitalSignsNotesHtmlString(vitalSignsNotes.notes);

      if (nodeID != '') {
        baseVitalSignsHtmlString = this.editTable(baseVitalSignsHtmlString, nodeID);
      }

      // const problemListString = this.getProblemList(problemList.data);

      return `${baseVitalSignsHtmlString}${vitalSingsHtmlStringExpr}${visionVitalSignsHtmlString}${vitalSignsNotesHtmlString}`;
    });
  }

  getProblemList(problemList?: any[]) {
    if (!problemList?.length) return '';

    const updatedFlag = '_updated';
    let assessmentListItems = `<br><strong>Problem List</strong><br> <ul ${updatedFlag}>`;
    for (let i = 0; i < problemList.length; i++) {
      const assessment = problemList[i];

      assessmentListItems += `
                  <li>
                      <div><b>${assessment.assessment}</b></div>
                      <div>Status: ${assessment.status} </div>
                      <div>${assessment.notes ? assessment.notes : ''}</div>
                  </li>`;
    }
    return assessmentListItems;
  }

  editTable(html: string, nodeID: string) {
    html = html.replace(
      '<table',
      "<b _pointer class='_template' id='" + nodeID + "' >Vital Signs:</b><br><table"
    );

    return html;
  }
  private getVitalSignsNotesHtmlString(notes: string) {
    return `<div style="margin-top:10px;"><p _updated> ${notes}</p></div>`;
  }

  private getVisionVitalSignsHtmlString(visionVitalSigns: VisionVitalSigns[]): string {
    const visionVitalSignsHtmlTable =
      this.createVisionVitalSignsHtmlTable(visionVitalSigns);

    return `${Constants.report.emptyLine}${visionVitalSignsHtmlTable}`;
  }

  private createVisionVitalSignsHtmlTable(patientVisionVitalSigns: VisionVitalSigns[]) {
    const visionVitalSignsTableColumnNames = ['Date', 'OS', 'OD', 'OU', 'With Glasses'];

    const visionVitalSignsTableColumnValues = patientVisionVitalSigns.map(vs => {
      const vitalSignsDateTime = DateHelper.getDate(vs.createDate);

      const visualAcuityRating = Constants.vitalSigns.visionVitalSigns.visualAcuityRating;
      const visionValueTemplate =
        Constants.vitalSigns.visionVitalSigns.visionValueTemplate;

      return [
        vitalSignsDateTime,
        vs.os
          ? StringHelper.format(
              visionValueTemplate,
              visualAcuityRating.toString(),
              vs.os.toString()
            )
          : '',
        vs.od
          ? StringHelper.format(
              visionValueTemplate,
              visualAcuityRating.toString(),
              vs.od.toString()
            )
          : '',
        vs.ou
          ? StringHelper.format(
              visionValueTemplate,
              visualAcuityRating.toString(),
              vs.ou.toString()
            )
          : '',
        vs.withGlasses ? 'true' : 'false',
      ];
    });
    return this.htmlReportHelperService.createReportHtmlTable(
      visionVitalSignsTableColumnNames,
      visionVitalSignsTableColumnValues
    );
  }

  private getVitalSignsHtmlString(vitalSigns: VitalSigns[]): string {
    const vitalSignsHtmlTable = this.createVitalSignsHtmlTable(vitalSigns);

    return `${Constants.report.emptyLine}${vitalSignsHtmlTable}`;
  }

  private getVitalSignsHtmlStringFromExpressions(vitalSigns: any): string {
    const vitalSignsHtmlTable = this.createVitalSignsHtmlTableFromExpressions(vitalSigns);
    return `${Constants.report.emptyLine}${vitalSignsHtmlTable}`;
  }

  private createVitalSignsHtmlTableFromExpressions(vitalSigns: any): string {
    const patientVitalSigns = vitalSigns['Patient'];
    let k: keyof any;
    let htmlTableString: string = "<table style='border-collapse:collapse;'>";
    let htmlHeader: string = '<thead><tr>';
    let htmlBody: string = '<tbody><tr>';

    for (k in patientVitalSigns) {
      if (vitalSigns[k]) {
        if (vitalSigns[k].Title !== '') {
          htmlHeader += `<th style='border:solid 1px #999;padding:4px 8px;'>${vitalSigns[k].Title}</th>`;
          htmlBody += `<td style='padding:4px 8px;text-align:center;background:${vitalSigns[k].warningLevel};color:white;border: solid 1px black;'>${patientVitalSigns[k]}${vitalSigns[k].valUnits}</td>`;
        }
      } else {
        htmlHeader += `<th style='border:solid 1px #999;padding:4px 8px;'>${k}</th>`;
        htmlBody += `<td style='padding:4px 8px;text-align:center;border: solid 1px black;'>${patientVitalSigns[k]}</td>`;
      }
    }
    htmlHeader += `</tr></thead>`;
    htmlBody += `</tr></tbody>`;
    htmlTableString += htmlHeader;
    htmlTableString += htmlBody;
    htmlTableString += `</table>`;
    return htmlTableString;
  }

  private createVitalSignsHtmlTable(patientVitalSigns: VitalSigns[]): string {
    const vitalSignsTableColumnNames = [
      'Time',
      'BP, mm Hg',
      'Position',
      'Pulse, bmp',
      'Resp, rpm',
      'Temprature',
      'Tempature unit',
      'O2 Sat, %',
      'Activity',
    ];

    const vitalSignsTableColumnValues = patientVitalSigns.map(vs => {
      const vitalSignsTime = DateHelper.getTime(vs.createdDate);

      const systolicBloodPressure = vs.systolicBloodPressure
        ? vs.systolicBloodPressure.toString()
        : '';

      const diastolicBloodPressure = vs.diastolicBloodPressure
        ? vs.diastolicBloodPressure.toString()
        : '';

      const bloodPressure = `${systolicBloodPressure} / ${diastolicBloodPressure}`;

      const pulse = vs.pulse ? vs.pulse.toString() : '';

      const respirationRate = vs.respirationRate ? vs.respirationRate.toString() : '';
      const temperature = vs.temperature ? vs.temperature.toString() : '';
      const temperatureUnit = vs.unit ? vs.unit.toString() : '';
      const o2Sat = vs.oxygenSaturationAtRestValue
        ? vs.oxygenSaturationAtRestValue.toString()
        : '';

      return [
        vitalSignsTime,
        bloodPressure,
        `${vs.bloodPressurePosition ? vs.bloodPressurePosition.toString() : ''} / ${
          vs.bloodPressureLocation ? vs.bloodPressureLocation.toString() : ''
        }`,
        pulse,
        respirationRate,
        temperature,
        temperatureUnit,
        o2Sat,
        vs.oxygenSaturationAtRest ? vs.oxygenSaturationAtRest.toString() : '',
      ];
    });
    return this.htmlReportHelperService.createReportHtmlTable(
      vitalSignsTableColumnNames,
      vitalSignsTableColumnValues
    );
  }

  private getBaseVitalSignsHtmlString(baseVitalSigns: BaseVitalSigns): string {
    const baseVitalSignsHtmlTable1 = this.createBaseVitalSignsHtmlTable1(baseVitalSigns);

    const baseVitalSignsHtmlTable2 = this.createBaseVitalSignsHtmlTable2(baseVitalSigns);

    return `${Constants.report.emptyLine}${baseVitalSignsHtmlTable1}${Constants.report.emptyLine}${baseVitalSignsHtmlTable2}`;
  }

  private createBaseVitalSignsHtmlTable1(baseVitalSigns: BaseVitalSigns) {
    const patientWeight = baseVitalSigns.weight;
    const patientHeight = baseVitalSigns.height;

    const bmi =
      patientWeight && patientHeight
        ? MedicalCalculationHelper.calculateBmi(patientHeight, patientWeight)
        : '';

    const dominantHand = baseVitalSigns.dominantHand;

    const oxygen =
      baseVitalSigns.oxygenUse || baseVitalSigns.oxygenAmount
        ? `${baseVitalSigns.oxygenUse} / ${baseVitalSigns.oxygenAmount}`
        : '';

    const baseVitalSignsTable1ColumnNames = [
      'Weight, lbs',
      'Height, inches',
      'BMI, %',
      'Dominant Hand',
      'Oxygen',
    ];

    const baseVitalSignsTable1ColumnValues = [
      [
        patientWeight ? patientWeight.toString() : '',
        patientHeight ? patientHeight.toString() : '',
        bmi ? bmi.toString() : '',
        dominantHand ? dominantHand.toString() : '',
        oxygen ? oxygen.toString() : '',
      ],
    ];
    return this.htmlReportHelperService.createReportHtmlTable(
      baseVitalSignsTable1ColumnNames,
      baseVitalSignsTable1ColumnValues
    );
  }

  private createBaseVitalSignsHtmlTable2(baseVitalSigns: BaseVitalSigns) {
    const baseVitalSignsTable2ColumnNames = [
      'Location',
      'Calf, cm',
      'Thigh, cm',
      'Forearm, cm',
      'Bicep, cm',
    ];

    const baseVitalSignsTable2ColumnValues = [
      [
        'Right',
        baseVitalSigns.rightCalf ? baseVitalSigns.rightCalf.toString() : '',
        baseVitalSigns.rightThigh ? baseVitalSigns.rightThigh.toString() : '',
        baseVitalSigns.rightForearm ? baseVitalSigns.rightForearm.toString() : '',
        baseVitalSigns.rightBicep ? baseVitalSigns.rightBicep.toString() : '',
      ],
      [
        'Left',
        baseVitalSigns.leftCalf ? baseVitalSigns.leftCalf.toString() : '',
        baseVitalSigns.leftThigh ? baseVitalSigns.leftThigh.toString() : '',
        baseVitalSigns.leftForearm ? baseVitalSigns.leftForearm.toString() : '',
        baseVitalSigns.leftBicep ? baseVitalSigns.leftBicep.toString() : '',
      ],
    ];
    return this.htmlReportHelperService.createReportHtmlTable(
      baseVitalSignsTable2ColumnNames,
      baseVitalSignsTable2ColumnValues
    );
  }
}
