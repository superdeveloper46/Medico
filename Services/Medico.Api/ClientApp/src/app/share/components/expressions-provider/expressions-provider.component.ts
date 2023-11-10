import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AlertService } from 'src/app/_services/alert.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { ExpressionItemService } from 'src/app/_services/expression-item.service';
import { ExpressionTestEntityIds } from 'src/app/_classes/expressionTestEntityIds';

@Component({
  selector: 'expressions-provider',
  templateUrl: './expressions-provider.component.html',
})
export class ExpressionsProviderComponent implements OnInit {
  @Input() companyId?: string;

  @Output()
  expressionItemGenerated: EventEmitter<string> = new EventEmitter();

  expressionId = '';
  expressionDataSource: any = {};
  expressionReturnData: any;

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private expressionItemService: ExpressionItemService,
  ) {}

  get isLibraryExpression(): boolean {
    return !this.companyId;
  }

  ngOnInit() {
    this.initExpressionDataSource();
  }

  onExpressionChanged($event: any) {
    const expressionId = $event.value;
    if (!expressionId) return;

    this.expressionItemService
      .getExpressionHtmlElementString(expressionId, ExpressionTestEntityIds.admissionId)
      // .then(expressionItemHtmlElementString => {
      .then(response => {
        this.expressionItemGenerated.next(response);

        this.expressionId = '';
      })
      .catch(error => {
        this.expressionId = '';
        this.alertService.error(error.message ? error.message : error);
      });
  }

  private initExpressionDataSource() {
    if (!this.isLibraryExpression && this.companyId) {
      this.initCompanyExpressionDataSource(this.companyId);
      return;
    }

    this.initLibraryExpressionDataSource();
  }

  private initCompanyExpressionDataSource(_companyId: string) {
    this.expressionDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.expressions),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private initLibraryExpressionDataSource() {
    this.expressionDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.libraryExpressions),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(() => {}, this),
    });
  }
}
