import { GuidHelper } from 'src/app/_helpers/guid.helper';

export class ReportDataTreeNode {
  patientChartNodeId: string;
  html: string;
  childrenNodes: ReportDataTreeNode[];
  selected = false;
  constructor(
    patientChartNodeId: string = GuidHelper.generateNewGuid(),
    html = '',
    childrenNodes: ReportDataTreeNode[] = []
  ) {
    this.patientChartNodeId = patientChartNodeId;
    this.html = html;
    this.childrenNodes = childrenNodes;
  }
}
