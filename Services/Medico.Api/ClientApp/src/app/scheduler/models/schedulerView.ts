export class SchedulerView {
  name?: string;
  type?: string;
  intervalCount?: number;

  static create(name: string, type: string, intervalCount: number): SchedulerView {
    const schedulerView = new SchedulerView();

    schedulerView.name = name;
    schedulerView.type = type;
    schedulerView.intervalCount = intervalCount;

    return schedulerView;
  }

  static createDefault(): SchedulerView {
    return this.create('Day', 'day', 1);
  }
}
