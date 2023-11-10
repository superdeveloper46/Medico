import {
  BaseHistoryReportSection,
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { TobaccoHistoryService } from '../../patient-chart-tree/services/tobacco-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class TobaccoHistorySection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private tobaccoHistoryService: TobaccoHistoryService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.tobaccoHistoryService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(tobaccoHistory => {
        const tobaccoHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!tobaccoHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            tobaccoHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const tobaccoHistoryProperties = [
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
          tobaccoHistory,
          tobaccoHistoryProperties,
          tobaccoHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
