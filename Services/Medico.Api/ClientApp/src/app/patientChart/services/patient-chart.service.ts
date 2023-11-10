import { Injectable } from '@angular/core';
import { ArrayHelper } from 'src/app/_helpers/array.helper';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { PatientDataModelNode } from '../classes/patientDataModelNode';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { PatientChartNodeManagementService } from './patient-chart-node-management.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { PatientChartAdminNode } from 'src/app/administration/classes/patientChartAdminNode';
import { PatientChartNodeAttributes } from 'src/app/_models/patientChartNodeAttributes';
import { PatientChartNodeTemplateProviderService } from 'src/app/_services/patient-chart-node-template-provider.service';
import { AppointmentGridItem } from 'src/app/scheduler/models/appointmentGridItem';
import { GroupedDocumentsByDateAndType } from '../models/groupedDocumentsByDateAndType';
import { Subject } from 'rxjs';

@Injectable()
export class PatientChartService {
  patientChartTree: any;
  patientChartTreeProjection: any;
  patientId?: string;
  patientScanDocumentData: any;
  emitPreviousVisits: Subject<PatientChartNode> = new Subject<PatientChartNode>();

  constructor(
    private patientChartNodeManagementService: PatientChartNodeManagementService
  ) {}

  getPatientChartAdminTree(
    patientChartTreeRootItem: any,
    options?: any
  ): PatientChartAdminNode {
    const id = patientChartTreeRootItem.id;
    const text = patientChartTreeRootItem.title;
    const name = patientChartTreeRootItem.name;

    const expanded = options && options.expandedSectionId === id ? true : false;

    const itemType = patientChartTreeRootItem.type;
    const isPredefined = patientChartTreeRootItem.attributes.isPredefined;

    const parentPatientChartTreeItemId = patientChartTreeRootItem.parentId;

    const order = patientChartTreeRootItem.attributes.order;
    const isActive = patientChartTreeRootItem.attributes.isActive;

    const templateId =
      patientChartTreeRootItem.attributes.nodeSpecificAttributes &&
      patientChartTreeRootItem.attributes.nodeSpecificAttributes.templateId;

    const attributes = patientChartTreeRootItem.attributes;

    const patientChartTreeItem = new PatientChartAdminNode(
      id,
      text,
      name,
      expanded,
      itemType,
      isPredefined,
      parentPatientChartTreeItemId,
      order,
      isActive,
      templateId,
      attributes
    );

    const itemChildren = patientChartTreeRootItem.children;
    if (!itemChildren || itemChildren.length === 0) return patientChartTreeItem;

    for (let i = 0; i < itemChildren.length; i++) {
      const child = itemChildren[i];
      patientChartTreeItem.items[i] = this.getPatientChartAdminTree(child, options);
    }

    return patientChartTreeItem;
  }

  getPatientChartTreeProjection(
    patientChartNode: PatientChartNode,
    isSignedOff: boolean,
    isPreviousVisitChart: boolean
  ): PatientDataModelNode {
    if (patientChartNode.title == 'History of Present Illness') {
    }

    let visible = true;

    const signedOffOnly = patientChartNode.attributes?.signedOffOnly;

    const isActive = patientChartNode.attributes?.isActive;

    if (!isActive || (signedOffOnly && !isSignedOff)) {
      visible = false;
    }

    const id = patientChartNode.id;
    const text = patientChartNode.title;
    const name = patientChartNode.name;
    const expanded = false;
    const isNotShownInReport = patientChartNode?.attributes?.isNotShownInReport ?? false;

    const nodeChildrens = patientChartNode.children;
    let hasChild = true;
    if (!nodeChildrens || nodeChildrens.length === 0) hasChild = false;

    const editable = isPreviousVisitChart && !hasChild && visible;

    const projectionTreeNode = new PatientDataModelNode(
      id,
      text,
      name,
      expanded,
      visible,
      isNotShownInReport,
      editable
    );

    if (!nodeChildrens || nodeChildrens.length === 0) return projectionTreeNode;

    for (let i = 0; i < nodeChildrens.length; i++) {
      const child = nodeChildrens[i];
      projectionTreeNode.items[i] = this.getPatientChartTreeProjection(
        child,
        isSignedOff,
        isPreviousVisitChart
      );
    }

    return projectionTreeNode;
  }

  createPreviousPatientVisitsNode(previousVisits: AppointmentGridItem[]) {
    const previousVisitsRootNodeId = GuidHelper.generateNewGuid();

    const previousVisitsRootNodeAttributes =
      PatientChartNodeAttributes.createPatientChartNodeAttributes(
        1,
        true,
        true,
        false,
        false
      );

    const previousVisitsRootNode = PatientChartNode.createPatientChartSectionNode(
      previousVisitsRootNodeId,
      'previousVisits',
      'Previous Visits',
      previousVisitsRootNodeAttributes,
      undefined,
      ''
    );

    if (!previousVisits.length) return previousVisitsRootNode;

    previousVisitsRootNode.children = [];

    const previousVisitsGroupedByDate = ArrayHelper.groupBy(previousVisits, 'date');

    const previousVisitsDates = Object.keys(previousVisitsGroupedByDate);

    for (let i = 0; i < previousVisitsDates.length; i++) {
      const previousVisitDate = previousVisitsDates[i];

      const formattedPreviousVisitDate = DateHelper.getDate(new Date(previousVisitDate));

      const previousVisitDateNodeId = GuidHelper.generateNewGuid();

      const previousVisitDateNodeAttributes =
        PatientChartNodeAttributes.createPatientChartNodeAttributes(
          i + 1,
          true,
          true,
          false,
          false
        );

      const previousVisitDateNode = PatientChartNode.createPatientChartSectionNode(
        previousVisitDateNodeId,
        formattedPreviousVisitDate,
        formattedPreviousVisitDate,
        previousVisitDateNodeAttributes,
        previousVisitsRootNodeId,
        ''
      );
      previousVisitDateNode.children = [];
      const previousChartsByDate = previousVisitsGroupedByDate[previousVisitDate];
      for (let j = 0; j < previousChartsByDate.length; j++) {
        const chart = previousChartsByDate[j];

        const chartNodeId = GuidHelper.generateNewGuid();
        let k = 0;
        const chartNodeAttributes =
          PatientChartNodeAttributes.createPatientChartNodeAttributes(
            ++k,
            true,
            true,
            false,
            false
          );

        let name = `Chart${j + 1}`;
        try {
          const endDate = new Date(previousVisits[i].endDate);
          name = `${
            previousVisits[i].appointmentPatientChartDocuments[0].title
          }, ${endDate.toLocaleTimeString()}, ${previousVisits[i].appointmentStatus}, ${
            previousVisits[i].physicianFirstName
          } ${previousVisits[i].physicianLastName}`;
        } catch {}

        const chartNode = PatientChartNode.createPatientChartSectionNode(
          chartNodeId,
          `chart${j + 1}`,
          `${name}`,
          chartNodeAttributes,
          previousVisitDateNodeId,
          chart.id
        );

        chartNode.template = `<previous-chart [appointmentId]="'${chart.id}'"></previous-chart>`;

        previousVisitDateNode.children.push(chartNode);
      }

      previousVisitsRootNode.children.push(previousVisitDateNode);
    }

    this.emitPreviousVisits.next(previousVisitsRootNode);
    return previousVisitsRootNode;
  }

  addScanDocumentsToPatientChartNodes(
    patientChartNode: PatientChartNode | undefined,
    scanDocumentsInfo?: any
  ) {
    if (!patientChartNode) return;

    const scanDocumentSectionNodes: PatientChartNode[] =
      this.patientChartNodeManagementService.getNodes(
        patientChartNode,
        (node: PatientChartNode) => node.type === PatientChartNodeType.ScanDocumentNode
      );

    const addingScanDocumentsNeeded =
      scanDocumentSectionNodes.length && scanDocumentsInfo;

    if (!addingScanDocumentsNeeded) return;

    scanDocumentSectionNodes.forEach(scanDocumentSectionNode =>
      this.addScanDocumentsToPatientChartNode(scanDocumentSectionNode, scanDocumentsInfo)
    );
  }

  private addScanDocumentsToPatientChartNode(
    scanDocumentsSectionNode: PatientChartNode,
    scanDocumentsInfo: any
  ) {
    let patientDocuments = JSON.parse(scanDocumentsInfo.documentData);

    //todo: temporary fix:  exclude null documents
    patientDocuments = patientDocuments.filter((document: any) => !!document);

    const patientDocumentsGroupedByDateAndType =
      this.getGroupedDocumentByDateAndType(patientDocuments);

    scanDocumentsSectionNode.children = [];

    patientDocumentsGroupedByDateAndType.forEach(
      (documentsGroupedByDate, documentsGroupedByDateIndex) => {
        const documentCreateDate = DateHelper.getDate(
          documentsGroupedByDate.documentCreateDate
        );

        const parentSectionId = scanDocumentsSectionNode.id;
        const groupedByDateSectionNodeId = GuidHelper.generateNewGuid();

        const groupedByDateSectionNodeAttributes =
          PatientChartNodeAttributes.createPatientChartNodeAttributes(
            documentsGroupedByDateIndex + 1,
            true,
            true,
            false,
            false
          );

        const groupedByDateSectionNode = PatientChartNode.createPatientChartSectionNode(
          groupedByDateSectionNodeId,
          documentCreateDate,
          documentCreateDate,
          groupedByDateSectionNodeAttributes,
          parentSectionId,
          ''
        );

        const documentsGroupedByTypes = documentsGroupedByDate.documentsGroupedByTypes;

        let documentsGroupedByTypesIndex = 1;

        for (const documentType in documentsGroupedByTypes) {
          if (
            Object.prototype.hasOwnProperty.call(documentsGroupedByTypes, documentType)
          ) {
            const groupedByTypeSectionNodeAttributes =
              PatientChartNodeAttributes.createPatientChartNodeAttributes(
                documentsGroupedByTypesIndex,
                true,
                true,
                false,
                false
              );

            const groupedByTypeSectionNodeId = GuidHelper.generateNewGuid();

            const groupedByTypeSectionNode =
              PatientChartNode.createPatientChartSectionNode(
                groupedByTypeSectionNodeId,
                documentType,
                documentType,
                groupedByTypeSectionNodeAttributes,
                groupedByDateSectionNodeId,
                ''
              );

            const documents = documentsGroupedByTypes[documentType];

            for (let i = 0; i < documents.length; i++) {
              const document = documents[i];
              const documentName = document.documentName;
              const pageNumber = document.pageNum;

              const scanDocumentNodeTemplate =
                PatientChartNodeTemplateProviderService.getTemplateValueForPatientChartScanDocumentNode(
                  pageNumber
                );

              const scanDocumentNodeAttributes =
                PatientChartNodeAttributes.createPatientChartNodeAttributes(
                  i + 1,
                  true,
                  true,
                  false,
                  false
                );

              const scanDocumentNodeId = GuidHelper.generateNewGuid();

              const scanDocumentNode = PatientChartNode.createPatientChartNode(
                scanDocumentNodeId,
                documentName,
                documentName,
                PatientChartNodeType.ScanDocumentNode,
                {},
                scanDocumentNodeAttributes,
                groupedByTypeSectionNodeId,
                scanDocumentNodeTemplate
              );

              groupedByTypeSectionNode.children?.push(scanDocumentNode);
            }

            groupedByDateSectionNode.children?.push(groupedByTypeSectionNode);

            documentsGroupedByTypesIndex++;
          }
        }

        scanDocumentsSectionNode.children?.push(groupedByDateSectionNode);
      }
    );
  }

  private getGroupedDocumentByDateAndType(documents: any[]) {
    const groupedDocumentsByDate = ArrayHelper.groupBy(documents, 'doucmentDate');
    const result: GroupedDocumentsByDateAndType[] = [];
    for (const documentCreateDate in groupedDocumentsByDate) {
      const documentsGroupedByTypes = ArrayHelper.groupBy(
        groupedDocumentsByDate[documentCreateDate],
        'documentType'
      );

      result.push({
        documentCreateDate: documentCreateDate,
        documentsGroupedByTypes: documentsGroupedByTypes,
      });
    }
    return result;
  }
}
