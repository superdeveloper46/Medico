import { StateList } from 'src/app/_classes/stateList';
import { MaskList } from 'src/app/_classes/maskList';
import { RegexRuleList } from 'src/app/_classes/regexRuleList';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DefaultValueService } from 'src/app/_services/default-value.service';
import { PopupConfiguration } from 'src/app/_classes/popupConfiguration';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';

@Component({
  selector: 'base-history',
  template: ``,
})
export class BaseHistoryComponent implements OnDestroy {
  private subscription: Subscription = new Subscription();

  states: any[] = StateList.values;
  validationMasks: MaskList = new MaskList();
  regexRuleList: RegexRuleList = new RegexRuleList();
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  popupConfiguration: PopupConfiguration = new PopupConfiguration();
  defaultHistoryValue = '';

  patientChartNodeId?: string;
  userLocalStorageName = 'Medico.CurrentUser';

  protected constructor(
    private defaultValueService: DefaultValueService,
    private selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    this.initSelectedPatientChartNodeSubscription();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  protected registerEscapeBtnEventHandler(popup: DxPopupComponent): void {
    popup.instance.registerKeyHandler('escape', (event: any) => {
      event.stopPropagation();
    });
  }

  protected initDefaultHistoryValue(patientChartNodeType: PatientChartNodeType): void {
    this.defaultValueService
      .getByPatientChartNodeType(patientChartNodeType)
      .then(defaultHistoryValue => {
        this.defaultHistoryValue = defaultHistoryValue.value
          ? defaultHistoryValue.value
          : '';
      });
  }

  private initSelectedPatientChartNodeSubscription() {
    const subscription =
      this.selectedPatientChartNodeService.selectedPatientChartNodeId.subscribe(
        selectedPatientChartNodeId =>
          (this.patientChartNodeId = selectedPatientChartNodeId)
      );

    this.subscription.add(subscription);
  }

  protected getUserDetails() {
    if (localStorage.getItem(this.userLocalStorageName)) {
      // const userDetails = new User();
      const decodeUserDetails = JSON.parse(
        localStorage.getItem(this.userLocalStorageName) || 'null'
      );

      return decodeUserDetails;
    }
  }
}
