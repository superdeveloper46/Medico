import {
  BaseHistoryReportSection,
  PatientChartNodeReportInfo,
  IReportContentProvider,
} from './baseHistoryReportSection';
import { SurgicalHistoryService } from '../../patient-chart-tree/services/surgical-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class PreviousSurgicalHistorySection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private surgicalHistoryDataService: SurgicalHistoryService,
    defaultValuesProvider: DefaultValueService
  ) {
    super(defaultValuesProvider);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.surgicalHistoryDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(surgicalHistory => {
        const surgicalHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!surgicalHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            surgicalHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const surgicalHistoryProperties = [
          { name: 'diagnosis', isFirstItem: true },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          surgicalHistory,
          surgicalHistoryProperties,
          surgicalHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
