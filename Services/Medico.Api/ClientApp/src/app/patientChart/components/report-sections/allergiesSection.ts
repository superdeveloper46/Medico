import {
  BaseHistoryReportSection,
  PatientChartNodeReportInfo,
  IReportContentProvider,
} from './baseHistoryReportSection';
import { AllergyService } from '../../patient-chart-tree/services/allergy.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { StringHelper } from 'src/app/_helpers/string.helper';
import { ReportSectionTemplates } from './reportSectionTemplates';

export class AllergiesSection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  countTemplate = 0;
  constructor(
    private allergyService: AllergyService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.allergyService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(allergies => {
        const allergiesSectionTitle = patientChartNodeReportInfo.patientChartNode.title;
        if (!allergies.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            allergiesSectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );
        let allergiesHtmlString = '<ul>';
        const li = allergies.length > 0 ? '<li _updated>' : '<li>';
        allergiesHtmlString += allergies.reduce((allergyList, allergy) => {
          return (
            `${allergyList}` +
            li +
            `${allergy.medication} - ${allergy.reaction}${
              allergy.includeNotesInReport && allergy.notes ? ` - ${allergy.notes}` : ''
            }</li>`
          );
        }, '');

        allergiesHtmlString += '</li>';
        const rowTemplate = ReportSectionTemplates.rowTemplate.replace(
          '<b>',
          "<b _pointer class='_template' id='" +
            patientChartNodeReportInfo.patientChartNode.id +
            "' >"
        );
        this.countTemplate = this.countTemplate + 1;

        return StringHelper.format(
          rowTemplate,
          allergiesSectionTitle,
          allergiesHtmlString
        );
      });
  }
}
