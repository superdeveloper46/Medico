import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { ConfigService } from 'src/app/_services/config.service';
import { Location } from '../models/location';
import { firstValueFrom } from 'rxjs';
import { Day } from 'src/app/_classes/day';

@Injectable()
export class BusinessHoursService {
  _businessHours: any = [];

  constructor(private http: HttpClient, private config: ConfigService) {
    
  }

  save(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}business-hours/`, this._businessHours)
    );
  }

  load(): Promise<void> {
    return firstValueFrom(this.http.get<any>(`${this.config.apiUrl}business-hours`));
  }

  setBusinessHours(businessHours: any) {
    this._businessHours = businessHours;
  }

  getBusinessHoursToRender() {
    let businessHoursToRender:any[] = [];
    
    Day.values.map((day:any, dindex:number) => {
      let dayCount = 0;
      this._businessHours.map((data:any, hindex:number) => {
        if (data.day == day.name) {
          let dayStr = day.name;

          if( dayCount != 0) {
            dayStr = '';
          }

          businessHoursToRender.push({
            'day': dayStr,
            'status': data.status,
            'type': data.type,
            // 'startAt': moment(dataHour.startAt, 'HH:mm').toDate(),
            // 'endAt': moment(dataHour.endAt, 'HH:mm').toDate(),
            'startAt': data.startAt,
            'endAt': data.endAt,
            'dayName': day.name,
            'index': hindex
          });

          dayCount ++;
        }        
      })
    })
    
    return businessHoursToRender;
  }

  removeBusinessHours(index: number) {
    if(this._businessHours.length > index) {
      this._businessHours.splice(index, 1);
    }
  }

  addBusinessHours(day:string, status: string, type: string, startAt: string, endAt: string) {
    this._businessHours.push({
      'day': day,
      'status': status,
      'type': type,
      'startAt': startAt,
      'endAt': endAt
    })
  }

  copyBusinessHours(sDay:string, dDays: string[]) {
    dDays.map((dDay) => {
      let sDayBusinessHours = this._businessHours.filter((data: any) => data.day == sDay);
      sDayBusinessHours.map((data: any) => {
        this._businessHours.push({
          'day': dDay,
          'status': data.status,
          'type': data.type,
          'startAt': data.startAt,
          'endAt': data.endAt
        })
      })
    })
  }
}
