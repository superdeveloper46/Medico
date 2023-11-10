import { PhysicianDoc, PhysicianExt } from './../../_models/physicianDoc';
import { Component, OnInit } from '@angular/core';
import { RepositoryService } from 'src/app/_services/repository.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Subscription } from 'rxjs';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { AlertService } from 'src/app/_services/alert.service';
import { PatientService } from 'src/app/_services/patient.service';
import { PatientSearchFilter } from 'src/app/_models/patientSearchFilter';
import { SelectableListService } from 'src/app/_services/selectable-list.service';

// declare let tinymce: any;

@Component({
  selector: 'app-physician-viewer',
  templateUrl: './physician-viewer.component.html',
  styleUrls: ['./physician-viewer.component.sass'],
})
export class PhysicianViewerComponent implements OnInit {
  docNameId: string = '';
  docNameDataSource: any = {};
  physicianDoc: any = {};
  selectedKeys: any = {};
  selectedValues: string = '';
  keyPairDataSource: any = [];
  documentId: string = '';
  loading = false;
  message = '';
  parserId = 'lapbzmcdrnuj';
  editor: any;
  editorId: string;
  initialContent: string = '';
  companyId: string = GuidHelper.emptyGuid;
  patientId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;
  patientDataSource: any = [];
  documentType: any;
  documentationList: any[] = [];
  documentDataSource: any = [];
  file?: File;

  constructor(
    private repository: RepositoryService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService,
    private patientService: PatientService,
    private selectableListService: SelectableListService
  ) {
    this.initDocNameDataSource();
    this.editorId = GuidHelper.generateNewGuid();
  }

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
  }

  private emitContentChange() {
    // const content = this.editor.getContent();
  }

  private initPatientDataSource(): void {
    const patientSearchFilter = new PatientSearchFilter();
    patientSearchFilter.companyId = this.companyId;
    this.patientService.getByFilter(patientSearchFilter).then(c => {
      this.patientDataSource = c as any[];
    });
  }

  private initDocNameDataSource(): void {
    this.loading = true;
    this.repository.fetchAllDocs(this.parserId).subscribe({
      next: res => {
        this.docNameDataSource = res as any;
        this.loading = false;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  onDocNameChanged($event: any) {
    const documentId = $event.value;
    this.documentId = documentId;

    this.repository.fetchDocument(this.parserId, this.documentId).subscribe({
      next: res => {
        this.keyPairDataSource = [];
        this.physicianDoc = res[0] as PhysicianDoc;
        this.physicianDoc.field_1.forEach((element: any, index: number) => {
          this.keyPairDataSource.push({ line: index + 1, value: element.key_0 });
        });
        this.loading = false;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  documentSelected($event: any) {
    this.selectedValues = '';
    this.selectedKeys = $event.component.getSelectedRowsData();
    this.selectedKeys.forEach((element: any) => {
      this.selectedValues += element.url + ',';
    });
  }

  handleChange($event: any) {
    this.selectedValues = '';
    this.selectedKeys = $event.component.getSelectedRowsData();
    this.selectedKeys.forEach((element: any) => {
      this.selectedValues += element.value + '<br/>';
    });
  }

  initDocumentationListValues() {
    const apiUrl =
      'selectable-lists?companyId=0084add6-3fda-e911-b5e9-0003ff1726dd&librarySelectableListIds=ad43752a-ade8-4212-9126-d3d506573c56';
    this.repository.getData(apiUrl).subscribe({
      next: (res: any[]) => {
        this.documentationList = res[0].selectableListValues as any[];
        res[0].selectableListValues.forEach((element: any, _index: number) => {
          this.documentDataSource.push({ name: element.file_name, url: 'hello' });
        });
        this.loading = false;
      },
      error: _error => {
        this.loading = false;
      },
    });
  }

  saveDocument() {
    // this.patientId = '145A2431-FB62-EB11-A607-0003FF21D4D4';
    // this.companyId = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';

    this.loading = true;
    const physicianDoc: PhysicianExt = {
      document_id: this.documentId,
      remote_id: this.physicianDoc.remote_id,
      file_name: this.physicianDoc.file_name,
      media_link: this.physicianDoc.media_link,
      media_link_original: this.physicianDoc.media_link_original,
      media_link_data: this.physicianDoc.media_link_data,
      page_count: this.physicianDoc.page_count,
      uploaded_at: this.physicianDoc.uploaded_at,
      processed_at: this.physicianDoc.processed_at,
      docContent: this.selectedValues,
      patientId: this.patientId,
      companyId: this.companyId,
      id: '',
      field_1: undefined,
      createDate: new Date(),
      documentType: this.documentType,
      isProcessed: false,
      documentUrls: '',
    };
    const apiUrl = `dataParser/physicianDoc/company/${this.companyId}/${this.parserId}`;

    this.repository.create(apiUrl, physicianDoc).subscribe({
      next: res => {
        if (res.success) {
          this.message = `${res.data} document(s) saved`;
          this.alertService.info(this.message);
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

  private subscribeToCompanyIdChanges() {
    // /*************** DEV ONLY ******************/
    // this.companyId = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';
    // this.initPatientDataSource();
    // /*************** DEV ONLY ******************/

    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.initPatientDataSource();
        this.initDocumentationListValues();
      }
    });
  }

  onChange(event: any) {
    this.file = event.target.files[0];
  }

  upload() {
    if (!this.file) return;

    this.patientId = '145A2431-FB62-EB11-A607-0003FF21D4D4';
    this.companyId = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';

    const formData = new FormData();

    formData.append(this.file.name, this.file);

    const apiUrl = `DataParser/physicianDoc/SaveLocalDocument?patientId=${this.patientId}&companyId=${this.companyId}`;
    this.repository.uploadDocument(apiUrl, formData).subscribe({
      next: res => {
        if (res.data > 0) {
          this.alertService.info('Document uploaded succesfully.');
        } else {
          this.alertService.error('Something went wrong.');
        }
        this.loading = false;
      },
      error: _error => {
        this.loading = false;
      },
    });
  }
}
