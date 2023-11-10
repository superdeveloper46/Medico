import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { RepositoryService } from 'src/app/_services/repository.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Subscription } from 'rxjs';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { AlertService } from 'src/app/_services/alert.service';
import { PhysicianDoc, PhysicianExt } from 'src/app/_models/physicianDoc';
import {
  DxDataGridComponent,
  DxFileUploaderComponent,
  DxFormComponent,
  DxPopupComponent,
} from 'devextreme-angular';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { MedicationUpdateService } from 'src/app/administration/services/medication-update.service';
import notify from 'devextreme/ui/notify';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { ParseData } from 'src/app/patientChart/models/parseData';
import { PatientChartNode } from 'src/app/_models/patientChartNode';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';

// declare var tinymce: any;

@Component({
  selector: 'app-physician-viewer',
  templateUrl: './physician-viewer.component.html',
  styleUrls: ['./physician-viewer.component.scss'],
})
export class PhysicianViewerComponent implements OnInit {
  @ViewChild('patientDataGrid', { static: false })
  patientDataGrid!: DxDataGridComponent;
  @ViewChild('uploaderPopup', { static: false })
  uploaderPopup!: DxPopupComponent;
  @ViewChild('pdfFileUploader', { static: false })
  pdfFileUploader!: DxFileUploaderComponent;
  @ViewChild('parseForm', { static: false })
  parseForm!: DxFormComponent;
  @ViewChild('file', { static: false })
  file!: ElementRef;
  @Input() isSignedOff!: boolean;
  @Input() patientId?: string;
  @Input() companyId!: string;
  @Input() patientChartNode!: PatientChartNode;

  docNameDataSource: any[] = [];
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
  companyIdSubscription?: Subscription;
  patientDataSource: any = [];
  documentationList: any = [];
  documentType: any;
  previewLink = '';
  documentUrls: string = '';
  documentDataSource: any = [];
  existingDocs: any = [];
  companyManagementTabs: Array<any> = [];
  selectedTabIndex: number = 0;
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  files?: File[];
  isUploaderPopupOpened = false;
  parseData: any = new ParseData();
  icdCodesDataSource: any = {};
  icdCodeArr?: Array<any>;
  assessmentListValues: any[] = [];
  fileTypes = [
    { id: '1', value: 'JSON' },
    { id: '2', value: 'XML' },
    { id: '3', value: 'CSV' },
    { id: '4', value: 'PDF' },
    { id: '5', value: 'ZIP' },
  ];
  subjectBoxEditorOptions: any;
  docData: any[] = [];


  public uploadDocParseTab: boolean = false;

  constructor(
    private repository: RepositoryService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService,
    private medicationUpdateService: MedicationUpdateService,
    private selectableListService: SelectableListService,
    private dxDataUrlService: DxDataUrlService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    // this.companyId = "FC4DCBCE-11EB-4719-AD57-24A7C514D5B0";
    this.initProcessedDocsDataSource();
    this.initDocNameDataSource();
    this.initCompanyManagementTabs();
    this.editorId = GuidHelper.generateNewGuid();
  }

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
    this.initAssessmentListValues();

    this.subjectBoxEditorOptions = {
      items: this.docData,
      searchEnabled: true,
      value: '',
      displayExpr: 'value',
      valueExpr: 'value',
      onValueChanged: this.subjectMethod.bind(this),
    };
  }

  subjectMethod(_e: any): void {}

  onTabSelect($event: any) {
    if (this.selectedTabIndex !== $event.itemIndex)
      this.selectedTabIndex = $event.itemIndex;

    if (this.selectedTabIndex === 1) {
      this.initPatientDocs();
    }
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }

  previewDoc(previewLink: string) {
    const myWindow: any = window.open('', 'MsgWindow', 'width=700,height=600');
    const url = previewLink;
    myWindow.document.write(
      '<object data="' +
        url +
        '" type="application/pdf" width="100%" height="100%">    <p>Alternative text - include a link <a href="myfile.pdf">to the PDF!</a></p>  </object>'
    );
  }

  private initCompanyManagementTabs() {
    this.companyManagementTabs = [
      {
        id: 0,
        text: "Patient's Document List",
      },
    ];
  }

  private emitContentChange() {
    const _content = this.editor.getContent();
  }

  private initDocNameDataSource(): void {
    this.loading = true;
    this.repository.fetchAllDocs(this.parserId).subscribe({
      next: res => {
        this.docNameDataSource = res as any;
        this.initDocumentSave(this.parserId);
        this.initPatientDocs();
        this.loading = false;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  initDocumentSave(parserId: string) {
    this.loading = true;
    let apiUrl = `dataParser/documents/company/${this.companyId}/${parserId}`;
    if (this.docNameDataSource.length > 0) {
      const ext = this.docNameDataSource[0].file_name.split('.').pop();

      switch (ext) {
        case 'tif':
          apiUrl = `dataParser/documentsExt/company/${this.companyId}/${parserId}`;
          break;
      }
    }

    this.repository.create(apiUrl, this.docNameDataSource).subscribe({
      next: res => {
        if (res.success) {
          this.message = `${res.data} documents saved for processing`;
        } else {
          this.alertService.error(res.message);
        }
        this.initProcessedDocsDataSource();
        this.refreshPatientsGrid();
        this.loading = false;
      },
      error: _error => {
        this.loading = false;
      },
    });
  }

  public initProcessedDocsDataSource() {
    this.loading = true;

    const apiUrl = `dataParser/dx/grid`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        this, (this.patientDataSource = res.data);
        this.loading = false;

        if (this.patientDataGrid && this.patientDataGrid.instance)
          this.patientDataGrid.instance.refresh();
      },
      error: _error => {
        this.loading = false;
      },
    });
  }

  private onDocNameChanged($event: any) {
    const documentId = $event.value;
    this.documentId = documentId;

    this.repository.fetchDocument(this.parserId, this.documentId).subscribe({
      next: res => {
        this.keyPairDataSource = [];
        this.physicianDoc = res[0] as PhysicianDoc;
        this.physicianDoc.field_1.forEach((element: any, index: number) => {
          this.keyPairDataSource.push({ line: index + 1, value: element.key_0 });
        });
        //this.previewLink='https://api.docparser.com\/v1\/document\/media\/4dEqie7q0s4YQDQC7Eix4kWC5P2T4QJA_pAsbCK_fFN0y99wSSMAIOm82AtUQPDIbODtmgtO-DNAl4trG2JRNuJu8g_lwO-HjtZcx-aKYPE\/original';
        this.previewLink = this.physicianDoc.media_link_original;
        this.loading = false;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  handleChange($event: any) {
    this.selectedValues = '';
    this.selectedKeys = $event.component.getSelectedRowsData();
    this.selectedKeys.forEach((element: any) => {
      this.selectedValues += element.value + '<br/>';
    });
  }

  documentSelected($event: any) {
    this.documentUrls = '';
    this.selectedKeys = $event.component.getSelectedRowsData();
    this.selectedKeys.forEach((element: any) => {
      this.documentUrls += element.media_link_original + '|' + element.id + ',';
    });
  }

  patientDocSelected($event: any) {
    const parserId = $event.selectedRowsData[0].parserId;
    if (parserId == null || parserId == '') {
      this.alertService.warning('This is a local document. Cannot be parsed');
      return;
    }
    const documentId = $event.selectedRowsData[0].documentId;
    this.documentId = documentId;
    this.previewLink = $event.selectedRowsData[0].media_link_original;

    this.parseDoc(this.documentId);
  }

  parseDoc(documentId: string) {
    this.repository.fetchDocument(this.parserId, documentId).subscribe({
      next: res => {
        this.keyPairDataSource = [];
        this.physicianDoc = res[0] as PhysicianDoc;
        this.physicianDoc.field_1.forEach((element: any, index: number) => {
          this.keyPairDataSource.push({ line: index + 1, value: element.key_0 });
        });
        //this.previewLink='https://api.docparser.com\/v1\/document\/media\/4dEqie7q0s4YQDQC7Eix4kWC5P2T4QJA_pAsbCK_fFN0y99wSSMAIOm82AtUQPDIbODtmgtO-DNAl4trG2JRNuJu8g_lwO-HjtZcx-aKYPE\/original';
        this.loading = false;
      },
      error: error => {
        console.log(error);
        this.loading = false;
      },
    });
  }

  donwloadDoc(data: any) {
    const { id , fileName, patientId } = data;
    this.loading = true;
    const apiUrl = `DataParser/downloadFile?documentId=${id}&filename=${fileName}&patientId=${patientId}`;
    this.repository.donwloadFIle(apiUrl).subscribe({
      next: res => {
        const blob = new Blob([res], { type: 'application/pdf' });
        // link.href = URL.createObjectURL(blob);
        // link.setAttribute('download', filename);
        // link.dispatchEvent(new MouseEvent('click'));
        this.loading = false;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('style', 'display: none');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(function() {
          URL.revokeObjectURL(link.href);
         }, 0);
        link.remove();
      },
      error: _error => {
        this.loading = false;
      }
    });
  }

  saveDocument(IsProcessed: boolean) {
    //  this.patientId = '145A2431-FB62-EB11-A607-0003FF21D4D4';
    //  this.companyId = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';

    this.loading = true;
    if (this.documentType == '' || this.documentType == undefined) {
      this.alertService.error('Please select document type.');
      return;
    }
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
      isProcessed: IsProcessed,
      documentUrls: this.documentUrls,
    };
    const apiUrl = `dataParser/physicianDoc/company/${this.companyId}/${this.parserId}`;

    this.repository.create(apiUrl, physicianDoc).subscribe({
      next: res => {
        if (res.success) {
          this.message = `${res.data} document(s) saved`;
          this.initProcessedDocsDataSource();
          this.initPatientDocs();
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

  saveSelected() {
    this.loading = true;
    // const appointmentId = 'D0004FEA-1562-EA11-A94C-0003FF16FDED';
    // const url = 'https://api.docparser.com/v1/document/media/nhjh-Oerc2v-kmGiFrAWEkOL3zOSzFTWfLAG5w0sXu10y99wSSMAIOm82AtUQPDIbODtmgtO-DNAl4trG2JRNuJu8g_lwO-HjtZcx-aKYPE/original';
    const url = this.documentUrls;
    //const url = 'https://api.docparser.com/v1/document/media/MPMfuricaGLN4KUNCoPg3Y-4VIZqxWzXT8M-8VqIQqN0y99wSSMAIOm82AtUQPDIbODtmgtO-DNAl4trG2JRNuJu8g_lwO-HjtZcx-aKYPE/original|444e603948e12779dce2d3b6aac844f4,https://api.docparser.com/v1/document/media/RgtTqMV6Itj0W3YghgyK8x0l06SWUL4x-wKbOWKIj3F0y99wSSMAIOm82AtUQPDIbODtmgtO-DNAl4trG2JRNuJu8g_lwO-HjtZcx-aKYPE/original|9bf8c8ba104a95b1a101fd8956b290e7,'
    const apiUrl = `dataParser/physicianDoc/saveDocument?companyId=${this.companyId}&patientId=${this.patientId}&fileUrl=${url}`;

    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.message = `${res.data} document(s) saved`;

          this.selectedTabIndex = 1;

          this.initPatientDocs();
          this.initProcessedDocsDataSource();

          if (this.patientDataGrid && this.patientDataGrid.instance)
            this.patientDataGrid.instance.refresh();

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
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        this.initDocumentationListValues();
        this.initPatientDocs();
      }
    });
  }

  initDocumentationListValues() {
    const apiUrl = `selectable-lists?companyId=${this.companyId}&librarySelectableListIds=ad43752a-ade8-4212-9126-d3d506573c56`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.length > 0) {
          this.documentationList = res[0].selectableListValues as any[];
          if (this.documentationList.length > 0) {
            res[0].selectableListValues.forEach((element: any, _index: number) => {
              this.documentDataSource.push({
                name: element.file_name,
                url: element.media_link_original,
              });
             
            });
          }
        }
        this.loading = false;
      },
      error: _error => {
        this.loading = false;
      },
    });

    console.log(this.patientDataSource)
  }

  initPatientDocs() {
    const apiUrl = `dataParser/physicianDocs?patientId=${this.patientId}`;
    this.repository.getData(apiUrl).subscribe({
      next: (res: any) => {
        this.existingDocs = res.data as any[];

        if (this.docNameDataSource.length > 0) {
          this.existingDocs.forEach((element: any) => {
            this.docNameDataSource = this.docNameDataSource.filter(
              entity => entity.document_id !== element.documentId
            );
          });
        }
        this.loading = false;
      },
      error: _error => {
        this.loading = false;
      },
    });
  }

  refreshPatientsGrid() {
    this.patientDataGrid?.instance.refresh();
  }

  onChange(event: any) {
    this.files = event.target.files;
  }

  upload() {
    // this.patientId = '145A2431-FB62-EB11-A607-0003FF21D4D4';
    // this.companyId = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';

    if (!this.files) return;

    const formData = new FormData();
    for (let i = 0; i < this.files.length; i++) {
      formData.append(this.files[i].name, this.files[i]);
    }

    const apiUrl = `DataParser/physicianDoc/SaveLocalDocument?patientId=${this.patientId}&companyId=${this.companyId}`;
    this.repository.uploadDocument(apiUrl, formData).subscribe({
      next: (res: any) => {
        if (res.data > 0) {
          this.alertService.info('Document uploaded succesfully.');
          this.initPatientDocs();
          this.file.nativeElement.value = '';
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

  openUploader() {
    this.isUploaderPopupOpened = true;
  }

  uploadToDocParser() {
    let filesUploaded = 0;
    for (let i = 0; i < this.pdfFileUploader.value.length; i++) {
      const medicationsFile = this.pdfFileUploader.value[i];
      if (!medicationsFile) {
        this.alertService.warning('You have to upload PDF file');
        return;
      }
      /************** TEST MODE *****************/
      // this.documentId = "xxxxxxxxxxxxxx";
      // this.isUploaderPopupOpened = false;
      /************** END TEST MODE *****************/

      this.medicationUpdateService
        .uploadFile(medicationsFile, this.parserId)
        .then(_c => {
          filesUploaded++;
          this.initProcessedDocsDataSource();
          this.isUploaderPopupOpened = false;
        })
        .catch(error => this.alertService.error(error.message ? error.message : error));
    }
    if (filesUploaded > 0) {
      this.message = `Document(s) has been uploaded successfully. Please wait for sometime for the document to process.`;
    }
  }

  deletePatientDocument(id: string, $event: any) {
    $event.stopPropagation();
    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the Patient Document?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        const route = `DataParser/physicianDoc/${id}`;
        this.repository.delete(route).subscribe({
          next: _res => {
            notify('Patient Document deleted');
            this.initPatientDocs();

            this.loading = false;
          },
          error: _error => {
            this.loading = false;
          },
        });
      }
    });
  }

  get associatedDocumentationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.scanDocuments.associatedDocumentation
    );
  }

  private initAssessmentListValues(): void {
    if (this.patientChartNode && this.patientChartNode.value.length > 0) {

      this.assessmentListValues = this.patientChartNode.value;
    }
  }

  private initCptCodeDataSource(): void {
    this.icdCodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('cptcode'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
    this.icdCodesDataSource.store.load().then(
      (data: any) => {
        this.icdCodeArr = data;
    })
  }

  onFormParseChanged($event: any): void {
    console.log($event);
  }

  doDocParser() {
    alert('doDocParser');
  }
}
