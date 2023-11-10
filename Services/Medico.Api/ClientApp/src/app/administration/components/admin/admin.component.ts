import { Component } from '@angular/core';

@Component({
  selector: 'admin',
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  adminSectionNames: Array<string> = [
    'companyManagement',
    'templateManagement',
    'medicationManagement',
    'patientChartManagement',
    'expressionsManagement',
    'insCompManagement',
    'labTestsManagement',
    'vitalSignsManagement',
    'profileManagement',
    'vendorManagement',
    'preAuthManagement',
    'careTeamManagement',
    'businessHoursManagement',
    'appointmentStatusColorManagement',
    'configurationSettings',
    //"attributeManagement"
  ];

  currentlyOpenedAdminSection: string = this.adminSectionNames[0];

  adminModelTree: Array<any> = [
    {
      text: 'Company Management',
      name: this.adminSectionNames[0],
      isSelected: true,
    },
    {
      text: 'Template Management',
      name: this.adminSectionNames[1],
    },
    {
      text: 'Medication Management',
      name: this.adminSectionNames[2],
    },
    {
      text: 'Patient Chart Management',
      name: this.adminSectionNames[3],
    },
    {
      text: 'Expressions Management',
      name: this.adminSectionNames[4],
    },
    {
      text: 'Insurance Company Management',
      name: this.adminSectionNames[5],
    },
    {
      text: 'Order Management',
      name: this.adminSectionNames[6],
    },
    {
      text: 'Vital Signs Look-up',
      name: this.adminSectionNames[7],
    },
    {
      text: 'Profile Management',
      name: this.adminSectionNames[8],
    },
    {
      text: 'Vendor Management',
      name: this.adminSectionNames[9],
    },
    {
      text: 'Pre Auth Management',
      name: this.adminSectionNames[10],
    },
    // {
    //   text: 'Care Team Management',
    //   name: this.adminSectionNames[11],
    // },
    // {
    //   text: 'Audit Management',
    //   name: this.adminSectionNames[12],
    // },
    {
      text: 'Business & Holiday Hours Management',
      name: this.adminSectionNames[12],
    },
    {
      text: 'Appointment Status Color Management',
      name: this.adminSectionNames[13],
    },
    {
      text: 'Configuration Settings',
      name: this.adminSectionNames[14],
    },
    // {
    //     text: "Attributes Management",
    //     name: this.adminSectionNames[5]
    // }
  ];

  isAdminSectionOpened(adminSectionName: string): boolean {
    return adminSectionName === this.currentlyOpenedAdminSection;
  }

  selectAdminSection($event: any) {
    if (!$event || !$event.itemData || !$event.itemData.name) {
      return;
    }

    const adminSectionName = $event.itemData.name;
    this.currentlyOpenedAdminSection = adminSectionName;
  }
}
