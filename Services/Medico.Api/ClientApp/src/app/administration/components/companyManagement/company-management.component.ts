import { Component } from '@angular/core';
import { PatientIdentificationCodeType } from 'src/app/lookUpZipCode/models/enums/patientIdentificationCodeType';

@Component({
  selector: 'company-management',
  templateUrl: './company-management.component.html',
})
export class CompanyManagementComponent {
  companyManagementTabs: Array<any> = [];
  selectedTabIndex = 0;
  identificationCodeTypes = PatientIdentificationCodeType;

  constructor() {
    this.initCompanyManagementTabs();
  }

  onTabSelect($event: any) {
    if (this.selectedTabIndex !== $event.itemIndex)
      this.selectedTabIndex = $event.itemIndex;
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }

  private initCompanyManagementTabs() {
    this.companyManagementTabs = [
      {
        id: 0,
        text: 'Company Info',
      },
      {
        id: 1,
        text: 'Locations',
      },
      {
        id: 2,
        text: 'Rooms',
      },
      {
        id: 3,
        text: 'Employees',
      },
      {
        id: 4,
        text: 'Permissions',
      },
      {
        id: 5,
        text: 'FIN-MRN Configurations',
      },
    ];
  }
}
