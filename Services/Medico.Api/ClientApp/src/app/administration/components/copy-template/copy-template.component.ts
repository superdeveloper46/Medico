import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { RegexRuleList } from 'src/app/_classes/regexRuleList';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'copy-template',
  templateUrl: './copy-template.component.html',
  styleUrls: ['./copy-template.component.sass'],
})
export class CopyTemplateComponent implements OnInit {
  @ViewChild('duplicateTemplateForm', { static: false })
  duplicateTemplateForm!: DxFormComponent;
  @Output()
  notifyParent: EventEmitter<any> = new EventEmitter();

  templateTypes: any[] = [];
  companyId: string = GuidHelper.emptyGuid;
  duplicateTemplateType: any = {};
  templates: any[] = [];
  selectedTemplates: any[] = [];
  _filteredTemplates: any[] = [];
  companiesList: any[] = [];
  regexRuleList: RegexRuleList = new RegexRuleList();
  companyIdSubscription?: Subscription;

  constructor(
    private repositoryService: RepositoryService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.initTemplates();
        this.initTemplateTypes();
        this.initCompanies();
      }
    });
  }

  initTemplates() {
    const apiUrl = `templates`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: (data: any) => {
        this.templates = data;
      },
      error: error => {
        console.log(error);
      },
    });
  }

  initTemplateTypes() {
    const apiUrl = `template-types/company/${this.companyId}`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: (data: any) => {
        this.templateTypes = data;
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  initCompanies() {
    const apiUrl = `companies/all/exclude/${this.companyId}`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: (data: any) => {
        this.companiesList = data as any[];
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  createDuplicateTemplate() {
    const validationResult = this.duplicateTemplateForm.instance.validate();

    if (!validationResult.isValid) return;

    this.templateTypes.forEach(_templateType => {
      this.companiesList.forEach(company => {
        const existing = this.templateTypes.filter(
          c =>
            c.title === this.duplicateTemplateType.newTitle && c.companyId == company.id
        );
        if (existing.length > 0) {
          const msg = `Template type with title '${this.duplicateTemplateType.newTitle}' already exists in company ${company.name}`;
          this.alertService.warning(msg);
          return;
        }
      });
    });

    const dataToPost = {
      copyFrom: this.duplicateTemplateType.copyFrom,
      newTitle: this.duplicateTemplateType.newTitle,
      templates: this.selectedTemplates,
      companies: this.duplicateTemplateType.companies,
    };

    const url = 'template-types/duplicate';

    this.repositoryService.create(url, dataToPost).subscribe({
      next: _data => {
        this.notifyParent.emit('Template saved');
      },
      error: err => {
        console.log(err);
      },
    });
  }

  validateDuplicateTitleExistence(params: any) {
    params.rule.isValid = true;

    const templteTypeTitle = params.value;
    this.templateTypes.forEach((_templateType: any) => {
      this.companiesList.forEach(company => {
        const existing = this.templateTypes.filter(
          c => c.title === params.value && c.companyId == company.id
        );
        if (existing.length > 0) {
          const msg = `Company ${company.name} has already a template type named ${templteTypeTitle}`;
          this.alertService.warning(msg);
          return;
        }
      });
    });
  }

  onTemplateFormFieldChanged(template: any) {
    if (template.dataField === 'copyFrom')
      this._filteredTemplates = this.templates.filter(
        c => c.templateTypeId == template.value
      );
  }

  templateSelected(template: any) {
    this.selectedTemplates = template.selectedRowsData;
  }
}
