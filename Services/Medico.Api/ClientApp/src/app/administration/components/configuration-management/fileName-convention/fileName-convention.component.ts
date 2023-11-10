import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { AlertService } from 'src/app/_services/alert.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'fileName-convention',
  templateUrl: './fileName-convention.component.html',
})
export class FileNameConventionComponent implements OnInit {
  @ViewChild('fileNameConventionForm', { static: false })
  fileNameConventionForm!: DxFormComponent;

  date = new Date();

  formData: any = {};

  fileTypes = [
    { id: '1', value: 'JSON' },
    { id: '2', value: 'XML' },
    { id: '3', value: 'CSV' },
    { id: '4', value: 'PDF' },
    { id: '5', value: 'ZIP' },
  ];

  itemId = 'File Naming Convention';
  loading: boolean = false;

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
          this.formData[data.fieldName] = data.value;
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
    const validationResult = this.fileNameConventionForm.instance.validate();
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
