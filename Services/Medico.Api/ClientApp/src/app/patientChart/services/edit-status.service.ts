import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { StackHelper } from 'src/app/_helpers/stack.helper';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { TobaccoHistoryService } from '../patient-chart-tree/services/tobacco-history.service';
import { TobaccoHistory } from '../models/tobaccoHistory';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { AlcoholHistoryService } from '../patient-chart-tree/services/alcohol-history.service';
import { DrugHistoryService } from '../patient-chart-tree/services/drug-history.service';
import { PatientChartTrackService } from 'src/app/_services/patient-chart-track.service';
import { MedicationHistoryService } from '../patient-chart-tree/services/medication-history.service';
import { AllergyService } from '../patient-chart-tree/services/allergy.service';
import { OccupationalHistoryService } from '../patient-chart-tree/services/occupational-history.service';
import { EducationHistoryService } from '../patient-chart-tree/services/education-history.service';
import { FamilyHistoryService } from '../patient-chart-tree/services/family-history.service';
import { SurgicalHistoryService } from '../patient-chart-tree/services/surgical-history.service';
import { MedicalHistoryService } from '../patient-chart-tree/services/medical-history.service';
import { AllegationEditService } from 'src/app/_services/allegation-edit.service';
import { MedicationPrescriptionService } from '../patient-chart-tree/services/medication-prescription.service';
import { MedicalRecordService } from '../patient-chart-tree/services/medical-record.service';
import { BaseVitalSignsService } from '../patient-chart-tree/services/base-vital-signs.service';
import { VitalSignsService } from '../patient-chart-tree/services/vital-signs.service';
import { VitalSignsNotesService } from '../patient-chart-tree/services/vital-signs-notes.service';
import { VisionVitalSignsService } from '../patient-chart-tree/services/vision-vital-signs.service';
import { DocumentService } from '../patient-chart-tree/services/document.service';
import { DrugHistory } from '../models/drugHistory';
import { AlcoholHistory } from '../models/alcoholHistory';
import { MedicalHistory } from '../models/medicalHistory';
import { SurgicalHistory } from '../models/surgicalHistory';
import { FamilyHistory } from '../models/familyHistory';
import { EducationHistory } from '../models/educationHistory';
import { OccupationalHistory } from '../models/occupationalHistory';
import { Allergy } from '../models/allergy';
import { MedicationHistory } from '../models/medicationHistory';
import { MedicalRecord } from '../models/medicalRecord';
import { Document } from '../models/document';
import { MedicationPrescription } from '../models/medicationPrescription';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListValue } from 'src/app/_models/selectableListValue';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';
import { SelectableItem } from 'src/app/share/classes/selectableItem';
import { Constants } from 'src/app/_classes/constants';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { PatientChartService } from './patient-chart.service';
import { PatientChartNodeManagementService } from './patient-chart-node-management.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { AdmissionService } from './admission.service';
import { PatientChartEqualityComparer } from './patient-chart-equality-comparer.service';

@Injectable()
export class EditStatusService {
  //} implements OnInit, OnDestroy {
  // subjects
  public emitNeedSaving: Subject<PatientChartNode> = new Subject<PatientChartNode>();
  private emitPreviousVisitsSaved: Subject<boolean> = new Subject<boolean>();

  // observers used to import template data
  tobaccoHistorySubscription?: Subscription;
  alcoholHistorySubscription?: Subscription;
  drugHistorySubscription?: Subscription;
  patientTemplateSubscription?: Subscription;
  medicationHistorySubscription?: Subscription;
  allergySubscription?: Subscription;
  occupationalHistorySubscription?: Subscription;
  educationHistorySubscription?: Subscription;
  familyHistorySubscription?: Subscription;
  surgicalHistorySubscription?: Subscription;
  medicalHistorySubscription?: Subscription;
  chiefComplaintSubscription?: Subscription;
  assessmentSubscription?: Subscription;
  medicationPrescriptionSubscription?: Subscription;
  reviewedMedicalRecordsSubscription?: Subscription;
  baseVitalSignsSubscription?: Subscription;
  vitalSignsSubscription?: Subscription;
  vitalSignsNotesSubscription?: Subscription;
  visionVitalSignsSubscription?: Subscription;
  documentSubscription?: Subscription;
  selectableListInitSubscription?: Subscription;
  selectedPatientChartNodeSubscription?: Subscription;
  educationOptionsSubscription?: Subscription;
  previousVisitsSubscription?: Subscription;

  // misc variables
  defaultHistoryValue?: string;
  patientChartRootNode?: PatientChartNode;
  isEditStatusSet: boolean = false; // used to check if the current chart has editStatus functionality.
  isEditStatusSaved: boolean = true; // false if changes have been made
  leafNodes: PatientChartNode[] = [];

  names_leafs: string[] = [];
  unique_leafs: PatientChartNode[] = [];
  types_leafs: { [key: number]: string[] } = {};
  defaultValues?: { [key: number]: string }; // key: PatientChartNodeType.____, value: default value
  editStatusValue: { [key: string]: string } = {
    'Default Only': 'DO',
    'Selectable Only': 'SO',
    'Edit Only': 'EO',
    'Edit and Selectable': 'ES',
    Incomplete: 'IN',
    Unknown: 'UN',
    'Not Documented': 'ND',
    'No Content Changed': 'NC',
  };
  setSelectableItems?: SelectableItem[];
  allSelectableItems: { [key: string]: SelectableListValue[] } | undefined; // key: selectable value, value: all selectable options
  editStatusReasons: statusReason[] = []; // key: editStatusValue value ("DO", "ES"...), value: data structure that holds reasoning (see EOF for statusReason)
  type4LeafDetailedHtml?: { [key: string]: string };
  selectedNode?: PatientChartNode;
  educationOptions?: any[];
  allergyOptions?: any[];
  medicationOptions: any = {};
  assessmentOptions: any = {};
  previousVisit: PatientChartNode | null = null;
  previousVisitAdmissionData: string | undefined;
  previousVisitPatientChartRootNode: PatientChartNode | undefined;
  previousVisitLeafNodes: PatientChartNode[] = [];
  isNewChart: boolean = false;

  constructor(
    private readonly defaultValueService: DefaultValueService,
    private readonly tobaccoHistoryService: TobaccoHistoryService,
    private readonly alcoholHistoryService: AlcoholHistoryService,
    private readonly drugHistoryService: DrugHistoryService,
    private readonly patientChartTrackService: PatientChartTrackService,
    private readonly medicationHistoryService: MedicationHistoryService,
    private readonly allergyService: AllergyService,
    private readonly occupationalHistoryService: OccupationalHistoryService,
    private readonly educationHistoryService: EducationHistoryService,
    private readonly familyHistoryService: FamilyHistoryService,
    private readonly surgicalHistoryService: SurgicalHistoryService,
    private readonly medicalHistoryService: MedicalHistoryService,
    private readonly allegationEditService: AllegationEditService,
    private readonly medicationPrescriptionService: MedicationPrescriptionService,
    private readonly medicalRecordService: MedicalRecordService,
    private readonly baseVitalSignsService: BaseVitalSignsService,
    private readonly vitalSignsService: VitalSignsService,
    private readonly vitalSignsNotesService: VitalSignsNotesService,
    private readonly visionVitalSignsService: VisionVitalSignsService,
    private readonly documentService: DocumentService,
    private readonly selectableListService: SelectableListService,
    private readonly selectableItemHtmlService: SelectableItemHtmlService,
    private readonly selectedPatientChartNodeService: SelectedPatientChartNodeService,
    private readonly patientChartService: PatientChartService,
    private readonly patientChartNodeManagement: PatientChartNodeManagementService,
    private readonly appointmentService: AppointmentService,
    private readonly admissionService: AdmissionService,
    private readonly patientChartEqualityComparer: PatientChartEqualityComparer
  ) {}

  // setters
  public setIsEditStatusSaved(value: boolean): void {
    this.isEditStatusSaved = value;
  }
  public setIsEditStatusSet(value: boolean): void {
    this.isEditStatusSet = value;
  }
  public setPatientChartRootNode(rootNode: PatientChartNode) {
    this.patientChartRootNode = rootNode;
  }

  // getters
  public getLeafNodes(): PatientChartNode[] {
    return this.leafNodes;
  }
  public getIsEditStatusSaved(): boolean {
    return this.isEditStatusSaved;
  }
  public getIsEditStatusSet(): boolean {
    return this.isEditStatusSet;
  }
  public getEditStatusValues(): { [key: string]: string } {
    return this.editStatusValue;
  }

  public isPatientChartRootNode(): boolean {
    return this.patientChartRootNode != undefined;
  }

  // use this method to subscribe to subjects
  onPatientChartInit(): void {
    // type: 6
    // tobaccoHistory - tested
    this.tobaccoHistorySubscription =
      this.tobaccoHistoryService.emitTobaccoHistorySave.subscribe(tobaccoHistory => {
        if (tobaccoHistory) {
          const tobaccoHistoryNodes = this.getLeafNodesByName('tobaccoHistory');
          if (tobaccoHistoryNodes?.length > 0) {
            this.isEditStatusSaved = false;
            tobaccoHistoryNodes.forEach(node => {
              this.type6_ChangeEditStatus(tobaccoHistory, node);
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      });

    // type: 9
    // alcoholHistory
    this.alcoholHistorySubscription =
      this.alcoholHistoryService.emitAlcoholHistorySave.subscribe(alcoholHistory => {
        if (alcoholHistory) {
          const alcoholHistoryNodes = this.getLeafNodesByName('alcoholHistory');
          if (alcoholHistoryNodes?.length > 0) {
            this.isEditStatusSaved = false;
            alcoholHistoryNodes.forEach(node => {
              this.type9_ChangeEditStatus(alcoholHistory, node);
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      });

    // type: 8
    // drugHistory
    this.drugHistorySubscription = this.drugHistoryService.emitDrugHistorySave.subscribe(
      drugHistory => {
        if (drugHistory) {
          const drugHistoryNodes = this.getLeafNodesByName('drugHistory');
          if (drugHistoryNodes?.length > 0) {
            this.isEditStatusSaved = false;
            drugHistoryNodes.forEach(node => {
              this.type8_ChangeEditStatus(drugHistory, node);
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      }
    );

    // type: 4
    // Pharmacy
    // General
    // pE_Default_ActivitiesOfDailyLiving
    // statementOfExamination
    // General Review Of Systems
    // General History of Present Illness
    // Medico Discharge Instructions
    // Activities of Daily Living
    // Statement of Examination
    // Skin
    // Range of Motion
    // Deep Tendon Reflexs
    // Fine Motor Skills
    // Sensory
    // Strength and Tone
    // Pulses
    // Gastrointestinal
    // Cardiovascular
    // Pulmonary
    // Head, Ears, Eyes, Nose, and Throat Exam
    // Neurological
    // Gait and Station
    // Assistive Device
    // Musculoskeletal
    // General Appearance
    this.patientTemplateSubscription =
      this.patientChartTrackService.emitPatientChartTemplateSave.subscribe(
        patientTemplateNode => {
          this.isEditStatusSaved = false;
          if (this.selectedNode) {
            console.log('running updateSelectableItems');
            console.time('test');
            this.updateSelectableItems(this.selectedNode.value['detailedTemplateHtml']);
            console.timeEnd('test');
          }
          console.log('about to run change edit status');
          this.type4_ChangeEditStatus(patientTemplateNode);
          this.saveEditStatus();
          this.updateLeafNodes();
        }
      );

    // type: 16
    // medications
    this.medicationHistorySubscription =
      this.medicationHistoryService.emitMedicationHistorySave.subscribe(
        medicationHistoryArr => {
          if (medicationHistoryArr) {
            const medicationHistoryNodes = this.getLeafNodesByName('medications');
            if (medicationHistoryNodes?.length > 0) {
              this.isEditStatusSaved = false;
              medicationHistoryNodes.forEach(node => {
                this.type16_ChangeEditStatus(
                  medicationHistoryArr[0],
                  medicationHistoryArr[1],
                  node
                );
              });
              this.saveEditStatus();
              this.updateLeafNodes();
            }
          }
        }
      );

    // type: 15
    // allergies
    this.allergySubscription = this.allergyService.emitAllergySave.subscribe(
      allergyArr => {
        if (allergyArr) {
          const allergyNodes = this.getLeafNodesByName('allergies');
          if (allergyNodes?.length > 0) {
            this.isEditStatusSaved = false;
            allergyNodes.forEach(node => {
              this.type15_ChangeEditStatus(allergyArr[0], allergyArr[1], node);
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      }
    );

    // type: 14
    // occupationalHistory
    this.occupationalHistorySubscription =
      this.occupationalHistoryService.emitOccupationalHistorySave.subscribe(
        occupationalHistory => {
          if (occupationalHistory) {
            const occupationalHistoryNodes =
              this.getLeafNodesByName('occupationalHistory');
            if (occupationalHistoryNodes?.length > 0) {
              this.isEditStatusSaved = false;
              occupationalHistoryNodes.forEach(node => {
                this.type14_ChangeEditStatus(occupationalHistory, node);
              });
              this.saveEditStatus();
              this.updateLeafNodes();
            }
          }
        }
      );

    // type: 13
    // education
    this.educationHistorySubscription =
      this.educationHistoryService.emitEducationHistorySave.subscribe(
        educationHistory => {
          if (educationHistory) {
            const educationHistoryNodes = this.getLeafNodesByName('education');
            if (educationHistoryNodes?.length > 0) {
              this.isEditStatusSaved = false;
              educationHistoryNodes.forEach(node => {
                this.type13_ChangeEditStatus(educationHistory, node);
              });
              this.saveEditStatus();
              this.updateLeafNodes();
            }
          }
        }
      );

    // type: 12
    // familyHistory
    this.familyHistorySubscription =
      this.familyHistoryService.emitFamilyHistorySave.subscribe(familyHistoryArr => {
        if (familyHistoryArr) {
          const familyHistoryNodes = this.getLeafNodesByName('familyHistory');
          if (familyHistoryNodes?.length > 0) {
            this.isEditStatusSaved = false;
            familyHistoryNodes.forEach(node => {
              this.type12_ChangeEditStatus(
                familyHistoryArr[0],
                familyHistoryArr[1],
                node
              );
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      });

    // type:  11
    // previousSurgicalHistory
    this.surgicalHistorySubscription =
      this.surgicalHistoryService.emitSurgicalHistorySave.subscribe(
        surgicalHistoryArr => {
          if (surgicalHistoryArr) {
            const surgicalHistoryNodes = this.getLeafNodesByName(
              'previousSurgicalHistory'
            );
            if (surgicalHistoryNodes?.length > 0) {
              this.isEditStatusSaved = false;
              surgicalHistoryNodes.forEach(node => {
                this.type11_ChangeEditStatus(
                  surgicalHistoryArr[0],
                  surgicalHistoryArr[1],
                  node
                );
              });
              this.saveEditStatus();
              this.updateLeafNodes();
            }
          }
        }
      );

    // type: 10
    // previousMedicalHistory
    this.medicalHistorySubscription =
      this.medicalHistoryService.emitMedicalHistorySave.subscribe(medicalHistoryArr => {
        if (medicalHistoryArr) {
          const medicalHistoryNodes = this.getLeafNodesByName('previousMedicalHistory');
          if (medicalHistoryNodes?.length > 0) {
            this.isEditStatusSaved = false;
            medicalHistoryNodes.forEach(node => {
              this.type10_ChangeEditStatus(
                medicalHistoryArr[0],
                medicalHistoryArr[1],
                node
              );
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      });

    // type: 7
    // chiefComplaint
    this.chiefComplaintSubscription =
      this.allegationEditService.emitChiefComplaintSave.subscribe(patientChartNodeId => {
        this.isEditStatusSaved = false;
        const chiefComplaintNode = this.getLeafNodesById(patientChartNodeId)[0];
        this.type7_ChangeEditStatus(chiefComplaintNode);
        this.saveEditStatus();
        this.updateLeafNodes();
      });

    // type: 18
    // assessment
    //  like chief complaint, doesn't update duplicates when saving
    this.assessmentSubscription =
      this.patientChartTrackService.emitAssessmentSave.subscribe(assessment => {
        this.isEditStatusSaved = false;
        this.type18_ChangeEditStatus(assessment[0], assessment[1]);
        this.saveEditStatus();
        this.updateLeafNodes();
      });

    // type: 5
    // plan
    // procedure
    //  - no edit status needed
    //  - chart nodes turn into folders if edited
    //    - the nodes that populate the folder are handled by type 4

    // type: 21
    // prescription
    this.medicationPrescriptionSubscription =
      this.medicationPrescriptionService.emitMedicationPrescriptionSave.subscribe(
        medicationPrescription => {
          const prescriptionNodes = this.getLeafNodesByName('prescription');
          if (prescriptionNodes?.length > 0) {
            this.isEditStatusSaved = false;
            prescriptionNodes.forEach(node => {
              this.type21_ChangeEditStatus(medicationPrescription, node);
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      );

    // type: 19
    // reviewedMedicalRecords
    this.reviewedMedicalRecordsSubscription =
      this.medicalRecordService.emitReviewedMedicalRecordSave.subscribe(
        medicalRecordArr => {
          const medicationNodes = this.getLeafNodesByName('reviewedMedicalRecords');
          if (medicationNodes?.length > 0) {
            this.isEditStatusSaved = false;
            medicationNodes.forEach(node => {
              this.type19_ChangeEditStatus(
                medicalRecordArr[0],
                medicalRecordArr[1],
                node
              );
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      );

    // type: 17
    // vitalSigns
    // five subsections:
    // base vital signs (& history),
    this.baseVitalSignsSubscription =
      this.baseVitalSignsService.emitBaseVitalSignsSave.subscribe(baseVitalSigns => {
        const baseVitalSignsNodes = this.getLeafNodesByName('vitalSigns');
        if (baseVitalSignsNodes?.length > 0) {
          this.isEditStatusSaved = false;
          baseVitalSignsNodes.forEach(node => {
            this.type17_ChangeEditStatus(baseVitalSigns, node);
          });
          this.saveEditStatus();
          this.updateLeafNodes();
        }
      });
    // vital signs,
    this.vitalSignsSubscription = this.vitalSignsService.emitVitalSignsSave.subscribe(
      vitalSigns => {
        const VitalSignsNodes = this.getLeafNodesByName('vitalSigns');
        if (VitalSignsNodes?.length > 0) {
          this.isEditStatusSaved = false;
          VitalSignsNodes.forEach(node => {
            this.type17_ChangeEditStatus(vitalSigns, node);
          });
          this.saveEditStatus();
          this.updateLeafNodes();
        }
      }
    );
    // vision,
    this.visionVitalSignsSubscription =
      this.visionVitalSignsService.emitVisionVitalSignsSave.subscribe(
        visionVitalSigns => {
          const visionVitalSignsNodes = this.getLeafNodesByName('vitalSigns');
          if (visionVitalSignsNodes?.length > 0) {
            this.isEditStatusSaved = false;
            visionVitalSignsNodes.forEach(node => {
              this.type17_ChangeEditStatus(visionVitalSigns, node);
            });
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      );
    // notes, (config no save option)
    this.vitalSignsNotesSubscription =
      this.vitalSignsNotesService.emitVitalSignsNotesSave.subscribe(vitalSignsNotes => {
        const vitalSignsNotesNodes = this.getLeafNodesByName('vitalSigns');
        if (vitalSignsNotesNodes?.length > 0) {
          this.isEditStatusSaved = false;
          vitalSignsNotesNodes.forEach(node => {
            this.type17_ChangeEditStatus(vitalSignsNotes, node);
          });
          this.saveEditStatus();
          this.updateLeafNodes();
        }
      });

    // type: 20
    // scanDocument
    this.documentSubscription = this.documentService.emitDocumentSave.subscribe(
      document => {
        const documentNodes = this.getLeafNodesByName('scanDocument');
        if (documentNodes?.length > 0) {
          this.isEditStatusSaved = false;
          documentNodes.forEach(node => {
            this.type20_ChangeEditStatus(document, node);
          });
          this.saveEditStatus();
          this.updateLeafNodes();
        }
      }
    );

    // type: 3
    // screenings - unsure how this one works

    // can't find:
    // type: 22
    // addendum

    this.selectedPatientChartNodeSubscription =
      this.selectedPatientChartNodeService.emitPatientChartNodeSelected.subscribe(
        node => {
          this.selectedNode = node;
          if (node.type == 4 && node.value) {
            console.log(`running updateSelectableItems`);
            this.updateSelectableItems(node.value['detailedTemplateHtml']);
          } else if (node.name == 'plan' || node.name == 'procedure') {
            this.isEditStatusSaved = false;
            this.type5_ChangeEditStatus(node);
            this.saveEditStatus();
            this.updateLeafNodes();
          }
        }
      );

    this.educationOptionsSubscription =
      this.selectableListService.emitSelectableOptions.subscribe(options => {
        switch (options.title) {
          case 'Education':
            this.educationOptions = options.selectableListValues;
            break;
          case 'MED_Allergy':
            this.allergyOptions = options.selectableListValues;
            break;
          case 'Medications Directions':
            this.medicationOptions['Medication Directions'] =
              options.selectableListValues;
            break;
          case 'Medications Forms':
            this.medicationOptions['Medication Forms'] = options.selectableListValues;
            break;
          case 'MED_Units':
            this.medicationOptions['MED_Units'] = options.selectableListValues;
            break;
          case 'MED_Route':
            this.medicationOptions['MED_Route'] = options.selectableListValues;
            break;
          case 'MED_Status':
            this.medicationOptions['MED_Status'] = options.selectableListValues;
            break;

          default:
            console.log('unrecognized data in selectableOptionsSubscription:');
            console.log(options);
            break;
        }
      });

    this.previousVisitsSubscription =
      this.patientChartService.emitPreviousVisits.subscribe(node => {
        if (!node.children) return;
        // the most recent entry is the current visit
        //  - have to grab the second to last entry
        const previousVisitDate: PatientChartNode =
          node.children[node.children?.length - 2];
        if (!previousVisitDate || !previousVisitDate.children) return;
        const previousVisit: PatientChartNode =
          previousVisitDate.children[previousVisitDate.children?.length - 1];
        const previousVisitId: string = previousVisit.value.chartId;

        this.appointmentService.getById(previousVisitId).then(appointment => {
          if (!appointment) return;
          this.admissionService.getById(appointment.admissionId).then(admission => {
            if (!admission) return;

            this.previousVisitAdmissionData = admission.admissionData;
            this.previousVisitPatientChartRootNode = JSON.parse(
              admission.admissionData || 'null'
            );
            if (this.previousVisitPatientChartRootNode)
              this.previousVisitLeafNodes = this.findLeafNodes(
                this.previousVisitPatientChartRootNode
              );

            this.emitPreviousVisitsSaved.next(true);
          });
        });
      });
  }

  // use this method to unsubscribe from observables
  onPatientChartDestroyed(): void {
    this.tobaccoHistorySubscription?.unsubscribe();
    this.alcoholHistorySubscription?.unsubscribe();
    this.drugHistorySubscription?.unsubscribe();
    this.patientTemplateSubscription?.unsubscribe();
    this.medicationHistorySubscription?.unsubscribe();
    this.allergySubscription?.unsubscribe();
    this.occupationalHistorySubscription?.unsubscribe();
    this.educationHistorySubscription?.unsubscribe();
    this.familyHistorySubscription?.unsubscribe();
    this.surgicalHistorySubscription?.unsubscribe();
    this.medicalHistorySubscription?.unsubscribe();
    this.chiefComplaintSubscription?.unsubscribe();
    this.assessmentSubscription?.unsubscribe();
    this.medicationPrescriptionSubscription?.unsubscribe();
    this.reviewedMedicalRecordsSubscription?.unsubscribe();
    this.baseVitalSignsSubscription?.unsubscribe();
    this.vitalSignsNotesSubscription?.unsubscribe();
    this.vitalSignsSubscription?.unsubscribe();
    this.visionVitalSignsSubscription?.unsubscribe();
    this.documentSubscription?.unsubscribe();
    this.selectableListInitSubscription?.unsubscribe();
    this.selectedPatientChartNodeSubscription?.unsubscribe();
    this.educationOptionsSubscription?.unsubscribe();
    this.previousVisitsSubscription?.unsubscribe();
  }

  public objForEach<T>(obj: T, f: (k: keyof T, v: T[keyof T]) => void): void {
    for (const k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) f(k, obj[k]);
  }

  private initPrint(data: any, node: PatientChartNode): void {
    console.log('data');
    console.log(data);
    console.log('node');
    console.log(node);
  }

  // loop through options - determine final editStatus
  // if at least one NC (not old), it's NC
  // if at least one UN, it's UN
  // if at least one IN, it's IN
  //  - if it's from past and only IN status
  //    - (meaning there are no more incomplete pieces)
  //    - remove IN
  // if at least one EO and one SO, it's SE
  // if at least one SO, its SO
  // if at least one EO, its EO
  // if ONLY DO's, it's DO
  private evaluateEditStatus(chartNode: PatientChartNode): void {
    // need to send the leaf node in order to save correctly
    const leafChartNode = this.getLeafNodesById(chartNode.id)[0];
    const statusCount: { [key: string]: number } = {};
    let isIncomplete: boolean = false;
    let reasons: string = '';

    this.editStatusReasons.forEach(reason => {
      Object.keys(statusCount).includes(reason.status)
        ? (statusCount[reason.status] += 1)
        : (statusCount[reason.status] = 1);
    });

    console.log('this.editStatusReasons');
    console.log(this.editStatusReasons);

    // if there are 'NC' reasons that don't include being the same as
    // the previous visit, add 'NC'
    if (statusCount[this.editStatusValue['No Content Changed']] > 0) {
      const NCStatus: statusReason[] = this.editStatusReasons.filter(reason => {
        return (
          reason.status === this.editStatusValue['No Content Changed'] &&
          !reason.reason.includes('old')
        );
      });
      if (NCStatus?.length > 0) {
        reasons = this.formatReasons(
          this.editStatusValue['No Content Changed'],
          this.editStatusReasons
        );
        this.addNoContentChangedStatus(leafChartNode, reasons);
        isIncomplete = true;
      }
    }

    if (statusCount[this.editStatusValue['Unknown']] > 0) {
      reasons = this.formatReasons(
        this.editStatusValue['Unknown'],
        this.editStatusReasons
      );
      this.addUnknownStatus(leafChartNode, reasons);
      isIncomplete = true;
    } else if (statusCount[this.editStatusValue['Incomplete']] > 0) {
      const numIncomplete = this.editStatusReasons.filter(reason => {
        return (
          !String(reason.reason).includes('old:') &&
          reason.status == this.editStatusValue['Incomplete']
        );
      });

      if (numIncomplete?.length > 0) {
        reasons = this.formatReasons(
          this.editStatusValue['Incomplete'],
          this.editStatusReasons
        );
        this.addIncompleteStatus(leafChartNode, reasons);
        isIncomplete = true;
      } else {
        console.log(`only old status holding incomplete!`);
      }
    }

    if (statusCount[this.editStatusValue['Not Documented']] > 0 && !isIncomplete) {
      reasons = this.formatReasons(
        this.editStatusValue['Not Documented'],
        this.editStatusReasons
      );
      this.addNotDocumentedStatus(leafChartNode, reasons);
    } else if (
      ((statusCount[this.editStatusValue['Edit Only']] > 0 &&
        statusCount[this.editStatusValue['Selectable Only']] > 0) ||
        statusCount[this.editStatusValue['Edit and Selectable']] > 0) &&
      !isIncomplete
    ) {
      reasons = this.formatReasons(
        this.editStatusValue['Not Documented'],
        this.editStatusReasons
      );
      this.addEditAndSelectableStatus(leafChartNode, reasons);
    } else if (
      statusCount[this.editStatusValue['Selectable Only']] > 0 &&
      !isIncomplete
    ) {
      reasons = this.formatReasons(
        this.editStatusValue['Selectable Only'],
        this.editStatusReasons
      );
      this.addSelectableOnlyStatus(leafChartNode, reasons);
    } else if (statusCount[this.editStatusValue['Edit Only']] > 0 && !isIncomplete) {
      reasons = this.formatReasons(
        this.editStatusValue['Edit Only'],
        this.editStatusReasons
      );
      this.addEditOnlyStatus(leafChartNode, reasons);
    } else if (!isIncomplete) {
      reasons = this.formatReasons(
        this.editStatusValue['Default Only'],
        this.editStatusReasons
      );
      this.addDefaultOnlyStatus(leafChartNode, reasons);
    }
  }

  private formatReasons(status: string, reasons: statusReason[]): string {
    let formattedReasons: string = '';
    const sortedReasons: Array<string | Array<string>> = [];

    // sort reasons
    reasons.forEach(reason => {
      if (reason.status === status) sortedReasons.push(reason.reason);
    });

    // format reasons
    sortedReasons.forEach(reason => {
      // handle arrays
      if (Array.isArray(reason)) {
        if (!reason[0].includes('id') && !reason[0].includes('Id'))
          reason.forEach(r => {
            formattedReasons += r + ': ';
          });
      }
      // handle strings
      if (typeof reason === 'string') formattedReasons += reason;
      formattedReasons += '\n';
    });

    return formattedReasons;
  }

  // should only be called when a new leaf node is selected with type 4
  private updateSelectableItems(htmlContent: string): void {
    const items: SelectableItem[] = this.selectableItemHtmlService.getSelectableItems(
      htmlContent,
      [
        Constants.selectableItemTypes.list,
        Constants.selectableItemTypes.date,
        Constants.selectableItemTypes.range,
        Constants.selectableItemTypes.variable,
      ]
    );

    // reset data structures in case this isn't the first chart selected
    if (this.setSelectableItems) this.setSelectableItems.splice(0);
    //if (this.allSelectableItems) this.allSelectableItems = undefined;

    this.setSelectableItems = items;
    this.setSelectableItems.forEach(item => {
      // metadata should only include a guid. If it doesn't that means it's
      // a specic kind of list that isn't selectable '::' = number,  '/' = date
      if (!item.metadata.includes('::') && !item.metadata.includes('/')) {
        this.selectableListService
          .getSelectableListValuesById(item.metadata)
          .then(values => {
            !this.allSelectableItems
              ? (this.allSelectableItems = { [item.value]: values })
              : (this.allSelectableItems[item.value] = values);
          });
      } else {
        !this.allSelectableItems
          ? (this.allSelectableItems = { [item.value]: [] })
          : (this.allSelectableItems[item.value] = []);
      }
    });
  }

  private pruneSelectableHtml(htmlContent: string): string {
    if (!this.allSelectableItems) return htmlContent;
    else {
      Object.keys(this.allSelectableItems).forEach(key => {
        if (!this.allSelectableItems) return;
        this.allSelectableItems[key].forEach(item => {
          htmlContent = htmlContent.replace(item.value, '');
        });
      });
    }
    return htmlContent.replace(/&nbsp/g, ''); // extra substring brought on by the selectable lists
  }

  // all template nodes
  //  - search for "type: 4" in file to find all the nodes this function covers
  private type4_ChangeEditStatus(patientTemplateNode: PatientChartNode): void {
   
    if (!this.type4LeafDetailedHtml || !patientTemplateNode.value) return;

    if (this.getLeafNodesById(patientTemplateNode.id)?.length == 0)
      this.updateLeafNodes();

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    const defaultHtml: string = patientTemplateNode.value['defaultTemplateHtml'];
    const detailedHtml: string = patientTemplateNode.value['detailedTemplateHtml'];
    const leafDetailedHtml: string = this.type4LeafDetailedHtml[patientTemplateNode.id];

    // check for DO
    // some have a default template in use
    if (this.setSelectableItems && this.allSelectableItems) {
      if (defaultHtml) {
        if (patientTemplateNode.value['isDefault']) {
          this.editStatusReasons.push({
            status: this.editStatusValue['Default Only'],
            reason: patientTemplateNode.value,
          });
          console.log(`${patientTemplateNode.name}: added DO`);
        }
      }

      // check for SO (and UN)
      this.setSelectableItems.forEach(item => {
        if (this.allSelectableItems) {
          const possibleOptions = this.allSelectableItems[item.value];

          if (possibleOptions?.length > 0) {
            // if there are other options
            const selectedOption = possibleOptions.filter(option => {
              return (
                option.value.toLowerCase() === item.value.toLowerCase() ||
                option.description?.toLowerCase() == item.value.toLowerCase()
              );
            })[0];

            // sometimes there is a placeholder that isn't in the selected options, will mark as UN
            if (selectedOption == undefined) {
              this.editStatusReasons.push({
                status: this.editStatusValue['Unknown'],
                reason: item.value,
              });
            } else if (selectedOption.isDefault === false) {
              this.editStatusReasons.push({
                status: this.editStatusValue['Selectable Only'],
                reason: item.value,
              });
            } else if (selectedOption.isDefault === true) {
              this.editStatusReasons.push({
                status: this.editStatusValue['Default Only'],
                reason: item.value,
              });
            }
          }
          // number list (others?). Default should be lower bound of description
          // need to test on more
          else if (item.metadata.includes('::')) {
            const bounds = item.metadata.split('::');
            if (item.value != bounds[0]) {
              this.editStatusReasons.push({
                status: this.editStatusValue['Selectable Only'],
                reason: item.value,
              });
            }
          }
        }
      });

      // check for EO
      let prunedHtml: string = detailedHtml.replace(/<[^>]+>/g, ''); // strips html tags
      let leafPrunedHtml: string = leafDetailedHtml.replace(/<[^>]+>/g, '');

      prunedHtml = this.pruneSelectableHtml(prunedHtml);
      leafPrunedHtml = this.pruneSelectableHtml(leafPrunedHtml);

      if (prunedHtml != leafPrunedHtml) {
        this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          // reason: [leafPrunedHtml, prunedHtml],
          reason: 'text has been manually edited',
        });
        console.log(`${patientTemplateNode.name}: added EO_1`);
      }
    }
    this.evaluateEditStatus(patientTemplateNode);
  }

  private checkHistoryObjEdits(
    data: TobaccoHistory | DrugHistory | AlcoholHistory,
    node: PatientChartNode
  ) {
    if (!data.status || !this.defaultValues) return;

    this.initPrint(data, node);
    this.editStatusReasons.splice(0); // clear in case it's been ran before

    // if there were other entries before this one, the old status needs to be taken into account
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    // check for DO
    if (data.status == this.defaultValues[node.type]) {
      this.editStatusReasons.push({
        status: this.editStatusValue['Default Only'],
        reason: data.status,
      });
    } else {
      this.objForEach(data, (key, value) => {
        // check for EO
        if (String(key) == 'notes') {
          if (value != '')
            this.editStatusReasons.push({
              status: this.editStatusValue['Edit Only'],
              reason: [key, value],
            });
        }
        // check for SO & IN
        else if (String(key) != 'id' && !String(key).includes('statusLength'))
          value == undefined || value == null
            ? this.editStatusReasons.push({
                status: this.editStatusValue['Incomplete'],
                reason: [key, value],
              })
            : this.editStatusReasons.push({
                status: this.editStatusValue['Selectable Only'],
                reason: [key, value],
              });
      });
    }

    this.evaluateEditStatus(node);
  }

  // tobaccoHistory
  //    - drugHistory     : type8
  //    - alcoholHistory  : type9
  //    - prescription(?) : type21
  private type6_ChangeEditStatus(
    tobaccoHistory: TobaccoHistory,
    node: PatientChartNode
  ): void {
    this.checkHistoryObjEdits(tobaccoHistory, node);
  }
  // drughistory
  private type8_ChangeEditStatus(drugHistory: DrugHistory, node: PatientChartNode): void {
    this.checkHistoryObjEdits(drugHistory, node);
  }
  // alcoholHistory
  private type9_ChangeEditStatus(
    alcoholHistory: AlcoholHistory,
    node: PatientChartNode
  ): void {
    this.checkHistoryObjEdits(alcoholHistory, node);
  }

  // chiefComplaint - doesn't have a model, have to grab the patient node instead
  //  - when a template is used, it adds new leaf nodes to different sections

  //  what determines
  //    - DO?
  //      - No allegations
  //    - EO?
  //      - no template attached
  //    - SO?
  //      - no just SO option
  //    - ES
  //      - templates used
  //    - IN?
  //      - null/undefined values
  private type7_ChangeEditStatus(chiefComplaintNode: PatientChartNode): void {
    if (!chiefComplaintNode.value) return;

    let hasTemplates: boolean = false;
    this.editStatusReasons.splice(0); // clear in case it's been ran before

    if (chiefComplaintNode.value?.length == 0)
      this.editStatusReasons.push({
        status: this.editStatusValue['Default Only'],
        reason: 'no allegations',
      });
    else {
      chiefComplaintNode.value['patientAllegationsSets'].forEach((allegation: any) => {
        console.log('allegation');
        console.log(allegation);

        // checks ES
        this.objForEach(Object(allegation), (key, value) => {
          if (
            String(key) == 'hpiTemplates' ||
            String(key) == 'peTemplates' ||
            String(key) == 'rosTemplates'
          ) {
            if (value?.length != 0) {
              this.editStatusReasons.push({
                status: this.editStatusValue['Edit and Selectable'],
                reason: [key, value],
              });
              hasTemplates = true;
            }
          }
          // check IN
          if (value == undefined || value == null)
            this.editStatusReasons.push({
              status: this.editStatusValue['Incomplete'],
              reason: [key, value],
            });
        });
        // checks EO
        if (!hasTemplates)
          this.editStatusReasons.push({
            status: this.editStatusValue['Edit Only'],
            reason: 'no templates used',
          });

        hasTemplates = false;
      });
    }
    this.evaluateEditStatus(chiefComplaintNode);
  }

  private checkICDCodeObjEdits(
    data: MedicalHistory | SurgicalHistory | FamilyHistory,
    icdCodes: Array<any>,
    node: PatientChartNode
  ) {
    this.initPrint(
      {
        data: data,
        icdCodes: icdCodes,
      },
      node
    );

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    const matchingCode = icdCodes.filter(code => {
      return code.description == data.diagnosis || code.name == data.diagnosis;
    });

    // check for EO & SO
    matchingCode?.length == 0
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: 'no icdCodes match diagnosis',
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Selectable Only'],
          reason: matchingCode,
        });

    // check for EO
    this.checkNotes(data);
    // check for IN
    this.checkMissingFields(data);

    this.evaluateEditStatus(node);
  }

  private checkMissingFields(data: any): void {
    this.objForEach(data, (key, value) => {
      if (
        (value == undefined || value == null || value == '') &&
        String(key) != 'notes' &&
        String(key) != 'icdCode' &&
        typeof value != 'boolean'
      ) {
        this.editStatusReasons.push({
          status: this.editStatusValue['Incomplete'],
          reason: [key, value],
        });
      }
      // console.log(key);
      // console.log(value);
    });
  }

  private checkNotes(data: any): void {
    data.notes != undefined && data.notes != null && data.notes != ''
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: 'notes present',
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Default Only'],
          reason: 'no notes',
        });
  }

  // previousMedicalHistory
  private type10_ChangeEditStatus(
    previousMedicalHistory: MedicalHistory,
    icdCodes: Array<any>,
    node: PatientChartNode
  ): void {
    this.checkICDCodeObjEdits(previousMedicalHistory, icdCodes, node);
  }

  // previousSurgicalHistory
  private type11_ChangeEditStatus(
    previousSurgicalHistory: SurgicalHistory,
    icdCodes: Array<any>,
    node: PatientChartNode
  ): void {
    this.checkICDCodeObjEdits(previousSurgicalHistory, icdCodes, node);
  }

  // familyHistory
  private type12_ChangeEditStatus(
    familyHistory: FamilyHistory,
    icdCodes: Array<any>,
    node: PatientChartNode
  ): void {
    this.checkICDCodeObjEdits(familyHistory, icdCodes, node);
  }

  // education
  private type13_ChangeEditStatus(
    educationHistory: EducationHistory,
    node: PatientChartNode
  ): void {
    if (!this.educationOptions) {
      console.log('no education options available.');
      return;
    }

    this.initPrint([educationHistory, this.educationOptions], node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    const matchingCode = this.educationOptions.filter(code => {
      return (
        code.value == educationHistory.degree ||
        code.description == educationHistory.degree
      );
    });

    // check for EO & SO
    matchingCode?.length == 0
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: "education isn't specified in list",
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Selectable Only'],
          reason: matchingCode,
        });

    // check for EO
    this.checkNotes(educationHistory);
    // check for IN
    this.checkMissingFields(educationHistory);

    this.evaluateEditStatus(node);
  }

  // occupationalHistory
  // add occupational dropdown
  // not similar enough
  // different sections need checking
  private type14_ChangeEditStatus(
    occupationalHistory: OccupationalHistory,
    node: PatientChartNode
  ): void {
    // !!! getting undefined errors. check if other branches have the same !!!
    this.initPrint(occupationalHistory, node);
  }

  // allergies
  // medication class and medication cannot be selected at the same time
  // similar but should be own function
  private type15_ChangeEditStatus(
    allergies: Allergy,
    data: any,
    node: PatientChartNode
  ): void {
    if (!this.allergyOptions) console.log('NO ALLERGIES RECEIVED!!!');
    else data['allergies'] = this.allergyOptions;

    let foundMedication = false;
    this.initPrint([allergies, data], node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    // check for IN
    // missing fields are different depending on which selectable list is used
    // need to make custom implementation or send optional variable
    this.objForEach(allergies, (key, value) => {
      if (key != 'medicationClassId' && key != 'medicationNameId') {
        if ((value == undefined || value == null) && String(key) != 'notes')
          this.editStatusReasons.push({
            status: this.editStatusValue['Incomplete'],
            reason: [key, value],
          });
      } else if (value != '' && value != undefined && value != null)
        foundMedication = true;
    });

    // check for SO & IN
    if (!foundMedication)
      this.editStatusReasons.push({
        status: this.editStatusValue['Incomplete'],
        reason: 'no medication',
      });

    data['medicationNames'].includes(allergies.medication) ||
    data['medicationClasses'].includes(allergies.medication)
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Selectable Only'],
          reason: allergies.medication,
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: `${allergies.medication} not listed`,
        });

    // check for EO
    this.checkNotes(allergies);

    this.evaluateEditStatus(node);
  }

  // medications
  // MED_Route              -> Route
  // MED_Status             -> Medication Status
  // MED_Units              -> Units
  // Medications Directions -> Select SIG
  // Medications Forms      -> Dosage Form
  private type16_ChangeEditStatus(
    medicationHistory: MedicationHistory,
    medicationNames: Array<any>,
    node: PatientChartNode
  ): void {
    let isIncomplete: boolean = false;
    this.initPrint([medicationHistory, this.medicationOptions], node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    // update list values
    this.medicationOptions['Medication Names'] = medicationNames;

    this.medicationOptions['Medication Names'].includes(medicationHistory.medication)
      ? medicationHistory.medication
        ? this.editStatusReasons.push({
            status: this.editStatusValue['Selectable Only'],
            reason: medicationHistory.medication,
          })
        : this.editStatusReasons.push({
            status: this.editStatusValue['Incomplete'],
            reason: `medication doesn't exist`,
          })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: `${medicationHistory.medication} not listed`,
        });

    // check for EO
    this.checkNotes(medicationHistory);
    // check for IN
    this.checkMissingFields(medicationHistory);

    // if there isn't an IN after checkMissingFields, then each list has a selected value
    this.editStatusReasons.forEach(reason => {
      if (reason.status == 'IN') isIncomplete = true;
    });

    if (!isIncomplete) {
      this.editStatusReasons.push({
        status: this.editStatusValue['Selectable Only'],
        reason: 'every list is filled',
      });
    }

    this.evaluateEditStatus(node);
  }

  // vitalSigns - will import multiple different types of data
  private type17_ChangeEditStatus(vitalSignNode: any, node: PatientChartNode): void {
    this.initPrint(vitalSignNode, node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    // check for EO
    if (Object.keys(vitalSignNode).includes('notes')) this.checkNotes(vitalSignNode);

    // check for IN
    this.checkMissingFields(vitalSignNode);

    this.evaluateEditStatus(node);
  }

  // assessment
  private type18_ChangeEditStatus(assessment: any, icdCodes: any): void {
    if (!this.selectedNode) {
      console.log('no selected node!!');
      return;
    }
    const node: PatientChartNode = this.selectedNode;
    this.initPrint([assessment, icdCodes], node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    const matchingCodes = icdCodes.filter((code: any) => {
      return code.name == assessment.diagnosis;
    });

    // check SO and EO
    matchingCodes?.length > 0
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Selectable Only'],
          reason: matchingCodes,
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: `no matching icd code`,
        });

    // check EO
    this.checkNotes(assessment);

    // check for IN
    this.checkMissingFields(assessment);

    this.evaluateEditStatus(node);
  }

  // reviewedMedicalRecords
  private type19_ChangeEditStatus(
    reviewedMedicalRecords: MedicalRecord,
    icdCodes: any,
    node: PatientChartNode
  ): void {
    this.initPrint([reviewedMedicalRecords, icdCodes], node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    const matchingCodes = icdCodes.filter((code: any) => {
      return code.name == reviewedMedicalRecords.diagnosis;
    });

    // check SO and EO
    matchingCodes?.length > 0
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Selectable Only'],
          reason: matchingCodes,
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Edit Only'],
          reason: 'no matching icd code',
        });

    // check EO
    this.checkNotes(reviewedMedicalRecords);

    // check for IN
    this.checkMissingFields(reviewedMedicalRecords);

    this.evaluateEditStatus(node);
  }

  // scanDocument
  // what should determine the status of a scanned document
  private type20_ChangeEditStatus(document: Document, node: PatientChartNode): void {
    this.initPrint(document, node);

    document.documentData
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Edit and Selectable'],
          reason: document.documentData,
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Default Only'],
          reason: 'document.documentData is undefined',
        });

    this.evaluateEditStatus(node);
  }

  // prescription
  private type21_ChangeEditStatus(
    prescription: MedicationPrescription,
    node: PatientChartNode
  ): void {
    this.initPrint(prescription, node);

    this.editStatusReasons.splice(0); // clear in case it's been ran before
    this.editStatusReasons.push({
      status: node.attributes.nodeSpecificAttributes['editStatus'],
      reason: `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`,
    });

    // check EO
    this.checkNotes(prescription);

    // check for IN
    this.checkMissingFields(prescription);

    const incompleteReasons = this.editStatusReasons.filter(reason => {
      return (
        reason.status == this.editStatusValue['Incomplete'] &&
        reason.reason != `old: ${node.attributes.nodeSpecificAttributes['editStatus']}`
      );
    });

    if (incompleteReasons?.length == 0)
      this.editStatusReasons.push({
        status: this.editStatusValue['Selectable Only'],
        reason: 'every list is filled',
      });

    this.evaluateEditStatus(node);
  }

  // plan, procedure
  private type5_ChangeEditStatus(node: PatientChartNode): void {
    // implemented
    node.value?.length == 0
      ? this.editStatusReasons.push({
          status: this.editStatusValue['Default Only'],
          reason: `${node.name} is empty`,
        })
      : this.editStatusReasons.push({
          status: this.editStatusValue['Selectable Only'],
          reason: node.value,
        });

    this.evaluateEditStatus(node);
  }

  // // screening
  // private type3_ChangeEditStatus(): void {
  //   // unable to implement yet
  // }
  //
  // // addendum
  // // can't find node
  // private type22_ChangeEditStatus(): void {
  //   // can't implement yet
  // }

  private getLeafNodesByName(name: string): PatientChartNode[] {
    if (this.isEditStatusSet) {
      const ret: PatientChartNode[] = this.leafNodes.filter(node => {
        return node.name == name;
      });
      return ret;
    } else {
      console.log('getLeafNodesByName cannot be ran!!!');
      return [];
    }
  }

  private getLeafNodesById(id: string): PatientChartNode[] {
    if (this.isEditStatusSet) {
      const ret: PatientChartNode[] = this.leafNodes.filter(node => {
        return node.id == id;
      });
      return ret;
    } else {
      console.log('getLeafNodesById cannot be ran!!!');
      return [];
    }
  }

  private getLeafNodesByType(type: PatientChartNodeType): PatientChartNode[] {
    if (this.isEditStatusSet) {
      const ret: PatientChartNode[] = this.leafNodes.filter(node => {
        return node.type == type;
      });
      return ret;
    } else {
      console.log('getLeafNodesByType cannot be ran!!!');
      return [];
    }
  }

  private addDefaultOnlyStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Default Only'];
        this.addReasonToNode(chartNode, reason);
      }
    console.log(`${chartNode?.name}: added DO`);
  }

  private addSelectableOnlyStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Selectable Only'];
        this.addReasonToNode(chartNode, reason);
      }
    console.log(`${chartNode?.name}: added SO`);
  }

  private addEditOnlyStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Edit Only'];
        this.addReasonToNode(chartNode, reason);
      }
    console.log(`${chartNode?.name}: added EO`);
  }

  private addEditAndSelectableStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Edit and Selectable'];
        this.addReasonToNode(chartNode, reason);
      }

    console.log(`${chartNode?.name}: added ES`);
  }

  private addUnknownStatus(chartNode: PatientChartNode, reasons: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Unknown'];
        this.addReasonToNode(chartNode, reasons);
      }
    console.log(`${chartNode?.name}: added UN`);
  }

  private addNotDocumentedStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['NotDocumented'];
        this.addReasonToNode(chartNode, reason);
      }
    console.log(`${chartNode?.name}: added ND`);
  }

  private addIncompleteStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Incomplete'];
        this.addReasonToNode(chartNode, reason);
      }
    console.log(`${chartNode?.name}: added IN`);
  }

  private addNoContentChangedStatus(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['No Content Changed'];
        this.addReasonToNode(chartNode, reason);
      }
    console.log(`${chartNode?.name}: added NC`);
  }

  private addReasonToNode(chartNode: PatientChartNode, reason: string): void {
    if (chartNode?.attributes.nodeSpecificAttributes)
      if (this.checkEditStatus()) {
        chartNode.attributes.nodeSpecificAttributes['editStatusReason'] = reason;
      }
  }

  private checkEditStatus(): boolean {
    if (
      this.patientChartRootNode &&
      this.patientChartRootNode?.attributes.nodeSpecificAttributes
    ) {
      if (
        Object.keys(this.patientChartRootNode.attributes.nodeSpecificAttributes).includes(
          'isEditStatus'
        )
      ) {
        this.isEditStatusSet =
          this.patientChartRootNode.attributes.nodeSpecificAttributes['isEditStatus'];
        return true;
      } else {
        this.isEditStatusSet = false;
        console.log("editStatus isn't available. Was this chart just created?");
      }
    } else console.log('cannot add editStatus.');

    return false;
  }

  public initNewChart(): void {
    console.time('init');
    if (this.patientChartRootNode) {
      console.log('in initNewChart()');
      this.isNewChart = true;
      this.initRootEditStatus();

      if (this.checkEditStatus()) {
        this.addDefaultEditStatusToLeafs();
        // below removed since it is in addDefaultEditStatusToLeafs()
        // this.saveEditStatus();
      }
    }
    console.timeEnd('init');
  }

  public initChart(): void {
    if (!this.patientChartRootNode) return;
    console.time('init');
    this.isNewChart = false;
    if (this.checkEditStatus()) {
      this.leafNodes = this.findLeafNodes(this.patientChartRootNode);
      this.updateLeafNodeExtras();
    }
    console.timeEnd('init');
  }

  private saveEditStatus(): void {
    // console.log('selected node:', this.selectedNode);
    // console.log('previous visit:', this.previousVisitPatientChartRootNode);
    if (this.patientChartRootNode) {
      this.isEditStatusSaved = true;
      // this.printEditStatus();
      this.emitNeedSaving.next(this.patientChartRootNode);
    } else {
      console.log('no root node??');
    }
  }

  private initRootEditStatus(): void {
    if (this.patientChartRootNode)
      if (this.patientChartRootNode.attributes.nodeSpecificAttributes)
        this.patientChartRootNode.attributes.nodeSpecificAttributes['isEditStatus'] =
          true;
      else
        this.patientChartRootNode.attributes.nodeSpecificAttributes = {
          isEditStatus: true,
        };
  }

  private addDefaultEditStatusToLeafs(): void {
    this.emitPreviousVisitsSaved.subscribe((isSaved: boolean) => {
      if (!this.isNewChart || !isSaved || !this.patientChartRootNode) return;

      this.isEditStatusSaved = false;
      if (this.leafNodes?.length == 0) {
        this.leafNodes = this.findLeafNodes(this.patientChartRootNode);
        this.updateLeafNodeExtras();
      }
      //console.log('edit-status.addDefaultEditStatusToLeafs', this.leafNodes);
      this.leafNodes.forEach((node: PatientChartNode) => {
        if (Object.keys(node.attributes).includes('nodeSpecificAttributes')) {
          const status: string = this.changedSincePreviousVisit(node)
            ? this.editStatusValue['Default Only']
            : this.editStatusValue['No Content Changed'];

          // console.log(`\t${node.name} status: ${status}`);

          if (node.attributes.nodeSpecificAttributes) {
            // if (!node.attributes.nodeSpecificAttributes['editStatus'])
            node.attributes.nodeSpecificAttributes['editStatus'] = status;
          } else node.attributes.nodeSpecificAttributes = { editStatus: status };

          status === this.editStatusValue['Default Only']
            ? this.addReasonToNode(node, `${node.name} has default value`)
            : this.addReasonToNode(
                node,
                `${node.name} has not changed since previous visit`
              );
        } else console.log('\tnodeSpecificAttributes is not there!!!');
      });
      this.saveEditStatus();
    });
  }

  private changedSincePreviousVisit(node: PatientChartNode): boolean {
    const previousVisitEquality: boolean[] = [];
    this.previousVisitLeafNodes.forEach((previousVisitNode: PatientChartNode) => {
      if (node.name === previousVisitNode.name) {
        previousVisitEquality.push(
          this.patientChartEqualityComparer.arePatientChartsEqual(
            previousVisitNode,
            node,
            true
          )
        );
      }
    });
    // if there were changes, all of previousVisitEquality would be false
    if (previousVisitEquality?.length === 0 || previousVisitEquality.includes(true))
      return false;

    return true;
  }

  public findLeafNodes(rootNode: PatientChartNode): PatientChartNode[] {
    console.time('leafNodes');
    const leafNodes: PatientChartNode[] = [];

    // data structure to hold pieces (dfs -> use stack)
    const treeStack: StackHelper<PatientChartNode> = new StackHelper<PatientChartNode>();
    if (rootNode && leafNodes?.length == 0) treeStack.push(rootNode);

    while (treeStack.size() > 0) {
      const currentNode = treeStack.pop();
      if (currentNode != undefined) {
        // push children
        if (currentNode.children && currentNode.children?.length > 0) {
          currentNode.children.forEach((node: PatientChartNode) => {
            treeStack.push(node);
          });
        } else {
          leafNodes.push(currentNode);
          if (this.type4LeafDetailedHtml && currentNode.type == 4 && currentNode.value) {
            this.type4LeafDetailedHtml[currentNode.id] =
              currentNode.value['detailedTemplateHtml'];
          } else if (currentNode.type == 4 && currentNode.value)
            this.type4LeafDetailedHtml = {
              [currentNode.id]: currentNode.value['detailedTemplateHtml'],
            };
        }
      } else console.log('\tcurrentNode is undefined. Check implementation.');
    }
    console.timeEnd('leafNodes');
    return leafNodes;
  }

  private setDefaultValues(): void {
    console.time('getDefaultValues');
    this.defaultValues = {};
    for (const type of Object.values(PatientChartNodeType)) {
      this.defaultValueService
        .getByPatientChartNodeType(Number(type))
        .then(defaultValue => {
          if (this.defaultValues) {
            this.defaultValues[Number(type)] = defaultValue ? defaultValue.value : '';
          }
        });
    }
    console.timeEnd('getDefaultValues');
  }

  private updateLeafNodeExtras(): void {
    this.leafNodes.forEach(node => {
      if (!this.names_leafs.includes(node.name)) {
        this.names_leafs.push(node.name);
        this.unique_leafs.push(node);
        if (!Object.keys(this.types_leafs).includes(String(Number(node.type)))) {
          this.types_leafs[Number(node.type)] = [node.name];
        } else {
          this.types_leafs[Number(node.type)].push(node.name);
        }
      }
    });
    if (!this.defaultValues) this.setDefaultValues();
  }

  // should update leaf data structure, if there are new ones without input add DO status
  private updateLeafNodes(): void {
    if (!this.patientChartRootNode) return;
    const oldLength: number = this.leafNodes?.length;

    this.leafNodes = this.findLeafNodes(this.patientChartRootNode);
    this.updateLeafNodeExtras();
    this.leafNodes.forEach(leaf => {
      if (!leaf.attributes.nodeSpecificAttributes) {
        leaf.attributes['nodeSpecificAttributes'] = {};
        leaf.attributes.nodeSpecificAttributes = { editStatus: 'DO' };
        console.log(leaf);
      }
      if (
        leaf.attributes.nodeSpecificAttributes?.length > 0 &&
        !Object.keys(leaf.attributes.nodeSpecificAttributes).includes('editStatus')
      )
        leaf.attributes.nodeSpecificAttributes['editStatus'] =
          this.editStatusValue['Default Only'];
      else if (leaf.attributes.nodeSpecificAttributes?.length == 0)
        leaf.attributes.nodeSpecificAttributes = { editStatus: 'DO' };
    });

    oldLength == this.leafNodes?.length
      ? console.log('no new leafs added')
      : console.log(`${this.leafNodes?.length - oldLength} nodes added`);
  }

  public printEditStatus(): void {
    if (!this.patientChartRootNode) return;
    if (this.leafNodes?.length == 0) {
      this.leafNodes = this.findLeafNodes(this.patientChartRootNode);
      this.updateLeafNodeExtras();
    }

    console.log('printing edit status');
    console.log('this.editStatusReasons', this.editStatusReasons);
    console.log('this', this);
    // console.log('leafNodes:');
    // console.log(this.leafNodes);
    // console.log('this.unique_leafs');
    // console.log(this.unique_leafs);
    // console.log('this.names_leafs');
    // console.log(this.names_leafs);
    // console.log('patient tree (in edit-status.service.ts):');
    // console.log(this.patientChartRootNode);
  }
}

export interface statusReason {
  status: string;
  reason: string | Array<string>;
}
