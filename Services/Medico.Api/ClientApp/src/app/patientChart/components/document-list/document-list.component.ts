import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxSelectBoxComponent } from 'devextreme-angular/ui/select-box';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { LookupModel } from 'src/app/_models/lookupModel';
import { AlertService } from 'src/app/_services/alert.service';
import { ArrayHelper } from 'src/app/_helpers/array.helper';
import { LookupStateModel } from 'src/app/_models/lookupStateModel';

@Component({
  templateUrl: 'document-list.component.html',
  selector: 'document-list',
})
export class DocumentListComponent implements OnInit {
  @Input() companyId!: string;
  @Input() initialDocumentNodes: LookupModel[] = [];

  @ViewChild('documentNodeList', { static: false })
  documentNodeList!: DxListComponent;
  @ViewChild('documentNodeSelectBox', { static: false })
  documentNodeSelectBox!: DxSelectBoxComponent;

  documentNodesDataSource: any = {};

  actualDocumentNodes: LookupStateModel[] = [];

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.initDocumentNodesDataSource();
    this.copyInitialDocumentNodesToActual();
  }

  onDocumentNodeAdded($event: any) {
    const documentNodeToAdd = $event.itemData as LookupModel;
    const documentNodeToAddId = documentNodeToAdd.id;

    const alreadyAddedDocument = this.actualDocumentNodes.find(
      d => d.id === documentNodeToAddId
    );

    if (alreadyAddedDocument) {
      this.alertService.warning('The document is already added to the patient chart');
      this.documentNodeSelectBox.value = null;
      return;
    }

    this.actualDocumentNodes.push(LookupStateModel.createNew(documentNodeToAdd));

    this.documentNodeSelectBox.value = null;
  }

  removeDocumentNodeFromChart(documentNodeId: string) {
    this.alertService
      .confirm(
        'If you delete document, it will not be possible to return back previous patient chart document changes after saving',
        'Deletion Confirmation'
      )
      .then(isDeletionConfirmed => {
        if (isDeletionConfirmed) {
          const documentNodeIndexesToDelete = ArrayHelper.indexesOf(
            this.actualDocumentNodes,
            'id',
            [documentNodeId]
          );

          ArrayHelper.deleteByIndexes(
            this.actualDocumentNodes,
            documentNodeIndexesToDelete
          );
        }
      });
  }

  private initDocumentNodesDataSource() {
    this.documentNodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl(ApiBaseUrls.patientChartDocuments),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private copyInitialDocumentNodesToActual() {
    if (!this.initialDocumentNodes || !this.initialDocumentNodes.length) return;

    this.actualDocumentNodes = this.initialDocumentNodes.map(
      LookupStateModel.createSaved
    );
  }
}
