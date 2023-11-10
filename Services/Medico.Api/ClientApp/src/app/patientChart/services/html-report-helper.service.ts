import { Injectable } from '@angular/core';
import { RepositoryService } from 'src/app/_services/repository.service';

@Injectable()
export class HtmlReportHelperService {
  lookUpData: any[] = [];
  selectedCompanyId: any = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';
  constructor(private repositoryService: RepositoryService) {
    this.loadLookUpVitalSigns();
  }

  public checkAbnormalVitalSigns() {}

  loadLookUpVitalSigns() {
    const apiUrl = `vitalsigns-lookup/dx/grid?skip=0&take=100&requireTotalCount=true&_=1628953452072`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        if (res) {
          this.lookUpData = res.data;
        }
      },
      error: _error => {},
    });
  }

  createReportHtmlTable(header: string[], body: string[][], _nodeID = ''): string {
    localStorage.removeItem('abnormalVitals');
    let htmlTableString = '';

    htmlTableString += "<table style='border-collapse:collapse;'><thead><tr>";

    let upper = false;
    let lower = false;
    if (header.includes('Calf, cm')) {
      upper = this.checkArms(header, body);
      lower = this.checkLegs(header, body);
    }

    for (let i = 0; i < header.length; i++) {
      const columnName = header[i];
      if (columnName == 'Forearm, cm') {
        htmlTableString +=
          `<th class="_arms" upper="` +
          upper +
          `"  style='border:solid 1px #999;padding:4px 8px;'>${columnName}</th>`;
      } else if (columnName == 'Calf, cm') {
        htmlTableString +=
          `<th class="_legs" lower="` +
          lower +
          `"  style='border:solid 1px #999;padding:4px 8px;'>${columnName}</th>`;
      } else {
        htmlTableString += `<th style='border:solid 1px #999;padding:4px 8px;'>${columnName}</th>`;
      }
    }

    htmlTableString += '</tr></thead><tbody>';

    let calfLeft = 0;
    let calfRight = 0;
    let foreArmLeft = 0;
    let foreArmRight = 0;
    let thighLeft = 0;
    let thighRight = 0;
    let bicepLeft = 0;
    let bicepRight = 0;
    for (let i = 0; i < body.length; i++) {
      const rowValues = body[i];
      htmlTableString += '<tr>';

      for (let j = 0; j < rowValues.length; j++) {
        const columnValue = rowValues[j];

        const baseVital =
          header[j] == undefined ? '' : this.auditBaseVitalSigns(header, j);
        let vitalDiff: number | undefined = 0;

        if (baseVital === '') {
          if (j < header.length) {
            if (header[j].includes('Calf, cm') && j === 1) {
              ({ calfLeft, calfRight, vitalDiff } = this.validateCalf(
                i,
                calfLeft,
                columnValue,
                calfRight,
                vitalDiff
              ));
            } else if (header[j].includes('Thigh, cm') && j === 2) {
              ({ thighLeft, thighRight, vitalDiff } = this.validateThigh(
                i,
                thighLeft,
                columnValue,
                thighRight,
                vitalDiff
              ));
            } else if (header[j].includes('Forearm, cm') && j === 3) {
              ({ foreArmLeft, foreArmRight, vitalDiff } = this.validateForearm(
                i,
                foreArmLeft,
                columnValue,
                foreArmRight,
                vitalDiff
              ));
            } else if (header[j].includes('Bicep, cm') && j === 4) {
              ({ bicepLeft, bicepRight, vitalDiff } = this.validateBicep(
                i,
                bicepLeft,
                columnValue,
                bicepRight,
                vitalDiff
              ));
            }
          }
        }
        if (baseVital === '') {
          if (vitalDiff !== undefined && vitalDiff > 0) {
            htmlTableString += `<td _vitalDiff style='border:solid 1px #999;padding:4px 8px;text-align:center;'>${columnValue}</td>`;
            // Mark Vital Signs as Abnormal
            localStorage.setItem('abnormalVitals', '1');
          } else {
            htmlTableString += `<td style='border:solid 1px #999;padding:4px 8px;text-align:center;'>${columnValue}</td>`;
          }
        } else {
          htmlTableString += `<td ${baseVital}>${columnValue}</td>`;
        }
        vitalDiff = 0;
      }

      htmlTableString += '</tr>';
    }

    return (htmlTableString += '</tbody></table>');
  }
  checkArms(header: string[], body: string[][]) {
    const indexForearm = header.indexOf('Forearm, cm');
    const indexBicep = header.indexOf('Bicep, cm');
    return (
      parseInt(body[0][indexForearm]) - parseInt(body[1][indexForearm]) === 0 &&
      parseInt(body[0][indexBicep]) - parseInt(body[1][indexBicep]) === 0
    );
  }
  checkLegs(header: string[], body: string[][]) {
    const indexCalf = header.indexOf('Calf, cm');
    const indexThigh = header.indexOf('Thigh, cm');
    return (
      parseInt(body[0][indexCalf]) - parseInt(body[1][indexCalf]) === 0 &&
      parseInt(body[0][indexThigh]) - parseInt(body[1][indexThigh]) === 0
    );
  }

  private validateBicep(
    i: number,
    bicepLeft: number,
    columnValue: string,
    bicepRight: number,
    vitalDiff: number
  ) {
    if (i === 0) {
      bicepLeft = parseFloat(columnValue);
    } else if (i === 1) {
      bicepRight = parseFloat(columnValue);
    }

    if (bicepLeft > 0 && bicepRight > 0) {
      vitalDiff = Math.abs(bicepRight - bicepLeft);
    }
    return { bicepLeft, bicepRight, vitalDiff };
  }

  private validateThigh(
    i: number,
    thighLeft: number,
    columnValue: string,
    thighRight: number,
    vitalDiff: number
  ) {
    if (i === 0) {
      thighLeft = parseFloat(columnValue);
    } else if (i === 1) {
      thighRight = parseFloat(columnValue);
    }

    if (thighLeft > 0 && thighRight > 0) {
      vitalDiff = Math.abs(thighRight - thighLeft);
    }
    return { thighLeft, thighRight, vitalDiff };
  }

  private validateForearm(
    i: number,
    foreArmLeft: number,
    columnValue: string,
    foreArmRight: number,
    vitalDiff: number
  ) {
    if (i === 0) {
      foreArmLeft = parseFloat(columnValue);
    } else if (i === 1) {
      foreArmRight = parseFloat(columnValue);
    }

    if (foreArmLeft > 0 && foreArmRight > 0) {
      vitalDiff = Math.abs(foreArmRight - foreArmLeft);
    }
    return { foreArmLeft, foreArmRight, vitalDiff };
  }

  private validateCalf(
    i: number,
    calfLeft: number,
    columnValue: string,
    calfRight: number,
    vitalDiff: number
  ) {
    if (i === 0) {
      calfLeft = parseFloat(columnValue);
    } else if (i === 1) {
      calfRight = parseFloat(columnValue);
    }

    if (calfLeft > 0 && calfRight > 0) {
      vitalDiff = Math.abs(calfRight - calfLeft);
    }
    return { calfLeft, calfRight, vitalDiff };
  }

  private auditBaseVitalSigns(header: string[], j: number) {
    let baseVital = '';
    if (
      header[j].includes('Weight, lbs') ||
      header[j].includes('Height, inches') ||
      header[j].includes('BMI, %') ||
      header[j].includes('Dominant Hand') ||
      header[j].includes('Oxygen')
    ) {
      baseVital = '_baseVital';
    }
    return baseVital;
  }

  createReportTable(table: string[][]): string {
    let htmlTableString = '';

    htmlTableString += "<table style='width:100%'><thead><tr>";

    for (let i = 0; i < table.length; i++) {
      const rowValues = table[i];
      htmlTableString += '<tr>';

      for (let j = 0; j < rowValues.length; j++) {
        const columnValue = rowValues[j];
        htmlTableString += `<td style='padding:4px 8px;'>${columnValue}</td>`;
      }

      htmlTableString += '</tr>';
    }

    return (htmlTableString += '</tbody></table>');
  }
}
