import { ZipCodeType } from '../patients/models/zipCodeType';

export class LookUpZipCode {
  id!: string;
  name?: string;
  companyId?: string;
  aspNetUserId?: string;
  createdBy?: string;
  updateBy?: string;
  createdDate?: string;
  updatedDate?: string;
  zipCodeTypeId: number;
  zipCodeType?: string;

  constructor() {
    this.zipCodeTypeId = ZipCodeType.FiveDigit;
  }
}
