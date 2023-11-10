import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PatientChartNode } from '../_models/patientChartNode';

@Injectable({ providedIn: 'root' })
export class SelectedPatientChartNodeService {
  private _selectedPatientChartNodeId: BehaviorSubject<string> = new BehaviorSubject('');
  public emitPatientChartNodeSelected: Subject<PatientChartNode> =
    new Subject<PatientChartNode>();

  public readonly selectedPatientChartNodeId: Observable<string> =
    this._selectedPatientChartNodeId.asObservable();

  setSelectedPatientChartNodeId(selectedPatientChartNodeId: string) {
    this._selectedPatientChartNodeId.next(selectedPatientChartNodeId);
  }

  toEmitPatientChartNodeSelected(node: PatientChartNode) {
    this.emitPatientChartNodeSelected.next(node);
  }
}
