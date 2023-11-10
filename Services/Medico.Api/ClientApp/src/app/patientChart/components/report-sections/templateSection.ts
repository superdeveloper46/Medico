import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';
import { StringHelper } from 'src/app/_helpers/string.helper';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { ReportSectionTemplates } from './reportSectionTemplates';

export class TemplateSection implements IReportContentProvider {
  count = 0;
  constructor(private selectableItemHtmlService: SelectableItemHtmlService) {}

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    let patientChartTemplateContent = this.getTemplateContent(
      patientChartNodeReportInfo.patientChartNode
    );
    patientChartTemplateContent = this.getDefaultNodeColor(
      patientChartNodeReportInfo.patientChartNode.value,
      patientChartTemplateContent,
      patientChartNodeReportInfo.patientChartNode.id
    );
    if (!patientChartTemplateContent)
      patientChartTemplateContent = this.trimEmptyLinesIfNeeded(
        patientChartTemplateContent
      );
    const rowTemplate = this.editTitle(
      patientChartNodeReportInfo.patientChartNode.id,
      ReportSectionTemplates.rowTemplate
    );

    if (patientChartNodeReportInfo.patientChartNode.title == 'Strength and Tone') {
      patientChartTemplateContent = patientChartTemplateContent.replace(
        '<ul>',
        "<ul class='_strength' >"
      );
    }
    const templateReportSectionContent = StringHelper.format(
      rowTemplate,
      patientChartNodeReportInfo.patientChartNode.title,
      patientChartTemplateContent
    );
    return Promise.resolve(templateReportSectionContent);
  }

  private editTitle(id: string, html: string) {
    html = html.replace('<b>', "<b _pointer class='_template' id='" + id + "' >");
    return html;
  }

  private getDefaultNodeColor(value: any, html: string, _id: string): string {
    // if (value.isDefault === undefined || value.isDefault === true) {
    //   // html = html.replace(
    //   //   "<p>",
    //   //   '<p style="background-color: #ff000040;border: 1px solid red;padding: 4px;">'
    //   // );
    //   html = html.replace("<p>", "<p default>");
    // }
    if (value != null && value.isDefault === false) {
      html = html.replace('<p>', '<p _default >');
    }
    return html;
  }

  private trimEmptyLinesIfNeeded(patientChartTemplateContent: string): string {
    //replace new lines
    patientChartTemplateContent = patientChartTemplateContent?.replace(
      /(\r\n|\n|\r)/gm,
      ''
    );

    const emptyParagraphs = new RegExp(/(<p>&nbsp;<\/p>)*$/g);
    return patientChartTemplateContent?.replace(emptyParagraphs, '');
  }

  private getTemplateContent(templatePatientChartNode: PatientChartNode): string {
    const templateContent = templatePatientChartNode.value;
    const aux = templateContent?.isDetailedTemplateUsed;
    let templateHtml = aux?
      templateContent?.detailedTemplateHtml
      :templateContent?.defaultTemplateHtml;

    if (templateContent?.isDetailedTemplateUsed) {
      templateHtml = this.wrapAllSelectableListValuesToBoldTag(templateHtml);
    }

    return templateHtml;
  }

  private wrapAllSelectableListValuesToBoldTag(templateHtml: any): string {
    return this.selectableItemHtmlService.wrapBoldTagAroundSelectableElementsValues(
      templateHtml
    );
  }
}
