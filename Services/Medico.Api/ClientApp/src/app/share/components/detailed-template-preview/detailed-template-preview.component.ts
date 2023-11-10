import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';

@Component({
  selector: 'detailed-template-preview',
  templateUrl: './detailed-template-preview.component.html',
})
export class DetailedTemplatePreviewComponent {
  @Input() detailedTemplateContent!: string;
  @Input() companyId?: string;
  @Input() expressions?: any;

  @Output()
  detailedTemplatePreviewHidden = new EventEmitter();

  @ViewChild('detailedTemplatePreviewPopup', { static: false })
  detailedTemplatePreviewPopup?: DxPopupComponent;

  isPreviewPopupContentReady = false;

  onContentChanged(_$event: any) {}

  onDetailedTemplatePreviewPopupHidden(): void {
    this.detailedTemplatePreviewHidden.next(undefined);
  }
}
