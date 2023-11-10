import * as moment from 'moment';

export class DateHelper {
  static jsLocalDateToSqlServerUtc(dateString: string): string {
    return moment.utc(dateString).toISOString();
  }

  static sqlServerUtcDateToLocalJsDate(sqlServerDateString: string): Date | undefined {
    if (!sqlServerDateString) return;

    const utcServerDate = `${sqlServerDateString}Z`.substring(0, 24);
    return new Date(utcServerDate);
  }

  static getDaysBetween(startDate?: Date, endDate?: Date): number {
    const end = endDate ? endDate : new Date();

    if (!end.getTime || !startDate?.getTime) return 0;

    const timeDiff = Math.abs(end.getTime() - startDate.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  static getAge(dateOfBirth: Date): number {
    const now = new Date();

    let years = now.getFullYear() - dateOfBirth.getFullYear();

    if (
      now.getMonth() < dateOfBirth.getMonth() ||
      (now.getMonth() == dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate())
    ) {
      years--;
    }

    return years;
  }

  static getFullDate(date: any): string {
    return moment(date).format('MMMM Do YYYY, h:mm A');
  }

  static getTime(date: any): string {
    return moment(date).locale('en').format('HH:mm');
  }

  static getDate(date: Nullable<string | Date>): string {
    return date ? moment(date).locale('en').format('MM/DD/YYYY') : '';
  }

  static getUtcOffset(): number {
    return -new Date().getTimezoneOffset() / 60;
  }
}
