import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxFormComponent, DxPopupComponent } from 'devextreme-angular';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { AlertService } from 'src/app/_services/alert.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { Subscription } from 'rxjs';
import { GuidHelper } from 'src/app/_helpers/guid.helper';

@Component({
  selector: 'notification-grid',
  templateUrl: './notification-grid.component.html',
  styleUrls: ['./notification-grid.component.sass'],
})
export class NotificationGridComponent implements OnInit {
  @ViewChild('replyPopup', { static: false })
  replyPopup!: DxPopupComponent;
  @ViewChild('HistoryPopup', { static: false })
  HistoryPopup!: DxPopupComponent;
  @ViewChild('replyForm', { static: false })
  replyForm!: DxFormComponent;
  @Input() data: any;
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  isDrawerOpen = false;
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  @Input() userId!: Array<string>;
  replyData?: {
    id: number;
    title: string;
    description: string;
    link: string;
    parentId: number;
    createdBy: string;
  };
  parentId: any;
  loading = false;
  notificationdata: any[] = [];
  userDataSource: any;
  userId1?: string;
  isHistoryOpen = false;

  constructor(
    private repository: RepositoryService,
    private alertService: AlertService,
    private companyIdService: CompanyIdService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
    this.bindEmployee();
  }

  updateNotification(args: any) {
    const apiUrl = `notification/EditNotifyRead/${args}`;
    this.repository.update(apiUrl, { isRead: true }).subscribe({
      next: res => {
        if (res.success) {
          this.bindNotificationReply(this.parentId);
          this.notifyParent.emit();
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

  bindEmployee() {
    this.loading = true;
    const apiUrl = `user/medico-staff?companyId=${this.companyId}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        this.userDataSource = res;
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

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
      }
    });
  }

  openHistory(id: string) {
    this.isHistoryOpen = !this.isHistoryOpen;
    this.bindNotificationReply(id);
    this.parentId = id;
  }

  openPopup(id: string) {
    this.isDrawerOpen = !this.isDrawerOpen;
    this.parentId = id;
    //this.bindNotificationReply(id);
  }

  bindNotificationReply(id: string) {
    this.loading = true;
    const apiUrl = `notification/Get-NotificationReply/${id}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.notificationdata = res.data as any[];
          // console.log(this.notificationdata);
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

  postMessage() {
    const validationResult = this.replyForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.replyData) return;

    if (this.userId === undefined) {
      this.userId1 = undefined;
    } else {
      this.userId1 = this.userId.toString();
    }
    this.replyData.parentId = this.parentId;
    this.replyData.createdBy = 'Arun';

    const apiUrl = `notification/?currentUserId=${this.userId1}`;
    this.repository.create(apiUrl, this.replyData).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isDrawerOpen = false;
          this.notifyParent.emit();
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
}
