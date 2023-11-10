import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { BaseHistoryComponent } from '../base-history.component';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { Allergy } from 'src/app/patientChart/models/allergy';
import { AlertService } from 'src/app/_services/alert.service';
import { AllergyService } from 'src/app/patientChart/patient-chart-tree/services/allergy.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { PatientChartTrackService } from 'src/app/_services/patient-chart-track.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { MedicationClassService } from '../../../services/medication-class.service';
import { MedicationService } from 'src/app/_services/medication.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { NotesEditorComponent } from 'src/app/share/components/notes-editor/notes-editor.component';
import { PhraseSuggestionHelperComponent } from '../../phrase-suggestion-helper/phrase-suggestion-helper.component';

@Component({
  templateUrl: 'allergy.component.html',
  selector: 'allergy',
})
export class AllergyComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateId?: string;

  @ViewChild('allergyDataGrid', { static: false })
  allergyDataGrid!: DxDataGridComponent;
  @ViewChild('allergyPopup', { static: false })
  allergyPopup!: DxPopupComponent;
  @ViewChild('allergyForm', { static: false })
  allergyForm!: DxFormComponent;
  @ViewChild('notesEditor', { static: false })
  notesEditor!: NotesEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  canRenderComponent = false;

  medicationClassId?: string;
  medicationNameId?: string;
  isAllergyPopupOpened = false;
  isHistoryExist = false;
  selectedAllergy: Array<any> = [];
  allergy: any = new Allergy();
  isNewAllergy = true;

  allergyDataSource: any = {};
  medicationNameDataSource: any = {};
  medicationClassDataSource: any = {};
  selectableLists: any = {};

  editorId: string = 'report-editor';
  editor: any;
  reportContent: string = '';

  reportUrl: string = '';
  initialContent?: string;
  isPhrasesHelperVisible = false;

  constructor(
    private alertService: AlertService,
    private allergyService: AllergyService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    private medicationClassService: MedicationClassService,
    private medicationService: MedicationService,
    private patientChartTrackService: PatientChartTrackService,
    defaultValueService: DefaultValueService,
    private devextremeAuthService: DevextremeAuthService,
    private envService: EnvironmentUrlService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    super(defaultValueService, selectedPatientChartNodeService);
    this.editorId = GuidHelper.generateNewGuid();
    this.init();
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.notesEditor) {
      const templateContent = this.notesEditor.content;

      this.notesEditor.insertContent(`${templateContent}${$event}`);
    }
  }

  onDetailedContentChanged(content: string) {
    this.allergy.notes = content;
  }

  get medicationNameOrClassSelected(): boolean {
    const isMedicationNameOrClassExist = this.medicationClassId || this.medicationNameId;
    return !!isMedicationNameOrClassExist;
  }

  get medicationReactionListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.medications.medicationsAllergy
    );
  }

  onAllergyFieldChanged($event: any) {
    const dataField = $event.dataField;
    const fieldValue = $event.value;

    if (dataField === 'medicationName' && fieldValue) {
      this.allergy.medication = fieldValue.name;
    }
  }

  ngAfterViewInit(): void {
    // this.registerEscapeBtnEventHandler(this.allergyPopup);
  }

  private emitContentChange() {
    const _content = this.editor.getContent();
  }

  deleteHistory(allergy: Allergy, $event: any) {
    $event.stopPropagation();

    const allergyId = allergy.id;
    if (!allergyId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the allergy ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.allergyService.delete(allergyId).then(() => {
          this.patientChartTrackService.emitPatientChartChanges(
            PatientChartNodeType.AllergiesNode
          );
          this.allergyDataGrid.instance.refresh();
          this.setHistoryExistence();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.setHistoryExistence();
  }

  openAllergyForm() {
    this.isAllergyPopupOpened = !this.isAllergyPopupOpened;
    this.allergy = new Allergy();
  }

  onAllergyPopupHidden() {
    this.isNewAllergy = true;
    this.selectedAllergy = [];
    this.allergy = new Allergy();

    this.medicationNameId = undefined;
    this.medicationClassId = undefined;
  }

  createUpdateAllergy() {
    const validationResult = this.allergyForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.notesEditor) {
      this.allergy.notes = '';
      const result = confirm('Are you sure you want to save without Notes!');
      if (!result) return;
    } else {
      this.allergy.notes = this.notesEditor.content;
      if (this.notesEditor.content === '') {
        const result = confirm('Are you sure you want to save without Notes!');
        if (!result) return;
      }
    }

    if (this.isNewAllergy) this.allergy.patientId = this.patientId;

    //this.allergy.notes = this.notesEditor.content;
    this.allergyService
      .save(this.allergy, this.selectableLists)
      .then(() => {
        this.patientChartTrackService.emitPatientChartChanges(
          PatientChartNodeType.AllergiesNode
        );

        if (this.allergyDataGrid && this.allergyDataGrid.instance) {
          this.allergyDataGrid.instance.refresh();
        }

        this.isHistoryExist = true;
        this.isAllergyPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onAllergySelect($event: any) {
    if (this.isSignedOff) {
      this.selectedAllergy = [];
      return;
    }

    const selectedAllergy = $event.selectedRowsData[0];
    if (!selectedAllergy) return;

    const selectedAllergyId = selectedAllergy.id;

    this.allergyService
      .getById(selectedAllergyId)
      .then(allergy => {
        this.allergy = allergy;

        if (allergy.medicationClassId) this.medicationClassId = allergy.medicationClassId;

        if (allergy.medicationNameId) this.medicationNameId = allergy.medicationNameId;

        this.isAllergyPopupOpened = true;
        this.isNewAllergy = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onMedicationClassChanged($event: any) {
    const medicationClassId = $event.value;
    this.allergy.medicationClassId = medicationClassId;
    if (medicationClassId) {
      this.medicationClassService
        .getById(medicationClassId)
        .then(medicationClass => {
          this.allergy.medication = medicationClass.name;

          this.medicationNameId = undefined;
          this.allergy.medicationNameId = undefined;
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    } else {
      const previousMedicationClassId = $event.previousValue;
      if (previousMedicationClassId && !this.allergy.medicationNameId)
        this.allergy.medication = null;
    }
  }

  onMedicationNameChanged($event: any) {
    const medicationNameId = $event.value;
    this.allergy.medicationNameId = medicationNameId;
    if (medicationNameId) {
      this.medicationService
        .getNameByMedicationNameId(medicationNameId)
        .then(medicationNameObject => {
          this.allergy.medication = medicationNameObject.name;

          this.medicationClassId = undefined;
          this.allergy.medicationClassId = undefined;
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    } else {
      const previousMedicationNameId = $event.previousValue;
      if (previousMedicationNameId && !this.allergy.medicationClassId)
        this.allergy.medication = null;
    }
  }

  private init() {
    this.initAllergyDataSource();
    this.initMedicationDataSource();
    this.initMedicationClassDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.AllergiesNode);
    // this.setUpReportEditor();
  }

  private initSelectableLists() {
    const medicationReactionListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.medications.medicationsAllergy,
      LibrarySelectableListIds.medications.medicationsAllergy
    );

    const selectableLists = [medicationReactionListConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderComponent = true;
      });
  }

  private initAllergyDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('allergy'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.allergyDataSource.store = appointmentStore;
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
    this.allergyService
      .isHistoryExist(this.patientId)
      .then(isHistoryExist => {
        this.isHistoryExist = isHistoryExist;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initMedicationDataSource(): void {
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
        this.selectableLists["medicationNames"] = data;
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

    this.medicationClassDataSource.store.load().then(
      (data: any) => {
        this.selectableLists["medicationClasses"] = data;
    });
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  contentChanged(_$event: any) {}
}
