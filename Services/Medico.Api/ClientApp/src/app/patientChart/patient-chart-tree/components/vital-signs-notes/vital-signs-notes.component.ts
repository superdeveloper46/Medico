import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { VitalSignsNotes } from 'src/app/patientChart/models/vitalSignsNotes';
import { VitalSignsNotesService } from '../../services/vital-signs-notes.service';
import { AlertService } from 'src/app/_services/alert.service';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { Subscription } from 'rxjs';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';

@Component({
  templateUrl: 'vital-signs-notes.component.html',
  selector: 'vital-signs-notes',
})
export class VitalSignsNotesComponent implements OnInit, OnDestroy {
  @Input() admissionId!: string;
  @Input() isSignedOff!: boolean;
  @Input() companyId!: string;

  @ViewChild('vitalSignsNotesForm', { static: false })
  vitalSignsNotesForm!: DxFormComponent;

  private subscription: Subscription = new Subscription();

  patientChartNodeId?: string;

  vitalSignsNotes: VitalSignsNotes = new VitalSignsNotes();

  constructor(
    private vitalSignsNotesService: VitalSignsNotesService,
    private alertService: AlertService,
    private selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    this.initSelectedPatientChartNodeSubscription();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    this.initVitalSignsNotes();
  }

  onPhraseSuggestionApplied($event: any) {
    this.vitalSignsNotes.notes = $event;
  }

  saveVitalSignsNotes() {
    if (!this.vitalSignsNotes.id) this.vitalSignsNotes.admissionId = this.admissionId;

    this.vitalSignsNotesService
      .save(this.vitalSignsNotes)
      .then(vitalSignsNotes => {
        this.vitalSignsNotes = vitalSignsNotes;
        this.alertService.info('Vital signs notes saved');
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initVitalSignsNotes() {
    this.vitalSignsNotesService
      .getByAdmissionId(this.admissionId)
      .then(vitalSignsNotes => {
        if (vitalSignsNotes) this.vitalSignsNotes = vitalSignsNotes;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initSelectedPatientChartNodeSubscription() {
    const subscription =
      this.selectedPatientChartNodeService.selectedPatientChartNodeId.subscribe(
        selectedPatientChartNodeId =>
          (this.patientChartNodeId = selectedPatientChartNodeId)
      );

    this.subscription.add(subscription);
  }
}
