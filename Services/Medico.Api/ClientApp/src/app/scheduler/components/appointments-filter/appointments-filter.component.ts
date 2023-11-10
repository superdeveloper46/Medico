import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AppointmentsFilter } from '../../models/appointmentsFilter';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { AlertService } from 'src/app/_services/alert.service';
import { FilterType } from '../../enums/filterType';
import { LookupModel } from 'src/app/_models/lookupModel';
import { AppointmentsFilterService } from '../../services/appointments-filter.service';

@Component({
  selector: 'appointments-filter',
  templateUrl: './appointments-filter.component.html',
  styles: ['::ng-deep .alert { margin-bottom: 0px !important; }'],
})
export class AppointmentsFilterComponent {
  private _companyId: string = '';

  @Input()
  set companyId(value: string) {
    if (!value) return;

    this._companyId = value;
    this.initSelectableLists();
    this.emitAppointmentFilterChanges();
  }

  get companyId(): string {
    return this._companyId;
  }

  @Output() filterChanged = new EventEmitter<AppointmentsFilter | undefined>();

  private _physicianDataSource: LookupModel[] = [];

  get physicianDataSource(): LookupModel[] {
    if (!this._physicianDataSource.length && this.filter?.physician)
      return [this.filter.physician];

    return this._physicianDataSource;
  }

  set physicianDataSource(value: LookupModel[]) {
    this._physicianDataSource = value;
  }

  private _locationDataSource: LookupModel[] = [];

  get locationDataSource(): LookupModel[] {
    if (!this._locationDataSource.length && this.filter?.location)
      return [this.filter.location];

    return this._locationDataSource;
  }

  set locationDataSource(value: LookupModel[]) {
    this._locationDataSource = value;
  }

  private _patientDataSource: LookupModel[] = [];

  get patientDataSource(): LookupModel[] {
    if (!this._patientDataSource.length && this.filter?.patient)
      return [this.filter.patient];

    return this._patientDataSource;
  }

  set patientDataSource(value: LookupModel[]) {
    this._patientDataSource = value;
  }

  canRenderFillter = false;

  isAppointmentFilterPopoverOpened = false;

  filterTypes = [
    { name: 'Equal', value: FilterType.Equal },
    { name: 'Not Equal', value: FilterType.NotEqual },
  ];

  filter?: AppointmentsFilter = new AppointmentsFilter();
  filterCopy?: AppointmentsFilter;

  get filterString(): string {
    const delimiter = '---';
    let isAnyFiltersApplied = false;

    let filterString = '';

    const filterType = this.filter?.appointmentStatusFilter.filterType;

    if (filterType) {
      isAnyFiltersApplied = true;
      const statuses = this.filter?.appointmentStatusFilter.statuses;
      const statusesString = statuses ? statuses.join(' ') : '';

      filterString += `status is ${FilterType[filterType]} to : ${statusesString}`;
    }

    const physicianId = this.filter?.physicianId;
    if (physicianId) {
      const physicianName = this.filter?.physician?.name ?? '';
      filterString += isAnyFiltersApplied
        ? ` ${delimiter} physician: ${physicianName}`
        : `physician: ${physicianName}`;

      if (!isAnyFiltersApplied) isAnyFiltersApplied = true;
    }

    const patientId = this.filter?.patientId;
    if (patientId) {
      const patientName = this.filter?.patient?.name ?? '';
      filterString += isAnyFiltersApplied
        ? ` ${delimiter} patient: ${patientName}`
        : `patient: ${patientName}`;

      if (!isAnyFiltersApplied) isAnyFiltersApplied = true;
    }

    const locationId = this.filter?.locationId;
    if (locationId) {
      const locationName = this.filter?.location?.name ?? '';
      filterString += isAnyFiltersApplied
        ? ` ${delimiter} location: ${locationName}`
        : `location: ${locationName}`;

      if (!isAnyFiltersApplied) isAnyFiltersApplied = true;
    }

    return filterString ? filterString : 'Filter is not set';
  }

  constructor(
    private selectableListService: SelectableListService,
    private alertService: AlertService,
    private appointmentsFilterService: AppointmentsFilterService
  ) {}

  cancelAppointmentFilter() {
    this.filterCopy = new AppointmentsFilter();
    this.isAppointmentFilterPopoverOpened = false;
  }

  resetAppointmentFilter() {
    this.filterCopy = new AppointmentsFilter();
    this.filterCopy.companyId = this.companyId;

    this.filter = new AppointmentsFilter();
    this.filter.companyId = this.companyId;

    this.filterChanged.next(this.filter);

    this.isAppointmentFilterPopoverOpened = false;

    this.appointmentsFilterService.save(this.filter);
  }

  applyAppointmentFilter() {
    if (!this.filterCopy) return;

    const newFilterType = this.filterCopy.appointmentStatusFilter.filterType;

    const newStatuses = this.filterCopy.appointmentStatusFilter.statuses;

    if (newStatuses && newStatuses.length && !newFilterType) {
      this.alertService.warning('Filter type is not selected');
      return;
    }

    if ((!newStatuses || !newStatuses.length) && newFilterType) {
      this.alertService.warning('Statuses are not selected');
      return;
    }

    this.filter = this.filterCopy;
    this.filterCopy = new AppointmentsFilter();

    this.filterChanged.next(this.filter);

    if (!this.filter.companyId) this.filter.companyId = this.companyId;

    this.appointmentsFilterService.save(this.filter);

    this.isAppointmentFilterPopoverOpened = false;
  }

  toggleAppointmentStatusPopover($event: any) {
    $event.preventDefault();

    const isPopupFilterShouldBeOpened = !this.isAppointmentFilterPopoverOpened;

    if (isPopupFilterShouldBeOpened)
      this.filterCopy = JSON.parse(JSON.stringify(this.filter));
    else this.filterCopy = new AppointmentsFilter();

    this.isAppointmentFilterPopoverOpened = isPopupFilterShouldBeOpened;
  }

  get appointmentStatuses(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.application.appointmentStatus
    );
  }

  onFilterChanged($event: any) {
    const newValue = $event.value;
    const previousValue = $event.previousValue;

    if (newValue != previousValue) this.filterChanged.next(this.filter);
  }

  physicianChanged($event: any) {
    if (this.filterCopy) {
      const physicianId = $event.value;
      this.filterCopy.physician = this.physicianDataSource.find(
        p => p.id === physicianId
      );
    }
  }

  patientChanged($event: any) {
    if (this.filterCopy) {
      const patientId = $event.value;
      this.filterCopy.patient = this.patientDataSource.find(p => p.id === patientId);
    }
  }

  locationChanged($event: any) {
    if (this.filterCopy) {
      const locationId = $event.value;
      this.filterCopy.location = this.locationDataSource.find(p => p.id === locationId);
    }
  }

  private initSelectableLists() {
    const appointmentStatusConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.application.appointmentStatus,
      LibrarySelectableListIds.application.appointmentStatus
    );

    const selectableLists = [appointmentStatusConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canRenderFillter = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private emitAppointmentFilterChanges() {
    this.appointmentsFilterService.getByCompanyId(this.companyId).then(filter => {
      this.filter = filter ? filter : new AppointmentsFilter();
      this.filterChanged.next(this.filter);
    });
  }
}
