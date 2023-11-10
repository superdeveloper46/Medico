import { Component, OnInit, Input, AfterViewInit, ViewChild } from "@angular/core";
import { DxDataGridComponent, DxPopupComponent, DxFormComponent } from "devextreme-angular";
import { createStore } from "devextreme-aspnet-data-nojquery";
import { LibrarySelectableListIds } from 'src/app/core/constants/library-selectable-list-ids.const';
import { SelectableListsNames } from 'src/app/core/constants/selectable-lists-names';
import { PatientChartNodeType } from 'src/app/core/enums/patient-chart-node-types.enum';
import { DateHelper } from 'src/app/core/helpers/date.helper';
import { MedicationItemInfoViewModel } from 'src/app/core/models/medication-item-info-view.model';
import { SelectableListConfigModel } from 'src/app/core/models/selectable-list-config.model';
import { AlertService } from 'src/app/core/services/alert.service';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { DefaultValueService } from 'src/app/core/services/default-value.service';
import { DevextremeAuthService } from 'src/app/core/services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/core/services/dxDataUrl.service';
import { MedicationService } from 'src/app/core/services/medication.service';
import { SelectableListService } from 'src/app/core/services/selectable-list.service';
import { BaseHistoryComponent } from '../classes/base-history-component';
import { MedicationHistoryModel } from '../models/medication-history.model';
import { MedicationHistoryService } from '../services/medication-history.service';

@Component({
    templateUrl: "medication-history.component.html",
    selector: "medication-history"
})
export class MedicationHistoryComponent extends BaseHistoryComponent implements OnInit, AfterViewInit {
    @ViewChild("medicationHistoryDataGrid", { static: false }) medicationHistoryDataGrid: DxDataGridComponent;
    @ViewChild("medicationHistoryPopup", { static: false }) medicationHistoryPopup: DxPopupComponent;
    @ViewChild("medicationHistoryForm", { static: false }) medicationHistoryForm: DxFormComponent;

    canRenderComponent: boolean = false;

    medicationItemInfo: MedicationItemInfoViewModel = null;
    medicationNameId: string = null;

    isMedicationHistoryPopupOpened: boolean = false;

    isHistoryExist: boolean = false;

    selectedMedicationHistory: Array<any> = [];
    medicationHistory: any;

    isNewMedicationHistory: boolean = true;

    medicationHistoryDataSource: any = {};
    medicationNameDataSource: any = {};

    constructor(private alertService: AlertService,
        private medicationHistoryService: MedicationHistoryService,
        private selectableListService: SelectableListService,
        private dxDataUrlService: DxDataUrlService,
        private medicationService: MedicationService,
        defaultValueService: DefaultValueService,
        private devextremeAuthService: DevextremeAuthService,
        authenticationService: AuthenticationService) {

        super(defaultValueService, authenticationService);

        this.init();
    }

    onMedicationHistoryFieldChanged($event) {
        const dataField = $event.dataField;
        const fieldValue = $event.value;

        if (dataField === "sigSelectBoxValue" && fieldValue) {
            this.medicationHistory.sig = fieldValue;
            this.medicationHistory.sigSelectBoxValue = "";
        }
    }

    onPhraseSuggestionApplied($event) {
        this.medicationHistory.notes = $event;
    }

    onMedicationNameChanged($event): void {
        const medicationNameId = $event.value;

        this.medicationNameId = medicationNameId;

        if (!medicationNameId) {
            this.medicationItemInfo = null;
            this.resetMedicationPrescriptionFields();
            this.medicationHistoryForm.instance.repaint();
        }
        else {
            const medicationNamePromise = this.medicationService
                .getNameByMedicationNameId(medicationNameId);

            const medicationInfoPromise = this.medicationService
                .getMedicationInfo(medicationNameId);

            Promise.all([medicationNamePromise, medicationInfoPromise])
                .then(result => {
                    const medicationName = result[0];
                    const medicationInfo = result[1];

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

    get medicationUnitsListValues(): string[] {
        return this.medicationItemInfo
            ? this.medicationItemInfo.unitList
            : this.selectableListService
                .getSelectableListValuesFromComponent(this, SelectableListsNames.medications.medicationsUnits);
    }

    get medicationRouteListValues(): string[] {
        return this.medicationItemInfo
            ? this.medicationItemInfo.routeList
            : this.selectableListService
                .getSelectableListValuesFromComponent(this, SelectableListsNames.medications.medicationsRoute);
    }

    get medicationDoseScheduleListValues(): string[] {
        return this.selectableListService
            .getSelectableListValuesFromComponent(this, SelectableListsNames.medications.medicationsDoseSchedule);
    }

    get medicationStatusListValues(): string[] {
        return this.selectableListService
            .getSelectableListValuesFromComponent(this, SelectableListsNames.medications.medicationsStatus);
    }

    ngAfterViewInit(): void {
        this.registerEscapeBtnEventHandler(this.medicationHistoryPopup);
    }

    deleteHistory(medicationHistory: MedicationHistoryModel, $event) {
        $event.stopPropagation();
        const medicationHistoryId = medicationHistory.id;

        const confirmationPopup = this.alertService
            .confirm("Are you sure you want to delete the history ?", "Confirm deletion");

        confirmationPopup.then(dialogResult => {
            if (dialogResult) {
                this.medicationHistoryService.delete(medicationHistoryId)
                    .then(() => {
                        this.medicationHistoryDataGrid.instance.refresh();
                        this.setHistoryExistence();
                    });

            }
        });
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.initSelectableLists();
        this.setHistoryExistence();
        this.medicationHistory = new MedicationHistoryModel(this.patientId);
    }

    openMedicationHistoryForm() {
        this.isMedicationHistoryPopupOpened = true;
    }

    onMedicationHistoryPopupHidden() {
        this.isNewMedicationHistory = true;;
        this.selectedMedicationHistory = [];
        this.medicationHistory = new MedicationHistoryModel(this.patientId);
        this.medicationItemInfo = null;
        this.medicationNameId = null;
    }

    createUpdateMedicationHistory() {
        const validationResult = this.medicationHistoryForm.instance
            .validate();

        if (!validationResult.isValid) {
            return;
        }

        this.saveMedicationHistory();
    }

    onMedicationHistorySelect($event) {
        const selectedMedicationHistory = $event.selectedRowsData[0];
        if (!selectedMedicationHistory)
            return;

        const selectedMedicationHistoryId = selectedMedicationHistory.id;

        this.medicationHistoryService.getById(selectedMedicationHistoryId)
            .then((medicationHistory) => {
                this.medicationHistory = medicationHistory;

                const medicationNameId = medicationHistory.medicationNameId;
                this.medicationNameId = medicationNameId;

                if (medicationNameId) {
                    this.medicationService.getMedicationInfo(medicationNameId)
                        .then(medicationItemInfo => {
                            this.medicationItemInfo = medicationItemInfo;
                            this.isMedicationHistoryPopupOpened = true;
                            this.isNewMedicationHistory = false;
                        })
                }
                else {
                    this.isMedicationHistoryPopupOpened = true;
                    this.isNewMedicationHistory = false;
                }
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    private saveMedicationHistory(): void {
        this.medicationHistoryService.save(this.medicationHistory)
            .then(() => {
                if (this.medicationHistoryDataGrid && this.medicationHistoryDataGrid.instance) {
                    this.medicationHistoryDataGrid
                        .instance.refresh();
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

    private initSelectableLists() {
        const medicationUnitsListConfig =
            new SelectableListConfigModel(this.companyId,
                SelectableListsNames.medications.medicationsUnits,
                LibrarySelectableListIds.medications.medicationsUnits);

        const medicationRouteListConfig =
            new SelectableListConfigModel(this.companyId,
                SelectableListsNames.medications.medicationsRoute,
                LibrarySelectableListIds.medications.medicationsRoute);

        const medicationDoseScheduleListConfig =
            new SelectableListConfigModel(this.companyId,
                SelectableListsNames.medications.medicationsDoseSchedule,
                LibrarySelectableListIds.medications.medicationsDoseSchedule);

        const medicationStatusListConfig =
            new SelectableListConfigModel(this.companyId,
                SelectableListsNames.medications.medicationsStatus,
                LibrarySelectableListIds.medications.medicationsStatus);

        const selectableLists = [
            medicationUnitsListConfig,
            medicationRouteListConfig,
            medicationDoseScheduleListConfig,
            medicationStatusListConfig
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
            key: "id",
            loadUrl: this.dxDataUrlService.getGridUrl("medicationhistory"),
            onBeforeSend: this.devextremeAuthService
                .decorateOnBeforeSendMethod((method, jQueryAjaxSettings) => {
                    jQueryAjaxSettings.data.patientId = this.patientId;
                }, this)
        });

        this.medicationHistoryDataSource.store = appointmentStore;
        this.applyDecoratorForDataSourceLoadFunc(appointmentStore)
    }

    private applyDecoratorForDataSourceLoadFunc(store: any) {
        const nativeLoadFunc = store.load;
        store.load = loadOptions => {
            return nativeLoadFunc.call(store, loadOptions)
                .then(result => {
                    result.forEach(item => {
                        item.createDate =
                            DateHelper.sqlServerUtcDateToLocalJsDate(item.createDate);
                    });
                    return result;
                });
        };
    }

    private setHistoryExistence() {
        this.medicationHistoryService.isHistoryExist(this.patientId)
            .then(isHistoryExist => {
                this.isHistoryExist = isHistoryExist;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    private resetMedicationPrescriptionFields(medication: string = "", medicationNameId: string = "") {
        this.medicationHistory.medication = medication;
        this.medicationHistory.medicationNameId = medicationNameId;
        this.medicationHistory.dosageForm = "";
        this.medicationHistory.dose = "";
        this.medicationHistory.route = "";
        this.medicationHistory.units = "";
    }

    private initMedicationNameDataSource(): void {
        this.medicationNameDataSource.store = createStore({
            loadUrl: this.dxDataUrlService.getLookupUrl("medication/name"),
            key: "Id",
            onBeforeSend: this.devextremeAuthService
                .decorateOnBeforeSendMethod((method, jQueryAjaxSettings) => { }, this)
        });
    }
}