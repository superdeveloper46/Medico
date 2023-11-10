import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportComponent } from './report/report.component';

import { TimeTrackReportComponent } from './time-track-report/time-track-report.component';

const routes: Routes = [
  // { path: '', component: ReportComponent },
  {
    path: '',
    component: ReportComponent,
    children: [
      { path: '', component: TimeTrackReportComponent },
      { path: 'time-tracking', component: TimeTrackReportComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportRoutingModule {}
