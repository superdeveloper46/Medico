import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { RepositoryService } from 'src/app/_services/repository.service';
import { AlertService } from 'src/app/_services/alert.service';

@Component({
  selector: 'error-log-list',
  templateUrl: './error-log-list.component.html',
})
export class ErrorLogListComponent extends BaseAdminComponent implements AfterViewInit {
  @ViewChild('errorLogDataGrid', { static: false })
  errorLogDataGrid!: DxDataGridComponent;
  @ViewChild('errorLogPopup', { static: false })
  errorLogPopup!: DxPopupComponent;

  errorLogDataSource: any = {};

  isErrorLogPopupOpened = false;

  status = 'New Error';
  userFriendlyErrorText = '';
  errorDetails = '';
  adminErrorText = '';

  errorLogStatusList = [];

  selectedId = '';

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private repository: RepositoryService,
    private alertService: AlertService
  ) {
    super();
    this.init();
  }

  convertFilterDateToUtc(...filter: any[]) {
    const minLocalDate = filter[0];

    const maxLocalDate: any = new Date(minLocalDate);
    maxLocalDate.setDate(maxLocalDate.getDate() + 1);

    const minUtcDate = DateHelper.jsLocalDateToSqlServerUtc(minLocalDate);
    const maxUtcDate = DateHelper.jsLocalDateToSqlServerUtc(maxLocalDate);

    const dateFieldName = 'date';

    const dateFilter = [
      [dateFieldName, '>=', minUtcDate],
      'and',
      [dateFieldName, '<', maxUtcDate],
    ];

    return dateFilter;
  }

  openErrorLogForm() {
    this.isErrorLogPopupOpened = true;
  }

  ngAfterViewInit(): void {
    this.registerEscapeBtnEventHandler(this.errorLogPopup);
  }

  showErrorDetails(
    status: string,
    userFriendlyErrorText: string,
    adminErrorText: string,
    errorDetails: string,
    id: string,
    $event: any
  ) {
    $event.stopPropagation();
    this.isErrorLogPopupOpened = true;
    this.selectedId = id;
    this.status = status;
    this.userFriendlyErrorText = userFriendlyErrorText;
    this.adminErrorText = adminErrorText;
    this.errorDetails = errorDetails;
  }

  resetErrorDetails() {
    this.userFriendlyErrorText = '';
    this.adminErrorText = '';
  }

  private init(): any {
    this.initErrorLogDataSource();
    this.bindErrorLogStatusList();
  }

  private initErrorLogDataSource(): void {
    this.errorLogDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl(ApiBaseUrls.errorLog),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _ajaxOptions) => {},
        this
      ),
    });

    this.applyDecoratorForDataSourceLoadFunc(this.errorLogDataSource.store);
  }

  private applyDecoratorForDataSourceLoadFunc(store: any) {
    const nativeLoadFunc = store.load;
    store.load = (loadOptions: any) => {
      return nativeLoadFunc.call(store, loadOptions).then((result: any) => {
        result.forEach((item: any) => {
          item.date = DateHelper.sqlServerUtcDateToLocalJsDate(item.date);
        });
        return result;
      });
    };
  }

  bindErrorLogStatusList() {
    const apiUrl = `selectable-lists/errorLogStatusList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.errorLogStatusList = JSON.parse(res.data[0].jsonValues);
        } else {
          this.alertService.error(res.message);
        }
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

  changeErrorStatus(event: any) {
    const value = event.value;
    this.status = value;
    const apiUrl = `error-log-records/changeStatus/${this.selectedId}/${value}`;
    this.repository.update(apiUrl, {}).subscribe({
      next: res => {
        if (res.success) {
          this.errorLogDataGrid.instance.refresh();
        } else {
          this.alertService.error(res.message);
        }
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

  deleteErrorLog(id: string) {
    const apiUrl = `error-log-records/${id}`;
    this.repository.delete(apiUrl).subscribe({
      next: () => {
        this.errorLogDataGrid.instance.refresh();
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

  deleteErrorLogs() {
    const rowsData = this.errorLogDataGrid.instance.getSelectedRowsData();
    const ids = rowsData.map(item => item.id).toString();

    console.log(rowsData);
    if (rowsData.length === 0) {
      this.alertService.error('Please select at least one row.');
      return;
    }

    const apiUrl = `error-log-records/${ids}`;
    this.repository.delete(apiUrl).subscribe({
      next: () => {
        this.errorLogDataGrid.instance.refresh();
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
}
