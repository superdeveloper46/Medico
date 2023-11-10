import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'admin-notification',
  templateUrl: './admin-notification.component.html',
})
export class AdminNotificationComponent implements OnInit {
  @ViewChild('adminNotificationForm', { static: false })
  adminNotificationForm!: DxFormComponent;

  formData: any = { techSupport: '', medicoManager: '' };
  loading = false;
  itemId = 'Admin Notification';

  userDataSource = [];

  techSupport: any = [];
  medicoManager: any = [];
  constructor(
    private companyIdService: CompanyIdService,
    private repository: RepositoryService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.subscribeToCompanyIdChanges();
    this.bindData();
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdService.companyId.subscribe((companyId: any) => {
      if (companyId) {
        this.bindEmployee(companyId);
      }
    });
  }

  bindEmployee(args: any) {
    const apiUrl = `user/medico-staff?companyId=${args}`;
    this.repository.getData(apiUrl).subscribe({
      next: data => {
        this.userDataSource = data;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
      },
    });
  }

  bindData() {
    this.loading = true;
    const apiUrl = `configurationSettings/${this.itemId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        res.forEach((data: any) => {
          this.formData[data.fieldName] = data.value.split(',');
        });
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

  save() {
    const validationResult = this.adminNotificationForm.instance.validate();
    if (!validationResult.isValid) {
      return;
    }
    const apiUrl = `configurationSettings`;
    const data: { itemId: string; fieldName: string; value: any }[] = [];

    Object.keys(this.formData).forEach(dataId => {
      const temp = {
        itemId: this.itemId,
        fieldName: dataId,
        value: this.formData[dataId].join(','),
      };
      data.push(temp);
    });

    this.repository.create(apiUrl, data).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.error('Successfully saved');
        } else {
          this.alertService.error('Error');
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
}
