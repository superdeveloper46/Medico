import { Injectable } from '@angular/core';
import { AppointmentsFilter } from '../models/appointmentsFilter';

@Injectable()
export class AppointmentsFilterService {
  private localStorageFiltersKey = 'filters';

  save(filter: AppointmentsFilter) {
    const filtersString: string | null = localStorage.getItem(
      this.localStorageFiltersKey
    );

    if (!filtersString) {
      localStorage.setItem(this.localStorageFiltersKey, JSON.stringify([filter]));
      return;
    }

    const filters = JSON.parse(filtersString) as AppointmentsFilter[];
    const filterByCompanyId = filters.find(f => f.companyId === filter.companyId);

    if (!filterByCompanyId) filters.push(filter);
    else {
      filterByCompanyId.appointmentStatusFilter = filter.appointmentStatusFilter;

      filterByCompanyId.location = filter.location;
      filterByCompanyId.locationId = filter.locationId;

      filterByCompanyId.patientId = filter.patientId;
      filterByCompanyId.patient = filter.patient;

      filterByCompanyId.physicianId = filter.physicianId;
      filterByCompanyId.physician = filter.physician;

      filterByCompanyId.schedulerDate = filter.schedulerDate;
      filterByCompanyId.schedulerView = filter.schedulerView;
    }

    localStorage.setItem(this.localStorageFiltersKey, JSON.stringify(filters));
  }

  getByCompanyId(companyId: string): Promise<AppointmentsFilter | undefined> {
    const filtersString = localStorage.getItem(this.localStorageFiltersKey);
    if (!filtersString) return Promise.resolve(undefined);

    const filters = JSON.parse(filtersString) as AppointmentsFilter[];

    return Promise.resolve(filters.find(f => f.companyId === companyId));
  }
}
