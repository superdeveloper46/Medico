import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PatientAllegationsSet } from 'src/app/patientChart/models/patientAllegationsSet';
import { AlertService } from 'src/app/_services/alert.service';
import { PatientChartTrackService } from '../../../../../_services/patient-chart-track.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { ChiefComplaintManagementComponent } from '../chief-complaint-management/chief-complaint-management.component';
import { Template } from 'src/app/_models/template';
import { PredefinedTemplateTypeNames } from 'src/app/_classes/predefinedTemplateTypeNames';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeManagementService } from 'src/app/patientChart/services/patient-chart-node-management.service';
import { ArrayHelper } from 'src/app/_helpers/array.helper';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { TemplateNodeInfo } from 'src/app/patientChart/models/templateNodeInfo';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { TemplateService } from 'src/app/_services/template.service';
import { Assessment } from 'src/app/patientChart/models/assessment';
import { DxFormComponent } from 'devextreme-angular';
import { AllegationEditService } from 'src/app/_services/allegation-edit.service';
import { ChiefComplaintService } from 'src/app/_services/chief-complaint.service';

@Component({
  templateUrl: 'chief-complaint.component.html',
  selector: 'chief-complaint',
  styles: ['div.chief-complaint-allegations { cursor: pointer; }'],
})
export class ChiefComplaintComponent implements OnInit {
  @ViewChild('chiefComplaintManagementPopup', { static: false })
  chiefComplaintManagementPopup!: ChiefComplaintManagementComponent;

  @Input() patientChartNode!: PatientChartNode;
  @Input() patientChartDocumentNode!: PatientChartNode;
  @Input() appointmentId!: string;
  @Input() companyId!: string;
  @Input() isSignedOff!: boolean;

  @ViewChild('allegationEditForm', { static: false })
  allegationEditForm!: DxFormComponent;

  isAllegationsPopupOpened = false;

  appointmentAllegations: string[] = [];
  allegationEdit: any;
  selectedPatientAllegationsSets: any[] = [];
  allegationSet: PatientAllegationsSet = new PatientAllegationsSet();
  isNewPatientAllegationsSet = true;
  isPatientAllegationsFormVisible = false;

  keywordsSeparator = ' ; ';
  allowChiefComplaintItemDeleting = true;

  selectedChiefComplaintId = '';
  patientChiefComplaint: any;
  isAllegationsEditPopupOpened = false;
  allegationEditId?: string;
  isHpiNameUpdate = false;

  statusList = [
    { id: 'Current', name: 'Current' },
    { id: 'Resolved', name: 'Resolved' },
    { id: 'Discontinued', name: 'Discontinued' },
  ];

  pointsList = [
    {
      id: 'Self limited or minor (maximum of 2)',
      value: 'Self limited or minor (maximum of 2)',
    },
    {
      id: 'Established problem, stable or improving',
      value: 'Established problem, stable or improving',
    },
    {
      id: 'Established problem, worsening',
      value: 'Established problem, worsening',
    },
    {
      id: 'New problem, with no additional work-up planned (maximum of 1)',
      value: 'New problem, with no additional work-up planned (maximum of 1)',
    },
    {
      id: 'New problem, with additional work-up planned',
      value: 'New problem, with additional work-up planned',
    },
    {
      id: 'Disability Claimant',
      value: 'Disability Claimant',
    },
  ];

  constructor(
    private alertService: AlertService,
    private patientChartTrackService: PatientChartTrackService,
    private appointmentService: AppointmentService,
    private allegationEditService: AllegationEditService,
    private patientChartNodeManagementService: PatientChartNodeManagementService,
    private templateService: TemplateService
  ) {}

  get isPatientAllegationsSetsEmpty(): boolean {
    return this.patientChiefComplaint.patientAllegationsSets.length === 0;
  }

  onChiefComplaintAllegationsClick() {
    this.isAllegationsPopupOpened = true;
  }

  cancelPatientAllegationCreation() {
    this.isPatientAllegationsFormVisible = false;
    this.allegationSet = new PatientAllegationsSet();

    this.isNewPatientAllegationsSet = true;
  }

  savePatientAllegationSet() {
    if (!this.isNewPatientAllegationsSet) {
      this.emitPatientChartChangesAndResetAllegationsSet();
      return;
    }

    if (!this.allegationSet.allegations) {
      this.alertService.warning('Allegations are not specified');
      return;
    }

    this.allegationSet.changeAlligationName = this.isHpiNameUpdate;

    this.patientChiefComplaint.patientAllegationsSets.push(this.allegationSet);

    this.saveChiefComplaintTemplatesToPatientDataTree(
      this.allegationSet.hpiTemplates,
      this.allegationSet.rosTemplates,
      this.allegationSet.peTemplates
    ).then(() => {
      this.emitPatientChartChangesAndResetAllegationsSet();
    });
  }

  setAllegationIsTodayUpdateFlag(val: boolean) {
    this.allegationSet.isToday = val;
  }

  setHpiUpdateFlag(val: boolean) {
    this.isHpiNameUpdate = val;
  }

  addTemplates($event: any) {
    const hpiTemplates = $event.hpi;
    const peTemplates = $event.pe;
    const rosTemplates = $event.ros;

    if (hpiTemplates.length) {
      this.allegationSet.hpiTemplates = hpiTemplates;
    }

    if (peTemplates.length) {
      this.allegationSet.peTemplates = peTemplates;
    }

    if (rosTemplates.length) {
      this.allegationSet.rosTemplates = rosTemplates;
    }
  }

  addAllegationSet() {
    this.isPatientAllegationsFormVisible = true;
  }

  onPatientAllegationSetSelected($event: any) {
    if (this.isSignedOff) {
      this.selectedPatientAllegationsSets = [];
      return;
    }

    const patientAllegationsSet = $event.selectedRowsData[0];
    if (!patientAllegationsSet || !patientAllegationsSet.Id) {
      return;
    }

    const patientAllegationsSetId = patientAllegationsSet.Id;

    const selectedPatientAllegationsSet =
      this.patientChiefComplaint.patientAllegationsSets.filter(
        (s: any) => s.Id === patientAllegationsSetId
      )[0];

    if (selectedPatientAllegationsSet) {
      this.allegationSet = selectedPatientAllegationsSet;
      this.isNewPatientAllegationsSet = false;
      this.selectedPatientAllegationsSets = [];

      this.isPatientAllegationsFormVisible = true;
    }
  }

  ngOnInit() {
    console.log('this.patientChartNode >> chief complainment ', this.patientChartNode);
    this.patientChiefComplaint = this.patientChartNode.value;

    if (!this.patientChiefComplaint.patientAllegationsSets) {
      this.patientChiefComplaint.patientAllegationsSets = [];
    }

    this.appointmentService.getById(this.appointmentId).then(appointment => {
      const allegations = appointment.allegations;
      if (allegations) {
        this.appointmentAllegations = allegations.split(', ');
      }
    });
  }

  onNewAllegationsAdded(newAllegations: string) {
    this.allegationSet.allegations = newAllegations;
    this.isAllegationsPopupOpened = false;
  }

  copyToAssessment($event: any, allegationsData: any) {
    $event.stopPropagation();
    
    const assesmentSectionNodes: PatientChartNode[] =
      this.patientChartNodeManagementService.getNodes(
        this.patientChartDocumentNode,
        (node: PatientChartNode) => node.type === PatientChartNodeType.AssessmentNode
      );

    if (!assesmentSectionNodes || !assesmentSectionNodes.length) {
      this.alertService.warning('Unable to find "Assessment" patient chart node');
      return;
    }

    for (let i = 0; i < assesmentSectionNodes.length; i++) {
      const assesmentSection = assesmentSectionNodes[i];
      const assesments = assesmentSection.value;

      const newAssesment = new Assessment();
      newAssesment.order = assesments.length + 1;
      newAssesment.diagnosis = allegationsData.allegations;
      newAssesment.points = allegationsData.points;
      newAssesment.status = allegationsData.status;

      assesments.push(newAssesment);
    }
    this.patientChartTrackService.emitPatientChartChanges(
      PatientChartNodeType.AssessmentNode
    );

    this.alertService.info('Allegations were added to "Assessment" patient chart node');
  }

  deletePatientAllegationsSet($event: any, allegationSetId: string) {
    $event.stopPropagation();

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete chief complaints ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        let patientAllegationsSetToDelete;
        let patientAllegationsSetIndexToDelete;

        for (
          let i = 0;
          i < this.patientChiefComplaint.patientAllegationsSets.length;
          i++
        ) {
          const patientAllegationsSet =
            this.patientChiefComplaint.patientAllegationsSets[i];

          if (patientAllegationsSet.id === allegationSetId) {
            patientAllegationsSetToDelete = patientAllegationsSet;
            patientAllegationsSetIndexToDelete = i;
          }
        }

        if (patientAllegationsSetToDelete.hpiTemplates.length) {
          this.deleteTemplatesFromPatientChart(
            PredefinedTemplateTypeNames.hpi,
            patientAllegationsSetToDelete.hpiTemplates
          );
        }

        if (patientAllegationsSetToDelete.rosTemplates.length) {
          this.deleteTemplatesFromPatientChart(
            PredefinedTemplateTypeNames.ros,
            patientAllegationsSetToDelete.rosTemplates
          );
        }

        if (patientAllegationsSetToDelete.peTemplates.length) {
          this.deleteTemplatesFromPatientChart(
            PredefinedTemplateTypeNames.physicalExam,
            patientAllegationsSetToDelete.peTemplates
          );
        }

        this.patientChiefComplaint.patientAllegationsSets.splice(
          patientAllegationsSetIndexToDelete,
          1
        );
        this.patientChartTrackService.emitPatientChartChanges(
          PatientChartNodeType.ChiefComplaintNode
        );
      }
    });
  }

  editPatientAllegationsSet(_$event: any, allegationSetId: string) {
    this.allegationEdit = this.patientChiefComplaint.patientAllegationsSets.filter(
      (a: any) => a.id == allegationSetId
    );
    // console.log(this.allegationEdit[0]);
    this.allegationEditId = allegationSetId;
    this.isAllegationsEditPopupOpened = true;
  }

  updatePatientAllegationSet() {
    this.isAllegationsEditPopupOpened = false;
    if (!this.isNewPatientAllegationsSet) {
      this.emitPatientChartChangesAndResetAllegationsSet();
      return;
    }

    if (!this.allegationEdit[0].allegations) {
      this.alertService.warning('Allegations are not specified');
      return;
    }
    //this.allegationEdit = this.patientChartNode.value.patientAllegationsSets.filter(x => x.id==this.allegationEditId)

    //this.patientChiefComplaint.patientAllegationsSets.push(this.allegationEdit[0]);

    this.saveChiefComplaintTemplatesToPatientDataTree(
      this.allegationEdit[0].hpiTemplates,
      this.allegationEdit[0].rosTemplates,
      this.allegationEdit[0].peTemplates
    ).then(() => {
      this.emitPatientChartChangesAndResetAllegationsSet();
    });
  }

  showAllegationsRelatedChiefComplaints() {
    if (!this.allegationSet.allegations) {
      this.alertService.warning('Allegations are not specified');
      return;
    }

    this.chiefComplaintManagementPopup.show();
  }

  private saveChiefComplaintTemplatesToPatientDataTree(
    hpiTemplates: any[],
    rosTemplates: any[],
    peTemplates: any[]
  ): Promise<void[]> {
    const addTemplatesPromises: Promise<void>[] = [];

    if (hpiTemplates.length) {
      const addHpiTemplatesPromise = this.addTemplatesToPatientСhartIfNeeded(
        PredefinedTemplateTypeNames.hpi,
        hpiTemplates
      );

      addTemplatesPromises.push(addHpiTemplatesPromise);
    }

    if (rosTemplates.length) {
      const addRosTemplatesPromise = this.addTemplatesToPatientСhartIfNeeded(
        PredefinedTemplateTypeNames.ros,
        rosTemplates
      );

      addTemplatesPromises.push(addRosTemplatesPromise);
    }

    if (peTemplates.length) {
      const addPeTemplatesPromise = this.addTemplatesToPatientСhartIfNeeded(
        PredefinedTemplateTypeNames.physicalExam,
        peTemplates
      );

      addTemplatesPromises.push(addPeTemplatesPromise);
    }

    this.allegationEditService.toEmitChiefComplaintSave(this.patientChartNode.id);
    return Promise.all(addTemplatesPromises);
  }

  private deleteTemplatesFromPatientChart(
    templateTypeName: string,
    templatesByType: Array<any>
  ) {
    const patientChartTemplateListNode = this.patientChartNodeManagementService.getByName(
      templateTypeName,
      this.patientChartDocumentNode
    );

    if (!patientChartTemplateListNode) return;

    const templateIds = templatesByType.map(t => t.id);

    const templateSectionIds = patientChartTemplateListNode.value
      .filter((ts: any) => templateIds.indexOf(ts.id) !== -1)
      .map((ts: any) => ts.sectionId);

    const patientChartTemplateListNodeValue = patientChartTemplateListNode.value;

    const patientChartTemplateListNodeChildren = patientChartTemplateListNode.children;
    if (!patientChartTemplateListNodeChildren) return;

    const templateItemIndexesToDelete = ArrayHelper.indexesOf(
      patientChartTemplateListNodeValue,
      'id',
      templateIds
    );

    const templateSectionIndexesToDelete = ArrayHelper.indexesOf(
      patientChartTemplateListNodeChildren,
      'id',
      templateSectionIds
    );

    ArrayHelper.deleteByIndexes(
      patientChartTemplateListNodeValue,
      templateItemIndexesToDelete
    );
    ArrayHelper.deleteByIndexes(
      patientChartTemplateListNodeChildren,
      templateSectionIndexesToDelete
    );

    this.adjustOrder(
      patientChartTemplateListNodeValue,
      patientChartTemplateListNodeChildren
    );
  }

  private addTemplatesToPatientСhartIfNeeded(
    templateTypeName: string,
    templatesByType: Template[]
  ): Promise<void> {
    const patientChartTemplateListNode = this.patientChartNodeManagementService.getByName(
      templateTypeName,
      this.patientChartDocumentNode
    );

    if (!patientChartTemplateListNode) return Promise.reject();

    //patientChartTemplateListNodeValue contains the list of added templates
    const patientChartTemplateListNodeValue: any[] = patientChartTemplateListNode.value;

    const getTemplatesPromises: Promise<Template>[] = [];

    for (let i = 0; i < templatesByType.length; i++) {
      const newlyAddedTemplate = templatesByType[i];
      const isTemplateAlreadyAdded = !!patientChartTemplateListNodeValue.find(
        t => t.id === newlyAddedTemplate.id
      );

      if (isTemplateAlreadyAdded) continue;

      const getTemplatePromise = this.templateService.getById(newlyAddedTemplate.id);

      getTemplatesPromises.push(getTemplatePromise);
    }

    if (!getTemplatesPromises.length) return Promise.resolve();

    return Promise.all(getTemplatesPromises).then(templates => {
      for (let i = 0; i < templates.length; i++) {
        const newlyAddedTemplate = templatesByType[i];
        const template = templates[i];
        const newlyCreatedNodeId = GuidHelper.generateNewGuid();

        const templateNodeInfo = new TemplateNodeInfo(
          newlyAddedTemplate.id,
          newlyAddedTemplate.templateOrder as number,
          newlyAddedTemplate.reportTitle,
          newlyCreatedNodeId
        );

        patientChartTemplateListNodeValue.push(templateNodeInfo);

        const templateNode = PatientChartNode.createPatientChartTemplateNode(
          newlyCreatedNodeId,
          patientChartTemplateListNode.id,
          template,
          templateTypeName
        );

        if (!patientChartTemplateListNode.children)
          patientChartTemplateListNode.children = [];

        patientChartTemplateListNode.children.push(templateNode);

        this.adjustOrder(
          patientChartTemplateListNodeValue,
          patientChartTemplateListNode.children
        );

        const dependentTemplates = template.dependentTemplates;
        const isDependentTemplatesDeletionNeeded =
          dependentTemplates &&
          dependentTemplates.length &&
          patientChartTemplateListNodeValue.length > 1;

        if (isDependentTemplatesDeletionNeeded)
          this.templateService.removeDependentTemplates(
            dependentTemplates,
            patientChartTemplateListNode.children,
            patientChartTemplateListNodeValue
          );
      }
    });
  }

  private adjustOrder(sectionTemplates: Array<any>, sectionChildrens: Array<any>) {
    this.adjustSectionTemplatesOrder(sectionTemplates);
    this.adjustSectionChildrenOrder(sectionChildrens);
  }

  private adjustSectionTemplatesOrder(sectionTemplates: Array<any>) {
    sectionTemplates.sort((t1, t2) => t1.order - t2.order);
  }

  private adjustSectionChildrenOrder(sectionChildren: Array<any>) {
    sectionChildren.sort((s1, s2) => s1.attributes.order - s2.attributes.order);
  }

  private emitPatientChartChangesAndResetAllegationsSet() {
    this.patientChartTrackService.emitPatientChartChanges(
      PatientChartNodeType.ChiefComplaintNode
    );
    this.allegationEditService.toEmitChiefComplaintSave(this.patientChartNode.id);

    this.isPatientAllegationsFormVisible = false;
    this.allegationSet = new PatientAllegationsSet();
    this.isNewPatientAllegationsSet = true;
  }
}
