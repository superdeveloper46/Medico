import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../_services/alert.service';
import { RepositoryService } from '../../../_services/repository.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.sass'],
})
export class NotificationComponent implements OnInit, AfterViewInit {
  @ViewChild('newMessages', { static: false }) newMessages: any;
  @ViewChild('oldMessages', { static: false }) oldMessages: any;

  @Input() companyId: string = '';
  @Input() appointmentId: string = '';
  @Input() patientId: string = '';
  @Input() startDate: string = '';
  @Input() endDate: string = '';

  listOfData = [];
  unread = [];
  read: any[] = [];
  loading = false;
  selectedTabIndex = 0;
  tabs: any[] = [
    {
      id: 0,
      text: 'NEW MESSAGES',
      icon: 'folder',
    },
    {
      id: 1,
      text: 'OLDER MESSAGES',
      icon: 'bookmark',
    },
  ];

  public id = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private repository: RepositoryService,
    private alertService: AlertService
  ) {
    this.id = this.activatedRoute.snapshot.params['id'] || 0;
  }

  ngAfterViewInit(): void {}

  ngOnInit() {
    // this.bindPrevNotifications();
  }

  reload() {
    // window.location.reload();
    // this.bindPrevNotifications();
  }

  bindPrevNotifications() {
    this.loading = true;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();
    const theDate = mm + '/' + dd + '/' + yyyy;
    const apiUrl = `notification/Get-Notifications?datetime=${theDate}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.read = res.data as any[];
          //this.unread = this.listOfData.filter(c => c.isRead === false);
          //this.read = this.listOfData.filter(c => c.isRead === true);
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

  selectTab(e: any) {
    if (this.selectedTabIndex !== e.itemIndex) this.selectedTabIndex = e.itemIndex;

    if (this.selectedTabIndex === 0) {
    }
    if (this.selectedTabIndex === 1) {
    }
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }
}
