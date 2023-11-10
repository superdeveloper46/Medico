import { SchedulerView } from '../models/schedulerView';

export const SchedulerViewNames = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  // month3: "3 Months",
  // month6: "6 Months",
  // month12: "12 Months",
};

export const SchedulerViews = [
  SchedulerView.create(SchedulerViewNames.day, 'day', 1),
  SchedulerView.create(SchedulerViewNames.week, 'week', 1),
  SchedulerView.create(SchedulerViewNames.month, 'month', 1),
  // SchedulerView.create(SchedulerViewNames.month3, "month", 3),
  // SchedulerView.create(SchedulerViewNames.month6, "month", 6),
  // SchedulerView.create(SchedulerViewNames.month12, "month", 12)
];
