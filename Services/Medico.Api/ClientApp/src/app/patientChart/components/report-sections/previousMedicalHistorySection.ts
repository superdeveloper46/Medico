import {
  BaseHistoryReportSection,
  PatientChartNodeReportInfo,
  IReportContentProvider,
} from './baseHistoryReportSection';
import { MedicalHistoryService } from '../../patient-chart-tree/services/medical-history.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';

export class PreviousMedicalHistorySection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private medicalHistoryDataService: MedicalHistoryService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.medicalHistoryDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(medicalHistory => {
        const medicalHistorySectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!medicalHistory.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            medicalHistorySectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const medicalHistoryProperties = [
          { name: 'diagnosis', isFirstItem: true },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          medicalHistory,
          medicalHistoryProperties,
          medicalHistorySectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
