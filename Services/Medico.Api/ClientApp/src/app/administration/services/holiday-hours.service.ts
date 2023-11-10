import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { firstValueFrom } from 'rxjs';
import { AlertService } from 'src/app/_services/alert.service';

@Injectable()
export class HolidayHoursService {
  _holidayHours: any = [];

  constructor(private http: HttpClient, private alertService: AlertService, private config: ConfigService) {
    
  }

  save(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}holiday-hours/`, this._holidayHours)
    );
  }

  load(): Promise<void> {
    return firstValueFrom(this.http.get<any>(`${this.config.apiUrl}holiday-hours`));
  }

  setHolidayHours(holidayHours: any) {
    this._holidayHours = holidayHours;
  }

  getHolidayHours() {    
    return this._holidayHours;
  }

  removeHolidayHours(index: number) {
    if(this._holidayHours.length > index) {
      this._holidayHours.splice(index, 1);
    }
  }

  addHolidayHours(date:string, status: string, type: string, startAt: string, endAt: string) {
    let filters = this._holidayHours.filter((data:any) => data.date == date && data.status && data.type == type);

    if( filters.length > 0) {
      this.alertService.error('Already exist at same date');
      return;
    }

    filters = this._holidayHours.filter((data:any) => data.date == date && data.status && type == '');

    if( filters.length > 0) {
      this.alertService.error('Already exist at same date');
      return;
    }

    this._holidayHours.push({
      'date': date,
      'status': status,
      'type': type,
      'startAt': startAt,
      'endAt': endAt
    })
  }
}
