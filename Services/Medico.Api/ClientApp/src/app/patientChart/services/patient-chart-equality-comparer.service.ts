import { Diff, diff } from 'deep-diff';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { Injectable } from '@angular/core';
import * as striptags from 'striptags';
// import { EditStatusService } from './edit-status.service';
import { PatientChartNodeManagementService } from './patient-chart-node-management.service';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';

@Injectable()
export class PatientChartEqualityComparer {
  editStatusValues: string[] = ['DO', 'SO', 'EO', 'ES', 'NC', 'UN', 'IN'];

  constructor(
    // private editStatusService: EditStatusService,
    private patientChartNodeManagementService: PatientChartNodeManagementService
  ) {}

  doesPatientChartHaveUnsavedChanges(
    patientChartRootNode: PatientChartNode | undefined,
    savedVersionOfAdmissionData: string | undefined
  ): boolean {
    // this.editStatusService.printEditStatus();

    // make sure that this can take in 'undefined'
    const currentPatientChart = JSON.parse(JSON.stringify(patientChartRootNode));
    const savedPatientChart = JSON.parse(savedVersionOfAdmissionData || 'null');

    //we have to exclude "ScanDocuments" section children because they are generated dynamically
    //and are not presented in saved admission
    const scanDocumentsSectionsInCurrentChart =
      this.patientChartNodeManagementService.getNodes(
        currentPatientChart,
        patientChartNode =>
          patientChartNode.type === PatientChartNodeType.ScanDocumentNode
      );

    if (
      scanDocumentsSectionsInCurrentChart &&
      scanDocumentsSectionsInCurrentChart.length
    ) {
      for (let i = 0; i < scanDocumentsSectionsInCurrentChart.length; i++) {
        scanDocumentsSectionsInCurrentChart[i].children = undefined;
      }
    }

    const scanDocumentsSectionsInSavedChart =
      this.patientChartNodeManagementService.getNodes(
        savedPatientChart,
        patientChartNode =>
          patientChartNode.type === PatientChartNodeType.ScanDocumentNode
      );

    if (scanDocumentsSectionsInSavedChart && scanDocumentsSectionsInSavedChart.length) {
      for (let i = 0; i < scanDocumentsSectionsInSavedChart.length; i++) {
        scanDocumentsSectionsInSavedChart[i].children = undefined;
      }
    }

    return !this.arePatientChartsEqual(savedPatientChart, currentPatientChart);
  }

  arePatientChartsEqual(
    originChart: PatientChartNode,
    comparandChart: PatientChartNode,
    ignoreId?: boolean
  ): boolean {
    const differences = diff(originChart, comparandChart);

    // 'N' indicates a newly added property/element;
    if (!differences) return true;

    if (
      differences.some(({ kind }: Diff<PatientChartNode>) => kind === 'D' || kind === 'A')
    ) {
      return false;
    }

    let newDifferences = differences.filter(
      ({ kind }: Diff<PatientChartNode>) => kind === 'N'
    );
    let editDifferences = differences.filter(
      ({ kind }: Diff<PatientChartNode>) => kind === 'E'
    );

    const newTest = newDifferences;
    const editTest = editDifferences;

    if (typeof ignoreId !== 'undefined') {
      if (ignoreId) {
        this.objForEach(originChart, (key, value) => {
          if (key === 'id' || key === 'parentId') {
            editDifferences = editDifferences.filter((d: any) => {
              d.lhs != value && d.rhs != value;
            });
            newDifferences = newDifferences.filter((d: any) => {
              d.lhs != value && d.rhs != value;
            });
          }
        });
      }
    }

    // if the only differences are the order attribute, return true
    // - might want to extend this to the 'attribute' path as that is the parent
    const orderNewDifferences = newDifferences.filter((d: any) => {
      return d.path.includes('order');
    });
    const orderEditDifferences = editDifferences.filter((d: any) => {
      return d.path.includes('order');
    });
    if (
      (orderNewDifferences === newDifferences && editDifferences.length === 0) ||
      (orderEditDifferences === editDifferences && newDifferences.length === 0)
    )
      return true;

    if (newDifferences.length) {
      if (editDifferences.length) {
        return newDifferences.every(this.isNewlyAddedPropertyHaveEmptyValue) &&
          editDifferences.every(this.areModifiedPropertiesEqual)
          ? true
          : false;
      }

      return newDifferences.every(this.isNewlyAddedPropertyHaveEmptyValue);
    }

    // returns true if empty
    return editDifferences.every((d: any) => this.areModifiedPropertiesEqual(d));
  }

  private isNewlyAddedPropertyHaveEmptyValue(difference: any): boolean {
    const changedValue = difference.rhs;
    // console.log('changedValue', changedValue);

    return Array.isArray(changedValue) && changedValue.length === 0 ? true : false;
  }

  private areModifiedPropertiesEqual(difference: any): boolean {
    const originProperty = difference.lhs;
    const editedProperty = difference.rhs;

    // console.log('in areModifiedPropertiesEqual');
    console.log('\t\toriginProperty', typeof originProperty, originProperty);
    console.log('\t\teditedProperty', typeof editedProperty, editedProperty);

    // this is what they were originally, should it be return true instead?
    // - if only the editStatus is different, not the content, then that
    //   shouldn't justify a change.
    if (originProperty === null && typeof editedProperty === 'object')
      if (Object.keys(editedProperty).includes('editStatus')) return true;
    if (editedProperty === null && typeof originProperty === 'object')
      if (Object.keys(originProperty).includes('editStatus')) return true;

    // just added the below lines, that should fix SoE, need to check the others as well
    if (
      typeof originProperty === 'string' &&
      this.editStatusValues.includes(originProperty) &&
      editedProperty == null
    )
      return true;
    if (
      typeof editedProperty === 'string' &&
      this.editStatusValues.includes(editedProperty) &&
      originProperty == null
    )
      return true;

    if (typeof originProperty === 'string' && typeof editedProperty === 'string') {
      //before comparing we have to clean up string values
      //from html tags and unneeded special characters
      const originPropertyValueToCompare = String(striptags(originProperty))
        .split('')
        .sort()
        .join('')
        .trim();

      const editedPropertyValueToCompare = String(striptags(editedProperty))
        .split('')
        .sort()
        .join('')
        .trim();

      return originPropertyValueToCompare === editedPropertyValueToCompare;
    }
    return originProperty === editedProperty;
  }

  private objForEach<T>(obj: T, f: (k: keyof T, v: T[keyof T]) => void): void {
    for (const k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) f(k, obj[k]);
  }
}
