import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { Appointment } from '../_models/appointment';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { AppointmentGridItem } from '../scheduler/models/appointmentGridItem';
import { AppointmentReportModel } from '../_models/appointmentReportModel';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getByAdmissionId(admissionId: string): Promise<Appointment> {
    return firstValueFrom(
      this.http.get<Appointment>(
        `${this.config.apiUrl}appointment/admission/${admissionId}`
      )
    ).then(appointment => {
      if (appointment) {
        appointment.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          appointment.startDate
        );
        appointment.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          appointment.endDate
        );
      }

      return appointment;
    });
  }

  getAppointmentGridItemById(appointmentId: string): Promise<AppointmentGridItem> {
    return firstValueFrom(
      this.http.get<AppointmentGridItem>(
        `${this.config.apiUrl}appointment/griditem/${appointmentId}`
      )
    );
  }

  getByUserId(userId: string) {
    const url = `${this.config.apiUrl}appointment/user/${userId}`;
    return firstValueFrom(this.http.get<Appointment>(url));
  }

  getPatientPreviousVisits(
    patientId: string | undefined,
    startDate: any
  ): Promise<AppointmentGridItem[]> {
    if (!patientId) return Promise.reject();

    const utcDate = DateHelper.jsLocalDateToSqlServerUtc(startDate);

    const url = `${this.config.apiUrl}appointment/previous/${patientId}/date/${utcDate}`;
    return firstValueFrom(this.http.get<AppointmentGridItem[]>(url)).then(
      previousVisits => {
        if (previousVisits.length) return previousVisits;

        previousVisits.forEach(previousVisit => {
          previousVisit.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            previousVisit.startDate
          );
          previousVisit.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            previousVisit.endDate
          );

          const startDate = previousVisit.startDate;
          previousVisit.date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          );
        });

        return previousVisits;
      }
    );
  }

  getPatientPreviousVisitsBetweenDates(
    patientId: string | undefined,
    startDate: any,
    endDate: any,
    quantity: any
  ): Promise<AppointmentGridItem[]> {
    if (!patientId) return Promise.reject();

    const utcStartDate = DateHelper.jsLocalDateToSqlServerUtc(startDate);
    const utcEndDate = DateHelper.jsLocalDateToSqlServerUtc(endDate);

    const url = `${this.config.apiUrl}appointment/previous/${patientId}/twodates/${utcStartDate}/${utcEndDate}/${quantity}`;
    return firstValueFrom(this.http.get<AppointmentGridItem[]>(url)).then(
      previousVisits => {
        if (previousVisits.length) return previousVisits;

        previousVisits.forEach(previousVisit => {
          previousVisit.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            previousVisit.startDate
          );
          previousVisit.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(
            previousVisit.endDate
          );

          const startDate = previousVisit.startDate;
          previousVisit.date = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          );
        });

        return previousVisits;
      }
    );
  }

  getPatientLastVisit(patientId: string, startDate: any): Promise<Appointment> {
    const utcDate = DateHelper.jsLocalDateToSqlServerUtc(startDate);

    const url = `${this.config.apiUrl}appointment/last/patient/${patientId}/date/${utcDate}`;
    return firstValueFrom(this.http.get<Appointment>(url));
  }

  getByLocationId(locationId: string): Promise<Appointment> {
    const url = `${this.config.apiUrl}appointment/location/${locationId}`;
    return firstValueFrom(this.http.get<Appointment>(url));
  }

  getByRoomId(roomId: string) {
    const url = `${this.config.apiUrl}appointment/room/${roomId}`;
    return firstValueFrom(this.http.get<Appointment>(url));
  }

  save(appointment: Appointment): Promise<Appointment> {
    return firstValueFrom(
      this.http.post<Appointment>(`${this.config.apiUrl}appointment/`, appointment)
    );
  }

  saveSimple(appointment: any): Promise<Appointment> {
    return firstValueFrom(
      this.http.post<Appointment>(`${this.config.apiUrl}appointment/savesimple`, appointment)
    );
  }

  getById(id: string): Promise<Appointment> {
    return firstValueFrom(
      this.http.get<Appointment>(`${this.config.apiUrl}appointment/${id}`)
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}appointment/${id}`)
    );
  }

  getAppointmentHtmlReport(appointmentId: string): Promise<string> {
    const utcOffset = DateHelper.getUtcOffset();
    return firstValueFrom(
      this.http.get<AppointmentReportModel>(
        `${this.config.apiUrl}report/appointment/${appointmentId}/offset/${utcOffset}/view`
      )
    ).then(appointmentReportModel => {
      return appointmentReportModel.reportContent;
    });
  }
}
