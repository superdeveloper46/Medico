import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { TemplateService } from 'src/app/_services/template.service';
import { ArrayHelper } from 'src/app/_helpers/array.helper';
import { TemplateTypeService } from 'src/app/administration/services/template-type.service';
import { PredefinedTemplateTypeNames } from 'src/app/_classes/predefinedTemplateTypeNames';
import { AlertService } from 'src/app/_services/alert.service';

@Component({
  templateUrl: 'add-templates.component.html',
  selector: 'add-templates',
})
export class AddTemplatesComponent implements AfterViewInit {
  @Input() chiefComplaintId!: string;
  @Input() companyId!: string;

  @Output() templatesAdded: EventEmitter<any> = new EventEmitter();
  @Output() templatesCanceled: EventEmitter<any> = new EventEmitter();

  @ViewChild('addTemplatesPopup', { static: false })
  addTemplatesPopup!: DxPopupComponent;

  selectedHpiTemplates: any[] = [];
  selectedPeTemplates: any[] = [];
  selectedRosTemplates: any[] = [];

  templates: any = { hpi: [], pe: [], ros: [] };

  constructor(
    private templateService: TemplateService,
    private templateTypeService: TemplateTypeService,
    private alertService: AlertService
  ) {}

  get areMappedTemplatesExist(): boolean {
    return (
      this.templates.pe.length || this.templates.ros.length || this.templates.hpi.length
    );
  }

  addTemplates() {
    const selectesTemplates = {
      hpi: this.selectedHpiTemplates,
      pe: this.selectedPeTemplates,
      ros: this.selectedRosTemplates,
    };

    this.templatesAdded.next(selectesTemplates);
    this.resetTemplates();
  }

  cancelAddingTemplates() {
    this.templatesCanceled.next(undefined);
    this.resetTemplates();
  }

  ngAfterViewInit(): void {
    this.addTemplatesPopup.instance.show();
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.templateService
      .getChiefComplaintTemplates(this.chiefComplaintId, this.companyId)
      .then(templates => {
        this.adjustTemplatesByType(templates);
      });
  }

  private adjustTemplatesByType(templates: Array<any>) {
    const templatesGroupedByTemplateType = this.groupTemplatesByTemplateTypes(templates);

    this.templateTypeService
      .getByCompanyId(this.companyId)
      .then(templateTypes => {
        const physicalExamTemplateTypeId = templateTypes.find(
          (t: any) => t.name === PredefinedTemplateTypeNames.physicalExam
        )?.id;

        const hpiTemplateTypeId = templateTypes.find(
          t => t.name === PredefinedTemplateTypeNames.hpi
        )?.id;

        const rosTemplateTypeId = templateTypes.find(
          t => t.name === PredefinedTemplateTypeNames.ros
        )?.id;

        if (
          physicalExamTemplateTypeId &&
          templatesGroupedByTemplateType[physicalExamTemplateTypeId]
        ) {
          this.templates.pe = templatesGroupedByTemplateType[physicalExamTemplateTypeId];
        }

        if (hpiTemplateTypeId && templatesGroupedByTemplateType[hpiTemplateTypeId]) {
          this.templates.hpi = templatesGroupedByTemplateType[hpiTemplateTypeId];
        }

        if (rosTemplateTypeId && templatesGroupedByTemplateType[rosTemplateTypeId]) {
          this.templates.ros = templatesGroupedByTemplateType[rosTemplateTypeId];
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private groupTemplatesByTemplateTypes(templates: any[]): any {
    if (templates.length) {
      return ArrayHelper.groupBy(templates, 'templateTypeId');
    }

    return {};
  }

  private resetTemplates() {
    this.templates = { hpi: [], pe: [], ros: [] };
  }
}
