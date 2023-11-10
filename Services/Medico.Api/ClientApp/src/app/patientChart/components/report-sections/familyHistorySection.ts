import {
  BaseHistoryReportSection,
  PatientChartNodeReportInfo,
  IReportContentProvider,
} from './baseHistoryReportSection';
import { FamilyHistoryService } from '../../patient-chart-tree/services/family-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class FamilyHistorySection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private familyHistoryDataService: FamilyHistoryService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.familyHistoryDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(familyHistory => {
        const familyHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!familyHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            familyHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const familyHistoryProperties = [
          { name: 'diagnosis', isFirstItem: true },
          { name: 'familyMember' },
          { name: 'familyStatus' },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          familyHistory,
          familyHistoryProperties,
          familyHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
