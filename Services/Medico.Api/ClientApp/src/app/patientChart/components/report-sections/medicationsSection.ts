import {
  BaseHistoryReportSection,
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { MedicationHistoryService } from '../../patient-chart-tree/services/medication-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class MedicationsSection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private medicationHistoryService: MedicationHistoryService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.medicationHistoryService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(medicationHistory => {
        const medicationHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!medicationHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            medicationHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const medicationHistoryProperties = [
          { name: 'medication', isFirstItem: true },
          { name: 'dose' },
          { name: 'units' },
          { name: 'route' },
          { name: 'dosageForm' },
          { name: 'prn' },
          { name: 'medicationStatus' },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          medicationHistory,
          medicationHistoryProperties,
          medicationHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
