import {
  IReportContentProvider,
  PatientChartNodeReportInfo,
} from './baseHistoryReportSection';
import { VitalSignsService } from '../../patient-chart-tree/services/vital-signs.service';

export class ProblemListSection implements IReportContentProvider {
  constructor(private vitalSignsService: VitalSignsService) {}
  getPatientChartNodeReportContent(
    patientChartNodeReportInfo: PatientChartNodeReportInfo
  ): Promise<string> {
    const problemListRequest = this.vitalSignsService.getProblemList(
      patientChartNodeReportInfo.appointmentId
    );

    return Promise.all([problemListRequest]).then(result => {
      const [problemList] = result;

      if (!problemList || !problemList.length) return '';

      const updatedFlag = '_updated';
      let assessmentListItems = `<ul ${updatedFlag}>`;
      for (let i = 0; i < problemList.length; i++) {
        const assessment = problemList[i];

        assessmentListItems += `
                  <li>
                      <div><b>${assessment.assessment}</b></div>
                      <div>Status: ${assessment.status} </div>
                      <div>${assessment.notes ? assessment.notes : ''}</div>
                  </li>`;
      }

      return `${assessmentListItems}</ul>`;
    });
  }

  // private getProblemList(appointmentId): string {
  //
  //   const apiUrl = `${appointmentId}`;
  //   var retValue = '';
  //   this.repositoryService.getData(apiUrl)
  //     .subscribe(res => {

  //       if (res.status) {
  //
  //         const updatedFlag = "_updated";
  //         const problemList = res.data;

  //         if (!problemList || !problemList.length) return "";

  //         let assessmentListItems = `<h6>Problem List</h6> <ul ${updatedFlag}>`;

  //         for (let i = 0; i < problemList.length; i++) {
  //           const assessment = problemList[i];

  //           assessmentListItems += `
  //                 <li>
  //                     <div><b>${assessment.assessment}</b></div>
  //                     <div>Status: ${assessment.status} </div>
  //                     <div>${assessment.notes ? assessment.notes : ""}</div>
  //                 </li>`;
  //         }

  //         retValue = assessmentListItems += "</ul>";
  //       }
  //     },
  //       (error => {

  //       })
  //     );
  //   return retValue;
  // }
}
