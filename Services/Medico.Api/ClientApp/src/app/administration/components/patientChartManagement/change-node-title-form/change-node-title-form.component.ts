import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { PatientChartContextMenuAction } from 'src/app/administration/classes/patientChartContextMenuAction';
import { PatientChartNodeChanges } from 'src/app/administration/classes/patientChartNodeChanges';
import { EntityNameService } from 'src/app/_services/entityName.service';

@Component({
  selector: 'change-node-title-form',
  templateUrl: 'change-node-title-form.component.html',
})
export class ChangeNodeTitleFormComponent implements OnInit {
  @ViewChild('changeTitleNodeForm', { static: false })
  changeTitleNodeForm!: DxFormComponent;

  @Input() patientChartContextMenuAction?: PatientChartContextMenuAction;

  @Output() titleNodeEdited: EventEmitter<PatientChartNodeChanges> =
    new EventEmitter<PatientChartNodeChanges>();

  node: any = {
    title: '',
  };

  constructor(private entityNameService: EntityNameService) {}

  ngOnInit() {
    this.setPatientChartNodeTitle();
  }

  setPatientChartNodeTitle() {
    this.node.title = this.patientChartContextMenuAction?.patientChartTreeItem.text;
  }

  updateNodeTitle() {
    const validationResult = this.changeTitleNodeForm.instance.validate();

    if (!validationResult.isValid) return;

    const newNodeTitle = this.node.title;
    const newNodeName = this.entityNameService.formatFromReadableEntityName(newNodeTitle);

    this.processNodeTitleEditing(newNodeTitle, newNodeName);
  }

  private processNodeTitleEditing(newNodeTitle: string, newNodeName: string) {
    const sectionNodeChanges = new PatientChartNodeChanges();

    sectionNodeChanges.nodeId =
      this.patientChartContextMenuAction?.patientChartTreeItem.id;

    sectionNodeChanges.changes = {
      title: newNodeTitle,
      name: newNodeName,
    };

    this.titleNodeEdited.next(sectionNodeChanges);
  }
}
