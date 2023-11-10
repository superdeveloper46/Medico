import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { BaseVitalSigns } from 'src/app/patientChart/models/baseVitalSigns';
import { PatientChartTrackService } from '../../../../_services/patient-chart-track.service';
import { BaseVitalSignsService } from '../../services/base-vital-signs.service';
import { MeasurementSystem, VitalSignsConfig } from '../../classes/vitalSignsConfig';
import { AlertService } from 'src/app/_services/alert.service';
import { MedicalCalculationHelper } from 'src/app/_helpers/medical-calculation.helper';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { PatientService } from 'src/app/_services/patient.service';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { Constants } from 'src/app/_classes/constants';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { RepositoryService } from 'src/app/_services/repository.service';
import { angularEditorConfig } from '@kolkov/angular-editor/lib/config';
import { retryWhen } from 'rxjs';
import { custom } from 'devextreme/ui/dialog';

@Component({
  templateUrl: 'base-vital-signs.component.html',
  selector: 'base-vital-signs',
})
export class BaseVitalSignsComponent implements OnInit {
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() vitalSignsConfig!: VitalSignsConfig;

  @ViewChild('baseVitalSignsPopup', { static: false })
  baseVitalSignsPopup!: DxPopupComponent;

  baseVitalSigns: BaseVitalSigns;
  baseVitalSignsCopy?: BaseVitalSigns | any;

  isNewBaseVitalSigns = true;

  isBaseVitalSignsPopupOpened = false;

  patientDateOfBirth: any = null;

  accordions: any[] = [
    {
      ID: 1,
      AccName: 'Super Mart of the West',
    },
    {
      ID: 2,
      AccName: 'Electronics Depot',
    },
  ];
  history: any[] = [];

  constructor(
    private alertService: AlertService,
    private baseVitalSignsService: BaseVitalSignsService,
    private patientChartTrackService: PatientChartTrackService,
    private selectableListService: SelectableListService,
    private patientService: PatientService,
    private repositoryService: RepositoryService
  ) {
    this.baseVitalSigns = new BaseVitalSigns();
  }

  dominantHand: string[] = ['Right', 'Left'];

  get oxygenUseListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.vitalSigns.oxygenUseType
    );
  }

  get bmi(): string {
    const patientWeight = this.baseVitalSigns.weight;
    const patientHeight = this.baseVitalSigns.height;

    return MedicalCalculationHelper.calculateBmi(patientHeight, patientWeight);
  }

  public calcBmi(patientHeight: number, patientWeight: number) {
    return MedicalCalculationHelper.calculateBmi(patientHeight, patientWeight);
  }

  get isHeadCircumferenceEnabled(): boolean {
    if (!this.patientDateOfBirth) return false;

    return DateHelper.getAge(this.patientDateOfBirth) <= 3;
  }

  get oxygenUseInfo(): string {
    const noSetMessage = Constants.messages.notSet;

    const oxygenUse = this.baseVitalSigns.oxygenUse || noSetMessage;
    const oxygenAmount = this.baseVitalSigns.oxygenAmount || noSetMessage;

    return oxygenUse === noSetMessage && oxygenAmount === noSetMessage
      ? ''
      : `${oxygenAmount} / ${oxygenUse}`;
  }

  get weightUnit(): string {
    if (this.vitalSignsConfig.vitalSignUnits == MeasurementSystem.Metric) {
      return 'kg';
    } else if (this.vitalSignsConfig.vitalSignUnits != MeasurementSystem.Imperial) {
      console.log(`Unknown unit: ${this.vitalSignsConfig.vitalSignUnits}`);
    }
    return 'lbs';
  }

  get distanceUnit(): string {
    if (this.vitalSignsConfig.vitalSignUnits == MeasurementSystem.Metric) {
      return 'cm';
    } else if (this.vitalSignsConfig.vitalSignUnits != MeasurementSystem.Imperial) {
      console.log(`Unknown unit: ${this.vitalSignsConfig.vitalSignUnits}`);
    }
    return 'inches';
  }

  onBaseVitalSignsPopupDisposing() {
    this.baseVitalSignsCopy = undefined;
  }

  ngOnInit(): void {
    this.init();
  }

  openBaseVitalSignsForm() {
    if (this.isNewBaseVitalSigns) {
      this.baseVitalSigns.dominantHand = this.dominantHand[0];
    }

    const baseVitalSignsString = JSON.stringify(this.baseVitalSigns);
    this.baseVitalSignsCopy = JSON.parse(baseVitalSignsString);

    (<any>this.baseVitalSignsCopy)['isOxygenUse'] =
      !!this.baseVitalSignsCopy?.oxygenUse || !!this.baseVitalSignsCopy?.oxygenAmount;

    this.isBaseVitalSignsPopupOpened = true;
  }

  createUpdateBaseVitalSigns() {
    if (!this.baseVitalSignsCopy) return;

    if (!(<any>this.baseVitalSignsCopy)['isOxygenUse']) {
      this.baseVitalSignsCopy.oxygenUse = undefined;
      this.baseVitalSignsCopy.oxygenAmount = undefined;
    }

    // check value changes or not

    if(this.baseVitalSigns.weight != this.baseVitalSignsCopy.weight || 
      this.baseVitalSigns.height != this.baseVitalSignsCopy.height || 
      this.baseVitalSigns.dominantHand != this.baseVitalSignsCopy.dominantHand || 
      this.baseVitalSigns.headCircumference != this.baseVitalSignsCopy.headCircumference || 
      this.baseVitalSigns.rightBicep != this.baseVitalSignsCopy.rightBicep || 
      this.baseVitalSigns.rightForearm != this.baseVitalSignsCopy.rightForearm || 
      this.baseVitalSigns.rightThigh != this.baseVitalSignsCopy.rightThigh || 
      this.baseVitalSigns.rightCalf != this.baseVitalSignsCopy.rightCalf || 
      this.baseVitalSigns.leftBicep != this.baseVitalSignsCopy.leftBicep || 
      this.baseVitalSigns.leftForearm != this.baseVitalSignsCopy.leftForearm || 
      this.baseVitalSigns.leftThigh != this.baseVitalSignsCopy.leftThigh || 
      this.baseVitalSigns.leftCalf != this.baseVitalSignsCopy.leftCalf || 
      this.baseVitalSigns.oxygenAmount != this.baseVitalSignsCopy.oxygenAmount || 
      this.baseVitalSigns.oxygenUse != this.baseVitalSignsCopy.oxygenUse
    ) {
      this.baseVitalSignsService
      .save(this.baseVitalSignsCopy)
      .then(vitalSigns => {
        if (!this.baseVitalSignsCopy) return;

        this.bindVitalSignsHistory();
        this.patientChartTrackService.emitPatientChartChanges(
          PatientChartNodeType.VitalSignsNode
        );

        if (this.isNewBaseVitalSigns) this.baseVitalSignsCopy.id = vitalSigns.id;

        this.baseVitalSigns = this.baseVitalSignsCopy;
        this.baseVitalSigns.createdOn = vitalSigns.createdOn;
        this.isBaseVitalSignsPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
    }
    else {
      const myDialog = custom({
        title: 'Warning',
        messageHtml: 'There is no changes. Do you want to save?',
        buttons: [
          {
            text: 'Save and Proceed',
            onClick: () => {
              this.baseVitalSignsService
              .save(this.baseVitalSignsCopy)
              .then(vitalSigns => {
                if (!this.baseVitalSignsCopy) return;

                this.bindVitalSignsHistory();
                this.patientChartTrackService.emitPatientChartChanges(
                  PatientChartNodeType.VitalSignsNode
                );

                if (this.isNewBaseVitalSigns) this.baseVitalSignsCopy.id = vitalSigns.id;

                this.baseVitalSigns = this.baseVitalSignsCopy;
                this.baseVitalSigns.createdOn = vitalSigns.createdOn;
                this.isBaseVitalSignsPopupOpened = false;
              })
              .catch(error => this.alertService.error(error.message ? error.message : error));
              return ;
            },
          },
          {
            text: 'Cancel',
            onClick: () => {
              return ;
            },
          },
        ],
      });
  
      return myDialog.show();
    }
    
  }

  private initBaseVitalSigns() {
    (<any>this.baseVitalSigns)['isOxygenUse'] = false;

    this.baseVitalSignsService.getByPatientId(this.patientId).then(baseVitalsigns => {
      if (baseVitalsigns) {
        this.baseVitalSigns = baseVitalsigns;
        if(this.baseVitalSigns.createdOn) {
          this.baseVitalSigns.createdOn = DateHelper.jsLocalDateToSqlServerUtc(this.baseVitalSigns.createdOn);
        }
        
        this.isNewBaseVitalSigns = false;
      } else {
        this.baseVitalSigns.patientId = this.patientId;
      }
    });
  }

  private init(): any {
    this.initSelectableLists();
    this.initBaseVitalSigns();
    this.setPatientDateOfBirth();
    this.bindVitalSignsHistory();
  }

  private setPatientDateOfBirth() {
    this.patientService
      .getById(this.patientId)
      .then(patient => {
        this.patientDateOfBirth = patient.dateOfBirth;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initSelectableLists() {
    const oxygenUseListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.vitalSigns.oxygenUseType,
      LibrarySelectableListIds.vitalSigns.oxygenUseType
    );

    const selectableLists = [oxygenUseListConfig];

    this.selectableListService.setSelectableListsValuesToComponent(selectableLists, this);
  }

  bindVitalSignsHistory() {
    const apiUrl = `baseVitalSigns/history/patient/${this.patientId}`;

    this.repositoryService.getData(apiUrl).subscribe({
      next: data => {
        this.history = data.data;
        this.history.forEach(item => {
          item.createdOn = DateHelper.jsLocalDateToSqlServerUtc(item.createdOn);
        });
      },
      error: _err => {},
    });
  }
}
