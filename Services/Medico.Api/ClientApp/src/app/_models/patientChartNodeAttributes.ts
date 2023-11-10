import { ChartColor } from '../patientChart/models/chartColor';

export class PatientChartNodeAttributes {
  order!: number;
  isActive!: boolean;
  isNotShownInReport!: boolean;
  signedOffOnly!: boolean;
  isPredefined!: boolean;
  auditRequired?: string;
  responsibleEmployeeTypes?: string[];
  chartColors?: ChartColor;
  canSelectMV?: boolean;
  modelViewDataType?: string;
  canSearch?: boolean;
  dataRegex?: string;
  dataLength?: string;
  dataType?: string;
  nodeSpecificAttributes: any = {};

  static createPatientChartNodeAttributes(
    order: number,
    isActive: boolean,
    isNotShownInReport: boolean,
    signedOffOnly: boolean,
    isPredefined: boolean,
    nodeSpecificAttributes: any = null
  ): PatientChartNodeAttributes {
    const patientChartNodeAttributes = new PatientChartNodeAttributes();

    patientChartNodeAttributes.order = order;
    patientChartNodeAttributes.isPredefined = isPredefined;
    patientChartNodeAttributes.isActive = isActive;
    patientChartNodeAttributes.isNotShownInReport = isNotShownInReport;
    patientChartNodeAttributes.signedOffOnly = signedOffOnly;

    patientChartNodeAttributes.nodeSpecificAttributes = nodeSpecificAttributes || {};

    return patientChartNodeAttributes;
  }
}
