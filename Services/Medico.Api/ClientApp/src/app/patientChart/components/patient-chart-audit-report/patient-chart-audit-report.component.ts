import { EnvironmentUrlService } from './../../../_services/environment-url.service';
import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  OnInit,
  Output,
  EventEmitter,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import { ReportSectionService } from '../../services/report-section.service';
import { SignatureInfoService } from '../../services/signature-info.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { AlertService } from 'src/app/_services/alert.service';
import { saveAs } from 'file-saver';
import { PatientInsuranceService } from 'src/app/_services/patient-insurance.service';
import { PatientDataModelNode } from '../../classes/patientDataModelNode';
import { ReportDataTreeNode } from '../../classes/reportDataTreeNode';
import { ObjectHelper } from 'src/app/_helpers/object.helper';
import { PatientChartNodeReportInfo } from '../report-sections/baseHistoryReportSection';
import { Admission } from '../../models/admission';
import { PatientChartNodeManagementService } from '../../services/patient-chart-node-management.service';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { PatientChartReportHeaderService } from '../../services/patient-chart-report-header.service';
import { PatientChartReportFooterService } from '../../services/patient-chart-report-footer.service';
import { Constants } from 'src/app/_classes/constants';
import { RepositoryService } from 'src/app/_services/repository.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { WindowService } from 'src/app/_services/window.service';
import { PatientChartInfo } from '../../models/patientChartInfo';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { firstValueFrom, Subject } from 'rxjs';
import { EditStatusService } from '../../services/edit-status.service';
import { ChartColor } from '../../models/chartColor';
import { AuditManagementService } from 'src/app/administration/components/audit-management/audit-management.service';
import { PatientChartEqualityComparer } from '../../services/patient-chart-equality-comparer.service';
import { DefaultChartColors } from 'src/app/administration/classes/defaultChartColors';

declare const tinymce: any;
@Component({
  selector: 'app-patient-chart-audit-report',
  templateUrl: './patient-chart-audit-report.component.html',
  styleUrls: ['./patient-chart-audit-report.component.scss'],
})
export class PatientChartAuditReportComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() patientChartTreeView: PatientDataModelNode[] = [];
  @Input() admission?: Admission;
  @Input() savedVersionOfAdmissionData?: string;
  @Input() companyId!: string;
  @Input() isPatientChartView: boolean = false;
  @Input() chartColors!: ChartColor;

  @Output() reportHidden: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('patientChartTreeViewComponent', { static: false })
  patientChartTreeViewComponent!: DxTreeViewComponent;

  patientChart: PatientChartNode = new PatientChartNode();
  public emitSelectedPatientChartNode: Subject<PatientChartNode> =
    new Subject<PatientChartNode>();

  reportDataTree?: ReportDataTreeNode;

  reportEditorId = 'report-editor';
  reportEditor: any;
  reportContent = '';

  reportUrl = '';
  configData: any = {};
  isPreview = false;
  currentUser: any;
  parsedContent = '';
  selectedNodeId?: string;
  patientChartInfo?: PatientChartInfo;
  selectedPatientChartNode?: PatientChartNode;
  nodeColors?: ChartColor;
  chartViewer = false;
  arrLength = 1;
  switch = true;

  color: { [key: string]: string } = {
    // key: color name, value: color hex
    white: '#FFFFFF',
    green: '#D5FFD5',
    blue: '#BFDFFF',
    red: '#FF9393',
    yellow: '#FDFFBF',
    blue_dark: '#F44336E3',
    border_green: '#00EC00',
    border_grey: '#999',
  };
  leafNodes: PatientChartNode[] = [];
  editStatusValues: { [key: string]: string } = {};
  prunedLeafNodes: { [key: string]: string[] } = {}; // key: id, value: [node title, editStatus]
  rootNodesVisible: { [key: string]: boolean } = {}; // key: root node id, value: if it's visible in audit
  constructor(
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private reportSectionService: ReportSectionService,
    private signatureInfoAppService: SignatureInfoService,
    private httpClient: HttpClient,
    private configService: ConfigService,
    private alertService: AlertService,
    private windowService: WindowService,
    private envService: EnvironmentUrlService,
    private authentication: AuthenticationService,
    private patientInsuranceService: PatientInsuranceService,
    private patientChartNodeManagementService: PatientChartNodeManagementService,
    private patientChartReportHeaderService: PatientChartReportHeaderService,
    private patientChartReportFooterService: PatientChartReportFooterService,
    private selectedPatientChartNodeService: SelectedPatientChartNodeService,
    private elementRef: ElementRef,
    private editStatusService: EditStatusService,
    private auditManagementService: AuditManagementService,
    private patientChartEqualityComparer: PatientChartEqualityComparer
  ) {
    this.reportUrl = `${this.configService.apiUrl}report`;

    if (localStorage.getItem('Medico.CurrentUser')) {
      // const userDetails = new User();
      const _decodeUserDetails = JSON.parse(
        localStorage.getItem('Medico.CurrentUser') || 'null'
      );
    }
  }

  generatePdfReport() {
    const reportBody = this.reportEditor.getBody();
    const reportContent = {
      reportContent: reportBody.innerHTML,
    };

    firstValueFrom(
      this.httpClient.post(this.reportUrl, reportContent, {
        observe: 'response',
        responseType: 'blob',
      })
    )
      .then(response => {
        const blob = new Blob([response.body as BlobPart], { type: 'application/pdf' });

        const patientId = this.admission?.patientId;
        if (!patientId) return;
        this.patientInsuranceService
          .getByPatientId(patientId)
          .then(patientInsurance => {
            if (!patientInsurance) {
              saveAs(blob, 'report.pdf');
              return;
            }

            const caseNumber = patientInsurance.caseNumber;
            const reportName = caseNumber ? caseNumber : 'report';

            saveAs(blob, `Medico-${reportName}.pdf`);
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  ngOnInit() {
    // console.log(`isPatientChartView: ${this.isPatientChartView}`);
    this.patientChart = JSON.parse(this.admission?.admissionData || 'null');
    this.leafNodes = this.editStatusService.getLeafNodes();
    this.editStatusValues = this.editStatusService.getEditStatusValues();
  }

  hideReport() {
    this.reportHidden.next();
  }

  ngAfterViewInit() {
    this.initPatientChartTreeViewComponentDataSource();
    this.setUpReportEditor();
  }
  popupHiding(e: any) {
    // if there have been any changes, refresh the chart
    if (
      this.patientChartEqualityComparer.doesPatientChartHaveUnsavedChanges(
        this.patientChart,
        this.savedVersionOfAdmissionData
      )
    )
      this.refreshChart();
  }
  refreshChart() {
    this.patientChart = JSON.parse(this.admission?.admissionData || 'null');
    this.refresh();
    this.previewReport();
  }
  bindEditorConfig() {
    const apiUrl = 'settings/editor-config';
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.configData = res.data;
          setTimeout(() => {
            tinymce.init({
              extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${
                Constants.selectableItem.attributes.id
              }|${Constants.selectableItem.attributes.metadata}|style]`,
              content_style: Constants.tinymceStyles.detailedEditor,
              //content_style: "body { font-family: " + this.configData.fontFamily + ";font-size:" + this.configData.fontSize + " }",
              height: 680,
              body_class: 'admin-rich-text-editor',
              ui_container: '.popup',
              selector: `#${this.reportEditorId}`,
              plugins: ['export lists table code image powerpaste'],
              fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt',
              menubar: true,
              toolbar:
                'export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image',
              powerpaste_allow_local_images: true,
              powerpaste_word_import: 'prompt',
              powerpaste_html_import: 'prompt',
              browser_spellcheck: true,

              // tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
              /* without images_upload_url set, Upload tab won't show up*/
              // images_upload_url: 'postAcceptor.php',
              images_upload_url: `${this.envService.urlAddress}Order/uploadFile`,
              setup: (editor: any) => {
                this.reportEditorId = editor;
                //editor.on("focusout", () => { this.emitContentChange(); });
              },
              init_instance_callback: (_editor: any) => {
                if (!this.admission?.id) return;
                this.signatureInfoAppService
                  .isAdmissionSignedOff(this.admission.id)
                  .then(isAdmissionSignedOff => {
                    if (isAdmissionSignedOff) {
                      this.reportEditor.setMode('readonly');
                    }

                    this.initReportDataTree(isAdmissionSignedOff);
                  });
              },
            });
          }, 0);
        }
      },
      error: error => {
        this.errorHandler.handleError(error);
      },
    });
  }

  ngOnDestroy() {
    tinymce.remove(this.reportEditor);
  }

  patientChartSectionSelectionChanged($event: any) {
    const reportTreeNode = $event.itemData;
    const isSectionSelected = $event.node.selected;

    if (isSectionSelected) {
      this.rootNodesVisible[reportTreeNode.id] = true;
      this.addPatientChartNodeReportContent(reportTreeNode.id);
    } else {
      this.rootNodesVisible[reportTreeNode.id] = false;
      this.removePatientChartNodeReportContent(reportTreeNode.id);
    }
  }

  private initReportDataTree(isPatientAdmissionSignedOff: boolean) {
    const reportDataTreeRootNode = new ReportDataTreeNode();

    const headerHtmlPromise = this.getReportHeader();
    const footerHtmlPromise = this.getReportFooter(isPatientAdmissionSignedOff);

    Promise.all([headerHtmlPromise, footerHtmlPromise]).then(result => {
      const reportHeaderHtml = result[0];
      const reportFooterHtml = result[1];

      const reportDataTreeHeader = new ReportDataTreeNode(
        GuidHelper.generateNewGuid(),
        reportHeaderHtml
      );

      const reportDataTreeBody = this.generateReportBody();

      reportDataTreeRootNode.childrenNodes.push(reportDataTreeHeader);

      reportDataTreeRootNode.childrenNodes.push(reportDataTreeBody);

      if (reportFooterHtml) {
        const reportDataTreeFooter = new ReportDataTreeNode('', reportFooterHtml);

        reportDataTreeRootNode.childrenNodes.push(reportDataTreeFooter);
      }

      this.reportDataTree = reportDataTreeRootNode;

      this.addPatientChartNodeReportContent(
        this.reportDataTree.childrenNodes[1].patientChartNodeId
      );

      // console.log('this.patientChartTreeView', this.patientChartTreeView);
      this.patientChartTreeView[0].items.forEach(rootNode => {
        this.rootNodesVisible[rootNode.id] = true;
      });
      this.updateReportContent();
    });
  }

  private getReportHeader(): Promise<string> {
    if (!this.admission) return Promise.resolve('');

    return this.patientChartReportHeaderService.getPatientChartNodeReportContent(
      this.admission,
      this.companyId
    );
  }

  private getReportFooter(isPatientAdmissionSignedOff: boolean): Promise<string> {
    if (!isPatientAdmissionSignedOff || !this.admission?.id) return Promise.resolve('');

    return this.patientChartReportFooterService.getPatientChartNodeReportContent(
      this.admission.id
    );
  }

  private generateReportBody(): ReportDataTreeNode {
    const patientChartTree = this.patientChartTreeViewComponent
      .dataSource as PatientDataModelNode[];
    return this.convertPatientChartTreeNodeToReportDataTreeNode(
      patientChartTree ? patientChartTree[0] : undefined
    );
  }

  private convertPatientChartTreeNodeToReportDataTreeNode(
    patientChartTreeNode?: PatientDataModelNode
  ): ReportDataTreeNode {
    const reportDataTreeNode = new ReportDataTreeNode(
      patientChartTreeNode ? patientChartTreeNode.id : ''
    );

    const patientChartTreeNodeChildren = patientChartTreeNode
      ? patientChartTreeNode.items
      : undefined;

    if (patientChartTreeNodeChildren && patientChartTreeNodeChildren.length) {
      for (let i = 0; i < patientChartTreeNodeChildren.length; i++) {
        const patientChartTreeChildNode = patientChartTreeNodeChildren[i];
        // if(patientChartTreeChildNode.name=='vitalSigns')
        const childDataTreeNode = this.convertPatientChartTreeNodeToReportDataTreeNode(
          patientChartTreeChildNode
        );

        reportDataTreeNode.childrenNodes.push(childDataTreeNode);
      }
    }
    return reportDataTreeNode;
  }

  private generateReportContent(
    content: string,
    reportDataTreeNode: ReportDataTreeNode
  ): string {
    if (reportDataTreeNode.html) {
      content += reportDataTreeNode.html;
    }

    const childrenNodes = reportDataTreeNode.childrenNodes;

    if (childrenNodes.length) {
      for (let i = 0; i < childrenNodes.length; i++) {
        const childNode = childrenNodes[i];
        content = this.generateReportContent(content, childNode);
      }
    }
    return content;
  }

  private updateReportContent() {
    if (!this.reportDataTree) return;

    const reportContent = this.generateReportContent('', this.reportDataTree);
    this.reportContent = `<div style="width:100%;">${reportContent}</div>`;
    this.reportEditor.setContent(this.reportContent);
  }

  private removePatientChartNodeReportContent(reportDataTreeNodeId: string) {
    if (!this.reportDataTree) return;

    const reportDataTreeNode = this.getReportDataTreeNodeById(
      reportDataTreeNodeId,
      this.reportDataTree
    );

    if (!reportDataTreeNode) return;

    this.removePatientChartReportNodesContent(reportDataTreeNode);
    this.updateReportContent();
    this.previewReport();
  }

  private addPatientChartNodeReportContent(patientTreeNodeId: string) {
    if (!this.reportDataTree) return;

    const reportDataTreeNode = this.getReportDataTreeNodeById(
      patientTreeNodeId,
      this.reportDataTree
    );

    if (!reportDataTreeNode) return;

    this.addPatientChartTreeReportContent(reportDataTreeNode).then(() => {
      this.updateReportContent();
      this.previewReport();
    });
  }

  private removePatientChartReportNodesContent(
    reportDataTreeNode: ReportDataTreeNode
  ): void {
    reportDataTreeNode.html = '';

    const childrenNodes = reportDataTreeNode.childrenNodes;

    if (childrenNodes.length) {
      for (let i = 0; i < childrenNodes.length; i++) {
        const childNode = childrenNodes[i];

        this.removePatientChartReportNodesContent(childNode);
      }
    }
  }

  private addPatientChartTreeReportContent(
    reportDataTreeNode: ReportDataTreeNode
  ): Promise<any> {
    const patientChartNode = this.patientChartNodeManagementService.getById(
      reportDataTreeNode.patientChartNodeId,
      this.patientChart
    );

    if (!patientChartNode || !this.admission) throw `patientChartNode is null`;

    const patientChartNodeReportInfo = new PatientChartNodeReportInfo(
      this.admission.patientId,
      patientChartNode,
      this.admission.id,
      this.admission.appointmentId
    );

    return this.reportSectionService
      .getPatientChartNodeContent(patientChartNodeReportInfo)
      .then(htmlContent => {
        if (htmlContent) reportDataTreeNode.html = htmlContent;

        const childrenNodes = reportDataTreeNode.childrenNodes;

        if (childrenNodes.length) {
          const childrenNodesPromises: Promise<any>[] = [];

          for (let i = 0; i < childrenNodes.length; i++) {
            const childNode = childrenNodes[i];
            const childNodePromise = this.addPatientChartTreeReportContent(childNode);

            childrenNodesPromises.push(childNodePromise);
          }

          return Promise.all(childrenNodesPromises);
        }

        return Promise.resolve([]);
      });
  }

  private getReportDataTreeNodeById(
    reportDataTreeNodeId: string,
    reportDataTreeNode: ReportDataTreeNode
  ): Nullable<ReportDataTreeNode> {
    if (reportDataTreeNodeId === reportDataTreeNode.patientChartNodeId)
      return reportDataTreeNode;

    const childrenNodes = reportDataTreeNode.childrenNodes;

    if (!childrenNodes.length) return null;

    for (let i = 0; i < childrenNodes.length; i++) {
      const childNode = childrenNodes[i];
      const childReportDataTreeNode = this.getReportDataTreeNodeById(
        reportDataTreeNodeId,
        childNode
      );

      if (childReportDataTreeNode) return childReportDataTreeNode;
    }

    return null;
  }

  refresh() {
    if (!this.admission) return;

    this.signatureInfoAppService
      .isAdmissionSignedOff(this.admission.id)
      .then(isAdmissionSignedOff => {
        if (isAdmissionSignedOff) {
          this.reportEditor.setMode('readonly');
        }

        this.initReportDataTree(isAdmissionSignedOff);
      });
  }
  private setUpReportEditor() {
    setTimeout(() => {
      tinymce.init({
        extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${
          Constants.selectableItem.attributes.id
        }|${Constants.selectableItem.attributes.metadata}|style]`,
        // content_style: "body { font-family: " + this.configData.fontFamily + ";font-size:" + this.configData.fontSize + " }",
        content_style: Constants.tinymceStyles.detailedEditor,
        height: 760,
        ui_container: '.popup',
        selector: `#${this.reportEditorId}`,
        plugins: ['export lists table image code powerpaste'],
        fontsize_formats: '8pt 10pt 12pt 14pt 18pt 20pt 24pt',
        menubar: true,
        toolbar:
          'export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image',
        powerpaste_allow_local_images: true,
        powerpaste_word_import: 'prompt',
        powerpaste_html_import: 'prompt',
        browser_spellcheck: true,
        // tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
        /* without images_upload_url set, Upload tab won't show up*/
        // images_upload_url: 'postAcceptor.php',
        images_upload_url: `${this.envService.urlAddress}Order/uploadFile`,
        setup: (editor: any) => {
          this.reportEditor = editor;
        },
        init_instance_callback: (_editor: any) => {
          if (!this.admission) return;
          this.signatureInfoAppService
            .isAdmissionSignedOff(this.admission.id)
            .then(isAdmissionSignedOff => {
              if (isAdmissionSignedOff) {
                this.reportEditor.setMode('readonly');
              }

              this.initReportDataTree(isAdmissionSignedOff);
            });
        },
      });
    }, 0);
  }

  private initPatientChartTreeViewComponentDataSource() {
    if (this.patientChartTreeView && this.patientChartTreeView.length) {
      this.patientChartTreeView[0].selected = true;
      this.patientChartTreeView[0].expanded = true;

      const patientChartTreeViewCopy = ObjectHelper.copy(this.patientChartTreeView);

      this.patientChartTreeViewComponent.dataSource = [
        this.getPatientChartReportTreeViewNode(patientChartTreeViewCopy[0]),
      ];
    }
  }

  //we have to remove all invisible nodes
  private getPatientChartReportTreeViewNode(
    patientChartNode: PatientDataModelNode
  ): Nullable<PatientDataModelNode> {
    const isVisible = patientChartNode.visible;
    const isNotShownInReport = patientChartNode.isNotShownInReport;
    if (isNotShownInReport || !isVisible) return;

    const children = patientChartNode.items;
    if (!children || !children.length) return patientChartNode;

    this.removeInvisibleNodes(children);

    return patientChartNode;
  }

  private removeInvisibleNodes(patientChartNodes: PatientDataModelNode[]) {
    const patientChartNodesIndexesToRemove = patientChartNodes.reduce(
      (indexesToRemove: number[], patientChartNode, index: number) => {
        const patientChartReportTreeViewNode =
          this.getPatientChartReportTreeViewNode(patientChartNode);
        if (!patientChartReportTreeViewNode) indexesToRemove.push(index);

        return indexesToRemove;
      },
      []
    );

    if (!patientChartNodesIndexesToRemove.length) return;

    let numberOfDeletedNodes = 0;

    patientChartNodesIndexesToRemove.forEach(indexToRemove => {
      patientChartNodes.splice(indexToRemove - numberOfDeletedNodes, 1);
      numberOfDeletedNodes++;
    });
  }

  getNodeFill(node: PatientChartNode): string {
    if (node.attributes.chartColors) {
      this.nodeColors = node.attributes.chartColors;
    } else {
      this.nodeColors = new ChartColor();
      this.nodeColors?.setDefault(new DefaultChartColors());
    }
    if (
      node.attributes.nodeSpecificAttributes &&
      (!this.editStatusService.getIsEditStatusSet() ||
        !Object.keys(node.attributes.nodeSpecificAttributes).includes('editStatus'))
      // node.attributes.nodeSpecificAttributes.editStatus == null
    ) {
      // should a color be returned if an editStatus isn't available?
      console.log("editStatus isn't available in getNodeFill:", node);
      return '';
    }
    if (!node.attributes.nodeSpecificAttributes?.editStatus) {
      console.log("editStatus isn't available in getNodeFill:", node);
      return '';
    }
    const [fillColor, borderColor] = this.chartColors.getColorsForNode(
      node.attributes.nodeSpecificAttributes.editStatus,
      node.attributes.auditRequired ?? ''
    );
    let css: string = `background: ${fillColor}; border: 1px solid ${borderColor};`;

    if (node.title === 'Pharmacy') {
      css += 'padding: 4px;';
    } else if (
      node.title === 'Statement of Examination' ||
      node.title === 'General History of Present Illness' ||
      node.title === 'Activities of Daily Living' ||
      node.title === 'Treatment Plan Established  Patient' ||
      node.title === 'Office Note' ||
      node.title === 'ODAR'
    ) {
      css += 'padding: 24px 4px 4px;';
    } else {
      css += 'padding: 16px 4px 4px;';
    }

    return css;
  }

  colorLeafNodes() {
    if (this.editStatusService.getIsEditStatusSet()) {
      // parse html and grab id's.
      const matches = this.parsedContent.match(/id=\s?('\S+')?("\S+")?/g) || [];

      // if this.prunedLeafNodes hasn't been initialized
      if (Object.keys(this.prunedLeafNodes).length === 0) {
        this.leafNodes.forEach(node => {
          if (node.attributes.nodeSpecificAttributes != null) {
            if (node.attributes.nodeSpecificAttributes.editStatus != null) {
              this.prunedLeafNodes[node.id] = [
                node.title,
                node.attributes.nodeSpecificAttributes.editStatus,
              ];
            } else {
              // console.log('node has attributes, but editStatus is null', node);
            }
          } else {
            // console.log('node attributes is null', node);
          }
        });
      }

      //console.log(matches.length);
      matches.forEach(match => {
        let id: string = match.split('=')[1];

        // prune id to just id
        if (id.includes("'")) id = id.split("'")[1];
        if (id.includes('"')) id = id.split('"')[1];
        if (id.includes('\\')) id = id.split('\\')[1];

        //console.log(`${id}`);
        //console.log(this.prunedLeafNodes);

        // if the id is connected to a leafNode (has editStatus)
        if (Object.keys(this.prunedLeafNodes).includes(id)) {
          //console.log(`${prunedLeafNodes[id][1]} : ${prunedLeafNodes[id][0]}`);
          //console.log(`${this.prunedLeafNodes[id][0]} : ${id}`);

          // regex to grab id + css
          const regExp: RegExp = new RegExp(
            `${id}.*?<div\\s?style=('.*?')?(".*?")?`,
            'g'
          );
          //console.log(this.parsedContent);
          const matchedTextRegExp: RegExpMatchArray | null =
            this.parsedContent.match(regExp);
          if (matchedTextRegExp) {
            matchedTextRegExp.forEach(matchedText => {
              const nodes: PatientChartNode[] = this.leafNodes.filter(node => {
                return node.id == id;
              });

              //console.log(nodes);
              const set_color: string = this.getNodeFill(nodes[0]);

              const curr_fill: string[] = Object.values(this.color).filter(val => {
                return matchedText.includes(val);
              });

              // console.log(nodes[0].title, nodes[0]);
              // if a color hasn't been set yet, set the color
              if (curr_fill.length === 0) {
                // split along style=, add css to the end, join, replace
                let new_css: string = matchedText.split('style=')[1];
                new_css =
                  new_css.slice(0, new_css.length - 1) +
                  ';' +
                  set_color +
                  new_css.slice(new_css.length - 1);
                //console.log(`replacing: ${matchedText}`);
                matchedText =
                  matchedText.slice(0, matchedText.indexOf('style=')) +
                  'style=' +
                  new_css;
                //console.log(`with: ${matchedText}`);

                const user = JSON.parse(
                  localStorage.getItem('Medico.CurrentUser') || 'null'
                );
                if (user.email == 'superadmin@mail.com') {
                  const splitMatchedText = matchedText.split('</b>');
                  if (splitMatchedText.length == 2) {
                    matchedText = `${splitMatchedText[0]} </b>  (Edit Status: ${nodes[0].attributes.nodeSpecificAttributes.editStatus} | Audit required: ${nodes[0].attributes.auditRequired}) ${splitMatchedText[1]}`;
                  }
                }
                this.parsedContent = this.parsedContent.replace(regExp, matchedText);

                // console.log(`replaced :${this.parsedContent.match(regExp)}`);
                // console.log('\n');
              } // else console.log(`already replaced ${this.prunedLeafNodes[1]}`);
            });
          }
        } else {
          //console.log(`not found: ${id}`);
        }
      });
      //console.log(this.parsedContent);
      //console.trace();
    } else {
      // console.log('edit status not set');
    }
    this.colorAllegations();
  }

  // need to loop through root nodes since chief allegations aren't auto shared
  colorAllegations(): void {
    const matchAllegations: RegExp = new RegExp(
      `Allegations.*?style\\s?=('.*?')?(".*?")?`,
      'g'
    );
    //`
    const matchedTextRegExp: RegExpMatchArray | null =
      this.parsedContent.match(matchAllegations);
    let allegationNum: number = 0;

    if (matchedTextRegExp) {
      if (matchedTextRegExp.length > 0) {
        // split html based on the Allegation headers in order to add correct
        // colors to each using this.rootNodesVisible
        const parsedContentArr: string[] = this.parsedContent.split('Allegations');
        for (let i = 0; i < parsedContentArr.length; i++) {
          if (parsedContentArr[i].charAt(0) === ':') {
            parsedContentArr[i] = 'Allegations' + parsedContentArr[i];
          }
        }

        Object.keys(this.rootNodesVisible).forEach(rootNodeId => {
          // makes sure the correct node is selected
          const node: PatientChartNode = this.leafNodes.filter(node => {
            return node.title == 'Chief Complaint' && node.parentId == rootNodeId;
          })[0];

          let matchedText = matchedTextRegExp[allegationNum];

          if (!node || !node?.parentId || !matchedText) {
            // console.log('couldnt match text, continuing...', allegationNum);
            // console.log('node', node);
            // console.log('matchedText', matchedText);
          } else if (this.rootNodesVisible[node.parentId]) {
            const set_color: string = this.getNodeFill(node);

            const curr_fill: string[] = Object.values(this.color).filter(val => {
              return matchedText.includes(val);
            });

            if (curr_fill.length === 0) {
              let new_css: string = matchedText.split('style=')[1];
              new_css =
                new_css.slice(0, new_css.length - 1) +
                ';' +
                set_color +
                new_css.slice(new_css.length - 1);

              // console.log(node.title, node);
              // console.log(`replacing: ${matchedText}`);
              matchedText =
                matchedText.slice(0, matchedText.indexOf('style=')) + 'style=' + new_css;

              parsedContentArr[allegationNum + 1] = parsedContentArr[
                allegationNum + 1
              ].replace(matchAllegations, matchedText);

              // console.log(
              //   `replaced :${parsedContentArr[allegationNum + 1].match(matchAllegations)}`
              // );
              // console.log('\n');
            } else console.log(`already replaced ${this.prunedLeafNodes[1]}`);
          }

          allegationNum += 1;
        });
        this.parsedContent = parsedContentArr.join('');
      }
    }
  }

  previewReport() {
    //console.log(this.parsedContent);
    if (this.editStatusService.getIsEditStatusSet()) {
      this.parsedContent = this.reportContent.replace(
        /_updated/g,
        `_updated style="padding:5px;"`
      );

      this.parsedContent = this.parsedContent.replace(
        /_baseVital/g,
        `_baseVital style="background:${this.color['blue']};border:solid 1px ${this.chartColors.borderAbnormal};padding:4px 8px;text-align:center;" `
      );

      this.parsedContent = this.parsedContent.replace(
        /_colColor/g,
        `_colColor style="background:${this.chartColors.updated};padding:5px; border:solid 1px ${this.chartColors.borderDefaultOrIncomplete};padding:4px 8px;text-align:center" `
      );
      this.parsedContent = this.parsedContent.replace(
        /_vitalDiff/g,
        `_vitalDiff style="background:${this.chartColors.abnormal};solid 1px ${this.chartColors.borderAbnormal};padding:4px 8px;text-align:center;" `
      );

      this.parsedContent = this.parsedContent.replace(
        /_default/g,
        `_default style="padding: 4px;"`
      );

      this.parsedContent = this.parsedContent.replace(
        /_pointer/g,
        'style="cursor: pointer;"'
      );
      this.colorLeafNodes();
    }

    // if edit status isn't available, format the old way.
    else {
      this.parsedContent = this.reportContent.replace(
        /_updated/g,
        `_updated style="background:${this.chartColors.updated};padding:5px; border:solid 1px ${this.chartColors.borderUpdated};" `
      );

      this.parsedContent = this.parsedContent.replace(
        /_baseVital/g,
        `_baseVital style="background:${this.color['blue']};border:solid 1px ${this.chartColors.borderAbnormal};padding:4px 8px;text-align:center;" `
      );

      this.parsedContent = this.parsedContent.replace(
        /_colColor/g,
        `_colColor style="background:${this.chartColors.updated};padding:5px; border:solid 1px ${this.chartColors.borderDefaultOrIncomplete};padding:4px 8px;text-align:center" `
      );
      this.parsedContent = this.parsedContent.replace(
        /_vitalDiff/g,
        `_vitalDiff style="background:${this.chartColors.abnormal};border:solid 1px ${this.chartColors.borderAbnormal};padding:4px 8px;text-align:center;" `
      );

      this.parsedContent = this.parsedContent.replace(
        /_default/g,
        `_default style="background-color: ${this.chartColors.defaultOrIncomplete};border: 1px solid ${this.chartColors.borderDefaultOrIncomplete};padding: 4px;"  `
      );

      this.parsedContent = this.parsedContent.replace(
        /_pointer/g,
        'style="cursor: pointer;"'
      );
    }

    // if (templatePatientChartNode.name === 'Gait and Station') {
    //   var searchText = 'The claimant can stand';
    //   var found = '';
    //   if (templateHtml.includes(searchText)) {
    //
    //     templateHtml = '<div style="background:#ccc">' + templateHtml + '</div>';
    //   }
    // }

    let count = 0;
    let data = this.parsedContent.split('_template').map(val => {
      val = val + '_template' + count;
      count++;
      return val;
    });
    this.parsedContent = data.join('');

    this.parsedContent = this.parsedContent.replace('_template' + (count - 1), '');

    let countC = 0;
    data = this.parsedContent.split('_arms').map(val => {
      val = val + '_arms' + countC;
      countC++;
      return val;
    });
    this.parsedContent = data.join('');
    this.parsedContent = this.parsedContent.replace('_arms' + (countC - 1), '');

    let countL = 0;
    data = this.parsedContent.split('_legs').map(val => {
      val = val + '_legs' + countL;
      countL++;
      return val;
    });
    this.parsedContent = data.join('');
    this.parsedContent = this.parsedContent.replace('_legs' + (countL - 1), '');

    let countS = 0;
    data = this.parsedContent.split('_strength').map(val => {
      val = val + '_strength' + countS;
      countS++;
      return val;
    });
    this.parsedContent = data.join('');
    this.parsedContent = this.parsedContent.replace('_strength' + (countS - 1), '');

    setTimeout(() => this.setevents(), 1);
  }
  closepreviewReport() {
    this.isPreview = false;
    this.auditDisable();
  }
  auditChanged(e: any) {
    e.value ? this.auditEnable() : this.auditDisable();
  }

  auditEnable() {
    this.previewReport();
  }
  auditDisable() {
    this.parsedContent = this.reportContent;
  }
  editTemplate(item: any) {
    // console.log('item', item);

    this.isPreview = true;
    this.chartViewer = true;

    const className: string = '.' + item.target.className;
    const nodeId = item.target.attributes.id.value;
    this.selectedNodeId = nodeId;

    const selectedPatientChartNode = this.patientChartNodeManagementService.getById(
      nodeId,
      this.patientChart
    );

    // console.log('className', className);
    // console.log(this.elementRef.nativeElement.querySelector(className));
    if (className)
      this.elementRef.nativeElement.querySelector(className).style.color = 'purple';

    if (!selectedPatientChartNode)
      throw `Patient chart node with id: ${nodeId} was not found`;

    const patientChartDocumentNode =
      this.patientChartNodeManagementService.getDocumentNodeRelatedToInnerNode(
        this.patientChart,
        selectedPatientChartNode.id
      );

    if (!patientChartDocumentNode)
      throw `Unable to find root document node for child node with id: ${nodeId}`;

    this.onPatientChartNodeSelected(selectedPatientChartNode, patientChartDocumentNode);
    this.moveToTopIfScrollExists();
  }
  private onPatientChartNodeSelected(
    selectedChartNode: PatientChartNode,
    patientChartDocumentNode: PatientChartNode
  ): void {
    if (this.admission) {
      const admissionId = this.admission.id;
      this.patientChartInfo = new PatientChartInfo(
        patientChartDocumentNode,
        selectedChartNode,
        this.admission.patientId,
        admissionId,
        false,
        this.admission.appointmentId,
        this.companyId
      );
    }

    this.selectedPatientChartNode = selectedChartNode;
    this.selectedPatientChartNodeService.setSelectedPatientChartNodeId(
      selectedChartNode.id
    );
    this.selectedPatientChartNodeService.toEmitPatientChartNodeSelected(
      selectedChartNode
    );
  }
  private moveToTopIfScrollExists() {
    const window = this.windowService.windowRef;
    const isVerticalExists = !!window.pageYOffset;

    if (isVerticalExists) window.scrollTo(0, 0);
  }

  setevents() {
    const templateCount = (this.parsedContent.match(/_template/g) || []).length;
    for (let i = 0; i < templateCount; i++) {
      if (this.elementRef.nativeElement.querySelector('._template' + i)) {
        this.elementRef.nativeElement.querySelector('._template' + i).style.color =
          '#337ab7';
        this.elementRef.nativeElement
          .querySelector('._template' + i)
          .addEventListener('dblclick', this.editTemplate.bind(this));
      }
    }

    // below val is null - needs fixing
    const style = `background-color: ${this.color['blue_dark']};
    color: wheat;
    padding-left: 14px;
    margin-top: 2px;`;
    const _calfCount = (this.parsedContent.match(/_arms/g) || []).length;
    for (let i = 0; i < _calfCount; i++) {
      if (this.elementRef.nativeElement.querySelector('._arms' + i)) {
        const val = this.elementRef.nativeElement.querySelector('._arms' + i).attributes
          .upper.value;
        if (val == 'false') {
          this.elementRef.nativeElement.querySelector(
            '._strength' + i
          ).children[1].style = style;
          this.elementRef.nativeElement.querySelector(
            '._strength' + i
          ).children[2].style = style;
        }
      }
    }

    const _legsCount = (this.parsedContent.match(/_legs/g) || []).length;
    for (let i = 0; i < _legsCount; i++) {
      if (this.elementRef.nativeElement.querySelector('._legs' + i)) {
        const val = this.elementRef.nativeElement.querySelector('._legs' + i).attributes
          .lower.value;

        if (val == 'false') {
          this.elementRef.nativeElement.querySelector(
            '._strength' + i
          ).children[4].style = style;
          this.elementRef.nativeElement.querySelector(
            '._strength' + i
          ).children[5].style = style;
        }
      }
    }
  }
}
