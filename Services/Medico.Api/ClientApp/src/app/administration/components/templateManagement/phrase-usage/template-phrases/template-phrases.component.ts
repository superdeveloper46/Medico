import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { LookupModel } from 'src/app/_models/lookupModel';
import { AlertService } from 'src/app/_services/alert.service';
import { TemplateUsePhraseReadModel } from 'src/app/administration/models/templateUsePhraseReadModel';

@Component({
  selector: 'template-phrases',
  templateUrl: './template-phrases.component.html',
})
export class TemplatePhrasesComponent implements OnInit {
  @Input() companyId!: string;
  @Input() phraseId?: string;
  @Input() phraseName?: string;
  @Input() templateUsePhrases?: TemplateUsePhraseReadModel[];

  @Output() cancelTemplatesManaging = new EventEmitter<void>();

  @Output() saveTemplatesChanges = new EventEmitter<TemplateUsePhraseReadModel[]>();

  templateUsePhrasesCopy: TemplateUsePhraseReadModel[] = [];

  templateDataSource: any = {};

  selectedTemplate?: LookupModel;

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.init();
  }

  saveTemplates() {
    this.saveTemplatesChanges.next(this.templateUsePhrasesCopy);
  }

  cancelSavingTemplates() {
    this.cancelTemplatesManaging.next();
  }

  deleteTemplate(templateId: string) {
    this.alertService
      .confirm('Are you sure you want to delete template ?', 'Delete Confirmation')
      .then(result => {
        if (!result) return;

        const indexTemplateToDelete = this.templateUsePhrasesCopy.findIndex(
          n => n.templateId === templateId
        );

        this.templateUsePhrasesCopy.splice(indexTemplateToDelete, 1);
      });
  }

  addTemplate() {
    if (!this.selectedTemplate) return;

    const alreadySelectedTemplate = this.templateUsePhrasesCopy.find(
      t => t.templateId === this.selectedTemplate?.id
    );

    if (alreadySelectedTemplate) {
      this.alertService.warning('Template is already added');
      this.selectedTemplate = undefined;
      return;
    }

    this.templateUsePhrasesCopy.push({
      templateId: this.selectedTemplate.id,
      templateName: this.selectedTemplate.name,
    });

    this.selectedTemplate = undefined;
  }

  private init() {
    this.templateUsePhrasesCopy = JSON.parse(JSON.stringify(this.templateUsePhrases));

    this.initTemplateDataSource();
  }

  private initTemplateDataSource() {
    this.templateDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.templates),
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }
}
