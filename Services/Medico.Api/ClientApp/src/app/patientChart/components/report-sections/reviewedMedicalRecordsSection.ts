import {
  BaseHistoryReportSection,
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { MedicalRecordService } from '../../patient-chart-tree/services/medical-record.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import * as moment from 'moment';

export class ReviewedMedicalRecordsSection
  extends BaseHistoryReportSection
  implements IReportContentProvider
{
  constructor(
    private medicalRecordDataService: MedicalRecordService,
    defaultValueService: DefaultValueService
  ) {
    super(defaultValueService);
  }

  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    return this.medicalRecordDataService
      .getAllByPatientId(patientChartNodeReportInfo.patientId)
      .then(medicalRecords => {
        const medicalRecordSectionTitle =
          patientChartNodeReportInfo.patientChartNode.title;

        if (!medicalRecords.length)
          return this.getHistorySectionDefaultString(
            patientChartNodeReportInfo.patientChartNode.type,
            medicalRecordSectionTitle,
            patientChartNodeReportInfo.patientChartNode.id
          );

        const formattedMedicalRecords = medicalRecords.map(mr => {
          return {
            documentType: mr.documentType,
            formattedCreateDate: moment(mr.createDate).format('MM/DD/YYYY'),
            notes: mr.notes,
            includeNotesInReport: mr.includeNotesInReport,
          };
        });

        const medicalRecordProperties = [
          { name: 'documentType', isFirstItem: true },
          { name: 'formattedCreateDate' },
          { name: 'notes', dependsOn: 'includeNotesInReport' },
        ];

        return this.getHistoryReportSectionString(
          formattedMedicalRecords,
          medicalRecordProperties,
          medicalRecordSectionTitle,
          patientChartNodeReportInfo.patientChartNode.id
        );
      });
  }
}
