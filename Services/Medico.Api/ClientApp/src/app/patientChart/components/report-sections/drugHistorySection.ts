import { DefaultValueService } from 'src/app/_services/default-value.service';
import { DrugHistoryService } from '../../patient-chart-tree/services/drug-history.service';
import {
  BaseHistoryReportSection,
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';

export class DrugHistorySection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private drugHistoryDataService: DrugHistoryService,
    defaultValueProvider: DefaultValueService
  ) {
    super(defaultValueProvider);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.drugHistoryDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(drugHistory => {
        const drugHistorySectionTitle = patientChartNodeReportInfo.patientChartNode.title;

        if (!drugHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            drugHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const drugHistoryProperties = [
          { name: 'status', isFirstItem: true },
          { name: 'type' },
          { name: 'amount' },
          { name: 'use' },
          { name: 'route' },
          { name: 'frequency' },
          { name: 'length' },
          { name: 'duration' },
          { name: 'quit' },
          { name: 'statusLength', dependsOn: 'quit' },
          { name: 'statusLengthType', dependsOn: 'quit' },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          drugHistory,
          drugHistoryProperties,
          drugHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
