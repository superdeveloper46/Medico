export class BaseVitalSigns {
  id?: string;
  patientId?: string;
  dominantHand?: string;
  oxygenUseInfo?: string;
  weight!: number;
  height!: number;
  leftBicep?: number;
  rightBicep?: number;
  leftForearm?: number;
  rightForearm?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
  oxygenUse?: string;
  oxygenAmount?: number;
  headCircumference?: number;
  createdOn?: string;
}
