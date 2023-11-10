import { Component, Input, OnInit } from '@angular/core';
import { AlertService } from 'src/app/_services/alert.service';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { VitalSignsConfig } from '../../classes/vitalSignsConfig';

@Component({
  selector: 'vital-signs',
  templateUrl: 'vital-signs.component.html',
})
export class VitalSignsComponent implements OnInit {
  @Input() companyId!: string;
  @Input() patientId!: string;
  @Input() admissionId!: string;
  @Input() isSignedOff!: boolean;

  vitalSignTabs: any[] = [
    { id: 1, title: 'Base Vital Signs', template: 'baseVitalSignsTemplate' },
    { id: 2, title: 'Vital Signs', template: 'vitalSignsTemplate' },
    { id: 3, title: 'Vision', template: 'visionTemplate' },
    { id: 4, title: 'Notes', template: 'notesTemplate' },
    { id: 5, title: 'Config', template: 'configTemplate' },
  ];

  canRenderComponent = false;

  vitalSignsConfig: VitalSignsConfig = new VitalSignsConfig();

  constructor(
    private alertService: AlertService,
    private selectableListService: SelectableListService
  ) {}

  ngOnInit(): void {
    this.init();
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
        this.canRenderComponent = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private init(): any {
    this.initSelectableLists();
  }
}
