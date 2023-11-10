import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PatientChartNodeUsePhraseReadModel } from 'src/app/administration/models/patientChartNodeUsePhraseReadModel';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { LookupModel } from 'src/app/_models/lookupModel';
import { PatientChartDocumentService } from 'src/app/_services/patient-chart-document.service';
import { AlertService } from 'src/app/_services/alert.service';

@Component({
  selector: 'patient-chart-node-phrases',
  templateUrl: './patient-chart-node-phrases.component.html',
})
export class PatientChartNodePhrasesComponent implements OnInit {
  @Input() companyId!: string;
  @Input() phraseId?: string;
  @Input() phraseName?: string;
  @Input() patientChartNodeUsePhrases?: PatientChartNodeUsePhraseReadModel[];

  @Output() cancelNodesManaging = new EventEmitter<void>();

  @Output() saveNodesChanges = new EventEmitter<PatientChartNodeUsePhraseReadModel[]>();

  patientChartNodeUsePhrasesCopy: PatientChartNodeUsePhraseReadModel[] = [];

  patientChartDocumentDataSource: any = {};
  patientChartNodeDataSource: LookupModel[] = [];

  selectedPatientChartDocument?: LookupModel;
  selectedPatientChartNode?: LookupModel;

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private patientChartDocumentService: PatientChartDocumentService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.init();
  }

  cancelSavingPatientChartNodes() {
    this.cancelNodesManaging.next();
  }

  savePatientChartNodes() {
    this.saveNodesChanges.next(this.patientChartNodeUsePhrasesCopy);
  }

  deleteNode(documentId: string, patientChartNodeId: string, _$event: any) {
    this.alertService
      .confirm('Are you sure you want to delete node ?', 'Delete Confirmation')
      .then(result => {
        if (!result) return;

        const indexNodeToDelete = this.patientChartNodeUsePhrasesCopy.findIndex(
          n => n.documentId === documentId && n.patientChartNodeId === patientChartNodeId
        );

        this.patientChartNodeUsePhrasesCopy.splice(indexNodeToDelete, 1);
      });
  }

  addPatientChartNode() {
    if (!this.selectedPatientChartDocument || !this.selectedPatientChartNode) {
      this.alertService.warning('Document Or Patient Chart Node is not selected');
      return;
    }

    const alreadyAddedNode = this.patientChartNodeUsePhrasesCopy.find(
      n =>
        n.documentId === this.selectedPatientChartDocument?.id &&
        n.patientChartNodeId === this.selectedPatientChartNode?.id
    );

    if (alreadyAddedNode) {
      this.alertService.warning('Patient Chart Node is already added');
      return;
    }

    const newNode = new PatientChartNodeUsePhraseReadModel();

    newNode.documentId = this.selectedPatientChartDocument.id;
    newNode.documentName = this.selectedPatientChartDocument.name;

    newNode.patientChartNodeId = this.selectedPatientChartNode.id;
    newNode.patientChartNodePath = this.selectedPatientChartNode.name;

    this.patientChartNodeUsePhrasesCopy.push(newNode);

    this.resetSelectedPatientChartDocumentAndNode();
  }

  onPatientChartDocumentChanged(_$event: any) {
    if (!this.selectedPatientChartDocument) {
      this.resetSelectedPatientChartDocumentAndNode();
      return;
    }

    this.patientChartDocumentService
      .getNodes(this.selectedPatientChartDocument.id)
      .then((nodes: LookupModel[]) => {
        this.patientChartNodeDataSource = nodes;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private resetSelectedPatientChartDocumentAndNode() {
    this.selectedPatientChartNode = undefined;
    this.selectedPatientChartDocument = undefined;

    this.patientChartNodeDataSource = [];
  }

  private init() {
    this.patientChartNodeUsePhrasesCopy = JSON.parse(
      JSON.stringify(this.patientChartNodeUsePhrases)
    );

    this.initPatientChartDocumentDataSource();
  }

  private initPatientChartDocumentDataSource() {
    this.patientChartDocumentDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.patientChartDocuments),
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
