import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.sass'],
})
export class ReportComponent implements OnInit {
  constructor(private router: Router) {}

  adminModelTree: Array<any> = [
    {
      text: 'Appointment Analysis',
      name: 'timeTrack',
      route: `reports/time-tracking`,
    },
  ];

  ngOnInit() {}

  selectReport($event: any) {
    this.router.navigateByUrl($event.itemData.route);
  }
}
