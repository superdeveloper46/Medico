import { FilterType } from '../enums/filterType';

export class AppointmentStatusFilter {
  statuses: string[] = [];
  filterType?: FilterType;
}
