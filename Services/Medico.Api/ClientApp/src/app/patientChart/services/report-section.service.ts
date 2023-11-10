import { Injectable } from '@angular/core';
import { OccupationalHistoryService } from '../patient-chart-tree/services/occupational-history.service';
import { EducationHistoryService } from '../patient-chart-tree/services/education-history.service';
import { TobaccoHistoryService } from '../patient-chart-tree/services/tobacco-history.service';
import { DrugHistoryService } from '../patient-chart-tree/services/drug-history.service';
import { AlcoholHistoryService } from '../patient-chart-tree/services/alcohol-history.service';
import { MedicalHistoryService } from '../patient-chart-tree/services/medical-history.service';
import { SurgicalHistoryService } from '../patient-chart-tree/services/surgical-history.service';
import { FamilyHistoryService } from '../patient-chart-tree/services/family-history.service';
import { AllergyService } from '../patient-chart-tree/services/allergy.service';
import { MedicationHistoryService } from '../patient-chart-tree/services/medication-history.service';
import { VitalSignsService } from '../patient-chart-tree/services/vital-signs.service';
import { MedicalRecordService } from '../patient-chart-tree/services/medical-record.service';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { TobaccoHistorySection } from '../components/report-sections/tobaccoHistorySection';
import { DrugHistorySection } from '../components/report-sections/drugHistorySection';
import { AlcoholHistorySection } from '../components/report-sections/alcoholHistorySection';
import { PreviousMedicalHistorySection } from '../components/report-sections/previousMedicalHistorySection';
import { PreviousSurgicalHistorySection } from '../components/report-sections/previousSurgicalHistorySection';
import { FamilyHistorySection } from '../components/report-sections/familyHistorySection';
import { EducationSection } from '../components/report-sections/educationSection';
import { OccupationalHistorySection } from '../components/report-sections/occupationalHistorySection';
import { ReviewedMedicalRecordsSection } from '../components/report-sections/reviewedMedicalRecordsSection';
import { AllergiesSection } from '../components/report-sections/allergiesSection';
import { MedicationsSection } from '../components/report-sections/medicationsSection';
import { ChiefComplaintSection } from '../components/report-sections/chiefComplaintSection';
import { VitalSignsSection } from '../components/report-sections/vitalSignsSection';
import { BaseVitalSignsService } from '../patient-chart-tree/services/base-vital-signs.service';
import { AssessmentSection } from '../components/report-sections/assessmentSection';
import { TemplateSection } from '../components/report-sections/templateSection';
import { PrescriptionSection } from '../components/report-sections/prescriptionSection';
import { MedicationPrescriptionService } from '../patient-chart-tree/services/medication-prescription.service';
import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from '../components/report-sections/baseHistoryReportSection';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { ContainerSection } from '../components/report-sections/containerSection';
import { AddendumSection } from '../components/report-sections/addendumSection';
import { VisionVitalSignsService } from '../patient-chart-tree/services/vision-vital-signs.service';
import { HtmlReportHelperService } from './html-report-helper.service';
import { VitalSignsNotesService } from '../patient-chart-tree/services/vital-signs-notes.service';

//todo: patient chart report is built on the server side;
//need to use server side report generation instead of client side for medico portal too
//( class that is responsible for report generation on the server side is: PatientChartHtmlReportBuilder )
//right now we have the same functionality on the server and client side need to use server side implementation
@Injectable()
export class ReportSectionService {
  private _registeredReportSections: { [id: string]: IReportContentProvider } = {};

  constructor(
    private occupationalHistoryService: OccupationalHistoryService,
    private educationHistoryService: EducationHistoryService,
    private tobaccoHistoryService: TobaccoHistoryService,
    private drugHistoryService: DrugHistoryService,
    private alcoholHistoryService: AlcoholHistoryService,
    private medicalHistoryService: MedicalHistoryService,
    private surgicalHistoryService: SurgicalHistoryService,
    private familyHistoryService: FamilyHistoryService,
    private allergyService: AllergyService,
    private medicationHistoryService: MedicationHistoryService,
    private vitalSignsService: VitalSignsService,
    private selectableItemHtmlService: SelectableItemHtmlService,
    private defaultValueService: DefaultValueService,
    private medicalRecordService: MedicalRecordService,
    private baseVitalSignsService: BaseVitalSignsService,
    private medicationPrescriptionService: MedicationPrescriptionService,
    private visionVitalSignsService: VisionVitalSignsService,
    private htmlReportHelperService: HtmlReportHelperService,
    private vitalSignsNotesService: VitalSignsNotesService
  ) {
    this.registerReportSections();
  }

  getPatientChartNodeContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const patientChartNodeReportSection =
      this._registeredReportSections[
        patientChartNodeReportInfo.patientChartNode?.type ?? 0
      ];

    if (!patientChartNodeReportSection) return Promise.resolve('');

    return patientChartNodeReportSection.getPatientChartNodeReportContent(
      patientChartNodeReportInfo
    );
  }

  private registerReportSections() {
    this.registerContainerSections();

    this.registerPatientHistorySections();

    this.registerReportSection(
      PatientChartNodeType.ChiefComplaintNode,
      new ChiefComplaintSection()
    );

    this.registerReportSection(
      PatientChartNodeType.VitalSignsNode,
      new VitalSignsSection(
        this.vitalSignsService,
        this.baseVitalSignsService,
        this.visionVitalSignsService,
        this.htmlReportHelperService,
        this.vitalSignsNotesService
      )
    );

    this.registerReportSection(
      PatientChartNodeType.AssessmentNode,
      new AssessmentSection(this.vitalSignsService)
    );

    this.registerReportSection(
      PatientChartNodeType.TemplateNode,
      new TemplateSection(this.selectableItemHtmlService)
    );

    this.registerReportSection(PatientChartNodeType.AddendumNode, new AddendumSection());

    // Problem List - Sep 2021
    // this.registerReportSection(
    //   PatientChartNodeType.ProblemListNode,
    //   new ProblemListSection(
    //     this.vitalSignsService)
    // );
  }

  private registerReportSection(
    patientChartNodeType: PatientChartNodeType,
    patientChartNodeContentProvider: IReportContentProvider
  ): void {
    this._registeredReportSections[patientChartNodeType] =
      patientChartNodeContentProvider;
  }

  private registerContainerSections() {
    const containerSection = new ContainerSection();

    this.registerReportSection(PatientChartNodeType.TemplateListNode, containerSection);
    this.registerReportSection(PatientChartNodeType.DocumentNode, containerSection);
    this.registerReportSection(PatientChartNodeType.SectionNode, containerSection);
  }

  private registerPatientHistorySections(): void {
    this.registerReportSection(
      PatientChartNodeType.TobaccoHistoryNode,
      new TobaccoHistorySection(this.tobaccoHistoryService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.DrugHistoryNode,
      new DrugHistorySection(this.drugHistoryService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.AlcoholHistoryNode,
      new AlcoholHistorySection(this.alcoholHistoryService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.PreviousMedicalHistoryNode,
      new PreviousMedicalHistorySection(
        this.medicalHistoryService,
        this.defaultValueService
      )
    );

    this.registerReportSection(
      PatientChartNodeType.PreviousSurgicalHistoryNode,
      new PreviousSurgicalHistorySection(
        this.surgicalHistoryService,
        this.defaultValueService
      )
    );

    this.registerReportSection(
      PatientChartNodeType.FamilyHistoryNode,
      new FamilyHistorySection(this.familyHistoryService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.EducationNode,
      new EducationSection(this.educationHistoryService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.OccupationalHistoryNode,
      new OccupationalHistorySection(
        this.occupationalHistoryService,
        this.defaultValueService
      )
    );

    this.registerReportSection(
      PatientChartNodeType.AllergiesNode,
      new AllergiesSection(this.allergyService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.MedicationsNode,
      new MedicationsSection(this.medicationHistoryService, this.defaultValueService)
    );

    this.registerReportSection(
      PatientChartNodeType.ReviewedMedicalRecordsNode,
      new ReviewedMedicalRecordsSection(
        this.medicalRecordService,
        this.defaultValueService
      )
    );

    this.registerReportSection(
      PatientChartNodeType.PrescriptionNode,
      new PrescriptionSection(
        this.medicationPrescriptionService,
        this.defaultValueService
      )
    );
  }
}
