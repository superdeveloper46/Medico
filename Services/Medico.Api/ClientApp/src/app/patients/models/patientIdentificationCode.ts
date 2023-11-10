import { PatientsModuleConstants } from '../constants/patientsModuleConstants';
import { PatientIdentificationCodeType } from './enums/patientIdentificationCodeType';
import { PatientIdentificationCodeApiModel } from './patientIdentificationCodeApiModel';

export class PatientIdentificationCode {
  id?: string;

  private _prefix: string = '';

  get prefix(): string {
    return this._prefix;
  }

  set prefix(prefix: string) {
    if (prefix) this._prefix = prefix.toUpperCase();
  }

  private _letterCode: string = '';

  get letterCode(): string {
    return this._letterCode;
  }

  set letterCode(letterCode: string) {
    if (letterCode) this._letterCode = letterCode.toLocaleUpperCase();
  }

  numericCode?: number;
  year?: number;
  month?: number;
  type?: PatientIdentificationCodeType;
  patientId?: string;

  get identificationCodeString(): string {
    let code = '';

    if (this.prefix) code += this.prefix;

    if (this.letterCode) code += this.letterCode;

    if (this.numericCode) code += this.numericCode;

    if (this.month) code += this.month;

    if (this.year) code += this.year;

    return code;
  }

  convertToApiModel(): PatientIdentificationCodeApiModel {
    const code = new PatientIdentificationCodeApiModel();

    code.id = this.id;
    code.patientId = this.patientId;
    code.type = this.type;
    code.numericCode = this.numericCode;
    code.prefix = this.prefix;
    code.letterCode = this.letterCode;
    code.year = this.year;
    code.month = this.month;
    code.identificationCodeString = this.identificationCodeString;

    return code;
  }

  static createDefault(
    type?: PatientIdentificationCodeType,
    patientId?: string
  ): PatientIdentificationCode {
    const code = new PatientIdentificationCode();

    code.patientId = patientId;
    code.type = type;
    code.numericCode = PatientsModuleConstants.identification.minValidNumericCodeValue;
    code.prefix =
      code.type === PatientIdentificationCodeType.Mrn
        ? PatientsModuleConstants.identification.mrnCodeName
        : PatientsModuleConstants.identification.finCodeName;

    const currentDate = new Date();
    code.year = currentDate.getFullYear();
    code.month = currentDate.getMonth();

    return code;
  }

  static createFromResponse(
    response: PatientIdentificationCodeApiModel
  ): PatientIdentificationCode {
    const code = new PatientIdentificationCode();

    code.id = response.id;
    code.patientId = response.patientId;
    code.type = response.type;
    code.numericCode = response.numericCode;
    code.prefix = response.prefix;
    code.letterCode = response.letterCode;
    code.year = response.year || undefined;
    code.month = response.month || undefined;

    return code;
  }
}
