import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { AlertService } from 'src/app/_services/alert.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'default-settings',
  templateUrl: './default-settings.component.html',
})
export class DefaultSettingsComponent implements OnInit {
  @ViewChild('defaultSettingsForm', { static: false })
  defaultSettingsForm!: DxFormComponent;

  messageStatus = [{ id: '1', value: 'New Msg' }];

  formData: any = {
    auditActivity: false,
    defaultMessageStatus: '',
    date: '',
    externalEmailsSend: false,
    externalEmailsReceive: false,
  };
  loading = false;
  itemId = 'Default Settings';

  constructor(
    private repository: RepositoryService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.bindData();
  }

  bindData() {
    this.loading = true;
    const apiUrl = `configurationSettings/${this.itemId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        res.forEach((data: any) => {
          console.log(data.value);
          this.formData[data.fieldName] =
            data.value === 'true' || data.value === 'false'
              ? JSON.parse(data.value)
              : data.value;
        });
        this.loading = false;
        console.log(this.formData);
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
    const validationResult = this.defaultSettingsForm.instance.validate();
    if (!validationResult.isValid) {
      return;
    }

    const apiUrl = `configurationSettings`;
    const data: { itemId: string; fieldName: string; value: any }[] = [];
    Object.keys(this.formData).forEach(dataId => {
      const temp = {
        itemId: this.itemId,
        fieldName: dataId,
        value: this.formData[dataId],
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
