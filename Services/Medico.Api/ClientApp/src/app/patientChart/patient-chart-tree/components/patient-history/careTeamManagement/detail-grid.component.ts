import { Component, OnInit, ViewChild } from '@angular/core';
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
  selector: 'detail-grid',
  templateUrl: './detail-grid.component.html',
  styleUrls: ['./detail-grid.component.sass'],
})
export class DetailGridComponent implements OnInit {
    @ViewChild('careteampDataGrid', { static: false })
    careTeamDataGrid!: DxDataGridComponent;
    @ViewChild('careteamAddPopup', { static: false })
    careTeamAddPopup!: DxPopupComponent;
    @ViewChild('careteamForm', { static: false })
    careTeamForm!: DxFormComponent;
  
    searchConfiguration: SearchConfiguration = new SearchConfiguration();
    careTeamSource: any;
    careTeamAdditionalInformation: any;
    loading = false;
    careTeam: any;
    careTeamNpi: any;
    constructor(
      private alertService: AlertService,
      private repositoryService: RepositoryService,
      private errorHandler: ErrorHandlerService
    ) {}
    private bindCareTeamAdditionalInformation() {
      const apiUrlcareTeamAdditionalInformation = `CareTeam/Get-CareTeamAdditionalInformation`;
        this.repositoryService.getData(apiUrlcareTeamAdditionalInformation).subscribe({
          next: res => {
            if (res.success) {
              this.careTeamAdditionalInformation = res.data;
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
      this.bindCareTeamAdditionalInformation();
      console.log(this.careTeamAdditionalInformation);
    }
  }