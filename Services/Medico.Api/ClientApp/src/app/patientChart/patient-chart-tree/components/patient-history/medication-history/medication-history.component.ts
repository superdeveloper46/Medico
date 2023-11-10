import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { MedicationHistory } from 'src/app/patientChart/models/medicationHistory';
import { AlertService } from 'src/app/_services/alert.service';
import { MedicationHistoryService } from 'src/app/patientChart/patient-chart-tree/services/medication-history.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { MedicationService } from 'src/app/_services/medication.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { MedicationItemInfoView } from 'src/app/patientChart/models/medicationItemInfoView';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../../phrase-suggestion-helper/phrase-suggestion-helper.component';
import { AllergyService } from '../../../services/allergy.service';
import { AllergyOnMedication } from 'src/app/patientChart/models/allergyOnMedication';
import { ConfigService } from 'src/app/_services/config.service';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';
import { MedicationClassService } from '../../../services/medication-class.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  templateUrl: 'medication-history.component.html',
  selector: 'medication-history',
})
export class MedicationHistoryComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('medicationHistoryDataGrid', { static: false })
  medicationHistoryDataGrid!: DxDataGridComponent;
  @ViewChild('medicationHistoryPopup', { static: false })
  medicationHistoryPopup!: DxPopupComponent;
  @ViewChild('medicationHistoryForm', { static: false })
  medicationHistoryForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  canRenderComponent = false;

  medicationItemInfo?: MedicationItemInfoView;
  medicationNameId?: string;
  medicationClassId?: string;
  medicationNames: [] = [];

  isMedicationHistoryPopupOpened = false;

  isHistoryExist = false;

  selectedMedicationHistory: Array<any> = [];
  medicationHistory: any;

  isNewMedicationHistory = true;

  medicationHistoryDataSource: any = {};
  medicationNameDataSource: any = {};
  isPhrasesHelperVisible = false;
  allergyOnMedication?: AllergyOnMedication;
  providersDataSource: any = {};
  assessmentListValues: any[] = [];
  medicationClassDataSource: any = {}

  constructor(
    private alertService: AlertService,
    private repository: RepositoryService,
    private medicationHistoryService: MedicationHistoryService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    private medicationService: MedicationService,
    defaultValueService: DefaultValueService,
    private allergyService: AllergyService,
    private devextremeAuthService: DevextremeAuthService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService,
    private medicationClassService: MedicationClassService,
    private configService: ConfigService,
  ) {
    super(defaultValueService, selectedPatientChartNodeService);

    this.init();
  }

  get allergyWarningMessage(): string {
    return this.allergyOnMedication?.medicationClass &&
      this.allergyOnMedication?.medicationClassId
      ? `WARNING! Patient has allergy on the whole class of medications: ${this.allergyOnMedication.medicationClass}!`
      : 'WARNING! Patient has allergy on the selected medication!';
  }

  get patientHasAllergyOnMedication(): boolean {
    return !!this.allergyOnMedication;
  }

  get medicationPrescriptionFormHeight(): number {
    return this.patientHasAllergyOnMedication ? 400 : 440;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  onDetailedContentChanged(content: string) {
    this.medicationHistory.notes = content;
  }

  onMedicationClassChanged($event: any) {
    const medicationClassId = $event.value;
    this.medicationHistory.medicationClassId = medicationClassId;
    if (medicationClassId) {
      this.medicationClassService.getById(medicationClassId)
          .then(medicationClass => {
              this.medicationHistory.medication = medicationClass.name;
              this.medicationNameId = "";
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
  }
  else {
      const previousMedicationClassId = $event.previousValue;
      if (previousMedicationClassId && !this.medicationHistory.medicationNameId)
          this.medicationHistory.medication = null;
    }
  }

  onMedicationNameChanged($event: any): void {
    const medicationNameId = $event.value;

    this.medicationNameId = medicationNameId;

    if (!medicationNameId) {
      this.medicationItemInfo = undefined;
      this.allergyOnMedication = undefined;
      this.resetMedicationPrescriptionFields();
      this.medicationHistoryForm.instance.repaint();
    } else {
      const medicationNamePromise =
        this.medicationService.getNameByMedicationNameId(medicationNameId);

      const medicationInfoPromise =
        this.medicationService.getMedicationInfo(medicationNameId);

      const medicationAllergiesPromise =
        this.allergyService.getPatientAllergyOnMedication(
          this.patientId,
          medicationNameId
        );

      Promise.all([
        medicationNamePromise,
        medicationInfoPromise,
        medicationAllergiesPromise,
      ])
        .then(result => {
          const medicationName = result[0];
          const medicationInfo = result[1];
          this.allergyOnMedication = result[2];

          this.medicationItemInfo = medicationInfo;
          this.medicationHistoryForm.instance.repaint();

          this.resetMedicationPrescriptionFields(medicationName.name, medicationName.id);
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  get isMedicationSelected(): boolean {
    return !!this.medicationItemInfo;
  }

  get medicationUnitsListValues(): string[] | undefined {
    return this.medicationItemInfo
      ? this.medicationItemInfo.unitList
      : this.selectableListService.getSelectableListValuesFromComponent(
          this,
          SelectableListsNames.medications.medicationsUnits
        );
  }

  get medicationRouteListValues(): string[] | undefined {
    return this.medicationItemInfo
      ? this.medicationItemInfo.routeList
      : this.selectableListService.getSelectableListValuesFromComponent(
          this,
          SelectableListsNames.medications.medicationsRoute
        );
  }

  get medicationDoseScheduleListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.medications.medicationsDirections
    );
  }

  get medicationStatusListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.medications.medicationsStatus
    );
  }

  get medicationFormListValues(): string[] | undefined {
    return this.medicationItemInfo
      ? this.medicationItemInfo.dosageFormList
      : this.selectableListService.getSelectableListValuesFromComponent(
          this,
          SelectableListsNames.medications.medicationsForms
        );
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.medicationHistoryPopup);
  }

  deleteHistory(medicationHistory: MedicationHistory, $event: any) {
    $event.stopPropagation();

    const medicationHistoryId = medicationHistory.id;
    if (!medicationHistoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the history ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.medicationHistoryService.delete(medicationHistoryId).then(() => {
          this.medicationHistoryDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setHistoryExistence();
    this.initProviderDataSource();
    this.initMedicationClassDataSource();
    this.medicationHistory = new MedicationHistory(this.patientId);
  }

  private initProviderDataSource(): void {
    const apiUrl = `user/careTeam-provider?companyId=${this.companyId}&patientId=${this.patientId}`;
    this.repository.getData(apiUrl).subscribe({
      next: data => {
        this.providersDataSource = data;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
      },
    });
  }

  openMedicationHistoryForm() {
    this.isMedicationHistoryPopupOpened = !this.isMedicationHistoryPopupOpened;
    this.medicationHistory = new MedicationHistory(this.patientId);
  }

  onMedicationHistoryPopupHidden() {
    this.isNewMedicationHistory = true;
    this.selectedMedicationHistory = [];
    this.medicationHistory = new MedicationHistory(this.patientId);
    this.medicationItemInfo = undefined;
    this.medicationNameId = undefined;
    this.allergyOnMedication = undefined;
  }

  createUpdateMedicationHistory() {
    if (this.patientHasAllergyOnMedication) {
      return;
    }
    const validationResult = this.medicationHistoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    this.saveMedicationHistory();
  }

  onMedicationHistorySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedMedicationHistory = [];
      return;
    }

    const selectedMedicationHistory = $event.selectedRowsData[0];
    if (!selectedMedicationHistory) return;

    const selectedMedicationHistoryId = selectedMedicationHistory.id;

    this.medicationHistoryService
      .getById(selectedMedicationHistoryId)
      .then(medicationHistory => {
        this.medicationHistory = medicationHistory;

        const medicationNameId = medicationHistory.medicationNameId;
        this.medicationNameId = medicationNameId;

        if (medicationNameId) {
          this.medicationService
            .getMedicationInfo(medicationNameId)
            .then(medicationItemInfo => {
              this.medicationItemInfo = medicationItemInfo;
              this.isMedicationHistoryPopupOpened = true;
              this.isNewMedicationHistory = false;
            });
        } else {
          this.isMedicationHistoryPopupOpened = true;
          this.isNewMedicationHistory = false;
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private saveMedicationHistory(): void {
    if (!this.notesEditor) {
      this.medicationHistory.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.medicationHistory.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    //this.medicationHistory.notes = this.notesEditor.content;
    this.medicationHistoryService
      .save(this.medicationHistory, this.medicationNames)
      .then(() => {
        if (this.medicationHistoryDataGrid && this.medicationHistoryDataGrid.instance) {
          this.medicationHistoryDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isMedicationHistoryPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initMedicationHistoryDataSource();
    this.initMedicationNameDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.MedicationsNode);
  }

  generateSIG() {
    let sigString = '';

    if (this.medicationHistory.medication) {
      sigString += this.medicationHistory.medication;
    }

    if (this.medicationHistory.dose) {
      sigString += ` ${this.medicationHistory.dose}`;
    }

    if (this.medicationHistory.units) {
      sigString += ` ${this.medicationHistory.units}`;
    }

    if (this.medicationHistory.route) {
      sigString += ` ${this.medicationHistory.route}`;
    }

    if (this.medicationHistory.sigSelectBoxValue) {
      sigString += `, ${this.medicationHistory.sigSelectBoxValue}`;
    }

    this.medicationHistory.sig = sigString;
  }

  private initSelectableLists() {
    const medicationUnitsListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.medications.medicationsUnits,
      LibrarySelectableListIds.medications.medicationsUnits
    );

    const medicationRouteListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.medications.medicationsRoute,
      LibrarySelectableListIds.medications.medicationsRoute
    );

    const medicationDoseScheduleListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.medications.medicationsDirections,
      LibrarySelectableListIds.medications.medicationsDirections
    );

    const medicationStatusListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.medications.medicationsStatus,
      LibrarySelectableListIds.medications.medicationsStatus
    );

    const medicationFormsListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.medications.medicationsForms,
      LibrarySelectableListIds.medications.medicationsForms
    );

    const selectableLists = [
      medicationUnitsListConfig,
      medicationRouteListConfig,
      medicationDoseScheduleListConfig,
      medicationStatusListConfig,
      medicationFormsListConfig,
    ];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initMedicationHistoryDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('medicationhistory'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.medicationHistoryDataSource.store = appointmentStore;
    this.applyDecoratorForDataSourceLoadFunc(appointmentStore);
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        result.forEach(item => {
          item.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.createDate);
        });
        return result;
      });
    };
  }

  private setHistoryExistence() {
    this.medicationHistoryService
      .isHistoryExist(this.patientId)
      .then(isHistoryExist => {
        this.isHistoryExist = isHistoryExist;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private resetMedicationPrescriptionFields(
    medication: string = '',
    medicationNameId: string = ''
  ) {
    this.medicationHistory.medication = medication;
    this.medicationHistory.medicationNameId = medicationNameId;
    this.medicationHistory.dosageForm = '';
    this.medicationHistory.dose = '';
    this.medicationHistory.route = '';
    this.medicationHistory.units = '';
  }

  private initMedicationNameDataSource(): void {
    this.medicationNameDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('medication/name'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });

    this.medicationNameDataSource.store.load().then(
      (data: any) => {
        this.medicationNames = data;
    });
  }

  private initMedicationClassDataSource(): void {
    this.medicationClassDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('medicationclass'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  contentChanged(_$event: any) {}

  customItemTemplate(data: any) {
    if(data.type === 0) {
      return `<div style="color: green; overflow: hidden; text-overflow: ellipsis;" title="${data.name}" >${data.name}</div>`;
    }else {
      return `<div style="color: blue; overflow: hidden; text-overflow: ellipsis;" title="${data.name}" >${data.name}</div>`;
    }
  }
}
