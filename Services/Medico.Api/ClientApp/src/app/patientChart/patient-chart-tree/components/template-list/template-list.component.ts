import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { PatientChartTrackService } from '../../../../_services/patient-chart-track.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { TemplateTypeService } from 'src/app/administration/services/template-type.service';
import { AlertService } from 'src/app/_services/alert.service';
import { TemplateNodeInfo } from 'src/app/patientChart/models/templateNodeInfo';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { TemplateService } from 'src/app/_services/template.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';

@Component({
  templateUrl: 'template-list.component.html',
  selector: 'template-list',
})
export class TemplateListComponent implements OnInit {
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;
  @Input() templateType: string = '';
  @Input() patientChartNode: any = {};

  @ViewChild('templateList', { static: false })
  templateList!: DxListComponent;
  @ViewChild('templateSelectBox', { static: false })
  templateSelectBox!: DxSelectBoxComponent;

  templateDataSource: any = {};
  templates: TemplateNodeInfo[] = [];

  selectedTemplateOrderNumber = 0;
  oldSelectedTemplateOrderNumber = 0;

  availableOrderNumbers: number[] = [];

  constructor(
    private patientChartTrackService: PatientChartTrackService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private templateTypeService: TemplateTypeService,
    private alertService: AlertService,
    private templateService: TemplateService
  ) {}

  ngOnInit() {
    if (this.patientChartNode) this.templates = this.patientChartNode.value;

    if (!this.isSignedOff) this.initTemplateDataSource();
  }

  onTemplateAdded($event: any) {
    const selectedTemplate = $event.itemData;
    if (selectedTemplate) {
      const selectedTemplateId = selectedTemplate.id;

      this.templateService
        .getById(selectedTemplateId)
        .then(template => {
          const newlyCreatedNodeId = GuidHelper.generateNewGuid();

          const templateNodeInfo = new TemplateNodeInfo(
            template.id,
            template.templateOrder as number,
            template.reportTitle,
            newlyCreatedNodeId
          );

          this.templates.push(templateNodeInfo);

          const templateListNodeId = this.patientChartNode.id;

          const childTemplateNode = PatientChartNode.createPatientChartTemplateNode(
            newlyCreatedNodeId,
            templateListNodeId,
            template,
            this.templateType
          );

          if (!this.patientChartNode.children) this.patientChartNode.children = [];

          this.patientChartNode.children.push(childTemplateNode);

          this.adjustTemplatesOrder();

          const dependentTemplates = template.dependentTemplates;
          const isDependentTemplatesDeletionNeeded =
            dependentTemplates && dependentTemplates.length && this.templates.length > 1;

          if (isDependentTemplatesDeletionNeeded)
            this.templateService.removeDependentTemplates(
              dependentTemplates,
              this.patientChartNode.children,
              this.templates
            );

          this.patientChartTrackService.emitPatientChartChanges(
            PatientChartNodeType.TemplateListNode
          );

          this.templateSelectBox.value = undefined;
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
  }

  onTemplateDeleted($event: any) {
    const templateToDelete = $event.itemData;
    if (!templateToDelete) {
      return;
    }
    const templateSectionIdToDelete = templateToDelete.sectionId;

    const alreadyExistedTemplatesInSection = this.patientChartNode.children;

    if (alreadyExistedTemplatesInSection.length > 0) {
      let templateSectionIndexToDelete = -1;
      for (let i = 0; i < alreadyExistedTemplatesInSection.length; i++) {
        const templateSection = alreadyExistedTemplatesInSection[i];
        if (templateSectionIdToDelete === templateSection.id) {
          templateSectionIndexToDelete = i;
          break;
        }
      }

      if (templateSectionIndexToDelete !== -1) {
        alreadyExistedTemplatesInSection.splice(templateSectionIndexToDelete, 1);
      }

      let templateIndexToDelete = -1;
      const templates = this.templates;
      const templateIdToDelete = templateToDelete.Id;

      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        if (templateIdToDelete === template.id) {
          templateIndexToDelete = i;
          break;
        }
      }

      if (templateIndexToDelete !== -1) {
        templates.splice(templateIndexToDelete, 1);
      }

      this.adjustTemplatesOrder();

      this.patientChartTrackService.emitPatientChartChanges(
        PatientChartNodeType.TemplateListNode
      );
    }
  }

  private adjustTemplatesOrder() {
    this.templates.sort((t1, t2) => t1.order - t2.order);

    this.patientChartNode.children.sort(
      (s1: any, s2: any) => s1.attributes.order - s2.attributes.order
    );
  }

  private initTemplateDataSource(): void {
    this.templateTypeService
      .getByName(this.templateType, this.companyId)
      .then(templateType => {
        //the template type can be deleted and is not exist anymore
        if (!templateType) return;

        const templateDataSource = {
          store: createStore({
            loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.templates),
            onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
              (_method, jQueryAjaxSettings) => {
                jQueryAjaxSettings.data.templateTypeId = templateType.id;
                jQueryAjaxSettings.data.companyId = this.companyId;
              },
              this
            ),
          }),
        };

        this.templateSelectBox.instance.option('dataSource', templateDataSource);
      })
      .catch(error => {
        this.alertService.error(error.message ? error.message : error);
      });
  }
}
