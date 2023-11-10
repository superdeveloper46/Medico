import { Component, Input, OnInit } from '@angular/core';
import { AppointmentService } from 'src/app/_services/appointment.service';

@Component({
  selector: 'previous-chart',
  templateUrl: './previous-chart.component.html',
  styles: ['.report-node-container { height: 80vh; overflow-y: auto; }'],
})
export class PreviousChartComponent implements OnInit {
  @Input() appointmentId!: string;

  isPreviousChartContentVisibe = false;

  previousChartContent = '';

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit() {
    this.appointmentService
      .getAppointmentHtmlReport(this.appointmentId)
      .then(appointmentReportContent => {
        this.previousChartContent = appointmentReportContent;
        this.isPreviousChartContentVisibe = true;
      });
  }
}
