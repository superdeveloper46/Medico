export enum MeasurementSystem {
  Metric = 'Metric',
  Imperial = 'Imperial',
}

export class VitalSignsConfig {
  vitalSignUnits: MeasurementSystem;
  numberOfPreviousVitalSigns: number;

  constructor() {
    this.vitalSignUnits = MeasurementSystem.Imperial;
    this.numberOfPreviousVitalSigns = 4;
  }
}

export class MeasurementHelper {
  public static convertTemperatureF2C(tempF: number): number {
    return 5 * (tempF - 32) / 9;
  }

  public static convertTemperatureC2F(tempC: number): number {
    return 9 * tempC / 5 + 32;
  }
}
