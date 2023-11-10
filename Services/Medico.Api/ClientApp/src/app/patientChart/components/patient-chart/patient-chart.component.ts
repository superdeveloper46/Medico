import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { Appointment } from 'src/app/_models/appointment';
import { AlertService } from 'src/app/_services/alert.service';
import { Admission } from '../../models/admission';
import { PatientChartHeaderData } from '../../models/patientChartHeaderData';
import { PatientChartService } from '../../services/patient-chart.service';
import { SignatureInfoService } from '../../services/signature-info.service';
import { PatientChartTrackService } from '../../../_services/patient-chart-track.service';
import { AdmissionService } from '../../services/admission.service';
import { SignatureInfo } from '../../models/signatureInfo';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { DocumentService } from '../../patient-chart-tree/services/document.service';
import { PatientChartInfo } from '../../models/patientChartInfo';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeManagementService } from '../../services/patient-chart-node-management.service';
import { WindowService } from 'src/app/_services/window.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import notify from 'devextreme/ui/notify';
import { custom } from 'devextreme/ui/dialog';
import { ProceedUnsavedChangesActionTypes } from 'src/app/_classes/proceed-unsaved-changes-action-types.enum';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { LookupModel } from 'src/app/_models/lookupModel';
import { DocumentListComponent } from '../document-list/document-list.component';
import { UpdatePatientChartDocumentNodesModel } from '../../models/updatePatientChartDocumentNodesModel';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { PatientChartEqualityComparer } from '../../services/patient-chart-equality-comparer.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { RepositoryService } from 'src/app/_services/repository.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { AppointmentStatus } from 'src/app/_classes/apptStatus';
import { patientChartTree } from 'src/app/administration/components/patientChartManagement/patient-chart-management.component';
import { EditStatusService } from 'src/app/patientChart/services/edit-status.service';
import {
  AllegationEditService,
  eventData,
} from 'src/app/_services/allegation-edit.service';
import { LookupStateModel } from 'src/app/_models/lookupStateModel';
import { PatientDataModelNode } from '../../classes/patientDataModelNode';
import { AuditManagementService } from 'src/app/administration/components/audit-management/audit-management.service';
import { ChartColor } from '../../models/chartColor';

@Component({
  selector: 'patient-chart',
  templateUrl: './patient-chart.component.html',
  styleUrls: ['patient-chart.component.scss'],
})
export class PatientChartComponent implements OnInit, OnDestroy {
  @ViewChild('treeView', { static: false })
  treeView!: DxTreeViewComponent;
  @ViewChild('documentList', { static: false })
  documentList!: DocumentListComponent;

  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  isAdmissionSignedOff: boolean = true;
  appointment?: Appointment;
  admission?: Admission;
  routeParamsSubscription?: Subscription;
  patientChartChangesSubscription?: Subscription;
  patientAssessmentChangesSubscription?: Subscription;
  emitNeedSavingSubscription?: Subscription;
  emitDocumentSave: Subject<LookupStateModel> = new Subject<LookupStateModel>();
  patientChartProjectionTree: any[] = [];
  patientChartRootNode?: PatientChartNode;
  selectedPatientChartNode?: PatientChartNode;
  previousVisitsNode?: PatientChartNode;
  patientChartInfo?: PatientChartInfo;
  patientChartHeaderData?: PatientChartHeaderData;
  isPatientChartVisible = true;
  isPatientChartPreAuth = true;
  isPatientAuditChart = true;
  selectedNodeId = '';
  selectedPatientChartName: string = '';
  savedVersionOfAdmissionData?: string;
  isDocumentNodesManagementPopupVisible = false;
  isPreviousPatientChartsPopupVisible = false;
  patientChartDocumentDataSource: any = {};
  patientChartDocumentNodeIds: string[] = [];
  documentNodes: LookupModel[] = [];
  physicianViewer = false;
  labOrderViewer = false;
  timelineViewer = false;
  messageViewer = false;
  now: Date = new Date();
  from: Date = new Date();
  //from1: Date = new Date();
  //from1: Date = new Date();
  quantity = 10;
  sortDirection = 'Ascending';
  dateDirection = '90d';
  sortDates = ['180d', '150d', '120d', '90d', '60d', '30d'];
  sortItems = ['Ascending', 'Descending'];
  from2?: Date = undefined;
  now1?: Date = undefined;
  previousVisitslength = 0;

  isStatusPopupVisible = false;
  appointmentsDataSource: any = {};
  statusForm: any = { sendEmail: true };
  statusList: any[] = [];
  dischargeInstructionsList: string[] = [];
  areSelectableListsInitialized = false;
  public fromNav = true;
  parsedData: any;
  patientEmail = '';
  alligationset: any;
  isHpiNameisAlligationName = false;
  UpdateAlligationName: any;
  patientNotesViewer?: boolean;
  originalStatementOfExamination = '';
  patientChartNodeType?: PatientChartNodeType;
  templateValue: any;
  preAuthViewer = false;
  appointmentId: any;
  showPatientAdmissionInfo = false;
  admissionSaved: boolean = false;
  companyIdSaved: boolean = false;
  patientChartTreeViewSaved: boolean = false;
  showPatientChartLeftColumn: boolean = true;
  isPatientChartView: boolean = false;
  isEditStatusSaved: boolean = true;
  doesUserWishToSave: boolean = true;
  cancelRouteChange: boolean = false;
  chartColors: ChartColor = new ChartColor();
  isChartColorsSaved = false;
  treeViewNodeStyles: { [key: string]: { [klass: string]: any } } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private alertService: AlertService,
    private patienChartService: PatientChartService,
    private signatureInfoService: SignatureInfoService,
    private patientChartTrackService: PatientChartTrackService,
    private admissionService: AdmissionService,
    private documentService: DocumentService,
    private router: Router,
    private allegationEditService: AllegationEditService,
    private companyIdService: CompanyIdService,
    private patientChartNodeManagementService: PatientChartNodeManagementService,
    private windowService: WindowService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private patientChartEqualityComparer: PatientChartEqualityComparer,
    private selectableListService: SelectableListService,
    private selectedPatientChartNodeService: SelectedPatientChartNodeService,
    private editStatusService: EditStatusService,
    private auditManagementService: AuditManagementService
  ) {}

  openDocumentNodesManagementPopup() {
    this.isDocumentNodesManagementPopupVisible = true;
  }

  openStatusPopup() {
    this.isStatusPopupVisible = true;
  }

  chartViewer = false;
  showPhysicianViewer() {
    this.isPatientChartView = false;
    this.physicianViewer = true;
    this.labOrderViewer = false;
    this.timelineViewer = false;
    this.chartViewer = false;
    this.patientNotesViewer = false;
    this.messageViewer = false;
  }

  showLabOrderViewer() {
    this.isPatientChartView = false;
    this.physicianViewer = false;
    this.labOrderViewer = true;
    this.timelineViewer = false;
    this.chartViewer = false;
    this.patientNotesViewer = false;
    this.messageViewer = false;
  }

  showPatientNotesViewer() {
    this.isPatientChartView = false;
    this.physicianViewer = false;
    this.labOrderViewer = false;
    this.timelineViewer = false;
    this.chartViewer = false;
    this.patientNotesViewer = true;
    this.messageViewer = false;
  }

  showPatientMessageViewer() {
    this.isPatientChartView = false;
    this.physicianViewer = false;
    this.labOrderViewer = false;
    this.timelineViewer = false;
    this.messageViewer = true;
    this.chartViewer = false;
    this.patientNotesViewer = false;
  }

  showTimeline() {
    this.isPatientChartView = false;
    this.physicianViewer = false;
    this.labOrderViewer = false;
    this.timelineViewer = true;
    this.chartViewer = false;
    this.patientNotesViewer = false;
    this.messageViewer = false;
  }

  signOff(isUnsigned: boolean): void {
    const message = !isUnsigned
      ? 'Are you sure you want to Sign Off patient chart?'
      : 'Are you sure you want to Unsign patient chart ?';
    this.alertService.confirm(message, 'Signed Off Confirmation').then(result => {
      if (result) {
        const signatureInfo = new SignatureInfo();
        const currentDate: any = new Date();

        if (!this.admission) return;
        const admissionId = this.admission.id;

        const signDate = DateHelper.jsLocalDateToSqlServerUtc(currentDate);

        signatureInfo.signDate = signDate;
        signatureInfo.admissionId = admissionId;
        signatureInfo.isUnsigned = isUnsigned;

        this.appointmentService
          .getById(this.admission.appointmentId)
          .then(appointment => {
            if (appointment.physicianId)
              signatureInfo.physicianId = appointment.physicianId;

            // check existing
            this.signatureInfoService
              .getSignature(admissionId)
              .then((existingInfo: SignatureInfo) => {
                if (existingInfo != null) {
                  signatureInfo.id = existingInfo.id;
                }
                this.signatureInfoService
                  .save(signatureInfo)
                  .then(() => {
                    this.isAdmissionSignedOff = !isUnsigned;

                    this.patientChartProjectionTree = [];
                    if (this.previousVisitsNode) {
                      this.patientChartProjectionTree.push(
                        this.patienChartService.getPatientChartTreeProjection(
                          this.previousVisitsNode,
                          this.isAdmissionSignedOff,
                          true
                        )
                      );
                    }
                    this.patientChartRootNode = this.updateHpiName(
                      this.patientChartRootNode
                    );
                    if (this.patientChartRootNode) {
                      this.patientChartProjectionTree.push(
                        this.patienChartService.getPatientChartTreeProjection(
                          this.patientChartRootNode,
                          true,
                          false
                        )
                      );
                      if (this.selectedPatientChartNode) {
                        const patientChartDocumentNode =
                          this.patientChartNodeManagementService.getDocumentNodeRelatedToInnerNode(
                            this.patientChartRootNode,
                            this.selectedPatientChartNode.id
                          );

                        this.onPatientChartNodeSelected(
                          this.selectedPatientChartNode,
                          patientChartDocumentNode
                        );
                      }
                    }

                    const successMsg = !isUnsigned
                      ? 'Document was signed off successfully'
                      : 'Document was unsigned successfully';
                    this.alertService.info(successMsg);
                  })
                  .catch(error =>
                    this.alertService.error(error.message ? error.message : error)
                  );
              });
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  showUnsavedChangesWarningNotificationIfNeeded($event: any) {
    if (
      this.patientChartEqualityComparer.doesPatientChartHaveUnsavedChanges(
        this.patientChartRootNode,
        this.savedVersionOfAdmissionData
      )
    )
      $event.returnValue = 'Patient Chart has unsaved changes';
  }

  showUnsavedChangesWarningNotification(): Promise<ProceedUnsavedChangesActionTypes> {
    const myDialog = custom({
      title: 'Warning',
      messageHtml: 'Unsaved patient chart changes will be lost',
      buttons: [
        {
          text: 'Save and Proceed',
          onClick: () => {
            return ProceedUnsavedChangesActionTypes.SaveAndProceed;
          },
        },
        {
          text: 'Cancel',
          onClick: () => {
            return ProceedUnsavedChangesActionTypes.Cancel;
          },
        },
        {
          text: "Don't save",
          onClick: () => {
            return ProceedUnsavedChangesActionTypes.DoNotSave;
          },
        },
      ],
    });

    return myDialog.show();
  }

  ngOnInit(): void {
    this.from = new Date();
    if (this.dateDirection === '180d') {
      this.from.setMonth(this.now.getMonth() - 6);
    }
    if (this.dateDirection === '150d') {
      this.from.setMonth(this.now.getMonth() - 5);
    }
    if (this.dateDirection === '120d') {
      this.from.setMonth(this.now.getMonth() - 4);
    }
    if (this.dateDirection === '90d') {
      this.from.setMonth(this.now.getMonth() - 3);
    }
    if (this.dateDirection === '60d') {
      this.from.setMonth(this.now.getMonth() - 2);
    }
    if (this.dateDirection === '30d') {
      this.from.setMonth(this.now.getMonth() - 1);
    }

    this.subscribeToCompanyIdChanges();
    this.subscribeToRouteParamsChanges();
    this.subscribeToPatientChartChanges();
    this.initPatientChartDocumentDataSource();

    this.allegationEditService.getEventWithObj.subscribe((event: eventData) => {
      // when you edit the selectable list of SoE, this if statement is entered
      if (event.method == 'setTemplateValue') {
        this.templateValue = event.data;
      }
      if (event.method == 'setHpiUpdateFlag') {
        this.isHpiNameisAlligationName = event.data;
      }

      if (event.method == 'updatePatientAllegationSet') {
        this.UpdateAlligationName = event.data;
      }
    });

    // add a check in here that, if it's a new chart, don't init audit until this is called
    this.emitNeedSavingSubscription = this.editStatusService.emitNeedSaving.subscribe(
      save => {
        if (save) {
          this.patientChartRootNode = save;
          this.savePatientAdmission().then(() => {
            this.savedVersionOfAdmissionData = this.admission?.admissionData;
            this.isEditStatusSaved = true;
            if (
              this.selectedPatientChartNode &&
              this.editStatusService.getIsEditStatusSet()
            ) {
              const [fillColor, borderColor] = this.chartColors.getColorsForNode(
                this.selectedPatientChartNode.attributes.nodeSpecificAttributes
                  .editStatus,
                this.selectedPatientChartNode.attributes.auditRequired ?? ''
              );
              this.treeViewNodeStyles[this.selectedPatientChartNode.id][
                'background-color'
              ] = fillColor;
              this.treeViewNodeStyles[this.selectedPatientChartNode.id]['border-color'] =
                borderColor;
            }
            this.tryInitAudit();
          });
        } else {
        }
      }
    );

    this.patientAssessmentChangesSubscription =
      this.patientChartTrackService.assessmentDataChanged.subscribe(data => {
        if (data.nodeID > 0) {
          const patientChartNodeType = data.nodeID;
          this.patientChartNodeType = patientChartNodeType;
          if (!this.fromNav) {
            if (data.data) {
              this.setAssessmentData(data.data);
            }
            this.savePatientAdmission()
              .then(() => {
                this.savedVersionOfAdmissionData = this.admission?.admissionData;
                const patientChartTreeSnapshot = this.patientChartProjectionTree;
                if (patientChartNodeType === PatientChartNodeType.ScanDocumentNode) {
                  if (this.appointment?.patientId) {
                    this.documentService
                      .getByPatientId(this.appointment?.patientId)
                      .then(patientScanDocumentsInfo => {
                        if (this.patientChartRootNode) {
                          this.patienChartService.addScanDocumentsToPatientChartNodes(
                            this.patientChartRootNode,
                            patientScanDocumentsInfo
                          );
                        }
                        this.updatePatientChartTreeView(patientChartTreeSnapshot);
                      });
                  }
                }
                this.updatePatientChartTreeView(patientChartTreeSnapshot);

                const patientChartHeaderUpdateNeeded =
                  patientChartNodeType === PatientChartNodeType.AllergiesNode ||
                  patientChartNodeType === PatientChartNodeType.VitalSignsNode;

                if (patientChartHeaderUpdateNeeded) {
                  this.setPatientChartHeaderData();
                }
                notify('Patient chart was successfully saved', 'info', 800);
              })
              .catch(error =>
                this.alertService.error(error.message ? error.message : error)
              );
          } else {
            this.fromNav = false;
          }
        }
      });
    this.auditManagementService.getColors().then(colors => {
      this.chartColors.setAll(colors);
      this.isChartColorsSaved = true;
      this.tryInitAudit();
    });
    this.editStatusService.onPatientChartInit();
  }

  // if all the necessary inputs are loaded, then audit view is initialized
  private tryInitAudit(): void {
    if (
      this.admissionSaved &&
      this.companyIdSaved &&
      this.patientChartTreeViewSaved &&
      this.isEditStatusSaved &&
      this.isChartColorsSaved
    ) {
      this.chartViewer = false;
      this.hideOthers();
      this.isPatientChartView = true;
    } else {
    }
  }

  showReason(): string {
    if (this.selectedPatientChartNode)
      if (
        this.selectedPatientChartNode.attributes.nodeSpecificAttributes[
          'editStatusReason'
        ]
      )
        return this.selectedPatientChartNode.attributes.nodeSpecificAttributes[
          'editStatusReason'
        ];
    return '';
  }

  private initSelectableLists(companyId: string): void {
    if (this.areSelectableListsInitialized) this.areSelectableListsInitialized = false;

    const appointmentStatusListConfig = new SelectableListConfig(
      companyId,
      SelectableListsNames.application.appointmentStatus,
      LibrarySelectableListIds.application.appointmentStatus
    );

    this.selectableListService
      .setSelectableListsValuesToComponent([appointmentStatusListConfig], this)
      .then(() => {
        this.areSelectableListsInitialized = true;
        this.statusList = this.selectableListService.getSelectableListValuesFromComponent(
          this,
          SelectableListsNames.application.appointmentStatus
        );
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  ngOnDestroy(): void {
    this.editStatusService.onPatientChartDestroyed();

    this.routeParamsSubscription?.unsubscribe();
    this.patientChartChangesSubscription?.unsubscribe();
    this.companyIdSubscription?.unsubscribe();
    this.patientAssessmentChangesSubscription?.unsubscribe();
    this.emitNeedSavingSubscription?.unsubscribe();
  }

  // event handler for when audit closes (through 'back to chart' button)
  onReportHidden() {
    this.showPatientChartLeftColumn = true;
    this.isPatientChartVisible = true;
    this.isPatientChartPreAuth = true;
    this.isPatientAuditChart = true;
    this.preAuthViewer = false;
    this.isPatientChartView = true;
  }

  makeReport() {
    this.isPatientChartVisible = false;
  }

  preAuth() {
    this.isPatientChartPreAuth = false;
  }

  auditChart() {
    this.isPatientChartView = false;
    this.isPatientAuditChart = false;
  }

  showPreAuthViewer() {
    this.physicianViewer = false;
    this.labOrderViewer = false;
    this.timelineViewer = false;
    this.chartViewer = false;
    this.patientNotesViewer = false;
    this.preAuthViewer = true;
  }

  hideOthers() {
    this.physicianViewer = false;
    this.labOrderViewer = false;
    this.timelineViewer = false;
    this.patientNotesViewer = false;
    this.preAuthViewer = false;
    this.messageViewer = false;
  }

  async toggleView(e: any) {
    if (e.event) {
      if (!this.cancelRouteChange) {
        this.chartViewer = false;
        this.hideOthers();
      }
    }
  }

  async selectPatientChartNode($event: any): Promise<void> {
    this.selectedPatientChartName = $event.itemData.text;
    this.chartViewer = true;
    this.hideOthers();
    this.fromNav = true;
    setTimeout(() => {
      this.fromNav = false;
    }, 2000);
    $event.itemData.selected = true;

    const nodeId = $event.itemData.id;
    this.selectedNodeId = nodeId;
    // Select chart in Patient Chart
    const selectedPatientChartNode = this.patientChartNodeManagementService.getById(
      nodeId,
      this.patientChartRootNode
    );

    // patient charts consists of two main part previous visits and patient chart
    // itself - need to check if patient selected any node from previous visits
    // Select chart in Previous VisitspatientChartRootNode
    if (!selectedPatientChartNode) {
      this.admissionSaved = false;
      // this.companyIdSaved = false; // company id is not refreshed when selecting a previous visit
      this.patientChartTreeViewSaved = false;
      const selectedPreviousVisitsChartNode =
        this.patientChartNodeManagementService.getById(nodeId, this.previousVisitsNode);

      if (!selectedPreviousVisitsChartNode) {
        throw `Patient chart node with id: ${nodeId} was not found`;
      }

      // saves chart - sets cancelRouteChange
      this.checkForAndSaveChanges();

      if (!this.cancelRouteChange) {
        this.router.navigate([
          '/patient-chart',
          selectedPreviousVisitsChartNode.value.chartId,
        ]);
        this.onPatientChartNodeSelected(selectedPreviousVisitsChartNode, undefined);
        //this.onPatientChartNodeSelected(selectedPreviousVisitsChartNode, selectedPatientChartNode);
        this.moveToTopIfScrollExists();
      }
      this.cancelRouteChange = false;

      return;
    }

    const patientChartDocumentNode =
      this.patientChartNodeManagementService.getDocumentNodeRelatedToInnerNode(
        this.patientChartRootNode,
        selectedPatientChartNode.id
      );
    if (!patientChartDocumentNode)
      throw `Unable to find root document node for child node with id: ${nodeId}`;

    if (!selectedPatientChartNode)
      throw `Patient chart node with id: ${nodeId} was not found`;

    this.onPatientChartNodeSelected(selectedPatientChartNode, patientChartDocumentNode);
    this.moveToTopIfScrollExists();
  }

  savePatientAdmission(): Promise<any> {
    this.appointmentId = this.activatedRoute.snapshot.params['appointmentId'] || '';
    if (this.admission && this.admission?.appointmentId == this.appointmentId) {
      if (this.templateValue) {
        this.patientChartRootNode = this.updateTemplateValue(this.templateValue);
      }
      this.admission.admissionData = JSON.stringify(this.patientChartRootNode);
      return this.admissionService.save(this.admission);
    }
    return Promise.reject();
  }

  // used for handling saving before changing to previous charts
  // as well as lifecycle for view toggle button
  async checkForAndSaveChanges(): Promise<void> {
    this.cancelRouteChange = false;
    this.doesUserWishToSave = true;
    if (
      this.patientChartEqualityComparer.doesPatientChartHaveUnsavedChanges(
        this.patientChartRootNode,
        this.savedVersionOfAdmissionData
      )
    ) {
      await this.showUnsavedChangesWarningNotification().then(
        async proceedUnsavedChangesActionType => {
          if (
            proceedUnsavedChangesActionType === ProceedUnsavedChangesActionTypes.Cancel
          ) {
            this.doesUserWishToSave = true;
            this.cancelRouteChange = true;
          } else if (
            proceedUnsavedChangesActionType === ProceedUnsavedChangesActionTypes.DoNotSave
          ) {
            this.doesUserWishToSave = false;
            this.cancelRouteChange = false;
          } else {
            this.doesUserWishToSave = true;
            this.cancelRouteChange = false;
          }
          if (this.doesUserWishToSave && !this.cancelRouteChange) {
            // needs to await since the canDeactivate will check for changes immediately once this.router.navigate is called
            await this.savePatientAdmission().then(() => {
              this.savedVersionOfAdmissionData = this.admission?.admissionData;
            });
          }
        }
      );
    }
  }

  updateTemplateValue(templateNode: any) {
    if (!this.patientChartRootNode?.children) return {};

    let template = [];
    const res: any = { ...this.patientChartRootNode };
    if (this.patientChartNodeType === PatientChartNodeType.TemplateNode) {
      for (let j = 0; j < this.patientChartRootNode.children.length; j++) {
        const mainNode = this.patientChartRootNode.children[j];
        if (mainNode) {
          if (mainNode.name == templateNode.parentNode && mainNode.children) {
            template = mainNode.children.filter(x => x.id === templateNode.templateId);
            if (template.length > 0) {
              template[0].value = templateNode.value;
              for (let i = 0; i < mainNode.children.length; i++) {
                if (mainNode.children[i].id === templateNode.templateId) {
                  mainNode.children[i] = template[0];
                  break;
                }
              }
            } else {
              for (let i = 0; i < mainNode.children.length; i++) {
                const data = mainNode.children[i].children;
                if (data) {
                  template = data.filter(x => x.id === templateNode.templateId);
                  if (template.length > 0) {
                    template[0].value = templateNode.value;
                    for (let i = 0; i < mainNode.children.length; i++) {
                      if (mainNode.children[i].id === templateNode.templateId) {
                        mainNode.children[i] = template[0];
                        break;
                      }
                    }
                    break;
                  }
                }
              }
            }
            res.children[j] = mainNode;
          }
        }
      }
    }

    return res;
  }

  isNodeOpened(nodeId: string): boolean {
    return nodeId === this.selectedNodeId;
  }

  closeDocumentNodesManagementPopup() {
    this.isDocumentNodesManagementPopupVisible = false;
  }

  createUpdatePatientChartDocumentNodes() {
    const isUpdatePatientChartDocumentNodesNeeded =
      this.isUpdatePatientChartDocumentNodesNeeded();

    if (!isUpdatePatientChartDocumentNodesNeeded) {
      this.isDocumentNodesManagementPopupVisible = false;
      return;
    }

    const updatePatientChartDocumentNodesModel =
      new UpdatePatientChartDocumentNodesModel();

    updatePatientChartDocumentNodesModel.admissionId = this.admission?.id;
    updatePatientChartDocumentNodesModel.documentNodes =
      this.documentList.actualDocumentNodes;

    this.admissionService
      .updatePatientChartDocumentNodes(updatePatientChartDocumentNodesModel)
      .then(() => {
        //todo: update patient chart document nodes without page reload
        location.reload();
        this.isDocumentNodesManagementPopupVisible = false;
      });
  }

  private isUpdatePatientChartDocumentNodesNeeded() {
    const actualDocumentNodes = this.documentList.actualDocumentNodes;

    if (actualDocumentNodes.length !== this.documentNodes.length) return true;

    for (let i = 0; i < actualDocumentNodes.length; i++) {
      const actualDocumentNode = actualDocumentNodes[i];
      const initialDocumentNode = this.documentNodes[i];

      if (actualDocumentNode.id !== initialDocumentNode.id) {
        // emit save here
        this.emitDocumentSave.next(actualDocumentNode);
        return true;
      }
    }

    return false;
  }

  private initPatientChartDocumentDataSource(): void {
    this.patientChartDocumentDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.patientChartDocuments),
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private moveToTopIfScrollExists() {
    const window = this.windowService.windowRef;
    const isVerticalExists = !!window.pageYOffset;
    if (isVerticalExists) window.scrollTo(0, 0);
  }

  private onPatientChartNodeSelected(
    selectedChartNode: PatientChartNode,
    patientChartDocumentNode?: PatientChartNode
  ): void {
    if (this.admission) {
      const admissionId = this.admission.id;
      this.patientChartInfo = new PatientChartInfo(
        patientChartDocumentNode,
        selectedChartNode,
        this.admission.patientId,
        admissionId,
        this.isAdmissionSignedOff,
        this.admission.appointmentId,
        this.companyId
      );
    }
    this.selectedPatientChartNode = selectedChartNode;
    this.selectedPatientChartNodeService.setSelectedPatientChartNodeId(
      selectedChartNode.id
    );

    this.selectedPatientChartNodeService.toEmitPatientChartNodeSelected(
      selectedChartNode
    );
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        if (this.companyId === GuidHelper.emptyGuid) {
          this.companyId = companyId;
          this.companyIdSaved = true;
          this.tryInitAudit();
        } else this.router.navigate(['/appointments']);

        this.initSelectableLists(this.companyId);
      }
    });
  }

  setAssessmentData(data: PatientChartNode) {
    this.patientChartRootNode;

    if (this.patientChartRootNode?.children) {
      for (let index = 0; index < this.patientChartRootNode.children.length; index++) {
        if (this.patientChartRootNode.children[index].name == data.name) {
          this.patientChartRootNode.children[index] = data;
        }
      }
    }
  }

  // the below breakpoint is also hit when adding a selectable to SoE
  private subscribeToPatientChartChanges(): void {
    this.patientChartChangesSubscription =
      this.patientChartTrackService.patientChartChanged.subscribe(
        patientChartNodeType => {
          this.patientChartNodeType = patientChartNodeType;

          // if (
          //   patientChartNodeType === PatientChartNodeType.ChiefComplaintNode ||
          //   patientChartNodeType === PatientChartNodeType.AssessmentNode ||
          //   //patientChartNodeType === PatientChartNodeType.TemplateNode ||
          //   patientChartNodeType === PatientChartNodeType.TemplateListNode
          // ) {
          //   const admissionData = this.admission.admissionData;
          //   const historyAndPhysicalData = JSON.parse(
          //     admissionData
          //   ).children.filter((x) => x.name == "historyAndPhysical");
          //   if (historyAndPhysicalData) {
          //     const sof = historyAndPhysicalData[0].children.filter(
          //       (y) => y.name === "Statement of Examination"
          //     );
          //   }

          //   this.fromNav = false;
          // }
          if (!this.fromNav) {
            this.savePatientAdmission()
              .then(() => {
                this.savedVersionOfAdmissionData = this.admission?.admissionData;
                const patientChartTreeSnapshot = this.patientChartProjectionTree;
                if (patientChartNodeType === PatientChartNodeType.ScanDocumentNode) {
                  if (this.appointment?.patientId) {
                    this.documentService
                      .getByPatientId(this.appointment.patientId)
                      .then(patientScanDocumentsInfo => {
                        if (this.patientChartRootNode) {
                          this.patienChartService.addScanDocumentsToPatientChartNodes(
                            this.patientChartRootNode,
                            patientScanDocumentsInfo
                          );
                        }

                        this.updatePatientChartTreeView(patientChartTreeSnapshot);
                      });
                  }
                }
                this.updatePatientChartTreeView(patientChartTreeSnapshot);

                const patientChartHeaderUpdateNeeded =
                  patientChartNodeType === PatientChartNodeType.AllergiesNode ||
                  patientChartNodeType === PatientChartNodeType.VitalSignsNode;

                if (patientChartHeaderUpdateNeeded) {
                  this.setPatientChartHeaderData();
                }

                notify('Patient chart was successfully saved', 'info', 800);
              })
              .catch(error =>
                this.alertService.error(error.message ? error.message : error)
              );
          } else {
            this.fromNav = false;
          }
        }
      );
  }

  updateHpiName(treeData: any) {
    const admissionData = this.admission?.admissionData;
    if (admissionData) {
      const historyAndPhysicalData = JSON.parse(admissionData).children.filter(
        (x: any) => x.name == 'historyAndPhysical'
      );
      if (historyAndPhysicalData) {
        if (historyAndPhysicalData.length > 0) {
          const chiefComplaint = historyAndPhysicalData[0].children.filter(
            (y: any) => y.name === 'chiefComplaint'
          );
          if (chiefComplaint[0].value.patientAllegationsSets) {
            this.alligationset = chiefComplaint[0].value.patientAllegationsSets;
            if (
              this.alligationset[0] ? this.alligationset[0].changeAlligationName : false
            ) {
              const HPIItems = treeData.children[0].children.filter(
                (y: any) => y.name == 'hpi'
              )[0].children;
              if (HPIItems) {
                const _me = this.admission;

                for (let i = 0; i < HPIItems.length; i++) {
                  const hpiTemplateId =
                    HPIItems[i].attributes.nodeSpecificAttributes.templateId;

                  const alligationType = this.alligationset.filter(
                    (a: any) =>
                      (a.hpiTemplates[0] ? a.hpiTemplates[0].id : '') === hpiTemplateId
                  );
                  if (alligationType.length > 0) {
                    HPIItems[i].name = alligationType[0].allegations;
                    HPIItems[i].title = alligationType[0].allegations;
                  }
                }
                treeData.children[0].children.filter(
                  (y: any) => y.name == 'hpi'
                )[0].children = HPIItems;
              }
            }
          }
        }
      }
    }
    return treeData;
  }
  private subscribeToRouteParamsChanges(): void {
    this.routeParamsSubscription = this.route.params.subscribe(async params => {
      const appointmentId = params['appointmentId'];
      await this.appointmentService
        .getById(appointmentId)
        .then(appointment => {
          if (!appointment) return;

          this.appointment = appointment;

          const isAdmissionCreated = !!appointment.admissionId;

          if (!isAdmissionCreated) {
            this.createNewAdmission(appointment);
          } else {
            this.admissionService.getById(appointment.admissionId).then(admission => {
              this.admission = admission;
              this.admissionSaved = true;
              this.patientChartRootNode = JSON.parse(admission.admissionData || 'null');
              this.savedVersionOfAdmissionData = admission.admissionData;
              this.signatureInfoService
                .isAdmissionSignedOff(admission.id)
                .then(isAdmissionSignedOff => {
                  this.isAdmissionSignedOff = isAdmissionSignedOff;
                  this.refreshPatientChart(this.isAdmissionSignedOff);
                });
              this.tryInitAudit();
            });
          }
        })
        .catch(error => {
          this.alertService.error(error.message ? error.message : error);
        });
    });
  }

  private createNewAdmission(appointment: Appointment) {
    if (!this.appointment?.patientId || !appointment.id) return;
    this.isEditStatusSaved = false;
    const newAdmission = new Admission();
    newAdmission.createdDate = new Date();
    newAdmission.patientId = this.appointment.patientId;
    newAdmission.appointmentId = appointment.id;
    this.admissionService.save(newAdmission).then(admission => {
      this.admission = admission;
      this.admissionSaved = true;
      this.patientChartRootNode = JSON.parse(admission.admissionData || 'null');
      this.savedVersionOfAdmissionData = admission.admissionData;
      this.refreshPatientChart(false, true);
      this.tryInitAudit();
    });
  }

  handleValueChange(args: any) {
    this.now = args.value;
    this.refreshPatientChart(this.isAdmissionSignedOff);
  }

  handleValueChange1(args: any) {
    this.from = args.value;
    this.refreshPatientChart(this.isAdmissionSignedOff);
  }

  onLimitChanged(e: any) {
    this.quantity = e.value;
    this.onContentChanged();
  }

  onSortChanged(e: any) {
    this.sortDirection = e.value;
    this.onContentChanged();
  }

  onSortDateChanged(e: any) {
    this.dateDirection = e.value;
    this.from = new Date();
    if (this.dateDirection === '180d') {
      this.from.setMonth(this.now.getMonth() - 6);
    }
    if (this.dateDirection === '150d') {
      this.from.setMonth(this.now.getMonth() - 5);
    }
    if (this.dateDirection === '120d') {
      this.from.setMonth(this.now.getMonth() - 4);
    }
    if (this.dateDirection === '90d') {
      this.from.setMonth(this.now.getMonth() - 3);
    }
    if (this.dateDirection === '60d') {
      this.from.setMonth(this.now.getMonth() - 2);
    }
    if (this.dateDirection === '30d') {
      this.from.setMonth(this.now.getMonth() - 1);
    }
    this.onContentChanged();
  }

  async onContentChanged() {
    await this.refreshPatientChart(this.isAdmissionSignedOff);
  }

  private async refreshPatientChart(isAdmissionSignedOff: boolean, isNewChart?: boolean) {
    const previousPatientVisits =
      this.appointmentService.getPatientPreviousVisitsBetweenDates(
        this.appointment?.patientId,
        this.from,
        this.now,
        this.quantity
        //this.appointment.startDate
      );

    const patientDocuments = await this.documentService.getByPatientId(
      this.appointment?.patientId
    );

    Promise.all([previousPatientVisits, patientDocuments]).then(result => {
      const previousVisits = result[0];
      let _filter1: any[];
      if (result[0].length < this.quantity) {
        _filter1 = previousVisits.slice(0, result[0].length + 1);
      } else {
        _filter1 = previousVisits.slice(0, this.quantity + 1);
      }

      if (this.sortDirection === 'Ascending') {
        _filter1.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        _filter1.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      if (this.patientChartRootNode?.children && this.selectedPatientChartName != '')
        this.patientChartRootNode.children[0].title = this.selectedPatientChartName;

      this.patientChartRootNode?.children?.forEach(children => {
        if (children.name == 'historyAndPhysical') {
          children.title = 'History And Physical';
        }

        if (children.name == 'progressNote') {
          children.title = 'Progress Note';
        }

        if (children.name == 'telehealthProgressNote') {
          children.title = 'Telehealth Progress Note';
        }

        if (children.name == 'patientCallNote') {
          children.title = 'Patient Call Note';
        }
      });
      const previousVisitsNode =
        this.patienChartService.createPreviousPatientVisitsNode(_filter1);
      this.previousVisitsNode = previousVisitsNode;

      const patientScanDocumentsInfo = result[1];

      this.patienChartService.addScanDocumentsToPatientChartNodes(
        this.patientChartRootNode,
        patientScanDocumentsInfo
      );
      this.patientChartRootNode = this.updateHpiName(this.patientChartRootNode);
      this.patientChartProjectionTree = [];
      if (previousVisitsNode) {
        this.patientChartProjectionTree.push(
          this.patienChartService.getPatientChartTreeProjection(
            previousVisitsNode,
            isAdmissionSignedOff,
            true
          )
        );
      }
      if (this.patientChartRootNode) {
        this.patientChartProjectionTree.push(
          this.patienChartService.getPatientChartTreeProjection(
            this.patientChartRootNode,
            isAdmissionSignedOff,
            false
          )
        );
      }
      this.patientChartTreeViewSaved = true;
      this.setPatientChartHeaderData();
      this.setPatientChartDocumentNodesAndIds();
      this.tryInitAudit();
    });

    if (!this.editStatusService.isPatientChartRootNode() && this.patientChartRootNode)
      this.editStatusService.setPatientChartRootNode(this.patientChartRootNode);

    if (this.admission && isNewChart) {
      this.isEditStatusSaved = false;
      if (this.patientChartRootNode) {
        this.editStatusService.setPatientChartRootNode(this.patientChartRootNode);
        this.editStatusService.initNewChart();
      }
    } else {
      this.editStatusService.initChart();
    }
  }

  // adds the edit status color to the tree view
  colorTitles(data: PatientDataModelNode): { [klass: string]: any } {
    const leafNodes = this.editStatusService.getLeafNodes();
    const style: { [klass: string]: any } = {};
    style['text'] = 'black';

    if (data.id && this.editStatusService.getIsEditStatusSet()) {
      if (!Object.keys(this.treeViewNodeStyles).includes(data.id)) {
        const matchingNodes = leafNodes.filter(node => node.id === data.id);
        if (matchingNodes.length === 1) {
          const node = matchingNodes[0];
          const [fillColor, borderColor] = this.chartColors.getColorsForNode(
            node.attributes.nodeSpecificAttributes?.editStatus,
            node.attributes.auditRequired ?? ''
          );
          style['background-color'] = fillColor;
          style['padding'] = '2px';
          style['border-style'] = 'solid';
          style['border-width'] = '1px';
          style['border-color'] = borderColor;
        }
        this.treeViewNodeStyles[data.id] = style;
      }
      return this.treeViewNodeStyles[data.id];
    }
    return style;
  }

  private updatePatientChartTreeView(patientChartTreeSnapshot: any) {
    this.patientChartProjectionTree = [];
    if (this.previousVisitsNode) {
      this.patientChartProjectionTree.push(
        this.patienChartService.getPatientChartTreeProjection(
          this.previousVisitsNode,
          this.isAdmissionSignedOff,
          true
        )
      );
    }
    this.patientChartRootNode = this.updateHpiName(this.patientChartRootNode);
    if (this.patientChartRootNode) {
      this.patientChartProjectionTree.push(
        this.patienChartService.getPatientChartTreeProjection(
          this.patientChartRootNode,
          this.isAdmissionSignedOff,
          false
        )
      );
    }
    this.restoreTreeState(this.patientChartProjectionTree, patientChartTreeSnapshot);
    this.patientChartTreeViewSaved = true;
    this.tryInitAudit();
  }

  private restoreTreeState(tree: any, treeSnapshot: any[]) {
    for (let i = 0; i < tree.length; i++) {
      const treeSnapshotItem = treeSnapshot[i];
      tree[i].expanded = treeSnapshotItem ? treeSnapshotItem.expanded : false;

      const treeItems = tree[i].items;
      if (treeItems && treeItems.length && treeSnapshotItem && treeSnapshotItem.items) {
        this.restoreTreeState(tree[i].items, treeSnapshot[i].items);
      }
    }
  }

  private setPatientChartHeaderData(): void {
    const admissionId = this.admission?.id;
    const dateOfService = this.appointment?.startDate;
    if (admissionId && this.admission?.patientId) {
      this.patientChartHeaderData = new PatientChartHeaderData(
        this.admission.patientId,
        admissionId,
        dateOfService
      );
    }
  }

  private setPatientChartDocumentNodesAndIds() {
    if (!this.patientChartRootNode) return;

    const patientChartDocumentNodes = this.patientChartNodeManagementService.getNodes(
      this.patientChartRootNode,
      (patientChartNode: PatientChartNode) =>
        patientChartNode.type === PatientChartNodeType.DocumentNode
    );

    if (!patientChartDocumentNodes.length) return;

    this.patientChartDocumentNodeIds = patientChartDocumentNodes.map(
      patientChartNode => patientChartNode.id
    );

    for (let i = 0; i < patientChartDocumentNodes.length; i++) {
      const patientChartDocumentNode = patientChartDocumentNodes[i];

      const patientChartDocumentNodeLookup = new LookupModel();
      patientChartDocumentNodeLookup.id = patientChartDocumentNode.id;
      patientChartDocumentNodeLookup.name = patientChartDocumentNode.title;
      this.documentNodes.push(patientChartDocumentNodeLookup);
    }

    if (this.patientChartRootNode?.children) {
      const getDischargeInstructions =
        this.patientChartRootNode.children[0].children?.find(
          x => x.name === 'dischargeInstructions'
        );
      if (getDischargeInstructions?.children) {
        let i = 0;
        while (i < getDischargeInstructions.children.length) {
          const getDischargeInstructionsName = getDischargeInstructions.children[i].name;
          const result = this.dischargeInstructionsList.find(obj => {
            return obj === getDischargeInstructionsName;
          });
          if (result === undefined) {
            this.dischargeInstructionsList.push(
              getDischargeInstructions.children[i].name
            );
            i++;
          } else {
            i++;
          }
        }
      }
    }
  }

  patientInfo: any = {};

  setPatientInfo($event: any) {
    this.patientInfo = $event;
  }

  updateAppointmentStatus() {
    if (this.admission)
      this.admission.admissionData = JSON.stringify(this.patientChartRootNode);

    // Send Email for Discharge Instructions
    let dischargeContent = '';
    if (this.statusForm.appointmentStatus === 'Discharged') {
      this.parsedData = JSON.parse(this.savedVersionOfAdmissionData || 'null');

      this.parsedData.children.forEach((element: any) => {
        if (element.name === 'historyAndPhysical') {
          element.children.forEach((innerElement: any) => {
            if (innerElement.name.match('discharge')) {
              dischargeContent = innerElement.children[0].value.detailedTemplateHtml;
            }
          });
        }
      });

      if (dischargeContent === '' && this.statusForm.sendEmail) {
        this.alertService.warning(
          'Content for Discharge Instructions has not been provided. Please update that in order to send Email'
        );
        return;
      }
    } else {
      this.statusForm.sendEmail = false;
    }
    if (this.statusForm.sendEmail) {
      if (this.patientInfo.email === null) {
        this.alertService.warning(
          'Email will not be sent as patient email is unavailable!'
        );
        return;
      }
    }

    const appointmentId = this.appointment?.id;
    if (!appointmentId) return;

    const apiUrl = `appointment/status?email=${this.patientInfo.email}`;
    const data: AppointmentStatus = {
      id: appointmentId,
      status: this.statusForm.appointmentStatus,
      notes: this.statusForm.appointmentStatus,
      emailContent: dischargeContent,
      sendEmail: this.statusForm.sendEmail,
      createdBy: '',
    };
    this.repositoryService.update(apiUrl, data).subscribe({
      next: res => {
        if (res) {
          this.isStatusPopupVisible = false;
          notify('Appointment status updated successfully');
          this.subscribeToRouteParamsChanges();
        }
      },
      error: error => {
        this.errorHandler.handleError(error);
      },
    });
  }

  editNode(e: any, data: any) {
    e.preventDefault();
    e.stopPropagation();
    const selectedPreviousVisitsChartNode =
      this.patientChartNodeManagementService.getById(data.id, this.previousVisitsNode);

    const appointmentId = selectedPreviousVisitsChartNode?.value.chartId;
    if (appointmentId) {
      this.appointmentService
        .getById(appointmentId)
        .then(appointment => {
          this.admissionService.getById(appointment.admissionId).then(admission => {
            if (!admission?.admissionData || !this.patientChartRootNode) return;

            const patientNwChartRootNode = JSON.parse(admission.admissionData);
            if (!this.patientChartRootNode.children) {
              this.patientChartRootNode.children = [...patientNwChartRootNode.children];
            } else {
              this.patientChartRootNode.children.push(...patientNwChartRootNode.children);
            }
            this.refreshPatientChart(this.isAdmissionSignedOff);
          });
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  togglePatientAdmissionInfoView() {
    this.showPatientAdmissionInfo = !this.showPatientAdmissionInfo;
  }

  private getPatientChartisActive(params: string) {
    if (patientChartTree.length != undefined) {
      const found = patientChartTree[0].map((obj: { items: any }) => obj.items);
      switch (params) {
        case 'historyAndPhysical':
          if (patientChartTree[0][0].isActive == false) {
            if (this.patientChartRootNode?.children) {
              this.patientChartRootNode.children[0].attributes.isActive = false;
            }
          } else {
            for (let i = 0; i < found[0].length; i++) {
              if (found[0][i].isActive == false) {
                if (this.patientChartRootNode?.children) {
                  const templateChart =
                    this.patientChartRootNode.children[0].children?.find(
                      x => x.title === found[0][i].text
                    );
                  if (templateChart) templateChart.attributes.isActive = false;
                }
              } else {
                if (found[0][i].items.length != 0) {
                  for (let j = 0; j < found[0][i].items.length; j++) {
                    if (found[0][i].items[j].isActive == false) {
                      if (this.patientChartRootNode?.children) {
                        const templateChart =
                          this.patientChartRootNode.children[0].children
                            ?.find(x => x.title === found[0][i].text)
                            ?.children?.find(x => x.title === found[0][i].items[j].text);
                        if (templateChart) templateChart.attributes.isActive = false;
                      }
                    }
                  }
                }
              }
            }
          }
          break;
        case 'progressNote':
          if (patientChartTree[0][1].isActive == false) {
            if (this.patientChartRootNode?.children) {
              this.patientChartRootNode.children[0].attributes.isActive = false;
            }
          } else {
            for (let i = 0; i < found[1].length; i++) {
              if (found[1][i].isActive == false) {
                if (this.patientChartRootNode?.children) {
                  const templateChart =
                    this.patientChartRootNode.children[0].children?.find(
                      x => x.title === found[0][i].text
                    );
                  if (templateChart) templateChart.attributes.isActive = false;
                }
              } else {
                if (found[1][i].items.length != 0) {
                  for (let j = 0; j < found[1][i].items.length; j++) {
                    if (found[1][i].items[j].isActive == false) {
                      if (this.patientChartRootNode?.children) {
                        const templateChart =
                          this.patientChartRootNode.children[0].children
                            ?.find(x => x.title === found[0][i].text)
                            ?.children?.find(x => x.title === found[0][i].items[j].text);
                        if (templateChart) templateChart.attributes.isActive = false;
                      }
                    }
                  }
                }
              }
            }
          }
          break;
        case 'telehealthProgressNote':
          if (patientChartTree[0][2].isActive == false) {
            if (this.patientChartRootNode?.children) {
              this.patientChartRootNode.children[0].attributes.isActive = false;
            }
          } else {
            for (let i = 0; i < found[2].length; i++) {
              if (found[2][i].isActive == false) {
                if (this.patientChartRootNode?.children) {
                  const templateChart =
                    this.patientChartRootNode.children[0].children?.find(
                      x => x.title === found[0][i].text
                    );
                  if (templateChart) templateChart.attributes.isActive = false;
                }
              } else {
                if (found[2][i].items.length != 0) {
                  for (let j = 0; j < found[2][i].items.length; j++) {
                    if (found[2][i].items[j].isActive == false) {
                      if (this.patientChartRootNode?.children) {
                        const templateChart =
                          this.patientChartRootNode.children[0].children
                            ?.find(x => x.title === found[0][i].text)
                            ?.children?.find(x => x.title === found[0][i].items[j].text);
                        if (templateChart) templateChart.attributes.isActive = false;
                      }
                    }
                  }
                }
              }
            }
          }
          break;
        case 'patientCallNote':
          if (patientChartTree[0][3].isActive == false) {
            if (this.patientChartRootNode?.children) {
              this.patientChartRootNode.children[0].attributes.isActive = false;
            }
          } else {
            for (let i = 0; i < found[3].length; i++) {
              if (found[3][i].isActive == false) {
                if (this.patientChartRootNode?.children) {
                  const templateChart =
                    this.patientChartRootNode.children[0].children?.find(
                      x => x.title === found[0][i].text
                    );
                  if (templateChart) templateChart.attributes.isActive = false;
                }
              } else {
                if (found[3][i].items.length != 0) {
                  for (let j = 0; j < found[3][i].items.length; j++) {
                    if (found[3][i].items[j].isActive == false) {
                      if (this.patientChartRootNode?.children) {
                        const templateChart =
                          this.patientChartRootNode.children[0].children
                            ?.find(x => x.title === found[0][i].text)
                            ?.children?.find(x => x.title === found[0][i].items[j].text);
                        if (templateChart) templateChart.attributes.isActive = false;
                      }
                    }
                  }
                }
              }
            }
          }
          break;
      }
    }
  }
}
