import { Component, Input } from '@angular/core';

@Component({
  selector: 'configuration-management',
  templateUrl: './configuration-management.component.html',
})
export class ConfigurationManagementComponent {
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
        text: 'Config settings',
      },
      {
        id: 1,
        text: 'File Naming Convention',
      },
      {
        id: 2,
        text: 'Credentials',
      },
      {
        id: 3,
        text: 'Admin Notification',
      },
      {
        id: 4,
        text: 'Default Settings',
      },
      {
        id: 5,
        text: 'Selectable List Data Source',
      },
      {
        id: 6,
        text: 'Include List',
      },
      {
        id: 7,
        text: 'Exclude List',
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
