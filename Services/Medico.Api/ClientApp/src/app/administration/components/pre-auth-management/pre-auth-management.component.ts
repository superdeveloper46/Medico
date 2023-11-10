import { AfterViewInit, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DxTreeViewComponent } from 'devextreme-angular';
import { PatientDataModelNode } from 'src/app/patientChart/classes/patientDataModelNode';
import { PatientChartNodeManagementService } from 'src/app/patientChart/services/patient-chart-node-management.service';
import { PatientChartReportFooterService } from 'src/app/patientChart/services/patient-chart-report-footer.service';
import { PatientChartReportHeaderService } from 'src/app/patientChart/services/patient-chart-report-header.service';
import { ReportSectionService } from 'src/app/patientChart/services/report-section.service';
import { SignatureInfoService } from 'src/app/patientChart/services/signature-info.service';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { User } from 'src/app/_models/user';
import { AlertService } from 'src/app/_services/alert.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { ConfigService } from 'src/app/_services/config.service';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { PatientInsuranceService } from 'src/app/_services/patient-insurance.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { UserService } from '../../services/user.service';
import { PreAuthVM } from '../../models/preAuthVM';
import { PatientChartService } from 'src/app/patientChart/services/patient-chart.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { PatientChartHttpService } from 'src/app/_services/patient-chart-http.service';
import { BasePatientChartHttpService } from 'src/app/_services/base-patient-chart-http.service';
import { LibraryPatientChartHttpService } from 'src/app/_services/library-patient-chart-http.service';
import { PatientChartNodeService } from 'src/app/patientChart/services/patient-chart-node.service';
import { Subscription } from 'rxjs';
import { PatientChartAdminNode } from '../../classes/patientChartAdminNode';
@Component({
  selector: 'app-pre-auth-management',
  templateUrl: './pre-auth-management.component.html',
  styleUrls: ['./pre-auth-management.component.sass'],
})
export class PreAuthManagementComponent implements AfterViewInit, OnInit {
  // @Input() patientChartTreeView: PatientDataModelNode[] = [];
  // @Input() admission: Admission;
  companyId: string = '';

  @ViewChild('patientChartTreeViewComponent', { static: false })
  patientChartTreeViewComponent!: DxTreeViewComponent;

  // patientChart: PatientChartNode;

  // reportDataTree: ReportDataTreeNode;
  patientChartTreeViewOrignal: PatientChartAdminNode[] = [];
  reportEditorId = 'report-editor';
  reportEditor: any;
  reportContent = '';
  patientChartHttpService?: BasePatientChartHttpService;
  reportUrl = '';
  configData: any = {};
  isPreview = false;
  currentUser: any;
  parsedContent = '';
  nodeData: any;
  request?: PreAuthVM;
  responseData?: PreAuthVM;
  companyIdSubscription: any;
  patientChartNodeService?: PatientChartNodeService;
  patientChartNodeChangesSubscription?: Subscription;
  patientChartRootId?: string;
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
    private patientChartReportFooterService: PatientChartReportFooterService,
    private companyIdService: CompanyIdService,
    private injector: Injector,

    private patientChartService: PatientChartService,
    private service: UserService
  ) {
    this.reportUrl = `${this.configService.apiUrl}report`;

    if (localStorage.getItem('Medico.CurrentUser')) {
      const _userDetails = new User();
      const _decodeUserDetails = JSON.parse(
        localStorage.getItem('Medico.CurrentUser') ?? 'null'
      );
    }
  }

  ngOnInit() {
    //this.patientChart = JSON.parse(this.admission.admissionData);
    this.initPatientChartHttpService(false, this.injector);
    this.subscribeToCompanyIdChanges();
  }
  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        //this.resetPreviousCompanyData();
        this.getNodeData();
      }
    });
  }
  getNodeData() {
    this.service
      .getPreAuth(this.companyId)
      .then((x: any) => {
        if (x.success) {
          this.responseData = x.data;
          this.nodeData = x.data.preAuth ? JSON.parse(x.data.preAuth) : null;
        }
        if (this.nodeData) {
          this.initPatientChartTreeViewComponentDataSource();
        } else {
          this.patientChartHttpService
            ?.get(this.companyId)
            .then(patientChartRootNode => {
              this.subscribeOnPatientChartNodeChanges(patientChartRootNode);
            })
            .catch(error =>
              this.alertService.error(error.message ? error.message : error)
            );
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }
  private initPatientChartHttpService(isLibraryManagement: boolean, injector: Injector) {
    this.patientChartHttpService = injector.get(
      isLibraryManagement ? LibraryPatientChartHttpService : PatientChartHttpService
    );
  }
  private subscribeOnPatientChartNodeChanges(patientChartRootNode: PatientChartNode) {
    this.patientChartNodeService = new PatientChartNodeService(
      patientChartRootNode,
      this.patientChartNodeManagementService,
      this.patientChartHttpService
    );

    this.patientChartNodeChangesSubscription =
      this.patientChartNodeService?.adminPatientChart.subscribe(adminPatientChart => {
        // const options = this.currentExpandedPatientChartNodeId
        //   ? { expandedSectionId: this.currentExpandedPatientChartNodeId }
        //   : null;
        this.patientChartTreeViewOrignal = [
          this.patientChartService.getPatientChartAdminTree(adminPatientChart, null),
        ];
        this.initPatientChartTreeViewComponentDataSource();
        this.patientChartRootId = adminPatientChart.id;

        // this.updateSelectedPatientChartNodeIfNeeded();

        // this.setPatientChartNodesToReorder();

        // if (this.isUpdatePatientChartNotificationShown)
        //   notify("Patient chart was successfully updated", "info", 800);

        // if (!this.isUpdatePatientChartNotificationShown)
        //   this.isUpdatePatientChartNotificationShown = true;
      });
  }

  ngAfterViewInit() {}

  patientChartSectionSelectionChanged($event: any) {
    const _reportTreeNode = $event.itemData;
    const _isSectionSelected = $event.node.selected;

    // if (isSectionSelected)
    //   this.addPatientChartNodeReportContent(reportTreeNode.id, true);
    // else this.removePatientChartNodeReportContent(reportTreeNode.id);
  }

  save() {
    if (!this.responseData) return;

    this.request = {
      id: this.responseData.id,
      appointmentId: this.companyId,
      createdOn: this.responseData.createdOn,
      preAuth: JSON.stringify(
        this.nodeData ? this.nodeData : this.patientChartTreeViewOrignal
      ),
      modifiedOn: this.responseData.modifiedOn,
      companyId: this.companyId,
    };
    this.service
      .savePreAuth(this.request)
      .then((x: any) => {
        const successMsg = x.success ? 'Save Successfully' : 'Something went wrong';
        this.alertService.info(successMsg);
      })
      .catch(error => {
        this.alertService.error(error.message ? error.message : error);
      });
  }

  private initPatientChartTreeViewComponentDataSource() {
    const data = this.nodeData ? this.nodeData[0] : this.patientChartTreeViewOrignal[0];
    this.patientChartTreeViewComponent.dataSource = [data];
  }

  //we have to remove all invisible nodes
  private getPatientChartReportTreeViewNode(
    patientChartNode: PatientDataModelNode
  ): Nullable<PatientDataModelNode> {
    const isVisible = patientChartNode.visible;
    const isNotShownInReport = patientChartNode.isNotShownInReport;
    if (isNotShownInReport || !isVisible) {
      return;
    }

    const children = patientChartNode.items;
    if (!children || !children.length) return patientChartNode;

    this.removeInvisibleNodes(children);

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
}
