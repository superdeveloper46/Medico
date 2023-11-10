
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  DxDataGridComponent,
  DxFormComponent,
  DxPopupComponent,
} from 'devextreme-angular';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { AlertService } from 'src/app/_services/alert.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'care-team-mamnagement',
  templateUrl: './careTeamManagement.component.html',
  styleUrls: ['./careTeamManagement.component.sass'],
})
export class CareTeamManagement implements OnInit {
  @ViewChild('careteampDataGrid', { static: false })
  careTeamDataGrid!: DxDataGridComponent;
  @ViewChild('careteamAddPopup', { static: false })
  careTeamAddPopup!: DxPopupComponent;
  @ViewChild('careteamForm', { static: false })
  careTeamForm!: DxFormComponent;

  @Input() patientId: string= '';

  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  careTeamSource: any;
  loading = false;
  constructor(
    private alertService: AlertService,
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService
  ) {}

  openLink() {
    window.open("https://www.hipaaspace.com/");
  }

  private bindCareTeam() {

    const apiUrlcareTeam = `CareTeam/Get-CareTeam/${this.patientId}`;
      this.repositoryService.getData(apiUrlcareTeam).subscribe({
        next: res => {
          if (res.success) {
            this.careTeamSource = res.data;
          } else {
            this.alertService.error(res.message);
          }
          this.loading = false;
        },
        error: error => {
          this.errorHandler.handleError(error);
          this.loading = false;
        },
      });
  }

  ngOnInit() {
    this.bindCareTeam();
  }

}
