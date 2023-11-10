import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.sass'],
})
export class AppointmentComponent extends BaseAdminComponent implements OnInit {
  @Input() patientId!: string;
  @Input() companyId!: string;

  appointmentsDataSource: any = {};

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.initAppointmentsDataSource();
  }

  navigateToPatientAdmission(appointmentId: string) {
    if (!appointmentId) return;

    this.router.navigate(['/patient-chart', appointmentId]);
  }

  private initAppointmentsDataSource() {
    const appointmentsStore = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('appointment/griditem'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        this.onBeforeRequestingAppointments,
        this
      ),
    });

    this.appointmentsDataSource.store = appointmentsStore;
  }

  private onBeforeRequestingAppointments(method: string, ajaxOptions: any): void {
    if (method === 'load') {
      ajaxOptions.data.companyId = this.companyId;
      ajaxOptions.data.patientId = this.patientId;
    }
  }
}
