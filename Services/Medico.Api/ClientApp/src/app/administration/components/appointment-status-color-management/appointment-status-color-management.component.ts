import { Component, QueryList, ViewChildren } from '@angular/core';
import { DxColorBoxComponent } from 'devextreme-angular';
import { ChartColor } from 'src/app/patientChart/models/chartColor';
import { AppointmentStatusColorManagementService } from './appointment-status-color-management.service';
import { LibrarySelectableListService } from 'src/app/administration/services/library/library-selectable-list.service';
import { LibrarySelectableListTitles } from 'src/app/_classes/librarySelectableListTitles';

@Component({
  selector: 'appointment-status-color-management',
  templateUrl: './appointment-status-color-management.component.html',
  styleUrls: ['./appointment-status-color-management.component.scss'],
})
export class AppointmentStatusColorManagementComponent {
  @ViewChildren(DxColorBoxComponent) colorBox!: QueryList<DxColorBoxComponent>;

  // model that stores colors
  chartColors: ChartColor = new ChartColor();
  // used to control event handler looping when resetting color
  resettingColor: boolean = false;
  // used to display the proper name
  categoryFrontEnd: Array<string> = [
    'No Content Changed',
    'Content Updated',
    'Default Or Incomplete',
    'Abnormal Values',
  ];
  // connects the changed color to the correct SQL column name
  categoryBackEnd: Array<string> = [
    'NoContentChanged',
    'Updated',
    'DefaultOrIncomplete',
    'Abnormal',
  ];
  // used to identify the different color boxes
  classNames: Array<Array<string>> = [
    [
      // category_1
      'cat_1Color',
      'cat_1Border',
    ],
    [
      // category_2
      'cat_2Color',
      'cat_2Border',
    ],
    [
      // category_3
      'cat_3Color',
      'cat_3Border',
    ],
    [
      // category_4
      'cat_4Color',
      'cat_4Border',
    ],
  ];

  private allAppointmentStatuses: any;
  private allAppointmentStatusColors: any;

  constructor(
    private appointmentStatusColorManagementService: AppointmentStatusColorManagementService,
    private selectableListService: LibrarySelectableListService
  ) {
    this.appointmentStatusColorManagementService.load().then(colors => {
      this.allAppointmentStatusColors = {};
      colors.map((colorData:any) => {
        let status = colorData.status;
        let color = colorData.color;
        this.allAppointmentStatusColors[status] = color;
      })
    });

    this.selectableListService.getByTitle(LibrarySelectableListTitles.appointmentStatus).then(selectableList => {
      console.log('appointment statuses:', selectableList);
      this.allAppointmentStatuses = selectableList.selectableListValues;
    });
  }

  getAppointmentStatusColor(status: string) {
    return this.allAppointmentStatusColors.hasOwnProperty(status) ? this.allAppointmentStatusColors[status] : null
  }

  saveAppointmentStatusColors() {
    let serviceData = [];
    for(var status in this.allAppointmentStatusColors) {
      console.log(status, this.allAppointmentStatusColors[status]);
      serviceData.push({
        'status': status,
        'color': this.allAppointmentStatusColors[status]
      })
    }
    this.appointmentStatusColorManagementService.save(serviceData);
  }
  
  onColorChange($event: any): void {
    let color = $event.value
    let status = $event.element.id;
    this.allAppointmentStatusColors[status] = color;
  }
}
