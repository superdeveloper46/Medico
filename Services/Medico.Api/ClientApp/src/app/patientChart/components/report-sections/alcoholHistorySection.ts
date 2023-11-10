import {
  BaseHistoryReportSection,
  PatientChartNodeReportInfo,
  IReportContentProvider,
} from './baseHistoryReportSection';
import { AlcoholHistoryService } from '../../patient-chart-tree/services/alcohol-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class AlcoholHistorySection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private alcoholHistoryDataService: AlcoholHistoryService,
    defaultValuesProvider: DefaultValueService
  ) {
    super(defaultValuesProvider);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.alcoholHistoryDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(alcoholHistory => {
        const alcoholHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!alcoholHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            alcoholHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const alcoholHistoryProperties = [
          { name: 'status', isFirstItem: true },
          { name: 'type' },
          { name: 'amount' },
          { name: 'use' },
          { name: 'frequency' },
          { name: 'length' },
          { name: 'duration' },
          { name: 'quit' },
          { name: 'statusLength', dependsOn: 'quit' },
          { name: 'statusLengthType', dependsOn: 'quit' },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          alcoholHistory,
          alcoholHistoryProperties,
          alcoholHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
