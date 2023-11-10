import { Component, Input, OnInit } from '@angular/core';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { Router } from '@angular/router';
import { AdmissionService } from 'src/app/patientChart/services/admission.service';

@Component({
  selector: 'patient-appointments',
  templateUrl: './patient-appointments.component.html',
})
export class PatientAppointmentsComponent extends BaseAdminComponent implements OnInit {
  @Input() patientId?: string;
  @Input() companyId?: string;

  appointmentsDataSource: any = {};
  isPatientChartReview: boolean = false;
  patientChartNodeReview = '';
  patientChartDocumentNodeReview = '';
  appointmentIdReview = '';
  patientIdReview = '';
  admissionIdReview = '';
  companyIdReview = '';

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private admissionService: AdmissionService,
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

  reviewPatientChartFromAdmission(appointment: any) {
    this.admissionService.getById(appointment.admissionId).then(admission => {
      this.patientChartNodeReview = JSON.parse(admission.admissionData || 'null');
      this.isPatientChartReview = true;
      // this.patientChartNodeReview = '';
      this.patientChartDocumentNodeReview = this.patientChartNodeReview;
      this.appointmentIdReview = appointment.id;
      this.patientIdReview = appointment.patientId;
      this.admissionIdReview = appointment.admissionId;
      this.companyIdReview = appointment.companyId;
    });
  }
}
