import { LookupModel } from 'src/app/_models/lookupModel';
import { SchedulerViewNames } from '../constants/schedulerViews';
import { AppointmentStatusFilter } from './appointmentStatusFilter';
import { DateHelper } from 'src/app/_helpers/date.helper';

export class AppointmentsFilter {
  location?: LookupModel;
  locationId: string;
  physician?: LookupModel;
  physicianId: string;
  patient?: LookupModel;
  patientId: string;
  appointmentStatusFilter: AppointmentStatusFilter;
  schedulerView: string;
  schedulerDate: string;
  companyId?: string;

  constructor() {
    this.appointmentStatusFilter = new AppointmentStatusFilter();
    this.schedulerView = SchedulerViewNames.day;
    const today = new Date();
    this.schedulerDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toString();
    this.locationId = '';
    this.physicianId = '';
    this.patientId = '';
  }
}
