export class SelectableListResult {
  values: string[];
  defaultValue: string;

  constructor(values: string[] = [], defaultValue = '') {
    this.values = values;
    this.defaultValue = defaultValue;
  }
}
