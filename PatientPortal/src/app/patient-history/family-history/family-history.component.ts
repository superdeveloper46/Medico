import { Component, OnInit, Input, AfterViewInit, ViewChild } from "@angular/core";
import { DxDataGridComponent, DxPopupComponent, DxFormComponent } from "devextreme-angular";
import { createStore } from "devextreme-aspnet-data-nojquery";
import { LibrarySelectableListIds } from 'src/app/core/constants/library-selectable-list-ids.const';
import { SelectableListsNames } from 'src/app/core/constants/selectable-lists-names';
import { PatientChartNodeType } from 'src/app/core/enums/patient-chart-node-types.enum';
import { DateHelper } from 'src/app/core/helpers/date.helper';
import { SelectableListConfigModel } from 'src/app/core/models/selectable-list-config.model';
import { AlertService } from 'src/app/core/services/alert.service';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { DefaultValueService } from 'src/app/core/services/default-value.service';
import { DevextremeAuthService } from 'src/app/core/services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/core/services/dxDataUrl.service';
import { IcdCodeService } from 'src/app/core/services/icd-code.service';
import { SelectableListService } from 'src/app/core/services/selectable-list.service';
import { BaseHistoryComponent } from '../classes/base-history-component';
import { FamilyHistoryModel } from '../models/family-history.model';
import { FamilyHistoryService } from '../services/family-history.service';

@Component({
    templateUrl: "family-history.component.html",
    selector: "family-history"
})
export class FamilyHistoryComponent extends BaseHistoryComponent implements OnInit, AfterViewInit {
    @ViewChild("familyHistoryDataGrid", { static: false }) familyHistoryDataGrid: DxDataGridComponent;
    @ViewChild("familyHistoryPopup", { static: false }) familyHistoryPopup: DxPopupComponent;
    @ViewChild("familyHistoryForm", { static: false }) familyHistoryForm: DxFormComponent;

    canRenderComponent: boolean = false;

    isFamilyHistoryPopupOpened: boolean = false;

    isHistoryExist: boolean = false;

    selectedFamilyHistory: Array<any> = [];
    familyHistory: any = new FamilyHistoryModel();

    isNewFamilyHistory: boolean = true;

    familyHistoryDataSource: any = {};
    icdCodesDataSource: any = {};

    constructor(private alertService: AlertService,
        private familyHistoryService: FamilyHistoryService,
        private selectableListService: SelectableListService,
        private dxDataUrlService: DxDataUrlService,
        private icdCodeService: IcdCodeService,
        defaultValueService: DefaultValueService,
        private devextremeAuthService: DevextremeAuthService,
        authenticationService: AuthenticationService) {

        super(defaultValueService, authenticationService);

        this.init();
    }

    onPhraseSuggestionApplied($event) {
        this.familyHistory.notes = $event;
    }

    get familyListValues(): string[] {
        return this.selectableListService
            .getSelectableListValuesFromComponent(this, SelectableListsNames.familyHistory.familyMembers)
    }

    get familyStatusListValues(): string[] {
        return this.selectableListService
            .getSelectableListValuesFromComponent(this, SelectableListsNames.familyHistory.familyStatus)
    }

    onFamilyHistoryFieldChanged($event) {
        const dataField = $event.dataField;
        const fieldValue = $event.value;

        if (dataField === "icdCode" && fieldValue) {
            this.icdCodeService.getById(fieldValue)
                .then(icdCode => {
                    this.familyHistory.diagnosis = icdCode.name;
                    this.familyHistory.icdCode = "";
                })
                .catch(error => this.alertService.error(error.message ? error.message : error));
        }
    }

    ngAfterViewInit(): void {
        this.registerEscapeBtnEventHandler(this.familyHistoryPopup);
    }

    deleteHistory(familyHistory: FamilyHistoryModel, $event) {
        $event.stopPropagation();
        const familyHistoryId = familyHistory.id;

        const confirmationPopup = this.alertService
            .confirm("Are you sure you want to delete the history ?", "Confirm deletion");

        confirmationPopup.then(dialogResult => {
            if (dialogResult) {
                this.familyHistoryService.delete(familyHistoryId)
                    .then(() => {
                        this.familyHistoryDataGrid.instance.refresh();
                        this.setHistoryExistence();
                    });
            }
        });
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.initSelectableLists();
        this.setHistoryExistence();
        this.initDefaultHistoryValue(PatientChartNodeType.FamilyHistoryNode);
    }

    openFamilyHistoryForm() {
        this.isFamilyHistoryPopupOpened = true;
    }

    onFamilyHistoryPopupHidden() {
        this.isNewFamilyHistory = true;;
        this.selectedFamilyHistory = [];
        this.familyHistory = new FamilyHistoryModel();
    }

    createUpdateFamilyHistory() {
        const validationResult = this.familyHistoryForm.instance
            .validate();

        if (!validationResult.isValid) {
            return;
        }

        if (this.isNewFamilyHistory)
            this.familyHistory.patientId = this.patientId;

        this.familyHistoryService.save(this.familyHistory)
            .then(() => {
                if (this.familyHistoryDataGrid && this.familyHistoryDataGrid.instance) {
                    this.familyHistoryDataGrid
                        .instance.refresh();
                }

                this.isHistoryExist = true;
                this.isFamilyHistoryPopupOpened = false;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    onFamilyHistorySelect($event) {
        const selectedFamilyHistory = $event.selectedRowsData[0];
        if (!selectedFamilyHistory)
            return;

        const selectedFamilyHistoryId = selectedFamilyHistory.id;

        this.familyHistoryService.getById(selectedFamilyHistoryId)
            .then((familyHistory) => {
                this.familyHistory = familyHistory;
                this.isFamilyHistoryPopupOpened = true;
                this.isNewFamilyHistory = false;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    private init(): any {
        this.initFamilyHistoryDataSource();
        this.initIcdCodeDataSource();
    }

    private initSelectableLists() {
        const familyListConfig =
            new SelectableListConfigModel(this.companyId,
                SelectableListsNames.familyHistory.familyMembers,
                LibrarySelectableListIds.familyHistory.familyMembers);

        const familyStatusListConfig =
            new SelectableListConfigModel(this.companyId,
                SelectableListsNames.familyHistory.familyStatus,
                LibrarySelectableListIds.familyHistory.familyStatus);

        const selectableLists = [
            familyStatusListConfig,
            familyListConfig
        ];

        this.selectableListService
            .setSelectableListsValuesToComponent(selectableLists, this)
            .then(() => {
                this.canRenderComponent = true;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
    }

    private initFamilyHistoryDataSource(): any {
        const appointmentStore = createStore({
            key: "id",
            loadUrl: this.dxDataUrlService.getGridUrl("familyhistory"),
            onBeforeSend: this.devextremeAuthService
                .decorateOnBeforeSendMethod((method, jQueryAjaxSettings) => {
                    jQueryAjaxSettings.data.patientId = this.patientId;
                }, this)
        });

        this.familyHistoryDataSource.store = appointmentStore;
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

    private setHistoryExistence() {
        this.familyHistoryService.isHistoryExist(this.patientId)
            .then(isHistoryExist => {
                this.isHistoryExist = isHistoryExist;
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
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