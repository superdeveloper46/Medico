import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { VisionVitalSigns } from 'src/app/patientChart/models/visionVitalSigns';
import { AlertService } from 'src/app/_services/alert.service';
import { VisionVitalSignsService } from '../../services/vision-vital-signs.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { Constants } from 'src/app/_classes/constants';
import { StringHelper } from 'src/app/_helpers/string.helper';

@Component({
  templateUrl: 'vision-vital-signs.component.html',
  selector: 'vision-vital-signs',
})
export class VisionVitalSignsComponent implements OnInit {
  @Input() patientId!: string;
  @Input() isSignedOff!: boolean;

  @ViewChild('visionVitalSignsPopup', { static: false })
  visionVitalSignsPopup!: DxPopupComponent;
  @ViewChild('visionVitalSignsForm', { static: false })
  visionVitalSignsForm!: DxFormComponent;
  @ViewChild('visionVitalSignsDataGrid', { static: false })
  visionVitalSignsDataGrid!: DxDataGridComponent;

  searchConfiguration: SearchConfiguration = new SearchConfiguration();

  visionVitalSignsDataSource: any = {};

  selectedVisionVitalSigns: any[] = [];

  visionVitalSigns?: VisionVitalSigns;

  isNewVisionVitalSigns = true;

  isVisionVitalSignsPopupOpened = false;

  constructor(
    private alertService: AlertService,
    private visionVitalSignsService: VisionVitalSignsService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService
  ) {}

  getVisionValue(visionValue: string): string {
    if (!visionValue) return 'not set';

    const visualAcuityRating = Constants.vitalSigns.visionVitalSigns.visualAcuityRating;

    const visionValueTemplate = Constants.vitalSigns.visionVitalSigns.visionValueTemplate;

    return StringHelper.format(visionValueTemplate, visualAcuityRating, visionValue);
  }

  openVisionVitalSignsForm() {
    this.isVisionVitalSignsPopupOpened = true;
  }

  onSelectedVisionVitalSigns($event: any) {
    if (this.isSignedOff) {
      this.selectedVisionVitalSigns = [];
      return;
    }

    const selectedVitalSigns = $event.selectedRowsData[0];
    if (!selectedVitalSigns) return;

    const selectedVitalSignsId = selectedVitalSigns.id;

    this.visionVitalSignsService
      .getById(selectedVitalSignsId)
      .then(visionVitalSigns => {
        this.visionVitalSigns = visionVitalSigns;
        this.isVisionVitalSignsPopupOpened = true;
        this.isNewVisionVitalSigns = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  ngOnInit(): void {
    this.init();
  }

  createUpdateVisionVitalSigns() {
    const validationResult = this.visionVitalSignsForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.visionVitalSigns) {
      return;
    }

    this.visionVitalSignsService
      .save(this.visionVitalSigns)
      .then(() => {
        this.visionVitalSignsDataGrid.instance.refresh();
        this.resetVisionVitalSignsForm();
        this.isVisionVitalSignsPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onVisionVitalSignsPopupHidden() {
    this.resetVisionVitalSignsForm();
    this.selectedVisionVitalSigns = [];
  }

  private resetVisionVitalSignsForm() {
    this.isNewVisionVitalSigns = true;
    this.initVisionVitalSigns();
  }

  private initVisionVitalSigns() {
    const vitalSigns = new VisionVitalSigns();
    vitalSigns.patientId = this.patientId;

    this.visionVitalSigns = vitalSigns;
  }

  private init(): any {
    this.initVisionVitalSigns();
    this.initVisionVitalSignsDataSource();
  }

  private initVisionVitalSignsDataSource(): any {
    const vitalSignsStore = createStore({
      key: 'id',
      loadUrl: this.dxDataUrlService.getGridUrl('visionvitalsigns'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.patientId = this.patientId;
        },
        this
      ),
    });

    this.visionVitalSignsDataSource.store = vitalSignsStore;
    this.applyDecoratorForDataSourceLoadFunc(vitalSignsStore);
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
}
