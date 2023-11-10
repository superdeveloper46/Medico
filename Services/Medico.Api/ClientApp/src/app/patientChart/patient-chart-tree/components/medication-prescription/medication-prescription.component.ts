import { Component, OnInit, Input, AfterViewInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { MedicationPrescription } from 'src/app/patientChart/models/medicationPrescription';
import { AlertService } from 'src/app/_services/alert.service';
import { MedicationPrescriptionService } from 'src/app/patientChart/patient-chart-tree/services/medication-prescription.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { MedicationService } from 'src/app/_services/medication.service';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { BaseHistoryComponent } from '../patient-history/base-history.component';
import { MedicationItemInfo } from 'src/app/patientChart/models/medicationItemInfo';
import { MedicationItemInfoView } from 'src/app/patientChart/models/medicationItemInfoView';
import { AllergyService } from '../../services/allergy.service';
import { AllergyOnMedication } from 'src/app/patientChart/models/allergyOnMedication';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import ArrayStore from 'devextreme/data/array_store';
import { MedicationClassService } from '../../services/medication-class.service';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';

@Component({
  templateUrl: 'medication-prescription.component.html',
  selector: 'medication-prescription',
})
export class MedicationPrescriptionComponent
  extends BaseHistoryComponent
  implements OnInit, AfterViewInit
{
  @Input() patientId!: string;
  @Input() admissionId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() patientChartNode!: PatientChartNode;

  @ViewChild('medicationPrescriptionDataGrid', { static: false })
  medicationPrescriptionDataGrid!: DxDataGridComponent;
  @ViewChild('medicationPrescriptionPopup', { static: false })
  medicationPrescriptionPopup!: DxPopupComponent;
  @ViewChild('medicationPrescriptionForm', { static: false })
  medicationPrescriptionForm!: DxFormComponent;

  canRenderComponent = false;

  allergyOnMedication?: AllergyOnMedication;

  medicationItemInfo?: MedicationItemInfoView;
  medicationNameId?: string;
  medicationClassId?: string;

  isMedicationPrescriptionPopupOpened = false;

  isPrescriptionExist = false;

  selectedMedicationPrescription: Array<any> = [];
  medicationPrescription: MedicationPrescription = new MedicationPrescription();

  isNewMedicationPrescription = true;

  medicationPrescriptionDataSource: any = {};
  medicationNameDataSource: any = {};

  assessmentListValues: any[] = [];
  medicationClassDataSource: any = {}

  providersDataSource: any = {};

  constructor(
    private alertService: AlertService,
    private medicationPrescriptionService: MedicationPrescriptionService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    private medicationService: MedicationService,
    private allergyService: AllergyService,
    private medicationClassService: MedicationClassService,
    defaultValueService: DefaultValueService,
    private devextremeAuthService: DevextremeAuthService,
    selectedPatientChartNodeService: SelectedPatientChartNodeService
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

  get prescriptionDurationInDays(): any {
    const startDate = this.medicationPrescription?.startDate;
    const endDate = this.medicationPrescription?.endDate;

    if (!startDate || !endDate) return '';

    if (startDate >= endDate) return '';

    return DateHelper.getDaysBetween(startDate, endDate);
  }

  get calculatedEndDate(): any {
    if (!this.medicationPrescription?.totalDays) return;

    return new Date(
      Date.parse(this.medicationPrescription.startDate) +
        this.medicationPrescription.totalDays * 24 * 3600 * 1000
    );
  }

  generateSIG() {
    let sigString = '';

    if (!this.medicationPrescription) return;

    if (this.medicationPrescription.medication) {
      sigString += this.medicationPrescription.medication;
    }

    if (this.medicationPrescription.dose) {
      sigString += ` ${this.medicationPrescription.dose}`;
    }

    if (this.medicationPrescription.units) {
      sigString += ` ${this.medicationPrescription.units}`;
    }

    if (this.medicationPrescription.route) {
      sigString += ` ${this.medicationPrescription.route}`;
    }

    if ((<any>this.medicationPrescription)['sigSelection']) {
      sigString += `, ${(<any>this.medicationPrescription)['sigSelection']}`;
    }

    const dispense = Number(this.medicationPrescription.dispense);
    if (!Number.isNaN(dispense)) {
      sigString += ` Dispense ${dispense}`;
    }

    const refills = Number(this.medicationPrescription.refills);
    if (!Number.isNaN(refills)) {
      sigString += ` Refills ${refills}`;
    }

    this.medicationPrescription.sig = sigString;
  }

  onMedicationPrescriptionFieldChanged($event: any) {
    const dataField = $event.dataField;
    const _fieldValue = $event.value;

    if (!this.medicationPrescription) return;

    if (dataField !== 'totalDays') {
      this.medicationPrescription.totalDays = this.prescriptionDurationInDays;
    }

    if (dataField === 'totalDays') {
      this.medicationPrescription.endDate = this.calculatedEndDate;
    }
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.medicationPrescription) this.medicationPrescription.notes = $event;
  }

  onMedicationNameChanged($event: any): void {
    const medicationNameId = $event.value;

    this.medicationNameId = medicationNameId;

    if (!medicationNameId) {
      this.medicationItemInfo = undefined;
      this.allergyOnMedication = undefined;
      this.resetMedicationPrescriptionFields();
      this.medicationPrescriptionForm.instance.repaint();
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
          this.medicationPrescriptionForm.instance.repaint();
          this.resetMedicationPrescriptionFields(medicationName.name, medicationName.id);
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  onMedicationClassChanged($event: any) {
    const medicationClassId = $event.value;
    this.medicationClassId = medicationClassId;
    if (medicationClassId) {
      this.medicationClassService.getById(medicationClassId)
          .then(medicationClass => {
              this.medicationPrescription.medication = medicationClass.name;
              this.medicationNameId = "";
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
    }
    else {
      const previousMedicationClassId = $event.previousValue;
      if (previousMedicationClassId && !this.medicationPrescription.medicationNameId)
          this.medicationPrescription.medication = "";
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
    this.registerEscapeBtnEventHandler(this.medicationPrescriptionPopup);
  }

  deletePrescription(medicationPrescription: MedicationPrescription, $event: any) {
    $event.stopPropagation();
    const medicationPrescriptionId = medicationPrescription.id;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete prescription ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.medicationPrescriptionService.delete(medicationPrescriptionId).then(() => {
          this.medicationPrescriptionDataGrid.instance.refresh();
          this.setPrescriptionExistence();
        });
      }
    });
  }

  ngOnInit(): void {
    this.initSelectableLists();
    this.initAssessmentListValues();
    this.setPrescriptionExistence();
    this.initProviderDataSource();
    this.medicationPrescription = new MedicationPrescription(
      this.patientId,
      this.admissionId
    );
  }

  private initProviderDataSource(): void {
    this.providersDataSource.store = createStore({
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

  openMedicationPrescriptionForm() {
    this.isMedicationPrescriptionPopupOpened = true;
  }

  onMedicationPrescriptionPopupHidden() {
    this.isNewMedicationPrescription = true;
    this.selectedMedicationPrescription = [];
    this.medicationPrescription = new MedicationPrescription(
      this.patientId,
      this.admissionId
    );
    this.medicationItemInfo = undefined;
    this.medicationNameId = undefined;
    this.allergyOnMedication = undefined;
  }

  createUpdateMedicationPrescription() {
    if (this.patientHasAllergyOnMedication) {
      return;
    }

    const validationResult = this.medicationPrescriptionForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (this.isMedicationSelected) {
      const medicationItemInfo = new MedicationItemInfo(
        this.medicationPrescription?.medicationNameId,
        this.medicationPrescription?.route,
        this.medicationPrescription?.dose,
        this.medicationPrescription?.dosageForm,
        this.medicationPrescription?.units
      );

      this.medicationService
        .getMedicationConfigurationExistence(medicationItemInfo)
        .then(medicationConfigurationExistence => {
          const isMedicationConfigurationExist = medicationConfigurationExistence.exist;
          if (!isMedicationConfigurationExist) {
            const errorMessage = `Medication with such cofiguration:<br/><br/>
                                              ROUTE ---------- ${medicationConfigurationExistence.route}<br/>
                                              DOSE ----------- ${medicationConfigurationExistence.strength}<br/>
                                              UNITS ---------- ${medicationConfigurationExistence.unit}<br/>
                                              DOSAGE FORM - ${medicationConfigurationExistence.dosageForm}<br/><br/>
                                              cannot be found. Try to use another configuration`;
            this.alertService.error(errorMessage);
          } else {
            this.saveMedicationPrescription();
          }
        });
    } else {
      this.saveMedicationPrescription();
    }
  }

  private saveMedicationPrescription(): void {
    if (!this.medicationPrescription) return;

    this.medicationPrescriptionService
      .save(this.medicationPrescription)
      .then(() => {
        if (
          this.medicationPrescriptionDataGrid &&
          this.medicationPrescriptionDataGrid.instance
        ) {
          this.medicationPrescriptionDataGrid.instance.refresh();
        }

        this.isPrescriptionExist = true;
        this.isMedicationPrescriptionPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onMedicationPrescriptionSelect($event: any) {
    if (this.isSignedOff) {
      this.selectedMedicationPrescription = [];
      return;
    }

    const selectedMedicationPrescription = $event.selectedRowsData[0];
    if (!selectedMedicationPrescription) return;

    const selectedMedicationPrescriptionId = selectedMedicationPrescription.id;

    this.medicationPrescriptionService
      .getById(selectedMedicationPrescriptionId)
      .then(medicationPrescription => {
        this.medicationPrescription = medicationPrescription;

        this.medicationPrescription.totalDays = this.prescriptionDurationInDays;

        const medicationNameId = medicationPrescription.medicationNameId;
        this.medicationNameId = medicationNameId;

        if (medicationNameId) {
          this.medicationService
            .getMedicationInfo(medicationNameId)
            .then(medicationItemInfo => {
              this.medicationItemInfo = medicationItemInfo;
              this.isMedicationPrescriptionPopupOpened = true;
              this.isNewMedicationPrescription = false;
            });
        } else {
          this.isMedicationPrescriptionPopupOpened = true;
          this.isNewMedicationPrescription = false;
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initMedicationPrescriptionDataSource();
    this.initMedicationNameDataSource();
    this.initMedicationClassDataSource();
    this.initDefaultHistoryValue(PatientChartNodeType.MedicationsNode);
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
      });
  }

  private initMedicationPrescriptionDataSource(): any {
    const appointmentStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('prescription'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
          jQueryAjaxSettings.data.admissionId = this.admissionId;
        },
        this
      ),
    });

    this.medicationPrescriptionDataSource.store = appointmentStore;
    this.applyDecoratorForDataSourceLoadFunc(appointmentStore);
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        result.forEach(item => {
          item.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.startDate);
          item.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.endDate);
        });
        return result;
      });
    };
  }

  private setPrescriptionExistence() {
    this.medicationPrescriptionService
      .isPrescriptionExist(this.admissionId)
      .then(isPrescriptionExist => {
        this.isPrescriptionExist = isPrescriptionExist;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
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
  }

  private initAssessmentListValues(): void {
    if (this.patientChartNode && this.patientChartNode.value.length > 0) {

      this.assessmentListValues = this.patientChartNode.value;
    }

  }

  private resetMedicationPrescriptionFields(
    medication: string = '',
    medicationNameId: string = ''
  ) {
    if (!this.medicationPrescription) return;

    this.medicationPrescription.medication = medication;
    this.medicationPrescription.medicationNameId = medicationNameId;

    // dose
    if (this.medicationItemInfo?.strengthList?.length === 1) {
      this.medicationPrescription.dose = this.medicationItemInfo.strengthList[0];
    } else {
      this.medicationPrescription.dose = '';
    }

    // units
    if (this.medicationUnitsListValues?.length === 1) {
      this.medicationPrescription.units = this.medicationUnitsListValues[0];
    } else {
      this.medicationPrescription.units = '';
    }

    // route
    if (this.medicationRouteListValues?.length === 1) {
      this.medicationPrescription.route = this.medicationRouteListValues[0];
    }
    // dosage
    if (this.medicationItemInfo?.dosageFormList?.length === 1) {
      this.medicationPrescription.dosageForm = this.medicationItemInfo.dosageFormList[0];
    }
    // this.medicationPrescription.medication = medication;
    // this.medicationPrescription.medicationNameId = medicationNameId;
    // this.medicationPrescription.dosageForm = "";
    // this.medicationPrescription.dose = "";
    // this.medicationPrescription.route = "";
    // this.medicationPrescription.units = "";
  }
}
