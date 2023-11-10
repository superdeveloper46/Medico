import {
  BaseHistoryReportSection,
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { EducationHistoryService } from '../../patient-chart-tree/services/education-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class EducationSection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private educationHistoryDataService: EducationHistoryService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.educationHistoryDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(educationHistory => {
        const educationHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!educationHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            educationHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const educationHistoryProperties = [
          { name: 'degree', isFirstItem: true },
          { name: 'yearCompleted' },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          educationHistory,
          educationHistoryProperties,
          educationHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
