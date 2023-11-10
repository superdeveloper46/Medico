import { Component, Input, OnInit } from '@angular/core';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { AlertService } from 'src/app/_services/alert.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';

@Component({
  selector: 'dependent-template-list',
  templateUrl: 'dependent-template-list.component.html',
})
export class DependentTemplateListComponent implements OnInit {
  @Input() dependentTemplates!: any[];
  @Input() companyId?: string;
  @Input() templateId?: string;
  @Input() templateTypeId?: string = '';

  templateDataSource: any = {};

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initTemplateDataSource();
  }

  onTemplateAdded($event: any) {
    const selectedTemplate = $event.itemData;
    if (!selectedTemplate) return;

    const selectedTemplateId = selectedTemplate.id;
    if (selectedTemplateId === this.templateId) {
      this.alertService.warning(`Unable to add self template`);
      return;
    }

    if (!this.dependentTemplates.length) {
      this.dependentTemplates.push(selectedTemplate);
      return;
    }

    const template = this.dependentTemplates.find(t => t.id === selectedTemplateId);

    if (template) {
      this.alertService.warning(`Template ${selectedTemplate.name} is already added`);
      return;
    }

    this.dependentTemplates.push(selectedTemplate);
  }

  private initTemplateDataSource(): void {
    this.templateDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.templates),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.templateTypeId = this.templateTypeId;
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }
}
