import { GuidHelper } from 'src/app/_helpers/guid.helper';

export class Assessment {
  id: string;
  diagnosis?: string;
  order?: number;
  notes?: string;
  status?: string;
  points?: number;
  startDate?: Date;
  endDate?: Date;
  employee?: string;
  favorite?: boolean;
  provider?: string;

  constructor() {
    this.id = GuidHelper.generateNewGuid();
    this.startDate = new Date(Date.now());
  }
}
