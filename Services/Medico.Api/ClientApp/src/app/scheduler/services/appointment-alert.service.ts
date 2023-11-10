import { Injectable } from '@angular/core';
import { AppointmentPatientUpdateUserActions } from 'src/app/_models/AppointmentPatientUpdateUserActions';
import { AlertService } from 'src/app/_services/alert.service';

@Injectable()
export class AppointmentAlertAervice {
  constructor(private alertService: AlertService) {}

  confirmDeleteAppointmentWithPatientChart() {
    const removeWithPatientChartBtn = {
      text: 'Remove With Patient Chart',
      onClick: () => true,
    };

    const cancelBtn = {
      text: 'Cancel',
      onClick: () => false,
    };

    return this.alertService.custom({
      title: 'Delete Appointment Confirmation',
      messageHtml: `The patient chart was already created.<br>
                        Are you sure you want to delete the appointment with the patient chart ?`,
      buttons: [removeWithPatientChartBtn, cancelBtn],
      showTitle: true,
    });
  }

  confirmPatientChangesInAppointment(previousPatientName: string) {
    const removeChartBtn = {
      text: 'Remove Chart',
      onClick: () => AppointmentPatientUpdateUserActions.DeletePreviousPatientChart,
    };

    const createNewAppointmentBtn = {
      text: 'New Appointment',
      onClick: () => AppointmentPatientUpdateUserActions.CreateNewAppointment,
    };

    const backToAppointmentChangeFromBtn = {
      text: 'Back',
      onClick: () => {},
    };

    return this.alertService.custom({
      title: 'Change Patient',
      messageHtml: `You are going to change patient on appointment form, but the<br>
                          patient chart for <strong>${previousPatientName}</strong> was already created.<br>
                          Do you want to remove patient chart for <strong>${previousPatientName}</strong> or create<br>
                          new exact appointment or back to appointment form ?`,
      buttons: [removeChartBtn, createNewAppointmentBtn, backToAppointmentChangeFromBtn],
      showTitle: true,
    });
  }
}
