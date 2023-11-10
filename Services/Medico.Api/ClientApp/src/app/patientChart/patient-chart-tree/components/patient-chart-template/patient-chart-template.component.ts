import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PatientRichTextEditorComponent } from '../patient-rich-text-editor/patient-rich-text-editor.component';
import { PredefinedTemplateTypeNames } from 'src/app/_classes/predefinedTemplateTypeNames';
import { PatientChartTrackService } from '../../../../_services/patient-chart-track.service';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { TemplateHistoryService } from 'src/app/_services/template-history.service';
import { TemplateHistory } from 'src/app/_models/templateHistory';
import { TemplateHistorySearchFilter } from 'src/app/_models/templateHistorySearchFilter';
import { ExpressionExecutionService } from 'src/app/_services/expression-execution.service';
import { ExpressionExecutionRequest } from 'src/app/_models/expression-execution-request';
import { RegexRuleList } from 'src/app/_classes/regexRuleList';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { AlertService } from 'src/app/_services/alert.service';
import { AllegationEditService } from 'src/app/_services/allegation-edit.service';
import { TextHelper } from 'src/app/_helpers/text.helper';
import { DxAccordionComponent } from 'devextreme-angular';
import { TemplateService } from '../../../../_services/template.service';
import { async } from '@angular/core/testing';
import {
  DxButtonModule,
  DxLoadIndicatorModule,
  DxTemplateModule,
} from 'devextreme-angular';
import { PatientChartComponent } from '../../../components/patient-chart/patient-chart.component';
import { custom } from 'devextreme/ui/dialog';
import { SelectableListService } from '../../../../_services/selectable-list.service';

@Component({
  templateUrl: 'patient-chart-template.component.html',
  selector: 'patient-chart-template',
  styleUrls: ['acordionStyles.css'],
})
export class PatientChartTemplateComponent implements OnInit {
  @Input() patientChartDocumentNode!: PatientChartNode;
  @Input() patientChartNode!: PatientChartNode;
  @Input() templateName!: string;
  @Input() templateType!: string;
  @Input() companyId!: string;
  @Input() isSignedOff!: boolean;
  @Input() admissionId!: string;
  private regexRuleList: RegexRuleList = new RegexRuleList();

  private duplicateDictionary = new Map();
  private _templateId: string = '';
  defaulttemplate: any;
  templateContentnew: any;
  templateHistoryData: any;
  startDate: any;
  endDate: any;
  flag: boolean = false;

  selectableListValues: any = [];
  selectableIteratorList: string[] = [];

  @Input() set templateId(value: string) {
    this._templateId = value;
  }

  get templateId(): string {
    //we should check template Id correctness due to the invalid
    //template generation for patient chart template node
    let templateId = this._templateId;
    const isTemplateIdFixNeeded = this.regexRuleList.dollarSignPlusGuid.test(templateId);

    if (isTemplateIdFixNeeded) {
      const dollarSignIndex = this._templateId.indexOf('$');

      templateId = this._templateId.slice(dollarSignIndex + 1);
    }

    const isGuidValid = this.regexRuleList.guid.test(templateId);
    if (!isGuidValid)
      throw `Patient Chart Template --- templateId has wrong format --- ${templateId}`;

    return templateId;
  }

  selectedModeIndex = 0;

  private defaultTemplateModeIndex = 0;
  private detailedTemplateModeIndex = 1;

  templateModes = [
    {
      id: this.defaultTemplateModeIndex,
      text: 'Default',
    },
    {
      id: this.detailedTemplateModeIndex,
      text: 'Detailed',
    },
  ];

  onTemplateModeSelected(selectedMode: any) {
    this.isDetailedTemplate = selectedMode.id === this.detailedTemplateModeIndex;

    this.templateContent.isDetailedTemplateUsed = this.isDetailedTemplate;

    if (this.isDetailedTemplate) {
      this.calculateExpressions();
    }
  }

  // the property has to be used instead 'templateId' due to the issue of wrong setting of templateId
  get correctTemplateId(): string {
    //const patientChartNodeId = this.patientChartNode.id;
    //before fix, template id setting was wrong - templateId was equal to node id
    //if (patientChartNodeId !== this.templateId)
    //  return this.templateId;

    return this.patientChartNode.attributes.nodeSpecificAttributes.templateId;
  }

  @ViewChild('detailedRichTextEditor', { static: false })
  detailedRichTextEditor!: PatientRichTextEditorComponent;
  @ViewChild('defaultRichTextEditor', { static: false })
  defaultRichTextEditor!: PatientRichTextEditorComponent;
  datesTemplates: string[] = [];
  templateHistory: TemplateHistory[] = [];
  templateHistoryFilter: TemplateHistory[] = [];

  isDuplicateWordsWarningVisible = false;
  isPreviousTemplateContentVisible = false;

  isDetailedEditorReady = false;
  isDefaultEditorReady = false;

  previousDetailedContent = '';
  showButton = false;
  dataReady = false;
  color = false;
  async doesTemplateHistoryExist() {
    await this.setPreviousTemplateHistory();
    const aux = await this.templateService.getById(this.templateId);
    this.showButton = aux.isHistorical.valueOf();
  }

  templateContent: any = {
    defaultTemplateHtml: '',
    detailedTemplateHtml: '',
    isDetailedTemplateUsed: false,
    isDefault: false,
  };

  get templateResult(): string {
    if (!this.isDetailedTemplate) return this.templateContent.defaultTemplateHtml;

    return this.getFormattedDetailedTemplateContent(
      this.templateContent.detailedTemplateHtml
    );
  }

  get isDetailedTemplateShown(): boolean {
    return this.isDetailedTemplate;
  }

  get isDefaultTemplateShown(): boolean {
    return !this.isDetailedTemplate;
  }

  isDetailedTemplate: boolean = false;
  hasDefaultTemplate: boolean = true;

  constructor(
    private patientChartTrackService: PatientChartTrackService,
    private selectableItemHtmlService: SelectableItemHtmlService,
    private templateHistoryService: TemplateHistoryService,
    private alertService: AlertService,
    private expressionExecutionService: ExpressionExecutionService,
    private eventService: AllegationEditService,
    private templateService: TemplateService,
    private patientChart: PatientChartComponent,
    private selectableListService: SelectableListService
  ) {}

  insertPreviousTemplateContent(element: any) {
    //Get the date of previous template
    const selectPreviousVisitDate = element.content.substring(21, 30);
    if (
      this.templateContent.detailedTemplateHtml.search(selectPreviousVisitDate) === -1
    ) {
      if (this.isDetailedTemplateShown) {
        this.templateContent.detailedTemplateHtml = `${
          'History of Present Illness: ' + element.content
        }${'--------------------------------------------------------------------'}
        ${this.templateContent.detailedTemplateHtml}`;
      } else
        this.templateContent.defaultTemplateHtml = `${
          element.content
        }${'--------------------------------------------------------------------'}${
          this.templateContent.defaultTemplateHtml
        }`;
      this.isPreviousTemplateContentVisible = false;
    } else {
      //If the previous template already exists, alert and avoid adding it into the chart
      alert('The previous template has already beed added');
    }
  }

  toggleDuplicateWordsWarning($event: any) {
    $event.preventDefault();

    this.isDuplicateWordsWarningVisible = !this.isDuplicateWordsWarningVisible;
  }

  async togglePreviousDetailedContentPopover($event: any) {
    $event.preventDefault();
    this.isPreviousTemplateContentVisible = !this.isPreviousTemplateContentVisible;
    this.dataReady = true;
  }

  ngOnInit() {
    this.doesTemplateHistoryExist();
    this.obtainSelectableListValues();
    this.templateContent = this.patientChartNode.value;

    if (
      typeof this.templateContent?.detailedTemplateHtml === 'undefined' ||
      !this.templateContent?.detailedTemplateHtml
    ) {
      this.templateContent = this.templateContent || {};
      this.templateContent.detailedTemplateHtml = '';
    }

    if (
      typeof this.templateContent.defaultTemplateHtml == 'undefined' ||
      this.templateContent.defaultTemplateHtml == null
    ) {
      this.templateContent.defaultTemplateHtml = '';
    }

    this.defaulttemplate = this.templateContent.detailedTemplateHtml;
    if (
      this.templateContent.defaultTemplateHtml &&
      !this.templateContent.isDetailedTemplateUsed
    ) {
      this.hasDefaultTemplate = true;
      this.isDetailedTemplate = false;
    } else {
      this.hasDefaultTemplate = !!this.templateContent.defaultTemplateHtml;
      this.calculateExpressions().then(() => (this.isDetailedTemplate = true));
    }
  }

  savePatientChart() {
    //for saving is Default value
    const isDefault =
      this.patientChartNode.value.isDefault == true ||
      this.patientChartNode.value.isDefault == undefined
        ? this.defaulttemplate === this.templateContent.detailedTemplateHtml
        : false;
    this.templateContent.isDefault = isDefault;
    this.setTemplateValue(this.templateContent);

    this.templateContent.detailedTemplateHtml = TextHelper.removeDoubleSpaces(
      this.templateContent.detailedTemplateHtml
    );
    this.templateContent.detailedTemplateHtml = TextHelper.applyFormatting(
      this.templateContent.detailedTemplateHtml
    );

    this.patientChartTrackService.emitPatientChartChanges(
      PatientChartNodeType.TemplateNode,
      this.patientChartNode
    );
  }

  onDetailedContentChanged($event: any) {
    this.templateContent.detailedTemplateHtml = $event;
  }

  setTemplateValue(data: any) {
    debugger;
    this.eventService.setDataWithObj({
      method: 'setTemplateValue',
      data: {
        parentNode: this.patientChartDocumentNode.name,
        templateName: this.patientChartNode.title,
        templateId: this.patientChartNode.id,
        value: this.patientChartNode.value,
      },
    });
  }

  onDefaultContentChanged($event: any) {
    this.templateContent.defaultTemplateHtml = $event;
  }

  onDefaultContentReady($event: any) {
    this.isDefaultEditorReady = $event;
  }

  onDetailedContentReady($event: any) {
    this.isDetailedEditorReady = $event;
  }

  calculateExpressions() {
    const expressionExecutionRequest = new ExpressionExecutionRequest();

    expressionExecutionRequest.admissionId = this.admissionId;
    expressionExecutionRequest.detailedTemplateContent =
      this.templateContent.detailedTemplateHtml;

    return this.expressionExecutionService
      .calculateExpressionsInTemplate(expressionExecutionRequest)
      .then(detailedTemplateContent => {
        this.templateContent.detailedTemplateHtml = detailedTemplateContent;
        // this.patientChartTrackService.emitPatientChartChanges(
        //   PatientChartNodeType.TemplateNode
        // );
      });
  }
  calculateExpressionsNew() {
    const expressionExecutionRequest = new ExpressionExecutionRequest();

    expressionExecutionRequest.admissionId = this.admissionId;
    expressionExecutionRequest.detailedTemplateContent =
      this.templateContent.detailedTemplateHtml;

    return this.expressionExecutionService
      .calculateExpressionsInTemplate(expressionExecutionRequest)
      .then(detailedTemplateContent => {
        this.templateContent.detailedTemplateHtml = detailedTemplateContent;
        this.patientChartTrackService.emitPatientChartChanges(
          PatientChartNodeType.TemplateNode
        );
      });
  }

  get isRosTemplate(): boolean {
    return this.templateType === PredefinedTemplateTypeNames.ros;
  }

  private getFormattedDetailedTemplateContent(detailedTemplateHtml: any): string {
    return this.selectableItemHtmlService.wrapBoldTagAroundSelectableElementsValues(
      detailedTemplateHtml
    );
  }

  private async setPreviousTemplateHistory() {
    const searchFilter = new TemplateHistorySearchFilter();
    searchFilter.admissionId = this.admissionId;
    searchFilter.templateId = this.correctTemplateId;
    searchFilter.documentId = this.patientChartDocumentNode.id;
    await this.templateHistoryService.get(searchFilter).then(templateHistory => {
      this.templateHistoryData = templateHistory;
      this.templateHistoryData.forEach((element: any) => {
        if (element.content)
          element.content = this.formatPreviousTemplateContent(element);

        if (this.templateHistory.length > this.templateHistoryData.length - 1) {
        } else {
          this.templateHistory.push(element);
        }
      });
    });
    await this.onSearchTemplates();
  }

  private formatPreviousTemplateContent(templateHistory: TemplateHistory) {
    const contentWithoutSelectableItemsAttributes =
      this.selectableItemHtmlService.removeSelectableItemsAttributes(
        templateHistory.content
      );

    const date = DateHelper.getDate(
      DateHelper.sqlServerUtcDateToLocalJsDate(
        templateHistory.createdDate.toString()
      )?.toString()
    );
    const dateHeader = ``;
    this.datesTemplates.push(date);
    return `${dateHeader}${contentWithoutSelectableItemsAttributes}`;
  }

  copyDefaultContent() {
    this.templateContent.detailedTemplateHtml = this.templateContent.defaultTemplateHtml;
  }

  async obtainSelectableListValues() {
    const selectableListId = '97b3715a-be7c-e811-80c2-0003ff433cda';
    await this.selectableListService.getById(selectableListId).then(selectableList => {
      this.selectableListValues = selectableList.selectableListValues;
    });
    for (let i = 0; i < this.selectableListValues.length; i++) {
      this.selectableIteratorList.push(this.selectableListValues[i].value.toLowerCase());
    }
  }
  async callDuplicateWords(content: string) {
    this.flag = false;
    const aux = TextHelper.findDuplicateWords(content);
    for (let i = 0; i < aux.length; i++) {
      if (!this.duplicateDictionary.has(aux[i])) {
        this.duplicateDictionary.set(aux[i], false);
      }
    }
    for (let i = 0; i < this.duplicateDictionary.size; i++) {
      let word = aux[i];
      if (word?.endsWith('s') || word?.endsWith('S')) {
        word = word.slice(0, -1);
      }
      if (
        this.duplicateDictionary.get(aux[i]) == false &&
        this.selectableIteratorList.includes(word.toLowerCase())
      ) {
        this.flag = true;
        const lastAparition = await new RegExp(aux[i] + '(?!.*' + aux[i] + ')');
        this.duplicateDictionary.set(aux[i], true);
        content = await content.replace(
          lastAparition,
          '<span style="color:red">' + aux[i] + '</span>'
        );
      }
    }
    return content;
  }
  async onSearchTemplates() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await this.searchTemplates();
        if (this.templateHistoryFilter?.length > 0) this.color = true;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
  async searchTemplates() {
    this.startDate = this.patientChart.from;
    this.endDate = this.patientChart.now;
    if (this.startDate && this.endDate) {
      this.templateHistoryFilter = await this.templateHistoryData.filter((item: any) => {
        const date = DateHelper.getDate(
          DateHelper.sqlServerUtcDateToLocalJsDate(
            item.createdDate.toString()
          )?.toString()
        );
        const newDate = new Date(date);
        return newDate >= this.startDate && newDate <= this.endDate;
      });
    } else this.templateHistoryFilter = this.templateHistory;
  }
}
