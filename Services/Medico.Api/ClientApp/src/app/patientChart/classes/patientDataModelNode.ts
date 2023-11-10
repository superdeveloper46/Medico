export class PatientDataModelNode {
  id: string;
  text: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  items: Array<PatientDataModelNode> = [];
  selected: boolean;
  isNotShownInReport: boolean;
  editable: boolean;

  constructor(
    id: string,
    text: string,
    name: string,
    expanded: boolean,
    visible: boolean,
    isNotShownInReport: boolean,
    editable: boolean
  ) {
    this.id = id;
    this.text = text;
    this.name = name;
    this.expanded = expanded;
    this.visible = visible;
    this.selected = false;
    this.isNotShownInReport = isNotShownInReport;
    this.editable = editable;
  }
}
