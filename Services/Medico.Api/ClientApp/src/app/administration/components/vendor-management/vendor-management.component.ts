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
  selector: 'app-vendor-management',
  templateUrl: './vendor-management.component.html',
  styleUrls: ['./vendor-management.component.sass'],
})
export class VendorManagementComponent implements OnInit {
  @ViewChild('vendorFormDataGrid', { static: false })
  vendorFormDataGrid!: DxDataGridComponent;
  @ViewChild('vendorAddPopup', { static: false })
  vendorAddPopup!: DxPopupComponent;
  @ViewChild('vendorForm', { static: false })
  vendorForm!: DxFormComponent;

  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  vendorDataSource: any;
  loading = false;
  isVendorFormOpened = false;
  isNewVendor = false;
  title = 'ADD VENDOR';
  vendorData: any;
  vendorId: any;

  constructor(
    private alertService: AlertService,
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService
  ) {}

  private bindVendor() {
    const apiUrl = `VendorData/Get-Vendor`;
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        console.log(res)
        if (res.success) {
          console.log(res)
          this.vendorDataSource = res.data;
          console.log(this.vendorDataSource)
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

  openVendorForm() {
    this.title = 'ADD VENDOR';
    this.isVendorFormOpened = true;
    this.vendorData = {};
    this.isNewVendor = true;
  }

  createVendor() {
    const validationResult = this.vendorForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    const apiUrl = `vendorData`;
    this.repositoryService.create(apiUrl, this.vendorData).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isVendorFormOpened = false;
          this.refreshVendorDataGrid();
          this.bindVendor();
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

  editVendor(args: any) {
    this.title = 'EDIT VENDOR';
    this.isVendorFormOpened = true;
    this.isNewVendor = false;
    this.vendorData = args;
    this.vendorId = args.id;
  }

  updateVendor() {
    const validationResult = this.vendorForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    const apiUrl = `vendorData/${this.vendorId}`;
    this.repositoryService.update(apiUrl, this.vendorData).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isVendorFormOpened = false;
          this.refreshVendorDataGrid();
          this.bindVendor();
        } else {
          this.alertService.error('Error');
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  deleteVendor(id: string) {
    const apiUrl = `vendorData/${id}`;
    this.repositoryService.delete(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.refreshVendorDataGrid();
          this.bindVendor();
        } else {
          this.alertService.error('Error');
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  refreshVendorDataGrid() {
    this.vendorFormDataGrid.instance.refresh();
  }

  ngOnInit() {
    this.bindVendor();
  }

  onVendorSelected(_$event: any) {
    throw 'onVendorSelected is not implemented';
  }
}
