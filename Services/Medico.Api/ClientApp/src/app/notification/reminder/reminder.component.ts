import { Component, OnInit, ViewChild } from '@angular/core';
import { DxSchedulerComponent } from 'devextreme-angular/ui/scheduler';
import { SchedulerViews } from 'src/app/scheduler/constants/schedulerViews';
import { SchedulerView } from 'src/app/scheduler/models/schedulerView';
import { AppConfiguration } from 'src/app/_classes/appConfiguration';
import { AlertService } from 'src/app/_services/alert.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.sass'],
})
export class ReminderComponent implements OnInit {
  @ViewChild('reminderScheduler', { static: false })
  reminderScheduler!: DxSchedulerComponent;

  appointmentsData: any[];

  appointments: any[] = [
    {
      text: 'Website Re-Design Plan',
      startDate: new Date('2021-03-29T16:30:00.000Z'),
      endDate: new Date('2021-03-29T18:30:00.000Z'),
    },
    {
      text: 'Book Flights to San Fran for Sales Trip',
      startDate: new Date('2021-03-29T19:00:00.000Z'),
      endDate: new Date('2021-03-29T20:00:00.000Z'),
      allDay: true,
    },
    {
      text: 'Install New Router in Dev Room',
      startDate: new Date('2021-03-29T21:30:00.000Z'),
      endDate: new Date('2021-03-29T22:30:00.000Z'),
    },
    {
      text: 'Approve Personal Computer Upgrade Plan',
      startDate: new Date('2021-03-30T17:00:00.000Z'),
      endDate: new Date('2021-03-30T18:00:00.000Z'),
    },
    {
      text: 'Final Budget Review',
      startDate: new Date('2021-03-30T19:00:00.000Z'),
      endDate: new Date('2021-03-30T20:35:00.000Z'),
    },
    {
      text: 'New Brochures',
      startDate: new Date('2021-03-30T21:30:00.000Z'),
      endDate: new Date('2021-03-30T22:45:00.000Z'),
    },
    {
      text: 'Install New Database',
      startDate: new Date('2021-03-31T16:45:00.000Z'),
      endDate: new Date('2021-03-31T18:15:00.000Z'),
    },
    {
      text: 'Approve New Online Marketing Strategy',
      startDate: new Date('2021-03-31T19:00:00.000Z'),
      endDate: new Date('2021-03-31T21:00:00.000Z'),
    },
    {
      text: 'Upgrade Personal Computers',
      startDate: new Date('2021-03-31T22:15:00.000Z'),
      endDate: new Date('2021-03-31T23:30:00.000Z'),
    },
    {
      text: 'Customer Workshop',
      startDate: new Date('2021-04-01T18:00:00.000Z'),
      endDate: new Date('2021-04-01T19:00:00.000Z'),
      allDay: true,
    },
    {
      text: 'Prepare 2021 Marketing Plan',
      startDate: new Date('2021-04-01T18:00:00.000Z'),
      endDate: new Date('2021-04-01T20:30:00.000Z'),
    },
    {
      text: 'Brochure Design Review',
      startDate: new Date('2021-04-01T21:00:00.000Z'),
      endDate: new Date('2021-04-01T22:30:00.000Z'),
    },
    {
      text: 'Create Icons for Website',
      startDate: new Date('2021-04-02T17:00:00.000Z'),
      endDate: new Date('2021-04-02T18:30:00.000Z'),
    },
    {
      text: 'Upgrade Server Hardware',
      startDate: new Date('2021-04-02T21:30:00.000Z'),
      endDate: new Date('2021-04-02T23:00:00.000Z'),
    },
    {
      text: 'Submit New Website Design',
      startDate: new Date('2021-04-02T23:30:00.000Z'),
      endDate: new Date('2021-04-03T01:00:00.000Z'),
    },
    {
      text: 'Launch New Website',
      startDate: new Date('2021-04-02T19:20:00.000Z'),
      endDate: new Date('2021-04-02T21:00:00.000Z'),
    },
  ];

  // currentDate: Date = new Date();
  schedulerAvailableViews: SchedulerView[] = SchedulerViews;
  appConfiguration: AppConfiguration = new AppConfiguration();
  loading = false;
  data: any[] = [];
  reminderData: any[] = [];

  constructor(private repository: RepositoryService, private alertService: AlertService) {
    this.appointmentsData = this.appointments;
  }

  ngOnInit() {
    this.bindData();
  }

  bindData() {
    this.loading = true;
    const apiUrl = `notification`;

    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.data = res.data.filter((x: any) => x.reminderDate != null) as any[];
          this.data.forEach(element => {
            this.reminderData.push({
              text: element.title,
              startDate: new Date(element.reminderDate),
              endDate: new Date(element.reminderDate),
            });
          });
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  dataSource: any;
  currentDate: Date = new Date();
  resourcesDataSource: any[] = [];

  // markWeekEnd(cellData) {
  //   function isWeekEnd(date) {
  //     var day = date.getDay();
  //     return day === 0 || day === 6;
  //   }
  //   var classObject = {};
  //   classObject["employee-" + cellData.groups.employeeID] = true;
  //   classObject['employee-weekend-' + cellData.groups.employeeID] = isWeekEnd(cellData.startDate)
  //   return classObject;
  // }

  // markTraining(cellData) {
  //   var classObject = {
  //     "day-cell": true
  //   }

  //   classObject[ReminderComponent.getCurrentTraining(cellData.startDate.getDate(), cellData.groups.employeeID)] = true;
  //   return classObject;
  // }

  // static getCurrentTraining(date, employeeID) {
  //   const result = (date + employeeID) % 3,
  //     currentTraining = "training-background-" + result;

  //   return currentTraining;
  // }
}
