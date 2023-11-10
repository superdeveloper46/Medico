import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { Admission } from '../models/admission';
import { HttpClient } from '@angular/common/http';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { UpdatePatientChartDocumentNodesModel } from '../models/updatePatientChartDocumentNodesModel';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdmissionService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  save(admission: Admission): Promise<Admission> {
    return firstValueFrom(
      this.http.post<Admission>(`${this.config.apiUrl}admission/`, admission)
    );
  }

  deleteById(admissionId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}admission/${admissionId}`)
    );
  }

  getById(id?: string): Promise<Admission> {
    if (!id) return Promise.reject();

    return firstValueFrom(
      this.http.get<Admission>(`${this.config.apiUrl}admission/${id}`)
    ).then(admission => {
      if (!admission) return admission;

      admission.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(
        admission.createdDate
      );
      return admission;
    });
  }

  getByAppointmentId(appointmentId: string): Promise<Admission> {
    return firstValueFrom(
      this.http.get<Admission>(
        `${this.config.apiUrl}admission/appointment/${appointmentId}`
      )
    ).then(admission => {
      if (!admission) return admission;

      admission.createdDate = DateHelper.sqlServerUtcDateToLocalJsDate(
        admission.createdDate
      );
      return admission;
    });
  }

  getPreviousPatientAdmissions(patientId: string, fromDate: any): Promise<Admission[]> {
    const utcServerFromDate = DateHelper.jsLocalDateToSqlServerUtc(fromDate);
    return firstValueFrom(
      this.http.get<Admission[]>(
        `${this.config.apiUrl}admission/previous/patient/${patientId}/date/${utcServerFromDate}`
      )
    );
  }

  updatePatientChartDocumentNodes(
    updatePatientChartDocumentNodesModel: UpdatePatientChartDocumentNodesModel
  ): Promise<Admission> {
    return firstValueFrom(
      this.http.put<Admission>(
        `${this.config.apiUrl}admission`,
        updatePatientChartDocumentNodesModel
      )
    );
  }

  getCurrentDiagnosisByPatientId(patientId: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(
        `${this.config.apiUrl}admission/assessments/current/${patientId}`
      ));
  }

  getCurrentChiefComplaintsByPatientId(patientId: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(
        `${this.config.apiUrl}admission/chiefcomplaints/current/${patientId}`
      ));
  }
}
