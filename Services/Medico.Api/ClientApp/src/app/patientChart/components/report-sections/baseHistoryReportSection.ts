import { DefaultValueService } from 'src/app/_services/default-value.service';
import { StringHelper } from 'src/app/_helpers/string.helper';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { ReportSectionTemplates } from './reportSectionTemplates';
let counter = 0;
export class BaseHistoryReportSection {
  historicalReportSectionContentTemplate = '<ul>{0}</ul>';

  constructor(private defaultValuesProvider: DefaultValueService) {}

  protected getHistorySectionDefaultString(
    patientChartNodeType: PatientChartNodeType,
    reportSectionTitle: string,
    nodeID = ''
  ): Promise<string> {
    return this.defaultValuesProvider
      .getByPatientChartNodeType(patientChartNodeType)
      .then(defaultValue => {
        let updatedFlag = '';
        // updatedFlag = defaultValue.value.trim().match(/None/ || /Unremarkable/ || /Denies Drugs Use/ || /Denies Alcohol Use/ || /Not Documented/)
        //     ? "" : "_updated";

        switch (defaultValue.value.trim()) {
          case 'None':
          case 'Unremarkable':
          case 'Denies Drugs Use':
          case 'Denies Alcohol Use':
          case 'Denies Tobacco Use':
          case 'NKDA':
          case 'Not Documented':
            updatedFlag = '_default';
            break;
          default:
            updatedFlag = '_updated';
            break;
        }

        const defaultReportSectionValueHtmlString = `<li ${updatedFlag}>${defaultValue.value}</li>`;

        const historicalReportSectionContent = StringHelper.format(
          this.historicalReportSectionContentTemplate,
          defaultReportSectionValueHtmlString
        );
        let rowTemplate = '';
        if (nodeID != '') {
          rowTemplate = this.editTitle(nodeID, ReportSectionTemplates.rowTemplate);
        } else {
          rowTemplate = ReportSectionTemplates.rowTemplate;
        }

        return StringHelper.format(
          rowTemplate,
          reportSectionTitle,
          historicalReportSectionContent
        );
      });
  }

  protected getHistoryReportSectionString(
    historyItems: any[],
    historyItemProperties: any,
    reportSectionTitle: string,
    nodeID = ''
  ): string {
    let historyStr = '';
    const updatedFlag = '_updated';
    for (let i = 0; i < historyItems.length; i++) {
      const historyItem = historyItems[i];
      historyStr += `<li ${updatedFlag}>`;

      for (let j = 0; j < historyItemProperties.length; j++) {
        const historyProp = historyItemProperties[j];

        const propName = historyProp['name'];
        const dependsOnProp = historyProp['dependsOn'];
        const isFirstItem = historyProp['isFirstItem'];

        const propValue = historyItem[propName]
          ? typeof historyItem[propName] === 'string'
            ? historyItem[propName].trim()
            : historyItem[propName]
          : '';

        if (dependsOnProp) {
          historyStr +=
            historyItem[dependsOnProp] && propValue
              ? isFirstItem
                ? propValue
                : ` - ${propValue}`
              : '';
        } else {
          historyStr += propValue ? (isFirstItem ? propValue : ` - ${propValue}`) : '';
        }
      }

      historyStr += '</li>';
    }

    const historicalReportSectionContent = StringHelper.format(
      this.historicalReportSectionContentTemplate,
      historyStr
    );
    let rowTemplate = '';
    if (nodeID !== '') {
      rowTemplate = this.editTitle(nodeID, ReportSectionTemplates.rowTemplate);
    } else {
      rowTemplate = ReportSectionTemplates.rowTemplate;
    }

    return StringHelper.format(
      rowTemplate,
      reportSectionTitle,
      historicalReportSectionContent
    );
  }
  private editTitle(id: string, html: string) {
    html = html.replace('<b>', "<b _pointer class='_template' id='" + id + "' >");
    counter = counter + 1;
    return html;
  }
}

export interface IReportContentProvider {
  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string>;
}

export class PatientChartNodeReportInfo {
  patientId: string;
  patientChartNode: PatientChartNode;
  admissionId: string;
  appointmentId: string;

  constructor(
    patientId: string,
    patientChartNode: PatientChartNode,
    admissionId: string,
    appointmentId: string
  ) {
    this.patientId = patientId;
    this.patientChartNode = patientChartNode;
    this.admissionId = admissionId;
    this.appointmentId = appointmentId;
  }
}
