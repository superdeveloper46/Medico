import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { AlertService } from 'src/app/_services/alert.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'include-exclude',
  templateUrl: './include-exclude.component.html',
})
export class IncludeExcludeListComponent implements OnInit {
  @ViewChild('IncludeExcludeForm', { static: false })
  configSettingsForm!: DxFormComponent;

  @Input() itemId: string = "";

  formData: any = { value: ''};
  loading = false;

  lists: any = [];

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
        this.lists = res;
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
    const validationResult = this.configSettingsForm.instance.validate();
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
          this.bindData();
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

  deleteList(id: string){
    const apiUrl = `configurationSettings/${id}`;
    this.repository.delete(apiUrl).subscribe({
      next: res => {
        this.bindData();
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
