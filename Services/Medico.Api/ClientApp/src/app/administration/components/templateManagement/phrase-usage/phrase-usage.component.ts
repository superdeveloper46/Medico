import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { Subscription } from 'rxjs';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { ButtonKeyCodes } from 'src/app/_classes/buttonKeyCodes';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { PhraseUsageReadModel } from 'src/app/administration/models/phraseUsageReadModel';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { PatientChartNodeUsePhraseReadModel } from 'src/app/administration/models/patientChartNodeUsePhraseReadModel';
import { PhraseUsageService } from 'src/app/administration/services/phrase-usage.service';
import { AlertService } from 'src/app/_services/alert.service';
import { TemplateUsePhraseReadModel } from 'src/app/administration/models/templateUsePhraseReadModel';

@Component({
  selector: 'phrase-usage',
  templateUrl: './phrase-usage.component.html',
})
export class PhraseUsageComponent
  extends BaseAdminComponent
  implements OnInit, OnDestroy
{
  @ViewChild('phraseUsagesGrid', { static: false })
  phraseUsagesGrid!: DxDataGridComponent;
  @ViewChild('phraseUsageManagePopup', { static: false })
  phraseUsageManagePopup!: DxPopupComponent;

  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;

  deleteBtnKeyCode: number = ButtonKeyCodes.delete;
  backspaceBtnKeyCode: number = ButtonKeyCodes.backspace;

  phraseUsage?: PhraseUsageReadModel;

  phraseUsageDataSource: any = {};
  selectedPhraseUsages: any[] = [];

  isManageTemplatesPopupOpen = false;
  isManageNodesPopupOpen = false;

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private companyIdService: CompanyIdService,
    private devextremeAuthService: DevextremeAuthService,
    private phraseUsageService: PhraseUsageService,
    private alertService: AlertService
  ) {
    super();
  }

  saveNodesChanges($event: PatientChartNodeUsePhraseReadModel[]) {
    if (!this.phraseUsage) return;

    this.phraseUsage.patientChartNodeUsePhrases = $event;
    this.phraseUsageService
      .save(this.phraseUsage)
      .then(() => {
        this.phraseUsage = new PhraseUsageReadModel();
        this.phraseUsagesGrid.instance.refresh();
        this.isManageNodesPopupOpen = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  saveTemplatesChanges($event: TemplateUsePhraseReadModel[]) {
    if (!this.phraseUsage) return;

    this.phraseUsage.templateUsePhrases = $event;
    this.phraseUsageService
      .save(this.phraseUsage)
      .then(() => {
        this.phraseUsage = new PhraseUsageReadModel();
        this.phraseUsagesGrid.instance.refresh();
        this.isManageTemplatesPopupOpen = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onPhraseUsageManagePopupHidden() {
    this.phraseUsage = new PhraseUsageReadModel();

    this.isManageTemplatesPopupOpen = false;
    this.isManageNodesPopupOpen = false;
  }

  ngOnDestroy() {
    this.companyIdSubscription?.unsubscribe();
  }

  ngOnInit() {
    this.init();
    this.subscribeToCompanyIdChanges();
  }

  managePatientChartNodes(phraseUsage: PhraseUsageReadModel, event: any) {
    event.stopPropagation();

    this.phraseUsage = phraseUsage;
    this.isManageNodesPopupOpen = true;
  }

  manageTemplates(phraseUsage: PhraseUsageReadModel, event: any) {
    event.stopPropagation();

    this.phraseUsage = phraseUsage;
    this.isManageTemplatesPopupOpen = true;
  }

  private init() {
    this.initPhraseUsageDataSource();
  }

  private initPhraseUsageDataSource() {
    this.phraseUsageDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl(ApiBaseUrls.phraseUsage),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;

        if (this.phraseUsagesGrid && this.phraseUsagesGrid.instance)
          this.phraseUsagesGrid.instance.refresh();
      }
    });
  }

  onPhraseUsageChanged(_$event: any) {
    throw 'onPhraseUsageChanged is not implemented';
  }
}
