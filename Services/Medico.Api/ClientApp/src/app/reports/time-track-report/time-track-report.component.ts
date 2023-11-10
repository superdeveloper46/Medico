import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { PatientService } from 'src/app/_services/patient.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-time-track-report',
  templateUrl: './time-track-report.component.html',
  styleUrls: ['./time-track-report.component.scss'],
})
export class TimeTrackReportComponent implements OnInit {
  @ViewChild('reportDataGrid', { static: false })
  reportDataGrid!: DxDataGridComponent;

  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  selectedRows: any;

  loading = false;
  appoitmentStatus: any[] = [];
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  reportDataSource: any = [];
  origDataSource: any = [];

  tabs: any[] = [
    {
      id: 0,
      text: 'Appoitment Status ',
      icon: 'card',
      content: 'User tab content',
    },
    {
      id: 1,
      text: 'Time Tracking',
      icon: 'folder',
      content: 'Comment tab content',
    },
  ];
  selectedTabIndex = 0;

  constructor(
    private companyIdService: CompanyIdService,
    private patientService: PatientService,
    private repository: RepositoryService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;

        this.bindReport();
        this.bindChart();

        if (this.reportDataGrid && this.reportDataGrid.instance)
          this.reportDataGrid.instance.refresh();
      }
    });
  }

  selectTab(e: any) {
    if (this.selectedTabIndex !== e.itemIndex) this.selectedTabIndex = e.itemIndex;

    if (this.selectedTabIndex === 0) {
      this.bindChart();
    }
    if (this.selectedTabIndex === 1) {
      this.bindReport();
    }
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }

  bindReport() {
    this.loading = true;
    const apiUrl = `appointment/status/report/${this.companyId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.reportDataSource = res.data as any[];
          this.origDataSource = this.reportDataSource;
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  customizeLabel(arg: any) {
    return arg.valueText + ' (' + arg.percentText + ')';
  }

  bindChart() {
    this.loading = true;
    const apiUrl = `appointment/Get-Piechart`;
    this.repository.getData(apiUrl).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.appoitmentStatus = res.data as any[];
        } else {
          this.alertService.error(res.message);
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  onRowSelected(_$event: any) {}
}
