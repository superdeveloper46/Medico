import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxFormComponent } from 'devextreme-angular';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { AlertService } from 'src/app/_services/alert.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { PatientService } from 'src/app/_services/patient.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { BaseHistoryComponent } from '../../patient-chart-tree/components/patient-history/base-history.component';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { DateHelper } from 'src/app/_helpers/date.helper';

@Component({
  selector: 'app-patient-notes',
  templateUrl: './patient-notes.component.html',
  styleUrls: ['./patient-notes.component.sass'],
})
export class PatientNotesComponent extends BaseHistoryComponent implements OnInit {
  @ViewChild('patientNotesDataGrid', { static: false })
  patientNotesDataGrid!: DxDataGridComponent;
  @ViewChild('patientNoteForm', { static: false })
  patientNoteForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;

  @Input() isSignedOff!: boolean;
  @Input() patientId?: string;
  @Input() companyId!: string;
  @Input() appointmentId?: string;

  isPatientNotesPopupOpened = false;
  canRenderComponent = false;
  loading = false;
  patientNotes: any = {};
  patientNotesDataSource = [];
  userDataSource: any = {};
  employeeData: any = {};
  docData: any[] = [];
  statusData: any[] = [];
  includeNotesInReport: Nullable<boolean> = false;
  employeeList: any;
  subjectBoxEditorOptions: any;
  _filteredRows = [];
  patientSearchtNotes: any = {};
  id: any;
  isAdd = true;
  isEdit = false;
  userId: any;
  selectedPatientNotes: any;
  reminderDate: string | number | Date = new Date();
  showMessageCheck = false;

  constructor(
    private patientService: PatientService,
    private repository: RepositoryService,
    private alertService: AlertService,
    private selectableListService: SelectableListService,
    defaultValueService: DefaultValueService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);
  }

  ngOnInit() {
    this.subjectBoxEditorOptions = {
      items: this.docData,
      searchEnabled: true,
      value: '',
      displayExpr: 'value',
      valueExpr: 'value',
      onValueChanged: this.subjectMethod.bind(this),
    };

    // this.patientSearchtNotes.fromDate = DateHelper.getDate(new Date());
    // this.patientSearchtNotes.toDate = DateHelper.getDate(new Date());

    this.getPatientNotes();
    this.initSelectableLists();
    this.bindDoc();
    this.bindStatus();
    this.bindEmployees();
  }

  subjectMethod(_e: any): void {}

  onDetailedContentChanged(content: string) {
    this.patientNotes.notes = content;
  }

  openPatientNoteForm() {
    this.patientNotes = {};
    this.isAdd = true;
    this.isEdit = false;
    this.isPatientNotesPopupOpened = !this.isPatientNotesPopupOpened;
  }

  closePatientNoteForm() {
    this.isPatientNotesPopupOpened = false;
  }

  createNotes() {
    const validationResult = this.patientNoteForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (this.notesEditor.content === '') {
      this.alertService.warning('Please enter Notes');
      return;
    }

    this.loading = true;
    const apiUrl = `patients/notes`;

    const user = this.getUserDetails();

    this.patientNotes.notes = this.notesEditor.content;
    this.patientNotes.id = this.patientId;
    this.patientNotes.createdByName = user.fullName;
    this.patientNotes.userIds = this.userId;
    this.patientNotes.reminderDate = this.reminderDate;
    this.patientNotes.link = `/patient-chart/${this.appointmentId}`;

    this.repository.create(apiUrl, this.patientNotes).subscribe({
      next: _res => {
        this.loading = false;
        this.getPatientNotes();
        this.isPatientNotesPopupOpened = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  bindDoc() {
    this.loading = true;
    const apiUrl = `selectable-lists/docs`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.docData = JSON.parse(res.data[0].jsonValues);
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  bindStatus() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageStatusList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.statusData = JSON.parse(res.data[0].jsonValues);
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  bindEmployees() {
    this.loading = true;
    const apiUrl = `user/medico-staff?companyId=${this.companyId}`;
    this.repository.getData(apiUrl).subscribe({
      next: data => {
        this.employeeList = data;
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  getNotes(id: string) {
    this.isAdd = false;
    this.isEdit = true;
    this.id = id;
    this.isPatientNotesPopupOpened = !this.isPatientNotesPopupOpened;
    this.loading = true;
    const apiUrl = `patients/notesById/${id}`;
    this.repository.getData(apiUrl).subscribe({
      next: data => {
        this.patientNotes = data;
        this.notesEditor.insertContent(this.patientNotes.notes);
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  EditNotes() {
    if (this.notesEditor.content === '') {
      this.alertService.warning('Please enter Notes');
      return;
    }

    this.loading = true;
    const apiUrl = `patients/notes/${this.id}`;

    this.patientNotes.notes = this.notesEditor.content;

    this.repository.update(apiUrl, this.patientNotes).subscribe({
      next: _res => {
        this.loading = false;
        this.getPatientNotes();
        this.isPatientNotesPopupOpened = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  deleteNotes(id: string) {
    const result = confirm('Are you sure you want to delete this record?');
    if (result) {
      this.loading = true;
      const apiUrl = `patients/patient-notes-delete/${id}`;

      this.repository.delete(apiUrl).subscribe({
        next: _res => {
          this.loading = false;
          this.getPatientNotes();
          this.isPatientNotesPopupOpened = false;
        },
        error: _error => {
          this.alertService.error('Error');
          this.loading = false;
        },
      });
    }
  }

  get patientNotesStatusListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.patienSearchtNotes.patientNotesStatus
    );
  }

  private initSelectableLists() {
    const patientNotesStatusListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.patienSearchtNotes.patientNotesStatus,
      LibrarySelectableListIds.patienSearchtNotes.patientNotesStatus
    );

    const selectableLists = [patientNotesStatusListConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  getPatientNotes() {
    let fromDate = '';
    let toDate = '';
    const subject = this.patientSearchtNotes.subject || '';
    const status = this.patientSearchtNotes.status || '';
    const employee = this.patientSearchtNotes.employee || '';
    const searchContent = this.patientSearchtNotes.searchContent || '';

    if (this.patientSearchtNotes.fromDate && this.patientSearchtNotes.toDate) {
      fromDate = DateHelper.getDate(this.patientSearchtNotes.fromDate);
      toDate = DateHelper.getDate(this.patientSearchtNotes.toDate);
    }

    if (!this.patientId) return;
    this.patientService
      .getPatientNotes(
        this.patientId,
        fromDate,
        toDate,
        subject,
        status,
        employee,
        searchContent
      )
      .then(notes => {
        this.patientNotesDataSource = notes;
        this._filteredRows = notes;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onSearchFormChanged(_$event: any) {
    // this._filteredRows = [];
    // var dataField = $event.dataField;
    // var dataValue = $event.value;
    // switch (dataField) {
    //   case 'date':
    //     var date = DateHelper.getDate(dataValue);
    //     this._filteredRows = this.patientNotesDataSource.filter(c => DateHelper.getDate(c.createdOn) === date);
    //     this.refreshGrid();
    //     break;
    //   case 'subject':
    //     this._filteredRows = this.patientNotesDataSource.filter(c => c.subject === dataValue);
    //     this.refreshGrid();
    //     break;
    //   case 'status':
    //     this._filteredRows = this.patientNotesDataSource.filter(c => c.status === dataValue);
    //     this.refreshGrid();
    //     break;
    //   case 'employee':
    //     this._filteredRows = this.patientNotesDataSource.filter(c => c.createdBy === dataValue);
    //     this.refreshGrid();
    //     break;
    //   default:
    //     this._filteredRows = this.patientNotesDataSource;
    // }
  }

  searchNotes(_$event: any) {
    this.getPatientNotes();
  }

  refreshGrid() {
    if (this.patientNotesDataGrid && this.patientNotesDataGrid.instance)
      this.patientNotesDataGrid.instance.refresh();
  }

  resetFilters() {
    this.patientSearchtNotes = {};
    this.getPatientNotes();
    //this._filteredRows = this.patientNotesDataSource;
    this.refreshGrid();
  }

  showInfo() {
    this.showMessageCheck = true;
  }

  checkBoxChecked() {
    this.includeNotesInReport = true;
    this.showMessageCheck = false;
  }

  closePopup() {
    this.includeNotesInReport = false;
    this.showMessageCheck = false;
  }
}
