import { EnvironmentUrlService } from './../../../_services/environment-url.service';
import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  OnInit,
  Output,
  EventEmitter,
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
import { User } from 'src/app/_models/user';
import { firstValueFrom } from 'rxjs';

declare const tinymce: any;
@Component({
  templateUrl: 'patient-chart-report.component.html',
  selector: 'patient-chart-report',
  styleUrls: ['./patient-chart-report.component.scss'],
})
export class PatientChartReportComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() patientChartTreeView: PatientDataModelNode[] = [];
  @Input() admission?: Admission;
  @Input() companyId!: string;

  @Output() reportHidden: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('patientChartTreeViewComponent', { static: false })
  patientChartTreeViewComponent!: DxTreeViewComponent;

  patientChart?: PatientChartNode;

  reportDataTree?: ReportDataTreeNode;

  reportEditorId = 'report-editor';
  reportEditor: any;
  reportContent = '';

  reportUrl = '';
  configData: any = {};
  isPreview = false;
  currentUser: any;
  parsedContent = '';

  constructor(
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private reportSectionService: ReportSectionService,
    private signatureInfoAppService: SignatureInfoService,
    private httpClient: HttpClient,
    private configService: ConfigService,
    private alertService: AlertService,
    private envService: EnvironmentUrlService,
    private authentication: AuthenticationService,
    private patientInsuranceService: PatientInsuranceService,
    private patientChartNodeManagementService: PatientChartNodeManagementService,
    private patientChartReportHeaderService: PatientChartReportHeaderService,
    private patientChartReportFooterService: PatientChartReportFooterService
  ) {
    this.reportUrl = `${this.configService.apiUrl}report`;

    if (localStorage.getItem('Medico.CurrentUser')) {
      const _userDetails = new User();
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
          .catch(error => {
            this.alertService.error(error.message ? error.message : error);
          });
      })
      .catch(error => {
        this.alertService.error(error.message ? error.message : error);
      });
  }

  ngOnInit() {
    this.patientChart = JSON.parse(this.admission?.admissionData || 'null');
  }

  hideReport() {
    this.reportHidden.next();
  }

  ngAfterViewInit() {
    this.initPatientChartTreeViewComponentDataSource();
    this.setUpReportEditor();
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
                  .isAdmissionSignedOff(this.admission?.id)
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

    if (isSectionSelected) this.addPatientChartNodeReportContent(reportTreeNode.id);
    else this.removePatientChartNodeReportContent(reportTreeNode.id);
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
    const patientChartTree = (
      this.patientChartTreeViewComponent.dataSource as PatientDataModelNode[]
    )[0];
    return this.convertPatientChartTreeNodeToReportDataTreeNode(patientChartTree);
  }

  private convertPatientChartTreeNodeToReportDataTreeNode(
    patientChartTreeNode: PatientDataModelNode
  ): ReportDataTreeNode {
    const reportDataTreeNode = new ReportDataTreeNode(patientChartTreeNode.id);

    const patientChartTreeNodeChildren = patientChartTreeNode.items;

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
    if (!this.patientChart) return Promise.reject();

    const patientChartNode = this.patientChartNodeManagementService.getById(
      reportDataTreeNode.patientChartNodeId,
      this.patientChart
    );
    if (!patientChartNode || !this.admission) return Promise.reject();

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

  private initPatientChartTreeViewComponentDataSource() {
    this.patientChartTreeView[0].selected = true;
    this.patientChartTreeView[0].expanded = true;

    const patientChartTreeViewCopy = ObjectHelper.copy(this.patientChartTreeView);

    this.patientChartTreeViewComponent.dataSource = [
      this.getPatientChartReportTreeViewNode(patientChartTreeViewCopy[0]),
    ];
  }

  //we have to remove all invisible nodes
  private getPatientChartReportTreeViewNode(
    patientChartNode: PatientDataModelNode
  ): Nullable<PatientDataModelNode> {
    const isVisible = patientChartNode.visible;
    const isNotShownInReport = patientChartNode.isNotShownInReport;
    if (isNotShownInReport || !isVisible) return null;

    const children = patientChartNode.items;
    if (!children || !children.length) return patientChartNode;

    this.removeInvisibleNodes(children);
    console.log(patientChartNode);

    return patientChartNode;
  }

  private removeInvisibleNodes(patientChartNodes: PatientDataModelNode[]) {
    const patientChartNodesIndexesToRemove = patientChartNodes.reduce(
      (indexesToRemove: number[], patientChartNode, index) => {
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

  previewReport() {
    this.isPreview = true;
    this.parsedContent = this.reportContent.replace(
      /_updated/g,
      'style=background:#D5FFD5;padding:5px; border:solid 1px #00EC00;'
    );

    this.parsedContent = this.parsedContent.replace(
      /_baseVital/g,
      'style="background:#BFDFFF;border:solid 1px #999;padding:4px 8px;text-align:center;"'
    );

    this.parsedContent = this.parsedContent.replace(
      /_colColor/g,
      'style=background:#D5FFD5;padding:5px; border:solid 1px red;padding:4px 8px;text-align:center'
    );
    this.parsedContent = this.parsedContent.replace(
      /_vitalDiff/g,
      'style="background:#FF9393;border:solid 1px #999;padding:4px 8px;text-align:center;"'
    );
    //style=''
    this.auditEnable();
  }
  closepreviewReport() {
    this.isPreview = false;
    this.auditDisable();
  }
  auditEnable() {
    const htmlTagRegexp = new RegExp('<p _default>', 'g');
    this.parsedContent = this.parsedContent.replace(
      htmlTagRegexp,
      '<p style="background-color: #D5FFD5;border: 1px solid #00EC00;padding: 4px;">'
    );
  }
  auditDisable() {
    const htmlTagRegexp = new RegExp(
      '<p style="background-color: #D5FFD5;border: 1px solid #00EC00;padding: 4px;">',
      'g'
    );
    this.parsedContent = this.reportContent.replace(htmlTagRegexp, '<p _default>');
  }
}
