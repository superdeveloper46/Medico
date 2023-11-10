import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LibraryTemplateService } from 'src/app/administration/services/library/library-template.service';
import { AlertService } from 'src/app/_services/alert.service';
import { TemplateSearchFilter } from 'src/app/administration/models/templateSearchFilter';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { TemplateGridItem } from 'src/app/_models/templateGridItem';
import { TemplateService } from 'src/app/_services/template.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';

@Component({
  selector: 'template-import',
  templateUrl: './template-import.component.html',
})
export class TemplateImportComponent implements OnInit {
  @Input() companyId?: string;

  @Output() templatesImportApplied: EventEmitter<void> = new EventEmitter<void>();

  @Output() templatesImportCanceled: EventEmitter<void> = new EventEmitter<void>();

  templateTypeId = '';
  templateTypeDataSource: any = {};

  templates: TemplateGridItem[] = [];
  selectedTemplates: TemplateGridItem[] = [];

  constructor(
    private libraryTemplateService: LibraryTemplateService,
    private alertService: AlertService,
    private templateService: TemplateService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService
  ) {}

  ngOnInit() {
    this.initTemplateTypeDataSource();
  }

  onTemplateTypeChanged($event: any) {
    const templateTypeId = $event.value;
    if (!templateTypeId) return;

    this.templateTypeId = templateTypeId;
    this.loadLibraryTemplates();
  }

  cancelTemplateImporting() {
    this.templatesImportCanceled.next();
  }

  importSelectedTemplates() {
    if (!this.companyId) return;
    if (!this.selectedTemplates.length) {
      this.alertService.warning("You haven't selected any templates");
      return;
    }

    const selectedTemplateIds = this.selectedTemplates.map(t => t.id);

    this.templateService
      .importLibraryTemplates(this.companyId, this.templateTypeId, selectedTemplateIds)
      .then(() => {
        this.templatesImportApplied.next();
      });
  }

  private initTemplateTypeDataSource() {
    this.templateTypeDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.libraryTemplateTypes),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  private loadLibraryTemplates() {
    const templateSearchFilter = new TemplateSearchFilter();
    templateSearchFilter.templateTypeId = this.templateTypeId;
    templateSearchFilter.companyId = this.companyId;
    templateSearchFilter.excludeImported = true;

    this.libraryTemplateService
      .getByFilter(templateSearchFilter)
      .then(templates => {
        this.templates = templates;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }
}
