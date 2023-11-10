import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import * as moment from 'moment';
import { AlertService } from 'src/app/_services/alert.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { PatientSearchFilter } from 'src/app/_models/patientSearchFilter';
import { PatientService } from 'src/app/_services/patient.service';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import { DxFormComponent } from 'devextreme-angular';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { Subscription } from 'rxjs';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { EmployeeTypeList } from 'src/app/administration/classes/employeeTypeList';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { AdminRichTextEditorComponent } from '../../../../share/components/admin-rich-text-editor/admin-rich-text-editor.component';
import { PhraseSuggestionHelperComponent } from 'src/app/patientChart/patient-chart-tree/components/phrase-suggestion-helper/phrase-suggestion-helper.component';
import { UserService } from 'src/app/administration/services/user.service';
import { AuthenticationService } from '../../../../_services/authentication.service';

@Component({
  selector: 'notification-card',
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.scss'],
})
export class NotificationCardComponent implements OnInit, OnChanges {
  @ViewChild('replyForm', { static: false })
  replyForm!: DxFormComponent;
  @ViewChild('messageForm', { static: false })
  messageForm!: DxFormComponent;
  @ViewChild('searchForm', { static: false })
  searchForm!: DxFormComponent;
  @ViewChild('subTask', { static: false })
  subTask!: any;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;

  @ViewChild('newMessageRichTextEditor', { static: false })
  newMessageRichTextEditor!: AdminRichTextEditorComponent;

  @Output() notifyParent: EventEmitter<any> = new EventEmitter();

  data: any = [];
  @Input() id: any = 0;
  // @Input() newer = true;
  dataSource: any;
  currentNotification: any;
  loading = false;
  //unread: any;
  read: any;
  notificationdata: any[] = [];
  isDrawerOpen = false;
  //userId1: string;
  userName: string | undefined = '';
  parentId: any;
  companyIdSubscription?: Subscription;
  replyData: {
    id: number;
    title: string;
    description: string;
    link: string;
    parentId: number;
    createdBy: string;
    createDate: Date | string;
    messageTypeId: string;
    patientId: string;
    userIds: string[];
    priority: string;
  } = {
    id: 0,
    title: '',
    description: '',
    link: '',
    parentId: 0,
    createdBy: '',
    createDate: new Date(),
    messageTypeId: '',
    patientId: '',
    userIds: [],
    priority: 'Medium',
  };
  statusList: any = [];
  phonePattern: any = /^[02-9]\d{9}$/;
  phoneRules: any = { X: /[02-9]/ };

  filterCopy: any = {};

  dateFrom: Date | undefined = undefined;
  dateTo: Date | undefined = undefined;
  emailValue: string = '';
  phoneValue: string = '';
  nameValue: string = '';
  statusId: any = null;
  messageTypeId: any = null;
  subjectValue: string = '';
  contentValue: string = '';
  priority: string = '';

  userDataSource: any;
  notificationTypeData: any[] = [];
  originalData: any;
  // data1: any[];
  isDrawerOpen1 = false;
  notificationTypeId: any;
  defaultVisible: boolean = false;
  searchData: any = {};
  isFilterPopoverOpened = false;
  physianDataSource: any = {};
  loop = 'once';
  accordions: any[] = [
    {
      ID: 1,
    },
    {
      ID: 2,
    },
  ];

  subject: string = '';

  patientSource: any = [];
  subjectsDataSource: DataSource = new DataSource({
    store: {
      data: [],
      type: 'array',
      key: 'subject',
    },
  });

  messageTypes = [];

  listSearchStr = '';
  editorValueType = 'html';
  isPhrasesHelperVisible = false;
  author = '';

  priorityList = [
    { name: 'High', value: 'High' },
    { name: 'Low', value: 'Low' },
    { name: 'Medium', value: 'Medium' },
  ];

  messageTitle = '';
  filterArchive: boolean = false;

  private subscription: Subscription = new Subscription();

  @Input() templateId?: string;

  @Input() startDate?: string;
  @Input() endDate?: string;
  @Input() companyId?: string;
  @Input() appointmentId?: string;
  @Input() patientId?: string;

  constructor(
    private repository: RepositoryService,
    private patientService: PatientService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService,
    private userService: UserService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.subscribeToCompanyIdChanges();
    this.bindNotificationTypes();
    this.bindData();
    this.initPhysicianDataSource();

    this.bindMessageTypeList();
    this.bindMessageSubjectList();
    this.bindStatus();
    this.setAuthor();
  }

  setAuthor() {
    this.subscription.add(
      this.authenticationService.currentUser.subscribe(currentUser => {
        this.userName = currentUser?.user?.fullName;
        const email = currentUser?.user.email ?? '';
        // const email = 'glenn@medicoinfotech.com';
        this.userService.getByEmail(email).then(physician => {
          const isNamePrefixOrSuffixSet = !!(
            physician.namePrefix || physician.nameSuffix
          );

          const namePrefix = physician.namePrefix
            ? ` ${physician.namePrefix} `
            : isNamePrefixOrSuffixSet
            ? ' '
            : '     ';

          const nameSuffix = physician.nameSuffix
            ? ` ${physician.nameSuffix} `
            : isNamePrefixOrSuffixSet
            ? ' '
            : '     ';

          const date = `<span style='font-style: italic'> ${moment(new Date()).format(
            'MM/DD/YY HH:mm'
          )}</span>`;
          this.author = `${namePrefix}${physician.firstName} ${physician.lastName}${nameSuffix} : ${date}`;
        });
      })
    );
  }

  bindPatientList(companyId: string) {
    const patientSearchFilter = new PatientSearchFilter();

    patientSearchFilter.companyId = companyId;

    this.patientService.getByFilter(patientSearchFilter).then(patients => {
      this.patientSource = patients;
    });
  }

  bindStatus() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageStatusList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.statusList = JSON.parse(res.data[0].jsonValues);
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

  bindMessageSubjectList() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageSubjectList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.subjectsDataSource = new DataSource({
            store: {
              data: JSON.parse(res.data[0].jsonValues),
              type: 'array',
              key: 'subject',
            },
          });
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

  bindMessageTypeList() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageTypeList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.messageTypes = JSON.parse(res.data[0].jsonValues);
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

  isOrder() {
    const data: any = this.messageTypes.filter((item: any) => item.value === 'Order');

    if (data.length === 0) return true;

    if (data[0].id === this.replyData.messageTypeId) {
      return true;
    } else {
      this.replyData.patientId = '';
      return false;
    }
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.newMessageRichTextEditor) {
      this.newMessageRichTextEditor.insertContent(`${$event}`);
    }
  }

  bindData() {
    this.loading = true;
    const apiUrl = `notification`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.data = res.data as any[];
          this.data = this.data.filter((item: any) => item.patientId === this.patientId);
          this.init();
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

  private init() {
    if (this.data.length > 0) {
      this.dataSource = this.getDataSource();
      this.originalData = this.data;
      if (this.loop === 'once') {
        this.currentNotification = this.getFirstRecord();
        this.loop = 'twice';
      }
      this.bindNotificationReply(this.currentNotification.id);
      if (this.subTask) {
        this.subTask.bindData(this.currentNotification.id);
      }
    }
  }

  ngOnChanges(_$event: any) {
    /**********THIS FUNCTION WILL TRIGGER WHEN PARENT COMPONENT UPDATES 'someInput'**************/
    // if (this.data.length > 0) {
    //   this.dataSource = this.getDataSource();
    //   this.originalData = this.data;
    //   this.currentNotification = this.getFirstRecord();
    //   this.bindNotificationReply(this.currentNotification.id);
    // }
  }

  bindEmployee(args: any) {
    this.loading = true;
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
        this.loading = false;
      },
    });
  }

  formatPatientDropdownItem(item: any): string {
    if (item?.firstName === undefined || item?.firstName === undefined) return '';
    return `${item?.firstName} ${item?.lastName}`;
  }

  customPatientSearch: (item: any, filter: string) => boolean = (item, filter) => {
    if (!filter) {
      return true;
    }
    return (
      (item?.firstName + item?.lastName).toLowerCase().indexOf(filter.toLowerCase()) !==
      -1
    );
  };

  toggleDefault() {
    if (this.replyData) this.replyData.description = '';
    this.defaultVisible = !this.defaultVisible;
  }

  listSelectionChanged(e: any, _idx: number) {
    if (e.addedItems.length > 0) {
      this.currentNotification = e.addedItems[0];
      this.bindNotificationReply(e.addedItems[0].id);
      this.subTask.bindData(e.addedItems[0].id);
      this.subTask.bindPatientOrderList();
      // this.updateNotification(e.addedItems[0].id);
    }
  }

  getDataSource() {
    this.data.map((item: any) => {
      item['formatedCreatedOn'] = moment(new Date(item?.createdOn)).format(
        'DD MMM YY HH:mm:ss'
      );
      return item;
    });
    const dataSource = new DataSource({
      store: new ArrayStore({
        data: this.data,
        key: 'id',
      }),

      group: 'isRead',
      searchExpr: [
        'title',
        'description',
        'entityStatus',
        'formatedCreatedOn',
        'creatorName',
      ],
      sort: ['Position', { selector: 'isRead', desc: false }],
    });

    return dataSource;
  }

  getFirstRecord() {
    const notificationId = parseInt(this.id);
    if (notificationId === 0) {
      return this.data[0];
    } else {
      const record = this.data.filter((c: any) => c.id === notificationId)[0];

      if (record) {
        return record;
      } else {
        return this.data[0];
      }
    }
  }

  bindNotificationReply(id: string) {
    this.parentId = id;
    this.loading = true;
    const apiUrl = `notification/Get-NotificationReply/${id}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.notificationdata = res.data as any[];
        } else {
          this.notificationdata = [];
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

  updateNotification(args: any) {
    const apiUrl = `notification/EditNotifyRead/${args}`;
    this.repository.update(apiUrl, { isRead: true }).subscribe({
      next: res => {
        if (res.success) {
          this.bindData();
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

  bindNotificationTypes() {
    this.loading = true;
    const apiUrl = `notification/getNotificationType`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.notificationTypeData = res.data as any[];
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

  reply() {
    this.messageTitle = 'Reply';
    this.clear();
    this.isDrawerOpen1 = true;
  }

  message() {
    this.messageTitle = 'New Message';
    this.clear();
    this.isDrawerOpen1 = true;
  }

  postMessage() {
    if (this.replyData.userIds?.length === 0) {
      this.alertService.warning(`Please choose at least one recipient!`);
      return;
    }

    if (this.replyData.title === null || this.replyData.title === '') {
      this.alertService.warning(`Subject can't be empty!`);
      return;
    }

    if (this.replyData.messageTypeId === '') {
      this.alertService.warning(`MessageType can't be empty!`);
      return;
    }

    if (this.replyData.patientId === '') {
      this.alertService.warning(`Patient can't be empty!`);
      return;
    }

    if (this.newMessageRichTextEditor.content === '') {
      this.alertService.warning(`Message can't be empty!`);
      return;
    }

    this.replyData.createdBy = '';
    this.replyData.description = this.newMessageRichTextEditor.content;

    let apiUrl = '';

    if (this.messageTitle === 'New Message') {
      apiUrl = `notification`;
      this.replyData.parentId = 0;
    } else {
      this.replyData.parentId = this.parentId;
      apiUrl = `notification/reply`;
    }
    this.repository.create(apiUrl, this.replyData).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isDrawerOpen1 = false;
          if (this.messageTitle === 'New Message')
            this.bindNotificationReply(this.parentId);
          else this.bindData();
          this.notifyParent.emit();
        } else {
          this.alertService.error(res.message);
        }

        this.loading = false;
      },
      error: _error => {
        this.loading = false;
      },
    });
  }

  clear() {
    this.replyData = {
      id: 0,
      title: '',
      description: '',
      link: '',
      parentId: 0,
      createdBy: '',
      createDate: new Date(),
      messageTypeId: '',
      patientId: '',
      userIds: [],
      priority: 'Medium',
    };
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.bindEmployee(companyId);
        this.bindPatientList(companyId);
      }
    });
  }

  onChanged(args: any) {
    this.data = [];
    if (args.value === null) {
      this.data = this.originalData;
      this.dataSource = this.getDataSource();
      this.currentNotification = this.getFirstRecord();
      this.bindNotificationReply(this.currentNotification.id);
    } else {
      this.data = this.originalData.filter(
        (x: any) => x.notificationTypeId === args.value
      );
      this.dataSource = this.getDataSource();
      this.currentNotification = this.getFirstRecord();
      this.bindNotificationReply(this.currentNotification.id);
    }
  }

  private initPhysicianDataSource(): void {
    this.physianDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('user'),
      loadParams: { employeeType: EmployeeTypeList.values[0].value },
      key: 'id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  get filterString(): string {
    const filters: string[] = [];
    const delimiter = '\n';

    if (this.messageTypeId != undefined) {
      const messsages: any = this.messageTypes.filter(
        (x: any) => x.value === this.messageTypeId
      );
      filters.push(`MessageType: ${messsages[0].value}`);
    }
    if (this.nameValue != undefined && this.nameValue != '') {
      filters.push(`Name: ${this.nameValue}`);
    }
    if (this.subjectValue != undefined && this.subjectValue != '') {
      filters.push(`Subject: ${this.subjectValue}`);
    }
    if (this.contentValue != undefined && this.contentValue != '') {
      filters.push(`Content: ${this.contentValue}`);
    }
    if (this.statusId != undefined) {
      const status = this.statusList.filter((x: any) => x.value === this.statusId);
      filters.push(`Status: ${status[0].value}`);
    }
    if (this.priority != undefined && this.priority != '') {
      const priorities = this.priorityList.filter(x => x.value === this.priority);
      filters.push(`Priority: ${priorities[0].value}`);
    }
    if (this.emailValue != undefined && this.emailValue != '') {
      filters.push(`email: ${this.emailValue}`);
    }
    if (this.phoneValue != undefined && this.phoneValue != '') {
      filters.push(`phone: ${this.phoneValue}`);
    }
    if (this.dateFrom != undefined) {
      filters.push(`from: ${this.dateFrom.toDateString()}`);
    }
    if (this.dateTo != undefined) {
      filters.push(`to: ${this.dateTo.toDateString()}`);
    }

    if (filters.length > 0) return filters.join(delimiter);
    return 'Filter is not set';
  }

  filter(_$event: any) {}

  togglePopover($event: any) {
    $event.preventDefault();

    const isPopupFilterShouldBeOpened = !this.isFilterPopoverOpened;

    this.isFilterPopoverOpened = isPopupFilterShouldBeOpened;
  }

  applyAppointmentFilter() {
    this.messageTypeId = this.filterCopy.messageTypeId;
    this.nameValue = this.filterCopy.nameValue;
    this.subjectValue = this.filterCopy.title;
    this.contentValue = this.filterCopy.description;
    this.statusId = this.filterCopy.statusId;
    this.priority = this.filterCopy.priority;
    this.phoneValue = this.filterCopy.phoneValue;
    this.emailValue = this.filterCopy.emailValue;
    this.dateTo = this.filterCopy.dateTo;
    this.dateFrom = this.filterCopy.dateFrom;
    this.isFilterPopoverOpened = false;

    this.data = this.originalData;

    if (
      this.messageTypeId === undefined &&
      this.nameValue === undefined &&
      this.subjectValue === undefined &&
      this.contentValue === undefined &&
      this.statusId === undefined &&
      this.priority === undefined &&
      this.phoneValue === undefined &&
      this.emailValue === undefined &&
      this.dateFrom === undefined &&
      this.dateTo === undefined
    ) {
      this.dataSource = this.getDataSource();
      this.currentNotification = this.getFirstRecord();
      this.bindNotificationReply(this.currentNotification.id);
      return;
    }

    if (this.messageTypeId) {
      this.data = this.data.filter((x: any) => x.messageTypeId === this.messageTypeId);
    }
    if (this.nameValue) {
      this.data = this.filterData(this.nameValue.toLowerCase());
    }
    if (this.subjectValue) {
      this.data = this.data.filter((x: any) => x.title === this.subjectValue);
    }
    if (this.contentValue) {
      this.data = this.data.filter((x: any) => x.description === this.contentValue);
    }
    if (this.statusId) {
      this.data = this.originalData.filter((x: any) => x.isRead === this.statusId);
    }
    if (this.priority) {
      this.data = this.data.filter((x: any) => x.priority === this.priority);
    }
    if (this.phoneValue) {
      // needs to look for variations of phoneValue
      const phoneRegExp: RegExp = new RegExp(
        `/(?<=[ ])[\\d \\-+()]+$|(?<=[ ])[\\d \\-+()]+(?=[ ]\\w)/`,
        'g'
      );
      this.data = this.filterData(this.phoneValue, false, [], phoneRegExp);
    }
    if (this.emailValue) {
      this.data = this.filterData(this.emailValue.toLowerCase());
    }
    if (this.dateTo) {
      const dateToArr: number[] = [
        this.dateTo.getFullYear(),
        this.dateTo.getMonth(),
        this.dateTo.getDate(),
      ];
      this.data = this.data.filter((x: any) => {
        const dateArr: number[] = [
          new Date(x.createdOn).getFullYear(),
          new Date(x.createdOn).getMonth(),
          new Date(x.createdOn).getDate(),
        ];
        if (dateToArr[0] > dateArr[0]) return x;
        if (dateToArr[0] === dateArr[0] && dateToArr[1] > dateArr[1]) return x;
        if (
          dateToArr[0] === dateArr[0] &&
          dateToArr[1] === dateArr[1] &&
          dateToArr[2] >= dateArr[2]
        )
          return x;
      });
    }
    if (this.dateFrom) {
      const dateFromArr: number[] = [
        this.dateFrom.getFullYear(),
        this.dateFrom.getMonth(),
        this.dateFrom.getDate(),
      ];
      this.data = this.data.filter((x: any) => {
        const dateArr: number[] = [
          new Date(x.createdOn).getFullYear(),
          new Date(x.createdOn).getMonth(),
          new Date(x.createdOn).getDate(),
        ];
        if (dateFromArr[0] < dateArr[0]) return x;
        if (dateFromArr[0] === dateArr[0] && dateFromArr[1] < dateArr[1]) return x;
        if (
          dateFromArr[0] === dateArr[0] &&
          dateFromArr[1] === dateArr[1] &&
          dateFromArr[2] <= dateArr[2]
        )
          return x;
      });
    }

    this.dataSource = this.getDataSource();
    this.currentNotification = this.getFirstRecord();
    if (this.currentNotification) this.bindNotificationReply(this.currentNotification.id);

    console.log('this.data after filtering', this.data);
  }

  /**
   * Filter function tailored to this.data
   * @param {filterValue} filterValue - the value to filter by (if string, should be lowercase)
   * @param {revertIfNone} revertIfNone - if true, will return the original data if no matches are found
   * @param {keysToCheck} keysToCheck - the keys to check for the filterValue, if empty, will check all keys
   * @param {regex} regex - the regex to use to filter the data (optional)
   * @returns the filtered data
   */
  private filterData(
    filterValue: string,
    revertIfNone: boolean = false,
    keysToCheck: string[] = [],
    regex: RegExp | undefined = undefined
  ): any {
    let atLeastOneMatch: boolean = false;
    let dataToReturn: any = this.data.filter((x: any) => {
      this.objForEach(x, (key, value) => {
        // if keysToCheck isn't specified, or if the key is in keysToCheck, check the value
        if (keysToCheck.length === 0 || keysToCheck.includes(key.toString())) {
          // check if any of the recipients info contains the filterValue
          if (key === 'userModels' || typeof value === 'object') {
            this.objForEach(value, (_key2, value2) => {
              if (regex) {
                const matches: string[] | null = value2.match(regex);
                if (matches != null)
                  if (matches.filter(x => x.includes(filterValue)).length > 0)
                    atLeastOneMatch = true;
              } else if (value != null && value != undefined)
                if (value2.toString().toLowerCase().includes(filterValue))
                  atLeastOneMatch = true;
            });
          }
          if (regex) {
            const matches: string[] | null = value.match(regex);
            if (matches != null)
              if (matches.filter(x => x.includes(filterValue)).length > 0)
                atLeastOneMatch = true;
          }
          // check if any value in the JSON object contains the filterValue
          else if (value != null && value != undefined)
            if (value.toString().toLowerCase().includes(filterValue))
              atLeastOneMatch = true;
        }
      });
      // if the filterValue is found in any of the JSON values, return the object
      if (atLeastOneMatch) {
        atLeastOneMatch = false;
        return x;
      }
    });
    if (revertIfNone && dataToReturn.length === 0) dataToReturn = this.data;

    return dataToReturn;
  }

  // resetAppointmentFilter()
  // {
  //   this.statusId = null;
  //   this.physicianId = null;
  //   this.data = this.originalData
  //   this.dataSource = this.getDataSource();
  //   this.currentNotification = this.getFirstRecord();
  //   this.bindNotificationReply(this.currentNotification.id);
  // }

  cancelAppointmentFilter() {
    this.isFilterPopoverOpened = false;
  }

  private objForEach<T>(obj: T, f: (k: keyof T, v: T[keyof T]) => void): void {
    for (const k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) f(k, obj[k]);
  }

  addCustomItem(data: any) {
    if (!data.text) {
      data.customItem = null;
      return;
    }

    const newItem = {
      value: data.text,
    };

    data.customItem = this.subjectsDataSource
      .store()
      .insert(newItem)
      .then(() => this.subjectsDataSource.load())
      .then(() => newItem)
      .catch((error: any) => {
        throw error;
      });
  }

  commonText = (html: string) => {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const text = parsed.documentElement.textContent;
    if (text !== null && text.length > 100) {
      return parsed.documentElement.textContent?.substring(0, 100) + '...';
    }
    return text;
  };

  setFilterWithArchive() {
    this.filterArchive = !this.filterArchive;
    if (this.filterArchive) {
      this.data = this.originalData.filter(
        (item: any) => item.archive === this.filterArchive
      );
    } else {
      this.data = this.originalData;
    }

    this.dataSource = this.getDataSource();
    this.currentNotification = this.getFirstRecord();
    if (this.currentNotification) this.bindNotificationReply(this.currentNotification.id);
  }

  setArchive() {
    const apiUrl = `notification/setArchive/${this.currentNotification.id}`;
    this.repository.update(apiUrl, { archive: true }).subscribe({
      next: res => {
        if (res.success) {
          this.bindData();
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
}
