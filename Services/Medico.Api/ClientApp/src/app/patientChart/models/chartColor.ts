import { AuditRequiredTypeList } from 'src/app/administration/classes/auditRequiredTypeList';
import { DefaultChartColors } from 'src/app/administration/classes/defaultChartColors';

export class ChartColor {
  updated: string;
  abnormal: string;
  defaultOrIncomplete: string;
  noContentChanged: string;
  borderUpdated: string;
  borderAbnormal: string;
  borderDefaultOrIncomplete: string;
  borderNoContentChanged: string;

  constructor() {
    this.updated = '';
    this.abnormal = '';
    this.defaultOrIncomplete = '';
    this.noContentChanged = '';
    this.borderUpdated = '';
    this.borderAbnormal = '';
    this.borderDefaultOrIncomplete = '';
    this.borderNoContentChanged = '';
  }

  setAll(chartColor: ChartColor): void {
    this.updated = chartColor.updated;
    this.abnormal = chartColor.abnormal;
    this.defaultOrIncomplete = chartColor.defaultOrIncomplete;
    this.noContentChanged = chartColor.noContentChanged;
    this.borderUpdated = chartColor.borderUpdated;
    this.borderAbnormal = chartColor.borderAbnormal;
    this.borderDefaultOrIncomplete = chartColor.borderDefaultOrIncomplete;
    this.borderNoContentChanged = chartColor.borderNoContentChanged;
  }

  setDefault(defaultColor: DefaultChartColors): void {
    this.updated = defaultColor.updated;
    this.abnormal = defaultColor.abnormal;
    this.defaultOrIncomplete = defaultColor.defaultOrIncomplete;
    this.noContentChanged = defaultColor.noContentChanged;
    this.borderUpdated = defaultColor.borderUpdated;
    this.borderAbnormal = defaultColor.borderAbnormal;
    this.borderDefaultOrIncomplete = defaultColor.borderDefaultOrIncomplete;
    this.borderNoContentChanged = defaultColor.borderNoContentChanged;
  }

  change(colorTitle: string, newColor: string): void {
    switch (colorTitle) {
      case 'updated':
      case 'Updated':
        this.updated = newColor;
        break;
      case 'abnormal':
      case 'Abnormal':
        this.abnormal = newColor;
        break;
      case 'noContentChanged':
      case 'NoContentChanged':
        this.noContentChanged = newColor;
        break;
      case 'defaultOrIncomplete':
      case 'DefaultOrIncomplete':
        this.defaultOrIncomplete = newColor;
        break;
      case 'borderUpdated':
      case 'BorderUpdated':
        this.borderUpdated = newColor;
        break;
      case 'borderAbnormal':
      case 'BorderAbnormal':
        this.borderAbnormal = newColor;
        break;
      case 'borderDefaultOrIncomplete':
      case 'BorderDefaultOrIncomplete':
        this.borderDefaultOrIncomplete = newColor;
        break;
      case 'borderNoContentChanged':
      case 'BorderNoContentChanged':
        this.borderNoContentChanged = newColor;
        break;
      default:
        console.log(`${colorTitle} is not a valid field`);
    }
    console.log(this);
  }

  /**
   * @param {editStatus} editStatus - edit status of a patient chart node
   * @param {auditRequired} auditRequired - Audit required state of chart node
   * @returns {[string, string]} two hex strings, first is fill color, second is border color
   */

  getColorsForNode(editStatus: string, auditRequired: string): [string, string] {
    const auditReq: any = AuditRequiredTypeList.values.find(x => x.name == auditRequired);

    switch (editStatus) {
      case 'NC':
        return [this.noContentChanged, this.borderNoContentChanged];
      case 'EO':
      case 'ES':
      case 'SO':
      case 'CU':
        return [this.updated, this.borderUpdated];
      case 'DO':
      case 'IN':
        switch (auditReq?.value) {
          case 1: // is not required can be default
            return [this.defaultOrIncomplete, this.borderDefaultOrIncomplete];
          case 2: // Is Required (Cannot be default)
            return [this.abnormal, this.borderAbnormal];
          case 3: //Is Required (Can be default)
            return [this.defaultOrIncomplete, this.borderDefaultOrIncomplete];
          default:
            return [this.defaultOrIncomplete, this.borderDefaultOrIncomplete];
        }
      case 'UN':
        return [this.defaultOrIncomplete, this.borderDefaultOrIncomplete];
      default:
        console.log(`${editStatus} is not a valid edit status`);
        return ['', ''];
    }
  }
}
