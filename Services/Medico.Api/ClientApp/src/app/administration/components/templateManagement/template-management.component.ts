import { Component, Input } from '@angular/core';

@Component({
  selector: 'template-management',
  templateUrl: './template-management.component.html',
})
export class TemplateManagementComponent {
  @Input() companyId?: string;

  public tabs: Array<any> = [];
  public selectedTabIndex = 0;

  constructor() {
    this.initTabs();
  }

  initTabs(): any {
    this.tabs = [
      {
        id: 0,
        text: 'Selectable List Categories',
      },
      {
        id: 1,
        text: 'Selectable List',
      },
      {
        id: 2,
        text: 'Template Type',
      },
      {
        id: 3,
        text: 'Template',
      },
      {
        id: 4,
        text: 'Template Mapping',
      },
      {
        id: 5,
        text: 'Keyword ICD Code Map',
      },
      {
        id: 6,
        text: 'Phrase',
      },
      {
        id: 7,
        text: 'Phrase Usage',
      },
    ];
  }

  onTabSelect($event: any) {
    if (this.selectedTabIndex !== $event.itemIndex)
      this.selectedTabIndex = $event.itemIndex;
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }
}
