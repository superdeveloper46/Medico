import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import notify from 'devextreme/ui/notify';
import { PatientChartTrackService } from '../../../../_services/patient-chart-track.service';
import { MeasurementSystem, VitalSignsConfig, MeasurementHelper } from '../../classes/vitalSignsConfig';
import { VitalSignsService } from '../../services/vital-signs.service';
import { AlertService } from 'src/app/_services/alert.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { VitalSigns } from 'src/app/patientChart/models/vitalSigns';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';

@Component({
  templateUrl: 'vital-signs-panel.component.html',
  selector: 'vital-signs-panel',
})
export class VitalSignsPanelComponent implements OnInit {
  @Input() patientId!: string;
  @Input() admissionId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() vitalSignsConfig!: VitalSignsConfig;

  @ViewChild('vitalSignsDataGrid', { static: false })
  vitalSignsDataGrid!: DxDataGridComponent;
  @ViewChild('vitalSignsPopup', { static: false })
  vitalSignsPopup!: DxPopupComponent;
  @ViewChild('vitalSignsForm', { static: false })
  vitalSignsForm!: DxFormComponent;

  searchConfiguration: SearchConfiguration = new SearchConfiguration();

  lastVitalSigns?: VitalSigns;

  selectedVitalSigns: Array<any> = [];
  vitalSigns?: VitalSigns;
  isNewVitalSigns = true;
  vitalSignsDataSource: any = {};

  displayPreviousVitalSigns: Nullable<boolean> = true;
  isVitalSignsPopupOpened = false;
  deleteEvent = false;
  loading = false;

  constructor(
    private alertService: AlertService,
    private vitalSignsService: VitalSignsService,
    private appointmentService: AppointmentService,
    private devextremeAuthService: DevextremeAuthService,
    private dxDataUrlService: DxDataUrlService,
    private patientChartTrackService: PatientChartTrackService,
    private selectableListService: SelectableListService,
    private repositoryService: RepositoryService
  ) {}

  get bloodPressurePositionListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.vitalSigns.bloodPressurePosition
    );
  }

  get bloodPressureLocationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.vitalSigns.bloodPressureLocation
    );
  }

  get oxygenSaturationTestListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.vitalSigns.oxygenSaturationTest
    );
  }

  ngOnInit(): void {
    this.init();
  }

  openVitalSignsCreationForm() {
    
    this.isVitalSignsPopupOpened = true;
   
    if(this.vitalSigns) {
      if(this.vitalSignsConfig.vitalSignUnits == MeasurementSystem.Metric) {
        this.vitalSigns.unit = "C";
      }
      else {
        this.vitalSigns.unit = "F";
      }
    }
  }

  onVitalSignsPopupShowing() {
    if (this.isNewVitalSigns) this.setVitalSignsDefaultValues();
  }

  onVitalSignsPopupHidden() {
    this.resetVitalSignsForm();
    this.selectedVitalSigns = [];
  }

  onSelectedVitalSigns($event: any) {
    if (this.deleteEvent) return;
    
    if (this.isSignedOff) {
      this.selectedVitalSigns = [];
      return;
    }

    const selectedVitalSigns = $event.selectedRowsData[0];
    if (!selectedVitalSigns) return;
    
    const selectedVitalSignsId = selectedVitalSigns.id;

    this.vitalSignsService
      .getById(selectedVitalSignsId)
      .then(vitalSigns => {
        this.vitalSigns = vitalSigns;
        this.isVitalSignsPopupOpened = true;
        this.isNewVitalSigns = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  createUpdateVitalSigns() {
    if (!this.vitalSigns) return;
    this.vitalSignsService
      .save(this.vitalSigns)
      .then(() => {
        this.patientChartTrackService.emitPatientChartChanges(
          PatientChartNodeType.VitalSignsNode
        );
        this.vitalSignsDataGrid.instance.refresh();
        this.resetVitalSignsForm();
        this.isVitalSignsPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private setVitalSignsDefaultValues() {
    if (!this.vitalSigns) return;

    this.vitalSigns.bloodPressureLocation =
      this.selectableListService.getSelectableListDefaultValueFromComponent(
        this,
        SelectableListsNames.vitalSigns.bloodPressureLocation
      );

    this.vitalSigns.bloodPressurePosition =
      this.selectableListService.getSelectableListDefaultValueFromComponent(
        this,
        SelectableListsNames.vitalSigns.bloodPressurePosition
      );

    this.vitalSigns.oxygenSaturationAtRest =
      this.selectableListService.getSelectableListDefaultValueFromComponent(
        this,
        SelectableListsNames.vitalSigns.oxygenSaturationTest
      );
  }

  private resetVitalSignsForm() {
    this.isNewVitalSigns = true;
    this.initNewVitalSigns();
  }

  private init(): any {
    this.initNewVitalSigns();
    this.setLastVitalSigns();
    this.initVitalSignsDataSource();
    this.initSelectableLists();
  }

  private setLastVitalSigns() {
    this.appointmentService
      .getByAdmissionId(this.admissionId)
      .then(appointment => {
        if (appointment) {
          const createDate = appointment.startDate;
          this.vitalSignsService
            .getLast(this.patientId, createDate)
            .then(vitalSigns => {
              if (vitalSigns) {
                this.lastVitalSigns = vitalSigns;
                this.lastVitalSigns.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(this.lastVitalSigns.createdDate);
              }
            })
            .catch(error =>
              this.alertService.error(error.message ? error.message : error)
            );
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initNewVitalSigns() {
    const vitalSigns = new VitalSigns();
    vitalSigns.admissionId = this.admissionId;
    vitalSigns.patientId = this.patientId;
    vitalSigns.createdDate = new Date();

    this.vitalSigns = vitalSigns;
  }

  private initVitalSignsDataSource(): any {
    const vitalSignsStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('vitalsigns'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
          jQueryAjaxSettings.data.admissionId = this.admissionId;
        },
        this
      ),
    });

    this.vitalSignsDataSource.store = vitalSignsStore;
    this.applyDecoratorForDataSourceLoadFunc(vitalSignsStore);
  }

  refreshPatientsGrid() {
    this.vitalSignsDataGrid.instance.refresh();
  }

  deleteVitalSign(id: string, $event: any) {
    $event.stopPropagation();
    this.deleteEvent = true;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the vital sign?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        const route = `vitalsigns/${id}`;
        this.repositoryService.delete(route).subscribe({
          next: _res => {
            notify('Vital sign deleted');
            this.vitalSignsDataGrid.instance.refresh();

            this.loading = false;
          },
          error: _error => {
            this.loading = false;
          },
        });
      }
    });
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any[]) => {
        // Sort by date descending
        result.sort((a, b) => {
          if (a.createdDate < b.createdDate) {
            return 1;
          } else if (a.createdDate > b.createdDate) {
            return -1;
          } else {
            return 0;
          }
        });

        // // Limit number of items to output
        const limit = parseInt(
          this.vitalSignsConfig.numberOfPreviousVitalSigns.toString()
        );
        result = result.slice(0, limit);

        result.forEach(item => {
          item.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(item.createdDate);
        });
        
        return result;
      });
    };
  }

  private initSelectableLists() {
    const bloodPressurePositionListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.vitalSigns.bloodPressurePosition,
      LibrarySelectableListIds.vitalSigns.bloodPressurePosition
    );

    const bloodPressureLocationListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.vitalSigns.bloodPressureLocation,
      LibrarySelectableListIds.vitalSigns.bloodPressureLocation
    );

    const oxygenSatTestListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.vitalSigns.oxygenSaturationTest,
      LibrarySelectableListIds.vitalSigns.oxygenSaturationTest
    );

    const selectableLists = [
      bloodPressurePositionListConfig,
      bloodPressureLocationListConfig,
      oxygenSatTestListConfig,
    ];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        // this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private temperatureCellValue(data: any) {
    var temperature = data.temperature;
    var temperatureConfigUnit = "F";
    if(this.vitalSignsConfig.vitalSignUnits == MeasurementSystem.Metric) {
      temperatureConfigUnit = "C";
    }

    if(temperatureConfigUnit.toLowerCase() != data.unit.toLowerCase()) {
      if(temperatureConfigUnit == 'C') {
        temperature = MeasurementHelper.convertTemperatureF2C(temperature);
      }
      else {
        temperature = MeasurementHelper.convertTemperatureC2F(temperature);
      }
    }

    if(temperature) {
      return temperature .toFixed(2) + ' ' + temperatureConfigUnit;
    }
    
    return 'no set';
    
  }
}
