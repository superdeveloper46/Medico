import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  templateUrl: 'patient-template-editor.component.html',
  selector: 'patient-template-editor',
})
export class PatientTemplateEditorComponent {
  @Input() companyId!: string;
  @Input() templateId!: string;
  @Input() admissionId!: string;
  @Input() detailedTemplateContent!: string;

  @Output() contentChanged = new EventEmitter<string>();

  selectedModeIndex = 0;
  private selectableEditorModeIndex = 0;
  private manualEditorModeIndex = 1;

  editorModes = [
    {
      id: this.selectableEditorModeIndex,
      text: 'Selectable',
    },
    {
      id: this.manualEditorModeIndex,
      text: 'Edit',
    },
  ];

  currentModeIndex: number = this.editorModes[0].id;

  onEditorModeSelected(editorMode: any) {
    this.currentModeIndex = editorMode.id;
  }

  onDetailedContentReady(_$event: any) {}

  onDetailedContentChanged(content: string) {
    this.contentChanged.next(content);
  }

  get isManualModeSelected(): boolean {
    return this.currentModeIndex === this.manualEditorModeIndex;
  }

  get isSelectableModeSelected(): boolean {
    return this.currentModeIndex === this.selectableEditorModeIndex;
  }
}
