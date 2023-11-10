import {
  BaseHistoryReportSection,
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { MedicationPrescriptionService } from '../../patient-chart-tree/services/medication-prescription.service';

export class PrescriptionSection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private medicationPrescriptionService: MedicationPrescriptionService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.medicationPrescriptionService
      .getByAdmissionId(patientChartNodeReportInfo.admissionId)
      .then(prescriptions => {
        const prescriptionsSectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!prescriptions.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            prescriptionsSectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const prescriptionHistoryProperties = [
          { name: 'sig', isFirstItem: true },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          prescriptions,
          prescriptionHistoryProperties,
          prescriptionsSectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
