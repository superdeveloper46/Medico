import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PatientChartNode } from '../_models/patientChartNode';

@Injectable({
  providedIn: 'root',
})
export class AllegationEditService {
  private event = new BehaviorSubject({ method: '', data: [] });
  public emitChiefComplaintSave: Subject<string> = new Subject<string>;

  getEventWithObj = this.event.asObservable();

  constructor() {}

  setDataWithObj(event: eventData) {
    this.event.next(event);
  }

  toEmitChiefComplaintSave(patientChartNodeId: string) {
    this.emitChiefComplaintSave.next(patientChartNodeId);
  }
  

}
export interface eventData {
  method: string;
  data: any;
}
