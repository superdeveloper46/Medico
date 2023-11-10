import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { SubTask } from 'src/app/_models/subTaskModel';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import DataSource from 'devextreme/data/data_source';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { AdminRichTextEditorComponent } from '../../share/components/admin-rich-text-editor/admin-rich-text-editor.component';
import { PhraseSuggestionHelperComponent } from 'src/app/patientChart/patient-chart-tree/components/phrase-suggestion-helper/phrase-suggestion-helper.component';

@Component({
  selector: 'sub-tasks',
  templateUrl: './sub-tasks.component.html',
  styleUrls: ['./sub-tasks.component.sass'],
})
export class SubTasksComponent implements OnInit {
  @ViewChild('subTaskForm', { static: false })
  replyForm!: DxFormComponent;
  @ViewChild('subTaskRichTextEditor', { static: false })
  subTaskRichTextEditor!: AdminRichTextEditorComponent;
  @ViewChild('phraseHelper', { static: false })
  phraseHelper!: PhraseSuggestionHelperComponent;
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();
  @Input() public notificationId = 0;
  @Input() public patientId = '';

  tasks: any[] = [];
  isDrawerOpen = false;
  loading: boolean = false;
  subTaskData: SubTask = {
    id: '',
    taskTypeId: '',
    title: '',
    createDate: new Date(),
    description: '',
    dueDate: new Date(),
    priority: 'Medium',
    notificationId: 0,
    notificationStatus: 'Unread',
    patientOrderId: '',
    userIds: [],
  };
  userDataSource: any;
  companyIdSubscription?: Subscription;
  companyId: string = GuidHelper.emptyGuid;

  priorityList = [
    { name: 'High', value: 'High' },
    { name: 'Low', value: 'Low' },
    { name: 'Medium', value: 'Medium' },
  ];

  statusList = [];

  orderList = [];
  titleDataSource: DataSource = new DataSource({
    store: {
      data: [],
      type: 'array',
      key: 'title',
    },
  });
  taskTypes = [];
  title = 'ADD SUB TASK';
  buttonText = 'Save Tasl';

  isPhrasesHelperVisible = false;
  @Input() templateId?: string;

  constructor(
    private repository: RepositoryService,
    private alertService: AlertService,
    private companyIdService: CompanyIdService
  ) {}

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
    this.bindData(this.notificationId);

    this.bindSubTaskTitleList();
    this.bindTaskTypeList();
    this.bindPatientOrderList();
    this.bindStatus();
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

  bindPatientOrderList() {
    if (this.patientId === '' || this.patientId === null) return;
    this.loading = true;
    const apiUrl = `order/patientOrdersBystatus/${this.patientId}/Unread`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.orderList = res.data;
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

  formatOrderListDropdownItem(item: any): string {
    if (item?.orderNumber === undefined || item?.notes === undefined) return '';
    return `${item?.orderNumber} - ${item?.notes}`;
  }

  bindTaskTypeList() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageTypeList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.taskTypes = JSON.parse(res.data[0].jsonValues);
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

  bindSubTaskTitleList() {
    this.loading = true;
    const apiUrl = `selectable-lists/messageSubjectList`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.titleDataSource = new DataSource({
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

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    this.isPhrasesHelperVisible = true;

    if (this.phraseHelper) this.phraseHelper.areSuggestionsVisible = true;
  }

  onPhraseSuggestionApplied($event: any) {
    if (this.subTaskRichTextEditor) {
      this.subTaskRichTextEditor.insertContent(`${$event}`);
    }
  }

  openPopUp(type: string) {
    if (this.notificationId === 0) {
      this.alertService.warning(`Please select notification.`);
      return;
    }
    if (type === 'add') {
      this.title = 'ADD SUB TASK';
      this.buttonText = 'Add Task';
    } else {
      this.title = 'Edit SUB TASK';
      this.buttonText = 'Edit Task';
    }
    this.isDrawerOpen = true;
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.bindEmployee(companyId);
      }
    });
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

  public bindData(id: number) {
    this.notificationId = id;
    this.loading = true;
    const apiUrl = `subTasks/notification/${this.notificationId}`;

    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.tasks = res.data as any[];
        } else {
          this.tasks = [];
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

  addSubTask() {
    if (this.subTaskData.userIds?.length === 0) {
      this.alertService.warning(`Please choose at least one recipient!`);
      return;
    }

    if (this.subTaskData.taskTypeId === '') {
      this.alertService.warning(`TaskType can't be empty!`);
      return;
    }

    if (this.subTaskData.title === '') {
      this.alertService.warning(`Title can't be empty!`);
      return;
    }

    if (this.subTaskRichTextEditor.content === '') {
      this.alertService.warning(`Message can't be empty!`);
      return;
    }

    this.subTaskData.notificationId = this.notificationId;
    this.subTaskData.description = this.subTaskRichTextEditor.content;
    const apiUrl = `subTasks`;
    this.repository.create(apiUrl, this.subTaskData).subscribe({
      next: res => {
        if (res.success) {
          this.alertService.info(res.message);
          this.isDrawerOpen = false;
          this.bindData(this.notificationId);
          this.notifyParent.emit();
          this.clear();
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
    this.subTaskData = {
      id: '',
      taskTypeId: '',
      title: '',
      createDate: new Date(),
      description: '',
      dueDate: new Date(),
      priority: 'Medium',
      notificationId: 0,
      notificationStatus: 'Unread',
      patientOrderId: '',
      userIds: [],
    };
  }

  addCustomItem(data: any) {
    if (!data.text) {
      data.customItem = null;
      return;
    }

    const newItem = {
      value: data.text,
    };

    data.customItem = this.titleDataSource
      .store()
      .insert(newItem)
      .then(() => this.titleDataSource.load())
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

  edit(id: string) {
    this.openPopUp('edit');
    const tempData: any = this.tasks.filter((item: any) => item.id === id)[0];
    this.subTaskData = tempData;
    setTimeout(() => {
      this.subTaskRichTextEditor.insertContent(this.subTaskData.description);
    }, 2000);

    const userIds: any = [];
    tempData.subTaskUsers.map((item: any) => {
      userIds.push(item.id);
    });
    this.subTaskData.userIds = userIds;
    this.subTaskData.id = id;

    this.addSubTask();
  }
}
