import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { VitalSignsNotes } from '../../models/vitalSignsNotes';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class VitalSignsNotesService {
  public emitVitalSignsNotesSave: Subject<VitalSignsNotes> = new Subject<VitalSignsNotes>;

  constructor(private http: HttpClient, private config: ConfigService) {}

  save(vitalSignsNotes: VitalSignsNotes) {
    this.emitVitalSignsNotesSave.next(vitalSignsNotes);

    return firstValueFrom(
      this.http.post<VitalSignsNotes>(
        `${this.config.apiUrl}vitalsignsnotes`,
        vitalSignsNotes
      )
    );
  }

  getByAdmissionId(admissionId: string) {
    return firstValueFrom(
      this.http.get<VitalSignsNotes>(
        `${this.config.apiUrl}vitalsignsnotes/admission/${admissionId}`
      )
    );
  }
}
