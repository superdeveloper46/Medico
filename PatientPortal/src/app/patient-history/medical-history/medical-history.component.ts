import { Component, OnInit, Input, AfterViewInit, ViewChild } from "@angular/core";
import { DxDataGridComponent, DxPopupComponent, DxFormComponent } from "devextreme-angular";
import { createStore } from "devextreme-aspnet-data-nojquery";
import { PatientChartNodeType } from 'src/app/core/enums/patient-chart-node-types.enum';
import { DateHelper } from 'src/app/core/helpers/date.helper';
import { AlertService } from 'src/app/core/services/alert.service';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { DefaultValueService } from 'src/app/core/services/default-value.service';
import { DevextremeAuthService } from 'src/app/core/services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/core/services/dxDataUrl.service';
import { IcdCodeService } from 'src/app/core/services/icd-code.service';
import { BaseHistoryComponent } from '../classes/base-history-component';
import { MedicalHistoryModel } from '../models/medical-history.model';
import { MedicalHistoryService } from '../services/medical-history.service';

@Component({
    templateUrl: "medical-history.component.html",
    selector: "medical-history"
})
export class MedicalHistoryComponent extends BaseHistoryComponent implements OnInit, AfterViewInit {
    @ViewChild("medicalHistoryDataGrid", { static: false }) medicalHistoryDataGrid: DxDataGridComponent;
    @ViewChild("medicalHistoryPopup", { static: false }) medicalHistoryPopup: DxPopupComponent;
    @ViewChild("medicalHistoryForm", { static: false }) medicalHistoryForm: DxFormComponent;

    isMedicalHistoryPopupOpened: boolean = false;

    isHistoryExist: boolean = false;

    selectedMedicalHistory = [];
    medicalHistory: any = new MedicalHistoryModel();

    isNewMedicalHistory: boolean = true;
    medicalHistoryDataSource: any = {};

    icdCodesDataSource: any = {};

    constructor(private alertService: AlertService,
        private medicalHistoryService: MedicalHistoryService,
        private dxDataUrlService: DxDataUrlService,
        private icdCodeService: IcdCodeService,
        defaultValueService: DefaultValueService,
        private devextremeAuthService: DevextremeAuthService,
        authenticationService: AuthenticationService) {
        super(defaultValueService, authenticationService);

        this.init();
    }

    onPhraseSuggestionApplied($event) {
        this.medicalHistory.notes = $event;
    }

    onMedicalHistoryFieldChanged($event) {
        const dataField = $event.dataField;
        const fieldValue = $event.value;

        if (dataField === "icdCode" && fieldValue) {
            this.icdCodeService.getById(fieldValue)
                .then(icdCode => {
                    this.medicalHistory.diagnosis = icdCode.name;
                    this.medicalHistory.icdCode = "";
                })
                .catch(error => this.alertService.error(error.message ? error.message : error));
        }
    }

    ngAfterViewInit(): void {
        this.registerEscapeBtnEventHandler(this.medicalHistoryPopup);
    }

    deleteHistory(medicalHistory: MedicalHistoryModel, $event) {
        $event.stopPropagation();
        const medicalHistoryId = medicalHistory.id;

        const confirmationPopup = this.alertService
            .confirm("Are you sure you want to delete the history ?", "Confirm deletion");

        confirmationPopup.then(dialogResult => {
            if (dialogResult) {
                this.medicalHistoryService.delete(medicalHistoryId)
                    .then(() => {
                        this.medicalHistoryDataGrid.instance.refresh();
                        this.setHistoryExistence();
                    });
            }
        });
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.setHistoryExistence();
    }

    openMedicalHistoryForm() {
        this.isMedicalHistoryPopupOpened = true;
    }

    onMedicalHistoryPopupHidden() {
        this.isNewMedicalHistory = true;;
        this.selectedMedicalHistory = [];
        this.medicalHistory = new MedicalHistoryModel();
    }

    createUpdateMedicalHistory() {
        const validationResult = this.medicalHistoryForm.instance
            .validate();

        if (!validationResult.isValid) {
            return;
        }

        if (this.isNewMedicalHistory)
            this.medicalHistory.patientId = this.patientId;

        this.medicalHistoryService.save(this.medicalHistory)
            .then(() => {
                if (this.medicalHistoryDataGrid && this.medicalHistoryDataGrid.instance) {
                    this.medicalHistoryDataGrid
                        .instance.refresh();
                }

                this.isHistoryExist = true;
                this.isMedicalHistoryPopupOpened = false;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    onMedicalHistorySelect($event) {
        const selectedMedicalHistory = $event.selectedRowsData[0];
        if (!selectedMedicalHistory)
            return;

        const selectedMedicalHistoryId = selectedMedicalHistory.id;

        this.medicalHistoryService.getById(selectedMedicalHistoryId)
            .then((medicalHistory) => {
                this.medicalHistory = medicalHistory;
                this.isMedicalHistoryPopupOpened = true;
                this.isNewMedicalHistory = false;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    private init(): any {
        this.initMedicalHistoryDataSource();
        this.initIcdCodeDataSource();
        this.initDefaultHistoryValue(PatientChartNodeType.PreviousMedicalHistoryNode);
    }

    private setHistoryExistence() {
        this.medicalHistoryService.isHistoryExist(this.patientId)
            .then(isHistoryExist => {
                this.isHistoryExist = isHistoryExist;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    private initMedicalHistoryDataSource(): any {
        const appointmentStore = createStore({
            key: "id",
            loadUrl: this.dxDataUrlService.getGridUrl("medicalhistory"),
            onBeforeSend: this.devextremeAuthService
                .decorateOnBeforeSendMethod((method, jQueryAjaxSettings) => {
                    jQueryAjaxSettings.data.patientId = this.patientId;
                }, this)
        });

        this.medicalHistoryDataSource.store = appointmentStore;
        this.applyDecoratorForDataSourceLoadFunc(appointmentStore)
    }

    private applyDecoratorForDataSourceLoadFunc(store: any) {
        const nativeLoadFunc = store.load;
        store.load = loadOptions => {
            return nativeLoadFunc.call(store, loadOptions)
                .then(result => {
                    result.forEach(item => {
                        item.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.createDate);
                    });
                    return result;
                });
        };
    }

    private initIcdCodeDataSource(): void {
        this.icdCodesDataSource.store = createStore({
            loadUrl: this.dxDataUrlService.getLookupUrl("icdcode"),
            key: "Id",
            onBeforeSend: this.devextremeAuthService
                .decorateOnBeforeSendMethod((method, jQueryAjaxSettings) => { }, this)
        });
    }
}