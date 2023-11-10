import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AlertService } from 'src/app/_services/alert.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { PatientChartItemService } from 'src/app/_services/patient-chart-item.service';
import { ExpressionTestEntityIds } from 'src/app/_classes/expressionTestEntityIds';

@Component({
  selector: 'patient-chart-provider',
  templateUrl: './patient-chart-provider.component.html',
})
export class PatientChartProviderComponent implements OnInit {
  @Input() companyId?: string;

  @Output()
  patientChartItemGenerated: EventEmitter<string> = new EventEmitter();

  patientChartId = '';
  patientChartDataSource: any = {};
  expressionReturnData: any;

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private patientChartItemService: PatientChartItemService,
  ) {}

  get isLibraryExpression(): boolean {
    return !this.companyId;
  }

  ngOnInit() {
    this.initPatientChartDataSource();
  }

  onPatientChartChanged($event: any) {
    const patientChartId = $event.value;
    if (!patientChartId) return;

    this.patientChartItemService
      .getPatientChartHtmlElementString(patientChartId, this.companyId ? this.companyId : '', ExpressionTestEntityIds.admissionId)
      // .then(expressionItemHtmlElementString => {
      .then(response => {
        this.patientChartItemGenerated.next(response);

        this.patientChartId = '';
      })
      .catch(error => {
        this.patientChartId = '';
        this.alertService.error(error.message ? error.message : error);
      });
  }

  private initPatientChartDataSource() {
    if (!this.isLibraryExpression && this.companyId) {
      this.patientChartDataSource.store = createStore({
        loadUrl: this.dxDataUrlService.getEntityEndpointUrl('') + ApiBaseUrls.patientChart + '/list',
        key: 'Id',
        onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
          (method, jQueryAjaxSettings) => {
            jQueryAjaxSettings.data.companyId = this.companyId;
          },
          this
        ),
      });
      return;
    }

  }

}
