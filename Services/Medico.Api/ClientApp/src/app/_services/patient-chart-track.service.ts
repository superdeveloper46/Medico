import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PatientChartNode } from '../_models/patientChartNode';
import { PatientChartNodeType } from '../_models/patientChartNodeType';

@Injectable({ providedIn: 'root' })
export class PatientChartTrackService {
  private _patienChartTrackSource = new Subject<PatientChartNodeType>();
  public emitPatientChartTemplateSave: Subject<PatientChartNode> =
    new Subject<PatientChartNode>();
  public emitAssessmentSave: Subject<Array<any>> = new Subject<Array<any>>();

  patientChartChanged = this._patienChartTrackSource.asObservable();

  emitPatientChartChanges(
    patientChartNodeType: PatientChartNodeType,
    patientChartNode?: PatientChartNode
  ) {
    this._patienChartTrackSource.next(patientChartNodeType);
    if (patientChartNode) {
      // emit save
      this.emitPatientChartTemplateSave.next(patientChartNode);
    }
  }
  private _assessmentDataTrackSource = new BehaviorSubject({
    nodeID: 0 as PatientChartNodeType,
    data: undefined,
  } as emitData);

  assessmentDataChanged = this._assessmentDataTrackSource.asObservable();

  emitAssessmentDataChanges(payload: emitData, assessment?: any) {
    if (assessment) this.emitAssessmentSave.next(assessment);
    else console.log('assessment is undefined!!!!!');

    this._assessmentDataTrackSource.next({
      nodeID: payload.nodeID,
      data: payload.data,
    });
  }
}

export interface emitData {
  nodeID: PatientChartNodeType;
  data?: PatientChartNode;
}
