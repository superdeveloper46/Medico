import { Injectable } from '@angular/core';
import { MedicationPrescription } from '../../models/medicationPrescription';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class MedicationPrescriptionService {
  public emitMedicationPrescriptionSave: Subject<MedicationPrescription> = new Subject<MedicationPrescription>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  getByAdmissionId(admissionId: string): Promise<MedicationPrescription[]> {
    return firstValueFrom(
      this.http.get<MedicationPrescription[]>(
        `${this.config.apiUrl}prescription/admission/${admissionId}`
      )
    );
  }

  save(medicationPrescription: MedicationPrescription): Promise<void> {
    this.emitMedicationPrescriptionSave.next(medicationPrescription);

    medicationPrescription.startDate = DateHelper.jsLocalDateToSqlServerUtc(
      medicationPrescription.startDate
    );

    medicationPrescription.endDate = DateHelper.jsLocalDateToSqlServerUtc(
      medicationPrescription.endDate
    );

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}prescription`, medicationPrescription)
    );
  }

  getById(prescriptionId: string): Promise<MedicationPrescription> {
    return firstValueFrom(
      this.http.get<MedicationPrescription>(
        `${this.config.apiUrl}prescription/${prescriptionId}`
      )
    ).then(prescription => {
      if (prescription) {
        prescription.startDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          prescription.startDate
        );
        prescription.endDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          prescription.endDate
        );
      }

      return prescription;
    });
  }

  isPrescriptionExist(admissionId: string): Promise<boolean> {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}prescription/existence/admission/${admissionId}`
      )
    );
  }

  delete(medicationPrescriptionId: any): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.config.apiUrl}prescription/${medicationPrescriptionId}`
      )
    );
  }
}
