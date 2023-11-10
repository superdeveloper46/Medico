import { Component, OnInit, ViewChild, OnDestroy, NgModule } from '@angular/core';
import { AppConfiguration } from 'src/app/_classes/appConfiguration';
import { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { AppointmentsFilter } from '../../models/appointmentsFilter';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { AppointmentService } from '../../../_services/appointment.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { AlertService } from 'src/app/_services/alert.service';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { PhraseSelectionFormComponent } from 'src/app/share/components/phrase-selection-form/phrase-selection-form.component';
import { AdmissionService } from 'src/app/patientChart/services/admission.service';
import { AppointmentAlertAervice } from '../../services/appointment-alert.service';
import { AppointmentPatientUpdateUserActions } from 'src/app/_models/AppointmentPatientUpdateUserActions';
import { Appointment } from 'src/app/_models/appointment';
import { SchedulerView } from '../../models/schedulerView';
import { SchedulerViewNames, SchedulerViews } from '../../constants/schedulerViews';
import { AppointmentGridItem } from '../../models/appointmentGridItem';
import { AppointmentsFilterComponent } from '../appointments-filter/appointments-filter.component';
import { LookupModel } from 'src/app/_models/lookupModel';
import DataSource from 'devextreme/data/data_source';
import { ConfigService } from 'src/app/_services/config.service';
import ArrayStore from 'devextreme/data/array_store';
import { AppointmentStatusColorManagementService } from 'src/app/administration/components/appointment-status-color-management/appointment-status-color-management.service';
import { LibrarySelectableListService } from 'src/app/administration/services/library/library-selectable-list.service';
import { LibrarySelectableListTitles } from 'src/app/_classes/librarySelectableListTitles';

@Component({
  selector: 'appointment-scheduler',
  templateUrl: './appointment-scheduler.component.html',
  styleUrls: ['./appointment-scheduler.component.scss'],
})
export class AppointmentSchedulerComponent implements OnInit, OnDestroy {
  @ViewChild('appointmentScheduler', { static: false })
  appointmentScheduler!: DxSchedulerComponent;
  @ViewChild('appointmentsGrid', { static: false })
  appointmentsGrid!: DxDataGridComponent;
  @ViewChild('phraseSelectionForm', { static: false })
  phraseSelectionForm!: PhraseSelectionFormComponent;
  @ViewChild('appointmentsFilter', { static: false })
  appointmentsFilter!: AppointmentsFilterComponent;

  isAppointmentCreationFormOpened = false;
  areSelectableListsInitialized = false;

  currentOpenedAppointmentForm: any = null;

  companyId: string = '';
  companyIdSubscription: Nullable<Subscription>;

  allegationsString: string = '';

  selectedLocationId: string = GuidHelper.emptyGuid;

  appConfiguration: AppConfiguration = new AppConfiguration();
  searchConfiguration: SearchConfiguration = new SearchConfiguration();

  isManageAllegationsPopupVisible = false;

  startDate: any;
  endDate: any;

  filter: AppointmentsFilter = new AppointmentsFilter();

  isAdmissionPopupVisible = false;
  patientPreviousAdmissions: Array<any> = [];

  locationDataSource: any = {};
  patientDataSource: any = {};
  physianDataSource: any = {};
  providerDataSource: any = {};
  nurseDataSource: any = {};
  maDataSource: any = {};
  roomDataSource: any = {};
  patientChartDocumentDataSource: any = {};

  schedulerAvailableViews: SchedulerView[] = SchedulerViews;

  selectedAppointment: Array<any> = [];

  icdCodesDataSource: any = {};

  isPatientChartReview = false;
  isSignedOffReview = false;
  patientChartNodeReview = '';
  patientChartDocumentNodeReview = '';
  appointmentIdReview = '';
  patientIdReview = '';
  admissionIdReview = '';
  companyIdReview = '';

  appointmentStatusItems: any;
  tableRoomDataSource: any = {};

  tableSelectedLocationId: string = GuidHelper.emptyGuid;
  tableSelectedCompanyId: string = '';

  careTeamDataSource: any = {};
  currentDiagnosisDataSource: any = {};
  currentChiefComplaintsDataSource: any = {};

  allAppointmentStatuses: any;
  allAppointmentTypes: any;
  allAppointmentStatusColors: any;

  previousHeader: any = '';

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private selectableListService: SelectableListService,
    private companyIdService: CompanyIdService,
    private appointmentService: AppointmentService,
    private router: Router,
    private devextremeAuthService: DevextremeAuthService,
    private alertService: AlertService,
    private admissionService: AdmissionService,
    private appointmentAlertAervice: AppointmentAlertAervice,
    private configService: ConfigService,
    private appointmentStatusColorManagementService: AppointmentStatusColorManagementService,
    private librarySelectableListService: LibrarySelectableListService
  ) {}

  onPhraseSuggestionApplied(notes: any) {
    this.currentOpenedAppointmentForm.option('formData.allegationsNotes', notes);
  }

  get canRenderComponents(): boolean {
    return !!this.companyId && !!this.areSelectableListsInitialized;
  }

  onPreviousAdmissionSelected($event: any) {
    const addedItems = $event.addedItems;
    if (!addedItems.length) {
      return;
    }

    const selectedAdmission = addedItems[0];
    this.patientPreviousAdmissions = [];
    this.isAdmissionPopupVisible = false;

    this.router.navigate(['/patient-chart', selectedAdmission.id]);
  }

  showPreviousAdmissions($event: any, data: any) {
    $event.stopPropagation();

    this.appointmentService
      .getPatientPreviousVisits(data.patientId, data.startDate)
      .then(admissions => {
        this.patientPreviousAdmissions = admissions;
        this.isAdmissionPopupVisible = true;
      });

    const dateObj = new Date(data.patientDateOfBirth);
    const options: any = { year: 'numeric', month: 'long', day: 'numeric' };

    this.previousHeader =
      '<b>Name</b>: ' +
      data.patientFirstName +
      ' ' +
      data.patientLastName +
      '&nbsp;&nbsp;&nbsp;' +
      '<b>DOB</b>: ' +
      dateObj.toLocaleDateString('en-US', options);
  }

  onAppointmentDeleting($event: any) {
    $event.cancel = true;
  }

  navigateToPatientChartFromScheduler($event: any, appointment: any) {
    $event.stopPropagation();
    this.router.navigate(['/patient-chart', appointment.appointmentData.id]);
  }

  navigateToPatientChart($event: any) {
    const selectedAppointemnt = $event.selectedRowsData[0];
    if (!selectedAppointemnt) return;

    this.router.navigate(['/patient-chart', selectedAppointemnt.id]);
  }

  onAppointmentFormOpening(data: any) {
    const form = data.form;
    console.log('onAppointmentFormOpening:', data);

    if (
      data.appointmentData != null &&
      typeof data.appointmentData.patientId != 'undefined'
    ) {
      this.reloadCurrentDiagnosisItems(data.appointmentData.patientId, form);
      this.reloadCurrentChiefComplaintsItems(data.appointmentData.patientId, form);
    }

    this.currentOpenedAppointmentForm = form;
    const popup = data.component._appointmentPopup.popup;
    this.setupAppointmentPopup(popup);

    //do not show validation summary during appointment creation
    form._options.showValidationSummary = false;

    const appointmentLocationId = data.appointmentData.locationId;

    //If we open already created appointment we have to set selected location id
    //to avoid rooms that are not related to location do not appear in room select box
    if (appointmentLocationId) this.selectedLocationId = appointmentLocationId;

    form.option('colCountByScreen', { xs: 1, sm: 1, md: 1, lg: 1 });
    form.option('items', [
      {
        itemType: 'tabbed',
        tabPanelOptions: {
          deferRendering: false,
        },
        tabs: [
          {
            title: 'Schedule Info',
            items: [
              this.initAppointmentTypeSelectBox(form),
              this.initAppointmentPatientSelectBox(form),
              this.initAppointmentLocationSelectBox(form),
              this.initAppointmentRoomSelectBox(),
              // this.initAppointmentPhysicianSelectBox(form),
              this.initAppointmentProvidersTagBox(form),
              // this.initAppointmentNurseSelectBox(),
              this.initAppointmentMasTagBox(),
              this.initAppointmentStatusSelectBox(),
              this.initAppointmentStartDateBox(),
              this.initAppointmentEndDateBox(),
            ],
          },
          {
            title: 'Allegation',
            items: [
              // this.initNewDiagnosisSelectBoxArea(form),
              // this.initNewChiefComplaintTextArea(),
              this.initAllegationsTextArea(form),
              // this.initCurrentDiagnosisSelectBoxArea(form),
              // this.initPreviousChiefComplaintsSelectBoxArea(form),
            ],
          },
          {
            title: 'Patient Chart',
            items: [
              this.initPatientChartDocumentSelectBox(form),
              this.initAdmissionTextBox(),
            ],
          },
          {
            title: 'Notes',
            items: [
              // this.initAllegationsTextArea(),
              // this.initAllegationsNotesTextArea(),
              // this.initManageAllegationsButton(),
              this.initNotesTextArea(),
            ],
          },
          {
            title: 'Care Team',
            items: [this.initCareTeamSelectBox()],
          },
        ],
      },
    ]);

    this.isAppointmentCreationFormOpened = true;
  }

  onAppointmentDeleted() {
    this.refreshRelatedSchedulerComponents();
  }

  onAppointmentAdded() {
    this.refreshRelatedSchedulerComponents();
  }

  onAppointmentUpdating(event: any) {
    const isPatientChartSigned = !!event.newData.signingDate;
    if (isPatientChartSigned) {
      this.alertService.warning('Unable to change appointment for already signed chart.');
      event.cancel = true;
      return;
    }

    const previousPatientId = event.oldData.patientId;
    const newPatientId = event.newData.patientId;

    if (previousPatientId == newPatientId) return;

    const isPatientChartCreated = !!event.oldData.admissionId;

    if (!isPatientChartCreated) return;

    event.cancel = new Promise((resolve, _reject) => {
      this.appointmentAlertAervice
        .confirmPatientChangesInAppointment(
          `${event.oldData.patientFirstName} ${event.oldData.patientLastName}`
        )
        .show()
        .then((userActionResult: any) => {
          if (!userActionResult) resolve(true);
          else {
            let newAppointment;
            switch (userActionResult) {
              case AppointmentPatientUpdateUserActions.DeletePreviousPatientChart:
                this.admissionService.deleteById(event.oldData.admissionId).then(() => {
                  event.newData.admissionId = null;
                  resolve(false);
                });
                break;
              case AppointmentPatientUpdateUserActions.CreateNewAppointment:
                newAppointment = this.duplicateAppointment(event.newData);
                event.newData.patientId = event.oldData.patientId;
                this.appointmentService.save(newAppointment).then(() => {
                  resolve(false);
                });
                break;
              default:
                return resolve(false);
            }
          }
        })
        .catch((error: any) =>
          this.alertService.error(error.message ? error.message : error)
        );
    });
  }

  onAppointmentUpdated() {
    this.refreshRelatedSchedulerComponents();
  }

  deleteAppointment($event: any, appointment: any) {
    $event.stopPropagation();
    console.log('deleteAppointment:', appointment);
    const isAdmissionCreated = !!appointment.appointmentData.admissionId;
    const appointmentId = appointment.appointmentData.id;

    if (!isAdmissionCreated) {
      this.alertService
        .confirm('Are you sure you want to delete the appointment?', 'Confirm deletion')
        .then(isDeletionConfirmed => {
          if (!isDeletionConfirmed) return;

          this.removeAppointment(appointmentId);
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    } else {
      const isAdmissionSignedIn = !!appointment.appointmentData.signingDate;
      if (isAdmissionSignedIn) {
        this.alertService.warning('Unable to delete signed patient chart');
        return;
      }

      this.appointmentAlertAervice
        .confirmDeleteAppointmentWithPatientChart()
        .show()
        .then((isDeletionConfirmed: any) => {
          if (!isDeletionConfirmed) return;

          this.admissionService
            .deleteById(appointment.appointmentData.admissionId)
            .then(() => {
              this.removeAppointment(appointmentId);
            });
        })
        .catch((error: any) =>
          this.alertService.error(error.message ? error.message : error)
        );
    }
  }

  hideSchedulerTooltip($event: any): void {
    if ($event) $event.stopPropagation();

    this.appointmentScheduler.instance.hideAppointmentTooltip();
  }

  ngOnInit() {
    this.initLocationDataSource();
    this.initPatientDataSource();
    this.initRoomDataSource();
    this.initPhysicianDataSource();
    this.initProviderDataSource();
    this.initNurseDataSource();
    this.initMaDataSource();

    this.initPatientChartDocumentDataSource();

    this.subscribeToCompanyIdChanges();

    this.initTableRoomDataSource();

    this.initDiagnosisDataSource();
    this.initCareTeamDataSource();

    this.initCurrentDiagnosisDataSource();
    this.initCurrentChiefComplaintsDataSource();

    this.appointmentStatusColorManagementService.load().then(colors => {
      this.allAppointmentStatusColors = {};
      colors.map((colorData: any) => {
        const status = colorData.status;
        const color = colorData.color;
        this.allAppointmentStatusColors[status] = color;
      });
    });

    this.librarySelectableListService
      .getByTitle(LibrarySelectableListTitles.appointmentStatus)
      .then(selectableList => {
        this.allAppointmentStatuses = selectableList.selectableListValues;
        this.appointmentStatusItems = selectableList.selectableListValues.map(
          appointmentStatus => {
            return appointmentStatus.value;
          }
        );
      });

    this.librarySelectableListService
      .getByTitle(LibrarySelectableListTitles.appointmentType)
      .then(selectableList => {
        this.allAppointmentTypes = selectableList.selectableListValues.map(
          appointmentType => {
            return appointmentType.value;
          }
        );
      });
  }

  ngOnDestroy(): void {
    this.companyIdSubscription?.unsubscribe();
  }

  onFilterChanged(filter?: AppointmentsFilter) {
    this.filter = filter || new AppointmentsFilter();
    this.refreshSchedulerAndAppointmentsGrid();
  }

  onManageAllegationsBtnClick = () => {
    this.isManageAllegationsPopupVisible = true;
  };

  onSchedulerOptionChanged($event: any) {
    const eventName = $event.name;
    switch (eventName) {
      case 'currentDate':
        if (this.filter.schedulerDate !== $event.value) {
          this.filter.schedulerDate = $event.value;
          this.refreshSchedulerAndAppointmentsGrid();
        }
        break;
      case 'currentView':
        if (this.filter.schedulerView !== $event.value) {
          this.filter.schedulerView = $event.value;
          this.refreshSchedulerAndAppointmentsGrid();
        }
        break;
    }
  }

  private removeAppointment(appointmentId: string): Promise<void> {
    return this.appointmentService.delete(appointmentId).then(() => {
      this.appointmentsGrid.instance.refresh();

      this.appointmentScheduler.instance.getDataSource().reload();

      this.hideSchedulerTooltip(null);
    });
  }

  private refreshRelatedSchedulerComponents() {
    if (this.appointmentsGrid) {
      this.appointmentsGrid.instance.refresh();
    }
  }

  private initAppointmentTypeSelectBox(_form: any): any {
    return {
      label: {
        text: 'Appointment Type',
      },
      editorType: 'dxSelectBox',
      dataField: 'appointmentType',
      isRequired: true,
      editorOptions: {
        items: this.allAppointmentTypes,
      },
    };
  }

  private initAppointmentPatientSelectBox(_form: any): any {
    const instance = this;
    return {
      label: {
        text: 'Patient',
      },
      editorType: 'dxSelectBox',
      dataField: 'patientId',
      isRequired: true,
      editorOptions: {
        searchEnabled: true,
        dataSource: this.patientDataSource,
        displayExpr: 'name',
        valueExpr: 'id',

        onValueChanged: function ($event: any) {
          instance.reloadCurrentDiagnosisItems($event.value, null);
          instance.reloadCurrentChiefComplaintsItems($event.value, null);
        },
      },
    };
  }

  private initAppointmentLocationSelectBox(form: any): any {
    return {
      label: {
        text: 'Location',
      },
      isRequired: true,
      editorType: 'dxSelectBox',
      dataField: 'locationId',
      editorOptions: {
        searchEnabled: true,
        dataSource: this.locationDataSource,
        displayExpr: 'name',
        valueExpr: 'id',
        onValueChanged: (args: any) => {
          if (!this.isAppointmentCreationFormOpened) return;

          const locationId = args.value;
          if (locationId) {
            this.selectedLocationId = locationId;

            const selectedRoomId = form.option('formData.roomId');
            if (selectedRoomId) form.option('formData.roomId', '');

            form.getEditor('roomId').getDataSource().reload();
          }
        },
      },
    };
  }

  private initAppointmentRoomSelectBox(): any {
    return {
      label: {
        text: 'Room',
      },
      isRequired: true,
      dataField: 'roomId',
      editorType: 'dxSelectBox',
      editorOptions: {
        searchEnabled: true,
        displayExpr: 'name',
        valueExpr: 'id',
        dataSource: this.roomDataSource,
      },
    };
  }

  private initAppointmentPhysicianSelectBox(form: any): any {
    return {
      label: {
        text: 'Physician',
      },
      editorType: 'dxSelectBox',
      dataField: 'physicianId',
      isRequired: true,
      editorOptions: {
        searchEnabled: true,
        displayExpr: 'name',
        valueExpr: 'id',
        dataSource: this.physianDataSource,
      },
    };
  }

  private initAppointmentProvidersTagBox(form: any): any {
    return {
      label: {
        text: 'Provider',
      },
      editorType: 'dxTagBox',
      dataField: 'providerIds',
      isRequired: true,
      editorOptions: {
        searchEnabled: true,
        displayExpr: 'name',
        valueExpr: 'id',
        dataSource: this.providerDataSource,
      },
    };
  }

  private initAppointmentNurseSelectBox(): any {
    return {
      label: {
        text: 'Nurse',
      },
      isRequired: true,
      editorType: 'dxSelectBox',
      dataField: 'nurseId',
      editorOptions: {
        searchEnabled: true,
        dataSource: this.nurseDataSource,
        displayExpr: 'name',
        valueExpr: 'id',
      },
    };
  }

  private initAppointmentMasTagBox(): any {
    return {
      label: {
        text: 'Medical Assistant',
      },
      isRequired: true,
      editorType: 'dxTagBox',
      dataField: 'maIds',
      editorOptions: {
        searchEnabled: true,
        dataSource: this.maDataSource,
        displayExpr: 'name',
        valueExpr: 'id',
      },
    };
  }

  private initAppointmentStatusSelectBox(): any {
    return {
      label: {
        text: 'Status',
      },
      isRequired: true,
      dataField: 'appointmentStatus',
      editorType: 'dxSelectBox',
      editorOptions: {
        // items: this.selectableListService.getSelectableListValuesFromComponent(
        //   this,
        //   SelectableListsNames.application.appointmentStatus
        // ),
        items: this.appointmentStatusItems,
      },
    };
  }

  private initAppointmentStartDateBox(): any {
    return {
      label: {
        text: 'Start Date',
      },
      isRequired: true,
      dataField: 'startDate',
      editorType: 'dxDateBox',
      editorOptions: {
        type: 'datetime',
        readOnly: true,
      },
    };
  }

  private initAppointmentEndDateBox(): any {
    return {
      label: {
        text: 'End Date',
      },
      isRequired: true,
      dataField: 'endDate',
      editorType: 'dxDateBox',
      editorOptions: {
        type: 'datetime',
        readOnly: true,
      },
    };
  }

  private initNewDiagnosisSelectBoxArea(form: any): any {
    const isAdmissionAlreadyCreated = !!form.option('formData.admissionId');

    return {
      label: {
        text: 'New Diagnosis',
      },
      // isRequired: true,
      dataField: 'newDiagnosises',
      editorType: 'dxTagBox',
      editorOptions: {
        disabled: isAdmissionAlreadyCreated,
        // placeholder: 'Select patient chart document...',
        searchEnabled: true,
        displayExpr: 'name',
        valueExpr: 'id',
        dataSource: this.icdCodesDataSource,
      },
    };
  }

  private initNewChiefComplaintTextArea(): any {
    return {
      label: {
        text: 'New Chief Complaint',
      },
      editorType: 'dxTextArea',
      dataField: 'chiefComplaints',
      editorOptions: {
        dataField: 'chiefCompalint',
        height: 100,
        onValueChanged: (args: any) => {
          // this.allegationsString = args.value;
        },
      },
    };
  }

  private initCurrentDiagnosisSelectBoxArea(form: any): any {
    const isAdmissionAlreadyCreated = !!form.option('formData.admissionId');

    return {
      label: {
        text: 'Current Diagnosis',
      },
      // isRequired: true,
      editorType: 'dxTagBox',
      dataField: 'currentDiagnosises',
      editorOptions: {
        disabled: isAdmissionAlreadyCreated,
        displayExpr: 'diagnosis',
        valueExpr: 'id',
        dataSource: this.currentDiagnosisDataSource,
      },
    };
  }

  private initPreviousChiefComplaintsSelectBoxArea(form: any): any {
    const isAdmissionAlreadyCreated = !!form.option('formData.admissionId');

    return {
      label: {
        text: 'Previous Chief Complaint',
      },
      // isRequired: true,
      editorType: 'dxTagBox',
      dataField: 'currentChiefComplaints',
      editorOptions: {
        disabled: isAdmissionAlreadyCreated,
        displayExpr: 'allegations',
        valueExpr: 'id',
        dataSource: this.currentChiefComplaintsDataSource,
      },
    };
  }

  private initPatientChartDocumentSelectBox(form: any): any {
    const isAdmissionAlreadyCreated = !!form.option('formData.admissionId');

    return {
      label: {
        text: isAdmissionAlreadyCreated
          ? 'Unable to select patient chart document. The patient chart was already opened(created). All documents modifications should be directly made on the patient chart page.'
          : 'The selected documents will be used during building patient chart tree. If not selected, all company documents will be added to the patient chart tree.',
      },
      validationRules: [
        {
          type: 'required',
          message: 'A document must be selected.',
        },
      ],
      isRequired: true,
      dataField: 'patientChartDocumentNodes',
      editorType: 'dxTagBox',
      editorOptions: {
        disabled: isAdmissionAlreadyCreated,
        placeholder: 'Select patient chart document...',
        searchEnabled: true,
        displayExpr: 'name',
        valueExpr: 'id',
        dataSource: this.patientChartDocumentDataSource,
      },
    };
  }

  private initAdmissionTextBox() {
    return {
      label: {
        visible: false,
      },
      editorType: 'dxTextBox',
      dataField: 'admissionId',
      editorOptions: {
        visible: false,
      },
    };
  }

  private initAllegationsTextArea(form: any): any {
    const isAdmissionAlreadyCreated = !!form.option('formData.admissionId');

    return {
      label: {
        text: 'Chief Complaint',
      },
      editorType: 'dxTextArea',
      dataField: 'allegations',
      editorOptions: {
        disabled: isAdmissionAlreadyCreated,
        dataField: 'allegations',
        height: 100,
        onValueChanged: (args: any) => {
          this.allegationsString = args.value;
        },
      },
    };
  }

  private initAllegationsNotesTextArea(): any {
    return {
      label: {
        text: 'Notes',
      },
      editorType: 'dxTextArea',
      dataField: 'allegationsNotes',
      editorOptions: {
        valueChangeEvent: 'keyup',
        dataField: 'allegationsNotes',
        height: 100,
        onValueChanged: (args: any) => {
          this.phraseSelectionForm.typedText = args.value;
        },
      },
    };
  }

  private initManageAllegationsButton(): any {
    return {
      editorType: 'dxButton',
      editorOptions: {
        stylingMode: 'outlined',
        type: 'default',
        text: 'Manage Allegations',
        onClick: this.onManageAllegationsBtnClick,
      },
    };
  }

  private initNotesTextArea(): any {
    return {
      label: {
        text: 'Notes',
      },
      editorType: 'dxTextArea',
      dataField: 'notes',
    };
  }

  private initCareTeamSelectBox(): any {
    return {
      label: {
        text: 'Care Team',
      },
      editorType: 'dxTagBox',
      dataField: 'careTeamIds',
      // isRequired: true,
      editorOptions: {
        displayExpr: 'name',
        valueExpr: 'npi',
        searchEnabled: true,
        dataSource: this.careTeamDataSource,
      },
    };
  }

  private createAppointmentGridDataSource(): any {
    const appointmentGridStore = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('appointment/griditem'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        this.onBeforeRequestingAppointmentGridItems,
        this
      ),
    });

    this.applyDecoratorForAppointmentGridDataSourceLoadFunc(appointmentGridStore);
    return appointmentGridStore;
  }

  private createSchedulerDataSource(): any {
    const schedulerStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('appointment'),
      insertUrl: this.dxDataUrlService.getEntityEndpointUrl('appointment'),
      updateUrl: this.dxDataUrlService.getEntityEndpointUrl('appointment'),
      deleteUrl: this.dxDataUrlService.getEntityEndpointUrl('appointment'),
      updateMethod: 'POST',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        this.onBeforeRequestingAppointments,
        this
      ),
    });

    this.applyDecoratorForDataSourceLoadFunc(schedulerStore);
    return schedulerStore;
  }

  private onBeforeRequestingAppointmentGridItems(method: string, ajaxOptions: any): void {
    if (method === 'load') {
      ajaxOptions.data.startDate = DateHelper.jsLocalDateToSqlServerUtc(this.startDate);

      ajaxOptions.data.endDate = DateHelper.jsLocalDateToSqlServerUtc(this.endDate);

      ajaxOptions.data.companyId = this.companyId;

      this.applyFilterIfNeeded(ajaxOptions.data);
    }
  }

  private onBeforeRequestingAppointments(method: string, ajaxOptions: any): void {
    if (method === 'delete') {
      ajaxOptions.url = `${ajaxOptions.url}/${ajaxOptions.data.key}`;
    }

    if (method === 'load') {
      ajaxOptions.data.startDate = DateHelper.jsLocalDateToSqlServerUtc(this.startDate);
      ajaxOptions.data.endDate = DateHelper.jsLocalDateToSqlServerUtc(this.endDate);
      ajaxOptions.data.companyId = this.companyId;
    }
    if (method !== 'load' && method !== 'delete') {
      const appointmentData = JSON.parse(ajaxOptions.data['values']);

      appointmentData.companyId = this.companyId;

      appointmentData.startDate = DateHelper.jsLocalDateToSqlServerUtc(
        appointmentData.startDate
      );
      appointmentData.endDate = DateHelper.jsLocalDateToSqlServerUtc(
        appointmentData.endDate
      );

      ajaxOptions.data = JSON.stringify(appointmentData);
      ajaxOptions.headers = {
        'Content-type': 'application/json',
      };
    }
  }

  private applyFilterIfNeeded(parameters: any) {
    const locationId = this.filter.locationId;
    if (locationId) parameters.locationId = locationId;

    const patientId = this.filter.patientId;
    if (patientId) parameters.patientId = patientId;

    const physicianId = this.filter.physicianId;
    if (physicianId) parameters.physicianId = physicianId;

    const appointmentStatusFilter = this.filter.appointmentStatusFilter;
    if (appointmentStatusFilter.filterType) {
      parameters.appointmentStatuses = appointmentStatusFilter.statuses.join(',');

      parameters.filterType = appointmentStatusFilter.filterType;
    }
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      let startDate =
        DateHelper.sqlServerUtcDateToLocalJsDate(this.filter.schedulerDate) || new Date();
      let endDate = startDate;
      if (this.filter.schedulerView === SchedulerViewNames.month) {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);
      } else if (this.filter.schedulerView === SchedulerViewNames.week) {
        startDate = new Date(startDate.setDate(startDate.getDate() - startDate.getDay()));
        endDate = new Date(endDate.setDate(endDate.getDate() - endDate.getDay() + 7));
      } else {
        endDate = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate() + 1
        );
      }
      endDate.setSeconds(endDate.getSeconds() - 1);

      this.startDate = startDate;
      this.endDate = endDate;

      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        console.log('result:', result);
        if (this.appointmentsGrid?.instance?.refresh)
          this.appointmentsGrid.instance.refresh();

        result.forEach((item: any) => {
          item.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.startDate);
          item.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.endDate);

          const startDate = item.startDate;
          item.date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          );
        });

        this.appointmentsFilter.physicianDataSource = this.getDataSourceItemsForFilter(
          result,
          (appointment: AppointmentGridItem) => appointment.physicianId,
          (appointment: AppointmentGridItem) =>
            `${appointment.physicianFirstName} ${appointment.physicianLastName}`
        );

        this.appointmentsFilter.patientDataSource = this.getDataSourceItemsForFilter(
          result,
          (appointment: AppointmentGridItem) => appointment.patientId,
          (appointment: AppointmentGridItem) =>
            `${appointment.patientFirstName} ${appointment.patientLastName}`
        );

        this.appointmentsFilter.locationDataSource = this.getDataSourceItemsForFilter(
          result,
          (appointment: AppointmentGridItem) => appointment.locationId,
          (appointment: AppointmentGridItem) => appointment.locationName
        );

        return result;
      });
    };
  }

  private getDataSourceItemsForFilter(
    appointments: AppointmentGridItem[],
    itemIdFunc: (appointment: AppointmentGridItem) => string | undefined,
    itemNameFunc: (appointment: AppointmentGridItem) => string | undefined
  ): LookupModel[] {
    if (!appointments || !appointments.length) return [];
    console.log('getDataSourceItemsForFilter', appointments);
    return appointments.reduce(
      (items: LookupModel[], appointment: AppointmentGridItem) => {
        const itemId = itemIdFunc(appointment);
        const itemName = itemNameFunc(appointment);
        const existingItem = items.find(i => i.id === itemId);
        if (existingItem) return items;

        if (itemId && itemName) {
          const newItem = new LookupModel();
          newItem.id = itemId;
          newItem.name = itemName;
          items.push(newItem);
        }

        return items;
      },
      []
    );
  }

  private applyDecoratorForPatientDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        result.forEach(item => {
          const dateOfBirth = DateHelper.getDate(
            DateHelper.sqlServerUtcDateToLocalJsDate(item.dateOfBirth)?.toString()
          );
          item.name = `${item.name} --- ${dateOfBirth}`;
        });
        return result;
      });
    };
  }

  private applyDecoratorForAppointmentGridDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        result.forEach(appointmentGridItem => {
          appointmentGridItem.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            appointmentGridItem.startDate
          );

          appointmentGridItem.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            appointmentGridItem.endDate
          );

          const startDate = appointmentGridItem.startDate;
          appointmentGridItem.date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          );
        });
        return result;
      });
    };
  }

  private initLocationDataSource(): void {
    this.locationDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('location'),
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initRoomDataSource(): void {
    this.roomDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('room'),
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.locationId = this.selectedLocationId;
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initTableRoomDataSource(): void {
    this.tableRoomDataSource = new DataSource({
      store: createStore({
        loadUrl: this.dxDataUrlService.getLookupUrl('room'),
        key: 'id',
        onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
          (_method, jQueryAjaxSettings) => {
            jQueryAjaxSettings.data.locationId = this.tableSelectedLocationId;
            jQueryAjaxSettings.data.companyId = this.tableSelectedCompanyId;
          },
          this
        ),
      }),
    });
  }

  private initPatientDataSource(): void {
    const patientDataSourceStore = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.patient),
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });

    this.patientDataSource.store = patientDataSourceStore;
    this.applyDecoratorForPatientDataSourceLoadFunc(patientDataSourceStore);
  }

  private initPhysicianDataSource(): void {
    this.physianDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[0].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initProviderDataSource(): void {
    this.providerDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[0].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initNurseDataSource(): void {
    this.nurseDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[1].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initMaDataSource(): void {
    this.maDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[2].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initDiagnosisDataSource(): void {
    this.icdCodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('icdcode'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  private initCareTeamDataSource(): void {
    this.careTeamDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('CareTeam'),
      loadParams: {},
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  private initCurrentDiagnosisDataSource(): void {
    this.currentDiagnosisDataSource = new DataSource({
      store: new ArrayStore({
        key: 'id',
        data: [],
      }),
    });
  }

  private reloadCurrentDiagnosisItems(patientId: string, form: any): void {
    this.admissionService.getCurrentDiagnosisByPatientId(patientId).then(resp => {
      this.currentDiagnosisDataSource.store().clear();
      resp.forEach((diagnosis: any) => {
        this.currentDiagnosisDataSource.store().insert(diagnosis);
      });
      this.currentDiagnosisDataSource.reload();

      if (form) {
        form.repaint();
      }
    });
  }

  private initCurrentChiefComplaintsDataSource(): void {
    // var admissionId = 'a7c84819-d923-ed11-bd6e-0003ff170b93';
    // this.currentChiefComplaintsDataSource.store = createStore({
    //   loadUrl: `${this.configService.apiUrl}admission/chiefcomplaints/current/${admissionId}`,
    //   key: 'id',
    //   onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
    //     (_method, _jQueryAjaxSettings) => {},
    //     this
    //   ),
    // });

    this.currentChiefComplaintsDataSource = new DataSource({
      store: new ArrayStore({
        key: 'id',
        data: [],
      }),
    });
  }

  private reloadCurrentChiefComplaintsItems(patientId: string, form: any): void {
    this.admissionService.getCurrentChiefComplaintsByPatientId(patientId).then(resp => {
      this.currentChiefComplaintsDataSource.store().clear();
      resp.forEach((diagnosis: any) => {
        this.currentChiefComplaintsDataSource.store().insert(diagnosis);
      });
      this.currentChiefComplaintsDataSource.reload();

      if (form) {
        form.repaint();
      }
    });
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

  private refreshSchedulerAndAppointmentsGrid(): void {
    const appointmentScheduler = this.appointmentScheduler;
    if (appointmentScheduler && this.appointmentScheduler.instance) {
      const isSchedulerDataSourceSet = !!appointmentScheduler.dataSource;
      if (isSchedulerDataSourceSet)
        appointmentScheduler.instance.getDataSource().reload();
      else appointmentScheduler.dataSource = this.createSchedulerDataSource();
    }

    const appointmentsGrid = this.appointmentsGrid;
    if (appointmentsGrid && appointmentsGrid.instance) {
      const isAppointmentsGridDataSourceSet = !!appointmentsGrid.dataSource;
      if (isAppointmentsGridDataSourceSet) appointmentsGrid.instance.refresh();
      else appointmentsGrid.dataSource = this.createAppointmentGridDataSource();
    }
  }

  private setupAppointmentPopup(popup: any) {
    popup.option('width', 600);
    popup.option('height', 610);
    popup.option('onHidden', () => {
      this.currentOpenedAppointmentForm = null;
    });
    popup.option('showCloseButton', true);
    popup.option('showTitle', true);
    popup.option('title', 'Schedule Appointment');

    popup.on('hidden', () => (this.isAppointmentCreationFormOpened = false));
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.initSelectableLists(this.companyId);
      }
    });
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

        // this.appointmentStatusItems = this.selectableListService.getSelectableListValuesFromComponent(
        //   this,
        //   SelectableListsNames.application.appointmentStatus
        // );
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private duplicateAppointment(appointment: any): Appointment {
    const newAppointment = new Appointment();

    newAppointment.patientId = appointment.patientId;
    newAppointment.companyId = appointment.companyId;
    newAppointment.locationId = appointment.locationId;
    newAppointment.physicianId = appointment.physicianId;
    newAppointment.nurseId = appointment.nurseId;
    newAppointment.roomId = appointment.roomId;
    newAppointment.startDate = appointment.startDate;
    newAppointment.endDate = appointment.endDate;
    newAppointment.allegations = appointment.allegations;
    newAppointment.allegationsNotes = appointment.allegationsNotes;
    newAppointment.appointmentStatus = appointment.appointmentStatus;
    newAppointment.patientChartDocumentNodes = appointment.patientChartDocumentNodes;

    return newAppointment;
  }

  navigateToPatientChartFromAdmission(appointmentId: string) {
    if (!appointmentId) return;

    this.router.navigate(['/patient-chart', appointmentId]);
  }

  reviewPatientChartFromAdmission(appointment: any) {
    this.admissionService.getById(appointment.admissionId).then(admission => {
      this.patientChartNodeReview = JSON.parse(admission.admissionData || 'null');
      this.isPatientChartReview = true;
      // this.patientChartNodeReview = '';
      this.patientChartDocumentNodeReview = this.patientChartNodeReview;
      this.appointmentIdReview = appointment.id;
      this.patientIdReview = appointment.patientId;
      this.admissionIdReview = appointment.admissionId;
      this.companyIdReview = appointment.companyId;
    });
  }

  saveSimpleAdmission(appointment: any) {
    this.appointmentService.saveSimple(appointment).then(resp => {
      this.refreshRelatedSchedulerComponents();
      this.appointmentScheduler.instance.getDataSource().reload();
    });
  }

  onTableLocationChanged($event: any, appointment: any): void {
    this.tableSelectedLocationId = $event.value;
    this.tableSelectedCompanyId = appointment.companyId;
    this.tableRoomDataSource.reload();
  }

  getTableRoomDataSource(appointment: any) {
    this.tableSelectedLocationId = appointment.locationId;
    this.tableSelectedCompanyId = appointment.companyId;
    // this.tableRoomDataSource.reload();
    return this.tableRoomDataSource;
  }

  getAppointmentStatusColor(status: string) {
    if (!this.allAppointmentStatusColors) return null;
    return Object.prototype.hasOwnProperty.call(this.allAppointmentStatusColors, status)
      ? this.allAppointmentStatusColors[status]
      : null;
  }
}
