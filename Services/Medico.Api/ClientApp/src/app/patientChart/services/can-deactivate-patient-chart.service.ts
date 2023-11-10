import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanDeactivate,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { ProceedUnsavedChangesActionTypes } from 'src/app/_classes/proceed-unsaved-changes-action-types.enum';
import { PatientChartComponent } from '../components/patient-chart/patient-chart.component';
import { PatientChartEqualityComparer } from './patient-chart-equality-comparer.service';

@Injectable()
export class CanDeactivatePatientChartService
  implements CanDeactivate<PatientChartComponent>
{
  constructor(private patientChartEqualityComparer: PatientChartEqualityComparer) {}

  canDeactivate(
    component: PatientChartComponent,
    _currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    _nextState: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    console.log('component', component);
    if (!component.doesUserWishToSave) {
      component.doesUserWishToSave = true;
      return true;
    }
    if (
      !this.patientChartEqualityComparer.doesPatientChartHaveUnsavedChanges(
        component.patientChartRootNode,
        component.savedVersionOfAdmissionData
      )
    )
      return true;

    return component
      .showUnsavedChangesWarningNotification()
      .then(proceedUnsavedChangesActionType => {
        if (proceedUnsavedChangesActionType === ProceedUnsavedChangesActionTypes.Cancel)
          return false;

        if (
          proceedUnsavedChangesActionType === ProceedUnsavedChangesActionTypes.DoNotSave
        )
          return true;

        return component.savePatientAdmission().then(() => true);
      });
  }
}
