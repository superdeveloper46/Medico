import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { Injectable } from '@angular/core';
import { PatientChartNodeFiltersService } from './patient-chart-node-filters.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';

@Injectable()
export class PatientChartNodeManagementService {
  constructor(private patientChartNodeFiltersService: PatientChartNodeFiltersService) {}

  getPatientChartDocumentNodeId(
    patientChartRootNode: PatientChartNode,
    patientChartNodeId: string
  ) {
    const patientChartDocumentNodes = this.getNodes(
      patientChartRootNode,
      n => n.type === PatientChartNodeType.DocumentNode
    );

    for (let i = 0; i < patientChartDocumentNodes.length; i++) {
      const patientChartDocumentNode = patientChartDocumentNodes[i];

      const patientChartDocumentChildNode = this.getById(
        patientChartNodeId,
        patientChartDocumentNode
      );

      if (!patientChartDocumentChildNode) continue;

      return patientChartDocumentNode.id;
    }

    return;
  }

  recursiveFromBottomToTopForeach(
    patientChartRootNode: PatientChartNode,
    patientChartNode: PatientChartNode,
    setPatientChartNodeFunc: (node: PatientChartNode) => void
  ) {
    if (!patientChartNode.parentId) return;

    const getByNodeIdFilter = this.patientChartNodeFiltersService.getByNodeIdFilter(
      patientChartNode.parentId
    );

    const parentNode = this.firstOrDefaultNode(patientChartRootNode, getByNodeIdFilter);

    if (!parentNode) return;

    setPatientChartNodeFunc(parentNode);

    this.recursiveFromBottomToTopForeach(
      patientChartRootNode,
      parentNode,
      setPatientChartNodeFunc
    );
  }

  recursiveFromTopToBottomForeach(
    patientChartNode: PatientChartNode,
    setPatientChartNodeFunc: (node: PatientChartNode) => void
  ) {
    setPatientChartNodeFunc(patientChartNode);

    const patientChartNodeChildren = patientChartNode.children;
    if (patientChartNodeChildren && patientChartNodeChildren.length)
      patientChartNodeChildren.forEach(node =>
        this.recursiveFromTopToBottomForeach(node, setPatientChartNodeFunc)
      );
  }

  firstOrDefaultNode(
    patientChartNode: PatientChartNode | undefined,
    filter: (patientChartNode: PatientChartNode) => boolean
  ): Nullable<PatientChartNode> {
    if (!patientChartNode) return;

    const isFilterPass = filter(patientChartNode);

    if (isFilterPass) return patientChartNode;

    const patientChartNodeChildren = patientChartNode.children;

    if (patientChartNodeChildren && patientChartNodeChildren.length) {
      for (let i = 0; i < patientChartNodeChildren.length; i++) {
        const childNode = patientChartNodeChildren[i];
        const patientChartNode = this.firstOrDefaultNode(childNode, filter);

        if (patientChartNode) return patientChartNode;
      }
    }

    return;
  }

  getNodes(
    patientChartNode: PatientChartNode,
    filter: (patientChartNode: PatientChartNode) => boolean
  ): PatientChartNode[] {
    const isFilterPass = filter(patientChartNode);
    if (isFilterPass) return [patientChartNode];

    const patientChartNodeChildren = patientChartNode.children;
    if (!patientChartNodeChildren || !patientChartNodeChildren.length) return [];

    let patientChartNodesByType: PatientChartNode[] = [];

    for (let i = 0; i < patientChartNodeChildren.length; i++) {
      const patientChartNodeChild = patientChartNodeChildren[i];
      const patientChartNodes = this.getNodes(patientChartNodeChild, filter);

      if (patientChartNodes.length)
        patientChartNodesByType = patientChartNodesByType.concat(patientChartNodes);
    }

    return patientChartNodesByType;
  }

  getByName(
    patientChartNodeName: string,
    patientChartNode: PatientChartNode
  ): Nullable<PatientChartNode> {
    const nodeNameFilter =
      this.patientChartNodeFiltersService.getByNodeNameFilter(patientChartNodeName);

    return this.firstOrDefaultNode(patientChartNode, nodeNameFilter);
  }

  getById(
    patientChartNodeId: string,
    patientChartNode?: PatientChartNode
  ): Nullable<PatientChartNode> {
    if (!patientChartNode) return;

    const nodeIdFilter =
      this.patientChartNodeFiltersService.getByNodeIdFilter(patientChartNodeId);

    const response = this.firstOrDefaultNode(patientChartNode, nodeIdFilter);
    return response;
  }

  getDocumentNodeRelatedToInnerNode(
    patientChartRootNode: PatientChartNode | undefined,
    innerPatientChartNodeId: string
  ): PatientChartNode | undefined {
    if (!patientChartRootNode) return;

    const nodeTypeFilter = this.patientChartNodeFiltersService.getByNodeTypeFilter(
      PatientChartNodeType.DocumentNode
    );

    const documentNodes = this.getNodes(patientChartRootNode, nodeTypeFilter);

    for (let i = 0; i < documentNodes.length; i++) {
      const documentNode = documentNodes[i];
      const isNodeInsideParentNode = this.isNodeInsideParentNode(
        documentNode,
        innerPatientChartNodeId
      );

      if (isNodeInsideParentNode) return documentNode;
    }

    return;
  }

  private isNodeInsideParentNode(
    parentNode: PatientChartNode,
    childNodeId: string
  ): boolean {
    if (parentNode.id === childNodeId) return true;

    if (!parentNode.children || !parentNode.children.length) return false;

    for (let i = 0; i < parentNode.children.length; i++) {
      const parentNodeChild = parentNode.children[i];
      if (this.isNodeInsideParentNode(parentNodeChild, childNodeId)) return true;
    }

    return false;
  }
}
