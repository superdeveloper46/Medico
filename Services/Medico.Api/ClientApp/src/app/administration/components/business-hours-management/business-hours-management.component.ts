import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { AlertService } from 'src/app/_services/alert.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { BusinessHoursService } from '../../services/business-hours.service';
import { HolidayHoursService } from '../../services/holiday-hours.service';
import { Day } from 'src/app/_classes/day';
import { LibrarySelectableListService } from 'src/app/administration/services/library/library-selectable-list.service';

const BUSINESS_HOURS_TYPE_SELECT_LIST_TITLE = 'Business Hours Type';
const HOLIDAY_HOURS_TYPE_SELECT_LIST_TITLE = 'Holiday Hours Type';

const TYPES = ['Regular', 'After Hours', 'Lunch', 'Office Close'];

const STATUSES = ['Open', 'Close'];

@Component({
  selector: 'business-hours-management',
  templateUrl: './business-hours-management.component.html',
  styleUrls: ['./business-hours-management.component.sass'],
})
export class BusinessHoursManagementComponent implements OnInit {
  // private businessHours;
  private allDays = Day.values;
  private allTypes = TYPES;
  private allStatuses = STATUSES;
  private allBusinessHoursTypes: any;
  private allHolidayHoursType: any;

  private newDay: string = '';
  private newStatus: string = '';
  private newType: string = '';
  private newStartAt: any;
  private newEndAt: any;

  private copySDay: string = '';
  private copyDDays: string[] = [];

  private newHolidayDate: any;
  private newHolidayStatus: string = '';
  private newHolidayType: string = '';
  private newHolidayStartAt: any;
  private newHolidayEndAt: any;

  private copyHolidaySDate: any;
  private copyHolidayDDate: any;

  private businessHoursList: any;

  private holidayHoursList: any;

  constructor(
    private alertService: AlertService,
    private selectableListService: LibrarySelectableListService,
    private businessHoursService: BusinessHoursService,
    private holidayHoursService: HolidayHoursService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    const instance = this;
    this.businessHoursService.load().then(resp => {
      this.businessHoursService.setBusinessHours(resp);
      this.businessHoursList = this.businessHoursService.getBusinessHoursToRender();
    });

    this.holidayHoursService.load().then(resp => {
      this.holidayHoursList = resp;
      this.holidayHoursService.setHolidayHours(resp);
    });

    this.selectableListService
      .getByTitle(BUSINESS_HOURS_TYPE_SELECT_LIST_TITLE)
      .then(selectableList => {
        instance.allBusinessHoursTypes = selectableList.selectableListValues;
      });

    this.selectableListService
      .getByTitle(HOLIDAY_HOURS_TYPE_SELECT_LIST_TITLE)
      .then(selectableList => {
        instance.allHolidayHoursType = selectableList.selectableListValues;
      });
  }

  removeBusinessHours(index: number) {
    this.businessHoursService.removeBusinessHours(index);
    this.businessHoursList = this.businessHoursService.getBusinessHoursToRender();
  }

  addBusinessHour() {
    this.businessHoursService.addBusinessHours(
      this.newDay,
      this.newStatus,
      this.newType,
      moment(this.newStartAt).format('hh:mm A'),
      moment(this.newEndAt).format('hh:mm A')
    );
    this.businessHoursList = this.businessHoursService.getBusinessHoursToRender();
  }

  saveBusinessHour() {
    this.businessHoursService.save().then(() => {
      this.alertService.alert('Saved Business hours successfully', 'Success');
    });
  }

  copyBusinessHours() {
    if (this.copySDay == '' || this.copyDDays.length == 0) {
      return;
    }

    this.businessHoursService.copyBusinessHours(this.copySDay, this.copyDDays);
    this.businessHoursList = this.businessHoursService.getBusinessHoursToRender();
  }

  removeHolidayHours(index: number) {
    this.holidayHoursService.removeHolidayHours(index);
    this.holidayHoursList = this.holidayHoursService.getHolidayHours();
  }

  addHolidayHours() {
    this.holidayHoursService.addHolidayHours(
      moment(this.newHolidayDate).format('M/D/YYYY'),
      this.newHolidayStatus,
      this.newHolidayType,
      moment(this.newHolidayStartAt).format('hh:mm A'),
      moment(this.newHolidayEndAt).format('hh:mm A')
    );
    this.holidayHoursList = this.holidayHoursService.getHolidayHours();
  }

  saveHolidayHours() {
    this.holidayHoursService.save().then(() => {
      this.alertService.alert('Saved Holiday hours successfully', 'Success');
    });
  }
}
