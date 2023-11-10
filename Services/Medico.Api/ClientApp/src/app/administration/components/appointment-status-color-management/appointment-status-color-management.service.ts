import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from 'src/app/_services/config.service';

@Injectable()
export class AppointmentStatusColorManagementService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  load(): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.config.apiUrl}appointment-status-color`)
    );
  }

  save(newColors: any): Promise<boolean> {
    return firstValueFrom(
      this.http.post<any>(`${this.config.apiUrl}appointment-status-color`, newColors)
    );
  }
}
