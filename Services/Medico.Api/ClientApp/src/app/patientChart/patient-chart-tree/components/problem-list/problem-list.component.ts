import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { Assessment } from 'src/app/patientChart/models/assessment';
import { AlertService } from 'src/app/_services/alert.service';
import { PatientChartTrackService } from 'src/app/_services/patient-chart-track.service';
import { IcdCodeService } from 'src/app/_services/icd-code.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { BaseHistoryComponent } from '../patient-history/base-history.component';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../phrase-suggestion-helper/phrase-suggestion-helper.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../../_services/appointment.service';
import { AppointmentGridItem } from 'src/app/scheduler/models/appointmentGridItem';

type Status = {
  id: string;
  name: string;
};

@Component({
  selector: 'problem-list',
  templateUrl: './problem-list.component.html',
})
export class ProblemListComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('assessmentsGrid', { static: false })
  assessmentsGrid!: DxDataGridComponent;
  @ViewChild('assessmentForm', { static: false })
  assessmentForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  @Input() patientChartNode?: PatientChartNode;
  @Input() patientChartDocumentNode?: PatientChartNode;

  @Input() appointmentId: any;
  @Input() admissionId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  private _orderService?: OrderService;
  private _assessmentCurrentOrderNumber?: number;

  isNewAssessment = true;

  orderNumberMaxAvailableValue?: number;
  orderNumberMinAvailableValue?: number;

  availableOrderNumbers: Array<number> = [];
  selectedAssessments: Array<any> = [];

  assessments: Array<any> = [];
  problemList: Array<any> = [];
  assessment: any;

  icdCodesDataSource: any = {};
  phrasesDataSource: any = {};

  toEmitIcdCodes:any = {};

  isAssessmentPopupOpened = false;
  data = [];
  searchModeOption = 'contains';
  searchExprOption: any = 'Name';
  searchTimeoutOption = 200;
  minSearchLengthOption = 0;
  showDataBeforeSearchOption = false;
  icdCode: any;
  includeNotesInReport: Nullable<boolean> = true;
  notes = '';
  isPhrasesHelperVisible = false;
  statusList: Status[] = [
    { id: 'Current', name: 'Current' },
    { id: 'Resolved', name: 'Resolved' },
    { id: 'Discontinued', name: 'Discontinued' },
  ];
  subjectList = [];
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
  endDateEnabled = false;
  original: any[] = [];
  appointment?: AppointmentGridItem;

  constructor(
    public repositoryService: RepositoryService,
    private alertService: AlertService,
    private patientChartTrackService: PatientChartTrackService,
    private icdCodeService: IcdCodeService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    defaultValueService: DefaultValueService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appointmentService: AppointmentService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);
    //console.log(`asssid ${this.assessment.id}`);
  }

  ngOnInit() {
    this.appointmentId = this.activatedRoute.snapshot.params['appointmentId'] || '';

    this.appointmentService.getAppointmentGridItemById(this.appointmentId).then(value => {
      this.appointment = value;
    });

    this.init();
    if (this.patientChartNode) {
      this.assessments = this.patientChartNode.value.filter(
        (assessment: any) => assessment.status !== 'Current'
      );
      this.original = this.assessments;
    }
    this._orderService = new OrderService(this.assessments);
    this.assessment = new Assessment();
    this.assessment.startDate = new Date();
  }

  ngAfterViewInit(): void {}

  onDetailedContentChanged(content: string) {
    this.notes = content;
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  contentChanged(_$event: any) {}

  onKeyPressInOrderNumberBox($event: any) {
    const event = $event.event;
    const keyCode = event.keyCode;
    //order number text box supports only integer value,
    // this check prevent of entering dot symbol
    if (keyCode === 46 || keyCode === 44) event.preventDefault();
  }

  // onPhraseSuggestionApplied($event: any) {
  //     this.assessment.notes = $event;
  // }

  onAssessmentFieldChanged($event: any): void {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'icdCode' && fieldValue) {
      this.icdCodeService
        .getById(fieldValue)
        .then(icdCode => {
          this.assessment.diagnosis = icdCode.name;
          this.assessment.icdCode = '';
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    if (dataField === 'status' && fieldValue) {
      this.endDateEnabled = fieldValue === 'Resolved';
    }
  }

  onValueChanged(_$event: any) {}

  onAssessmentPopupHidden() {
    this.assessment = new Assessment();
    this.selectedAssessments = [];
    this.isNewAssessment = true;
  }

  openAssessmentForm() {
    this.assessment = new Assessment();
    this._assessmentCurrentOrderNumber = this._orderService?.maxOrderNumber;

    this.assessment.order = this._orderService?.maxOrderNumber;
    // this.assessment.startDate = this.p

    this.setMinMaxOrderNumberRange();
    this.isAssessmentPopupOpened = !this.isAssessmentPopupOpened;
  }

  closeAssessmentForm() {
    this.isAssessmentPopupOpened = false;
  }

  deleteAssessment(assessment: any, $event: any) {
    $event.stopPropagation();
    const assessmentId = assessment.id;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the assessment ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this._orderService?.adjustOrder(assessmentId, assessment.order, true);
        this.patientChartTrackService.emitPatientChartChanges(
          PatientChartNodeType.AssessmentNode
        );

        this.assessmentsGrid.instance.refresh();
      }
    });
  }

  onAssessmentSelected($event: any) {
    if (this.isSignedOff) {
      this.selectedAssessments = [];
      return;
    }

    const selectedAssessment = $event.selectedRowsData[0];
    if (!selectedAssessment) {
      return;
    }

    this.isNewAssessment = false;

    this.setMinMaxOrderNumberRange();

    this.assessment = JSON.parse(JSON.stringify(selectedAssessment));

    if (this.notesEditor) this.notesEditor.insertContent(this.assessment.notes);

    this.notes = this.assessment.notes;

    this._assessmentCurrentOrderNumber = this.assessment.order;

    this.isAssessmentPopupOpened = true;
  }

  createUpdateAssessment() {
    const validationResult = this.assessmentForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }
    const user = this.getUserDetails();

    // updated code
    this.assessment.notes = this.notesEditor.content;
    this.assessment.employee = user.fullName;

    if (this.isNewAssessment) {
      this.assessments.push(this.assessment);
    } else {
      const assessmentToUpdate = this.assessments.find(a => a.id === this.assessment.id);

      assessmentToUpdate.diagnosis = this.assessment.diagnosis;
      assessmentToUpdate.notes = this.assessment.notes;
      assessmentToUpdate.order = this.assessment.order;
      assessmentToUpdate.startDate = this.assessment.startDate;
      assessmentToUpdate.endDate = this.assessment.endDate;
      assessmentToUpdate.points = this.assessment.points;
      assessmentToUpdate.status = this.assessment.status;
    }

    if (!this._assessmentCurrentOrderNumber) return;

    this._orderService?.adjustOrder(
      this.assessment.id,
      this._assessmentCurrentOrderNumber
    );
    this.patientChartTrackService.emitAssessmentDataChanges(
      {
        nodeID: PatientChartNodeType.AssessmentNode,
        data: this.patientChartDocumentNode,
      },
      [this.assessment, this.toEmitIcdCodes]
    );

    this.isAssessmentPopupOpened = false;
    this.selectedAssessments = [];
    this.assessmentsGrid.instance.refresh();
  }

  private setMinMaxOrderNumberRange() {
    if (!this._orderService) return;

    this.orderNumberMinAvailableValue = 1;
    this.orderNumberMaxAvailableValue = this.isNewAssessment
      ? this._orderService.maxOrderNumber
      : this._orderService.maxOrderNumber - 1;
  }

  private init() {
    this.initIcdCodeDataSource();
  }

  onIcdCodeChanged($event: any) {
    const keyword = $event.value;
    const apiUrl = `icdcode/search?keyword=${keyword}`;

    this.repositoryService.getData(apiUrl).subscribe({
      next: data => {
        this.data = data;
      },
      error: _err => {},
    });
  }

  public searchIcdCodes() {
    const keyword = '';
    const apiUrl = `icdcode/search?keyword=${keyword}`;

    this.repositoryService.getData(apiUrl).subscribe({
      next: data => {
        this.data = data;
      },
      error: _err => {},
    });
  }

  public onPlGroupValueChanged($event: any) {
    const event = $event.event.key;
    const _keyCode = event.keyCode;
  }

  private initIcdCodeDataSource(): void {
    this.icdCodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('icdcode'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });

    this.icdCodesDataSource.store.load().then(
      (data: any) => {
        this.toEmitIcdCodes = data;
    });
  }

  onStatusChanged(event: any) {
    const status = event.value.id;
    console.log(status);
    this.assessments = this.original.filter(c => c.status == status);
  }
}

class OrderService {
  private _items;

  constructor(items: Array<any>) {
    this._items = items;
  }

  get maxOrderNumber(): number {
    return this._items.length + 1;
  }

  adjustOrder(changedItemId: string, previousOrderNumber: number, isDelete = false) {
    const changedItem = this._items.filter(i => i.id === changedItemId)[0];
    if (!changedItem) {
      throw `Item with id: ${changedItemId} was not found`;
    }

    if (isDelete) {
      const changedItemIndex = this._items.map(i => i.order).indexOf(changedItem.order);

      this._items.splice(changedItemIndex, 1);

      for (let i = changedItemIndex; i < this._items.length; i++) {
        this._items[i].order = this._items[i].order - 1;
      }
    }
    const isOrderChanged = changedItem.order !== previousOrderNumber;

    if (isOrderChanged) {
      const itemToModify = this._items.filter(
        i => i.order === changedItem.order && i.id !== changedItemId
      )[0];
      if (!itemToModify) {
        throw 'Item was not found';
      } else {
        itemToModify.order = previousOrderNumber;
      }
    }

    this._items.sort((item1, item2) => item1.order - item2.order);
  }
}
