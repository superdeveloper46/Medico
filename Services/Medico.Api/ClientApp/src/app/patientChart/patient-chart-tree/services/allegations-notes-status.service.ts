import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { AllegationsNotesStatus } from '../../models/allegationsNotesStatus';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AllegationsNotesStatusService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getByAdmissionId(admissionId: string) {
    return firstValueFrom(
      this.http.get<AllegationsNotesStatus>(
        `${this.config.apiUrl}allegationsnotesstatus/admission/${admissionId}`
      )
    );
  }

  save(allegationsNotesStatus: AllegationsNotesStatus) {
    return firstValueFrom(
      this.http.post<void>(
        `${this.config.apiUrl}allegationsnotesstatus`,
        allegationsNotesStatus
      )
    );
  }
}
