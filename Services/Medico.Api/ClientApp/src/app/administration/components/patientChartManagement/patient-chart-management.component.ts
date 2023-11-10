import { Component, OnInit, OnDestroy, ViewChild, Input, Injector } from '@angular/core';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { Subscription } from 'rxjs';
import { PatientChartNodeService } from 'src/app/patientChart/services/patient-chart-node.service';
import { AlertService } from 'src/app/_services/alert.service';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import { PatientChartContextMenuService } from '../../services/patient-chart-context-menu.service';
import { SortableItem } from 'src/app/share/classes/sortableItem';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartAdminNode } from '../../classes/patientChartAdminNode';
import { PatientChartNodeManagementService } from 'src/app/patientChart/services/patient-chart-node-management.service';
import { PatientChartContextMenuAction } from '../../classes/patientChartContextMenuAction';
import { PatientChartContextMenuActionTypes } from '../../classes/patientChartContextMenuActionTypes';
import { PatientChartNodeChanges } from '../../classes/patientChartNodeChanges';
import notify from 'devextreme/ui/notify';
import { PatientChartService } from 'src/app/patientChart/services/patient-chart.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { BasePatientChartHttpService } from 'src/app/_services/base-patient-chart-http.service';
import { LibraryPatientChartHttpService } from 'src/app/_services/library-patient-chart-http.service';
import { PatientChartHttpService } from 'src/app/_services/patient-chart-http.service';
import { EmployeeTypeList } from '../../classes/employeeTypeList';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { AuditRequiredTypeList } from '../../classes/auditRequiredTypeList';
import { ChartColor } from 'src/app/patientChart/models/chartColor';
import { PatientChartNodeAttributes } from 'src/app/_models/patientChartNodeAttributes';
import { ModelViewSelectionTypes } from '../../classes/modelViewSelectionTypes';
import { DataTypeSelection } from '../../classes/dataTypeSelection';
import { DefaultChartColors } from '../../classes/defaultChartColors';

export let patientChartTree = {} as any;
@Component({
  selector: 'patient-chart-management',
  templateUrl: 'patient-chart-management.component.html',
  styleUrls: ['patient-chart-management.component.sass'],
})
export class PatientChartManagementComponent implements OnInit, OnDestroy {
  @Input() isLibraryManagement!: boolean;

  @ViewChild('contextMenu', { static: false })
  contextMenu!: DxContextMenuComponent;
  @ViewChild('treeView', { static: false })
  treeView!: DxTreeViewComponent;

  patientChartRootId = '';

  patientChartHttpService?: BasePatientChartHttpService;

  isUpdatePatientChartNotificationShown?: boolean;

  currentExpandedPatientChartNodeId?: string;

  patientChartNodesToReorder: SortableItem[] = [];

  patientChartNodeService?: PatientChartNodeService;
  patientChartNodeChangesSubscription?: Subscription;

  companyIdSubscription?: Subscription;
  companyId: string = '';

  patientChartTreeView: PatientChartAdminNode[] = [];

  selectedPatientChartNode?: PatientChartAdminNode;
  copiedPatientChartNode?: PatientChartAdminNode;
  patientChartContextMenuAction?: PatientChartContextMenuAction;

  isPatientChartNodeManagementPopupOpened = false;
  isReorderPatientChartItemsPopupOpened = false;

  medicalAssistantDataSource: any = {};
  physicianDataSource: any = {};
  employeeTypes: any[] = EmployeeTypeList.values;
  savedEmployeeTypes?: string[] = [];
  employeeTypeNames: string[] = this.employeeTypes.map(x => x.name);
  auditRequiredTypes: any[] = AuditRequiredTypeList.values;
  auditRequiredNames: string[] = this.auditRequiredTypes.map(x => x.name);
  savedAuditRequired?: string;
  modelViewSelectionTypeNames: string[] = ModelViewSelectionTypes.values.map(x => x.name);
  dataTypeNames: string[] = DataTypeSelection.values.map(x => x.name);
  selectedEmployeeTypes: string[] = [];
  selectedAuditRequiredTypes?: string;
  selectedDataType?: string;
  selectedModelViewType?: string;
  isPatientChartNodeSelected = false;
  isRequired = false;
  chartColor: ChartColor | undefined;
  canSelectMV?: Nullable<boolean> = false;
  canSearch?: Nullable<boolean> = false;
  dataRegex?: string = '';
  dataLength?: string = '';

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private companyIdService: CompanyIdService,
    private patientChartService: PatientChartService,
    private alertService: AlertService,
    private patientChartContextMenuService: PatientChartContextMenuService,
    private patientChartNodeManagementService: PatientChartNodeManagementService,
    private injector: Injector
  ) {}

  get isChangeNodeTitleFormVisible(): boolean {
    if (!this.patientChartContextMenuAction) return false;

    const actionType = this.patientChartContextMenuAction.actionType;

    return actionType === PatientChartContextMenuActionTypes.EditNodeTitle;
  }

  get isTemplateListNodeFormVisible(): boolean {
    if (!this.patientChartContextMenuAction) return false;

    const actionType = this.patientChartContextMenuAction.actionType;

    return (
      actionType === PatientChartContextMenuActionTypes.EditTemplateList ||
      actionType === PatientChartContextMenuActionTypes.NewTemplateList
    );
  }

  get isTemplateNodeFormVisible(): boolean {
    if (!this.patientChartContextMenuAction) return false;

    const actionType = this.patientChartContextMenuAction.actionType;

    return (
      actionType === PatientChartContextMenuActionTypes.NewTemplate ||
      actionType === PatientChartContextMenuActionTypes.EditTemplate
    );
  }

  get isSectionNodeFormVisible(): boolean {
    if (!this.patientChartContextMenuAction) return false;

    const actionType = this.patientChartContextMenuAction.actionType;

    return (
      actionType === PatientChartContextMenuActionTypes.NewSectionNode ||
      actionType === PatientChartContextMenuActionTypes.EditSectionNode
    );
  }

  get isDocumentNodeFormVisible(): boolean {
    if (!this.patientChartContextMenuAction) return false;

    const actionType = this.patientChartContextMenuAction.actionType;

    return (
      actionType === PatientChartContextMenuActionTypes.EditDocumentNode ||
      actionType === PatientChartContextMenuActionTypes.NewDocumentNode
    );
  }

  deactivatePatientChartNode(
    $event: Event,
    patientChartAdminNode: PatientChartAdminNode
  ) {
    const confirmationPopup = this.alertService.confirm(
      `Are you sure you want to deactivate the "${patientChartAdminNode.text}" company ?`,
      'Confirm deactivation'
    );
    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        console.log('Hello');
        // const patientnode = this.getPatientChartNode(patientChartAdminNode,patientChartAdminNode.id)
        $event.stopPropagation();
        const isDocumentRootNodeDeactivation =
          patientChartAdminNode.itemType === PatientChartNodeType.RootNode;

        if (isDocumentRootNodeDeactivation) {
          this.alertService.warning("Unable to deactivate 'root' node");
          return;
        }
        patientChartAdminNode.isActive = false;
        this.currentExpandedPatientChartNodeId = patientChartAdminNode.id;
        this.patientChartNodeService?.deactivatePatientChartNode(
          patientChartAdminNode,
          this.companyId
        );
        patientChartTree = this.patientChartTreeView.map(obj => obj.items);
      }
    });
  }

  activatePatientChartNode($event: Event, patientChartAdminNode: PatientChartAdminNode) {
    const confirmationPopup = this.alertService.confirm(
      `Are you sure you want to activate the "${patientChartAdminNode.text}" company ?`,
      'Confirm activation'
    );
    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        console.log('Hello');
        $event.stopPropagation();
        patientChartAdminNode.isActive = true;
        this.currentExpandedPatientChartNodeId = patientChartAdminNode.id;

        this.patientChartNodeService?.activatePatientChartNode(
          patientChartAdminNode,
          this.companyId
        );
        patientChartTree = this.patientChartTreeView.map(obj => obj.items);
      }
    });
  }

  onTitleNodeEdited($event: PatientChartNodeChanges) {
    this.currentExpandedPatientChartNodeId = $event.nodeId;
    this.isPatientChartNodeManagementPopupOpened = false;

    this.patientChartNodeService?.updatePatientChartNode($event, this.companyId);
  }

  onPatientChartNodeEdited($event: PatientChartNodeChanges) {
    this.currentExpandedPatientChartNodeId = $event.nodeId;
    this.isPatientChartNodeManagementPopupOpened = false;

    this.patientChartNodeService?.updatePatientChartNode($event, this.companyId);
  }

  onPatientChartNodeAdded($event: PatientChartNode) {
    this.currentExpandedPatientChartNodeId = $event.id;
    this.isPatientChartNodeManagementPopupOpened = false;

    this.patientChartNodeService?.addPatientChartNode($event, this.companyId);
  }

  reorderPatientChartChildrenNodes($event: SortableItem[]) {
    const patientChartNodeParentId = this.selectedPatientChartNode?.id;
    this.currentExpandedPatientChartNodeId = patientChartNodeParentId;

    if (!patientChartNodeParentId) return;

    this.patientChartNodeService?.reorderPatientChartChildrenNodes(
      patientChartNodeParentId,
      $event,
      this.companyId
    );
  }

  onDocumentNodeSynchronized(_$event: any) {
    this.isPatientChartNodeManagementPopupOpened = false;
    this.patientChartNodeService?.refreshPatientChart(this.companyId);
  }

  onPatientChartContextMenuClick($event: any) {
    const itemData: PatientChartContextMenuAction = $event.itemData;
    const actionType = itemData.actionType;
    const patientChartAdminNode: PatientChartAdminNode = itemData.patientChartTreeItem;

    this.executeCopyHandler(patientChartAdminNode, actionType);
    this.executePasteHandler(patientChartAdminNode, actionType);
    this.executeDeleteHandler(patientChartAdminNode, actionType);
    this.executeAddUpdateHandler(itemData);
  }

  selectPatientChartNode($event: any) {
    patientChartTree = this.patientChartTreeView.map(obj => obj.items);
    this.selectedPatientChartNode = $event.itemData;
    this.setPatientChartNodesToReorder();
    this.setAttributes();
    this.isPatientChartNodeSelected = true;
  }

  setAttributes(): void {
    if (this.selectedPatientChartNode?.attributes) {
      this.savedEmployeeTypes =
        this.selectedPatientChartNode.attributes.responsibleEmployeeTypes;
      this.savedAuditRequired = this.selectedPatientChartNode.attributes.auditRequired;
      if (this.selectedPatientChartNode.attributes.chartColors == null) {
        const chartColorsDefault = new ChartColor();
        chartColorsDefault.setDefault(new DefaultChartColors());
        this.chartColor = chartColorsDefault;
      } else {
        this.chartColor = this.selectedPatientChartNode.attributes.chartColors;
      }
      this.selectedAuditRequiredTypes =
        this.selectedPatientChartNode.attributes.auditRequired;
      this.canSearch = this.selectedPatientChartNode.attributes.canSearch;
      this.canSelectMV = this.selectedPatientChartNode.attributes.canSelectMV;
      this.selectedModelViewType =
        this.selectedPatientChartNode.attributes.modelViewDataType;
      this.selectedDataType = this.selectedPatientChartNode.attributes.dataType;
      this.dataRegex = this.selectedPatientChartNode.attributes.dataRegex;
      this.dataLength = this.selectedPatientChartNode.attributes.dataLength;
    }
  }

  openPatientChartContextMenu($event: any) {
    $event.event.preventDefault();
    this.setUpContextMenu($event);
  }

  onPatientChartNodeManagementPopupOpenedHidden() {
    this.patientChartContextMenuAction = undefined;
  }

  ngOnInit(): void {
    this.initPatientChartHttpService(this.isLibraryManagement, this.injector);

    if (!this.isLibraryManagement) this.subscribeToCompanyIdChanges();
    else this.setLibraryPatientChart();

    this.initPhysicianDataSource();
    this.initMedicalAssistantDataSource();
  }

  ngOnDestroy(): void {
    if (this.companyIdSubscription) this.companyIdSubscription.unsubscribe();

    if (this.patientChartNodeChangesSubscription)
      this.patientChartNodeChangesSubscription.unsubscribe();
  }

  private getPatientChartNode(
    patientChartNode: PatientChartAdminNode,
    nodeId: string
  ): PatientChartAdminNode | undefined {
    if (patientChartNode.id === nodeId) return patientChartNode;

    const patientChartNodeChildren = patientChartNode.items;

    if (!patientChartNodeChildren || !patientChartNodeChildren.length) return;

    for (let i = 0; i < patientChartNodeChildren.length; i++) {
      const currentChild = patientChartNodeChildren[i];
      const childNode = this.getPatientChartNode(currentChild, nodeId);
      if (childNode) return childNode;
    }

    return;
  }

  private executeCopyHandler = (
    patientChartAdminNode: PatientChartAdminNode,
    actionType: PatientChartContextMenuActionTypes
  ) => {
    if (!this.isCopyAction(actionType)) return;

    this.copiedPatientChartNode = patientChartAdminNode;
    this.currentExpandedPatientChartNodeId = patientChartAdminNode.id;
    this.patientChartContextMenuAction = undefined;

    notify('Patient chart node was successfully copied', 'info', 800);
  };

  private executePasteHandler = (
    patientChartAdminNode: PatientChartAdminNode,
    actionType: PatientChartContextMenuActionTypes
  ) => {
    if (!this.isPasteAction(actionType)) return;

    const patientChartNodeIdToCopy = this.copiedPatientChartNode?.id;
    const parentPatientChartNodeId = patientChartAdminNode.id;

    if (patientChartNodeIdToCopy && parentPatientChartNodeId) {
      this.patientChartNodeService?.copyPastePatientChartNode(
        patientChartNodeIdToCopy,
        parentPatientChartNodeId,
        this.companyId
      );
    }

    this.patientChartContextMenuAction = undefined;
    this.copiedPatientChartNode = undefined;
    this.currentExpandedPatientChartNodeId = parentPatientChartNodeId;
  };

  private executeDeleteHandler = (
    patientChartAdminNode: PatientChartAdminNode,
    actionType: PatientChartContextMenuActionTypes
  ) => {
    if (!this.isDeleteAction(actionType)) return;

    this.deletePatientChartNodeWithConfirmation(
      patientChartAdminNode.id,
      patientChartAdminNode.text,
      patientChartAdminNode.parentPatientChartTreeItemId,
      actionType,
      patientChartAdminNode.isPredefined
    );
  };

  private executeAddUpdateHandler = (
    patientChartContextMenuAction: PatientChartContextMenuAction
  ) => {
    const actionType = patientChartContextMenuAction.actionType;

    const isAddUpdateAction =
      !this.isDeleteAction(actionType) &&
      !this.isCopyAction(actionType) &&
      !this.isPasteAction(actionType);

    if (!isAddUpdateAction) return;

    this.patientChartContextMenuAction = patientChartContextMenuAction;

    this.isPatientChartNodeManagementPopupOpened = true;
  };

  private isDeleteAction(
    contextMenuActionType: PatientChartContextMenuActionTypes
  ): boolean {
    return contextMenuActionType === PatientChartContextMenuActionTypes.DeleteNode;
  }

  private isCopyAction(
    contextMenuActionType: PatientChartContextMenuActionTypes
  ): boolean {
    return contextMenuActionType === PatientChartContextMenuActionTypes.CopyNode;
  }

  private isPasteAction(
    contextMenuActionType: PatientChartContextMenuActionTypes
  ): boolean {
    return contextMenuActionType === PatientChartContextMenuActionTypes.PasteNode;
  }

  private deletePatientChartNodeWithConfirmation(
    id: string,
    nodeTitle: string,
    parentNodeId: string,
    action: PatientChartContextMenuActionTypes,
    isPredefinedNode: boolean
  ) {
    if (isPredefinedNode) {
      this.alertService.warning('You cannot delete predefined nodes from patient chart');
      this.patientChartContextMenuAction = undefined;
      return;
    }

    this.alertService
      .confirm('Are you sure you want to delete from patient chart ?', 'Confirm deletion')
      .then(confirmationResult => {
        if (confirmationResult) {
          this.currentExpandedPatientChartNodeId = parentNodeId;

          this.patientChartNodeService?.deletePatientChartNode(
            id,
            parentNodeId,
            this.companyId
          );

          this.patientChartContextMenuAction = undefined;
        }
      });
  }

  private setUpContextMenu($event: any) {
    this.contextMenu.target = $event.event.target;
    const patientChartTreeItem = $event.itemData;

    const isCopiedNodeExist = !!this.copiedPatientChartNode;

    this.contextMenu.dataSource =
      this.patientChartContextMenuService.getContextMenuItemsBasedOnPatientChartNode(
        patientChartTreeItem,
        isCopiedNodeExist
      );

    this.contextMenu.visible = true;
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.resetPreviousCompanyData();

        this.patientChartHttpService
          ?.get(companyId)
          .then(patientChartRootNode => {
            this.subscribeOnPatientChartNodeChanges(patientChartRootNode);
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
      }
    });
  }

  private setLibraryPatientChart() {
    this.patientChartHttpService
      ?.get()
      .then(patientChartRootNode => {
        this.subscribeOnPatientChartNodeChanges(patientChartRootNode);
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private subscribeOnPatientChartNodeChanges(patientChartRootNode: PatientChartNode) {
    if (this.patientChartNodeService)
      this.patientChartNodeChangesSubscription?.unsubscribe();

    this.patientChartNodeService = new PatientChartNodeService(
      patientChartRootNode,
      this.patientChartNodeManagementService,
      this.patientChartHttpService
    );

    this.patientChartNodeChangesSubscription =
      this.patientChartNodeService.adminPatientChart.subscribe(adminPatientChart => {
        const options = this.currentExpandedPatientChartNodeId
          ? { expandedSectionId: this.currentExpandedPatientChartNodeId }
          : null;

        this.patientChartTreeView = [
          this.patientChartService.getPatientChartAdminTree(adminPatientChart, options),
        ];

        this.patientChartRootId = adminPatientChart.id;

        this.updateSelectedPatientChartNodeIfNeeded();

        this.setPatientChartNodesToReorder();

        if (this.isUpdatePatientChartNotificationShown)
          notify('Patient chart was successfully updated', 'info', 800);

        if (!this.isUpdatePatientChartNotificationShown)
          this.isUpdatePatientChartNotificationShown = true;
      });
  }

  private updateSelectedPatientChartNodeIfNeeded() {
    if (!this.selectedPatientChartNode) return;

    const selectedPatientChartNodeId = this.selectedPatientChartNode.id;

    const selectedPatientChartNode = this.getPatientChartNode(
      this.patientChartTreeView[0],
      selectedPatientChartNodeId
    );

    this.selectedPatientChartNode = selectedPatientChartNode || undefined;
  }

  private resetPreviousCompanyData() {
    this.patientChartNodesToReorder = [];
    this.selectedPatientChartNode = undefined;
    this.copiedPatientChartNode = undefined;
    this.patientChartContextMenuAction = undefined;
    this.isUpdatePatientChartNotificationShown = false;
  }

  private setPatientChartNodesToReorder() {
    if (!this.selectedPatientChartNode) return;

    const selectedPatientChartNodeChildren = this.selectedPatientChartNode.items;

    if (!selectedPatientChartNodeChildren || !selectedPatientChartNodeChildren.length) {
      this.patientChartNodesToReorder = [
        SortableItem.createSortableItem(
          this.selectedPatientChartNode.id,
          this.selectedPatientChartNode.order,
          this.selectedPatientChartNode.text
        ),
      ];

      return;
    }

    this.patientChartNodesToReorder = selectedPatientChartNodeChildren.map(
      sortableItem => {
        return SortableItem.createSortableItem(
          sortableItem.id,
          sortableItem.order,
          sortableItem.text
        );
      }
    );
  }

  private initPatientChartHttpService(isLibraryManagement: boolean, injector: Injector) {
    this.patientChartHttpService = injector.get(
      isLibraryManagement ? LibraryPatientChartHttpService : PatientChartHttpService
    );
  }

  handleAttributeSave(_e: any): void {
    if (!this.selectedPatientChartNode || !this.patientChartNodeService) return;
    const attributes = {
      isRequired: this.isRequired,
      employeeTypes: this.selectedEmployeeTypes,
      auditRequired: this.selectedAuditRequiredTypes,
      chartColor: this.chartColor,
      canSelectMV: this.canSelectMV,
      modelViewDataType: this.selectedModelViewType,
      canSearch: this.canSearch,
      dataRegex: this.dataRegex,
      dataLength: this.dataLength,
      dataType: this.selectedDataType,
    };

    console.log('selectedPatientChartNode', this.selectedPatientChartNode);
    this.patientChartNodeService.addAttributeToPatientChartNode(
      this.companyId,
      this.selectedPatientChartNode.id,
      attributes
    );
  }

  onEmployeeSelectionChanged(e: any): void {
    this.selectedEmployeeTypes = e.component._selectedItems;
  }

  private initPhysicianDataSource(): void {
    const physicianDataSource = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[0].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });

    this.physicianDataSource.store = physicianDataSource;
    console.log(
      'this.physianDataSource',
      typeof this.physicianDataSource,
      this.physicianDataSource
    );
  }

  private initMedicalAssistantDataSource(): void {
    const medicalAssistantDataSource = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[3].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });

    this.medicalAssistantDataSource.store = medicalAssistantDataSource;
    console.log(
      'this.medicalAssistantDataSource',
      typeof this.medicalAssistantDataSource,
      this.medicalAssistantDataSource
    );
  }
}
