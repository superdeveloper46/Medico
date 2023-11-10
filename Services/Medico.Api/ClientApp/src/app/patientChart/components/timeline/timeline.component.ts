import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements OnInit, OnChanges {
  @ViewChild('timelineDataGrid', { static: false })
  timelineDataGrid!: DxDataGridComponent;

  searchConfiguration: SearchConfiguration = new SearchConfiguration();

  @Input() isSignedOff!: boolean;
  @Input() patientId?: string;
  @Input() companyId!: string;
  @Input() appointmentId?: string;
  @Input() startDate!: string;
  @Input() endDate?: string;

  timelineDataSource: any[] = [];
  selectedTimeline: any = {};
  loading = false;

  constructor(
    private repository: RepositoryService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate']) {
      this.ngOnInit();
    }
  }

  ngOnInit() {
    this.bindTimeline();
  }

  bindTimeline() {
    this.loading = true;
    const apiUrl = `appointment/status/timeline/${this.appointmentId}/${this.startDate}/${this.endDate}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          for (let i = 0; i < res.data.length; i++) {
            if (res.data[i + 1]) {
              const date1 = new Date(res.data[i + 1].createdOn);
              const date2 = new Date(res.data[i].createdOn);

              const differenceInTime = date2.getTime() - date1.getTime();
              const differenceInDays = differenceInTime / (1000 * 3600 * 24);
              const differenceInHours = Math.floor(differenceInTime / (1000 * 3600));
              const differenceInMinutes = Math.floor(differenceInTime / (1000 * 60));
              if (differenceInDays >= 1) {
                res.data[i]['timeDiff'] = Math.floor(differenceInDays);
              } else {
                let hours = '00';
                hours = Math.floor(differenceInHours) + '';
                let minutes = '00';
                minutes = (differenceInMinutes % 60) + '';
                res.data[i]['timeDiff'] =
                  hours.padStart(2, '0') + ':' + minutes.padStart(2, '0');
              }
            } else {
              res.data[i]['timeDiff'] = '00:00';
            }
          }
          this.timelineDataSource = res.data as any[];
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

  onTimelineSelected(_$event: any) {}
}
