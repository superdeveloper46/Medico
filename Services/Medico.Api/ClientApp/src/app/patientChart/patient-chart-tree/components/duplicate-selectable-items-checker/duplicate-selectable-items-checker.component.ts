import { Component, Input, OnInit } from '@angular/core';
import { PredefinedTemplateTypeNames } from 'src/app/_classes/predefinedTemplateTypeNames';
import { TemplateContentCheckerService } from '../../services/template-content-checker.service';

@Component({
  selector: 'duplicate-selectable-items-checker',
  templateUrl: 'duplicate-selectable-items-checker.component.html',
})
export class DuplicateSelectableItemsCheckerComponent implements OnInit {
  @Input() patientChartDocumentNode!: any;
  @Input() detailedTemplateHtmlContent!: string;

  duplicateWords: string[] = [];

  constructor(private templateContentCheckerService: TemplateContentCheckerService) {}

  ngOnInit() {
    this.processDuplicateWordsIfNeeded();
  }

  get duplicateWordsText(): string {
    return this.duplicateWords.length ? this.duplicateWords.join(', ') : '';
  }

  private processDuplicateWordsIfNeeded() {
    const hpiTemplateType = PredefinedTemplateTypeNames.hpi;

    this.duplicateWords = this.templateContentCheckerService.findDuplicateWords(
      this.detailedTemplateHtmlContent,
      hpiTemplateType,
      this.patientChartDocumentNode
    );
  }
}
