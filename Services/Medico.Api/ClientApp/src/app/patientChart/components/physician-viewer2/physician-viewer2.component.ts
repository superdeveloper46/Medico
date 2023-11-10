import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { SearchConfiguration } from 'src/app/_classes/searchConfiguration';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { PhysicianDoc, PhysicianExt } from 'src/app/_models/physicianDoc';
import { AlertService } from 'src/app/_services/alert.service';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { Constants } from 'src/app/_classes/constants';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
declare const tinymce: any;

@Component({
  selector: 'physician-viewer2',
  templateUrl: './physician-viewer2.component.html',
  styleUrls: ['./physician-viewer2.component.sass'],
})
export class PhysicianViewer2Component implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('patientDataGrid', { static: false })
  patientDataGrid!: DxDataGridComponent;
  @Input() isSignedOff!: boolean;
  @Input() patientId!: string;
  @Input() companyId!: string;

  reportEditorId = 'report-editor';
  reportEditor: any;
  reportContent = '';
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
  companyIdSubscription?: Subscription;
  patientDataSource: any = [];
  documentationList: any = [];
  documentType: any;
  previewLink = '';
  documentUrls: string = '';
  documentDataSource: any = [];
  existingDocs: any = [];
  companyManagementTabs: Array<any> = [];
  selectedTabIndex = 0;
  searchConfiguration: SearchConfiguration = new SearchConfiguration();
  file?: File;
  isDocumentPopupVisible = false;
  configData: any = {};

  constructor(
    private errorHandler: ErrorHandlerService,
    private envService: EnvironmentUrlService,
    private repository: RepositoryService,
    private companyIdService: CompanyIdService,
    private alertService: AlertService
  ) {
    this.initDocNameDataSource();
    this.initCompanyManagementTabs();
    this.editorId = GuidHelper.generateNewGuid();
  }

  ngOnInit() {
    this.bindEditorConfig();
    this.subscribeToCompanyIdChanges();
  }

  bindEditorConfig() {
    const apiUrl = 'settings/editor-config';
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.configData = res.data;
          setTimeout(() => {
            tinymce.init({
              extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${
                Constants.selectableItem.attributes.id
              }|${Constants.selectableItem.attributes.metadata}|style]`,
              content_style: Constants.tinymceStyles.detailedEditor,
              //content_style: "body { font-family: " + this.configData.fontFamily + ";font-size:" + this.configData.fontSize + " }",
              height: 680,
              body_class: 'admin-rich-text-editor',
              ui_container: '.popup',
              selector: `#${this.editorId}`,
              plugins: ['export lists table code image powerpaste'],
              fontsize_formats: '8pt 10pt 12pt 14pt 18pt 20pt 24pt',
              menubar: true,
              toolbar:
                'export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image',
              powerpaste_allow_local_images: true,
              powerpaste_word_import: 'prompt',
              powerpaste_html_import: 'prompt',
              browser_spellcheck: true,

              // tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
              /* without images_upload_url set, Upload tab won't show up*/
              // images_upload_url: 'postAcceptor.php',
              images_upload_url: `${this.envService.urlAddress}Order/uploadFile`,
              setup: (editor: any) => {
                this.editor = editor;
                editor.on('focusout', () => {
                  this.emitContentChange();
                });
              },
              init_instance_callback: (editor: any) => {
                editor.setContent(this.initialContent);
              },
            });
          }, 0);
        }
      },
      error: error => {
        this.errorHandler.handleError(error);
      },
    });
  }

  ngAfterViewInit() {
    // this.setUpReportEditor();
  }

  ngOnDestroy() {
    tinymce.remove(this.reportEditor);
  }

  private setUpReportEditor() {
    setTimeout(() => {
      tinymce.init({
        extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${
          Constants.selectableItem.attributes.id
        }|${Constants.selectableItem.attributes.metadata}|style]`,
        content_style:
          'body { font-family: ' +
          this.configData.fontFamily +
          ';font-size:' +
          this.configData.fontSize +
          ' }',
        height: 760,
        ui_container: '.popup',
        selector: `#${this.reportEditorId}`,
        plugins: ['export lists table image powerpaste'],
        fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt',
        menubar: true,
        toolbar:
          'export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image',
        powerpaste_allow_local_images: true,
        powerpaste_word_import: 'prompt',
        powerpaste_html_import: 'prompt',
        browser_spellcheck: true,
        // tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
        /* without images_upload_url set, Upload tab won't show up*/
        // images_upload_url: 'postAcceptor.php',
        images_upload_url: `${this.envService.urlAddress}Order/uploadFile`,
        setup: (editor: any) => {
          this.reportEditor = editor;
        },
      });
    }, 0);
  }

  onTabSelect($event: any) {
    if (this.selectedTabIndex !== $event.itemIndex)
      this.selectedTabIndex = $event.itemIndex;

    if (this.selectedTabIndex === 1) {
      this.initSavedDocs();
    }
  }

  isTabVisible(tabId: number) {
    return this.selectedTabIndex === tabId;
  }

  previewDoc(previewLink: string) {
    const myWindow = window.open('', 'MsgWindow', 'width=700,height=600');
    const url = previewLink;
    myWindow?.document.write(
      '<object data="' +
        url +
        '" type="application/pdf" width="100%" height="100%">    <p>Alternative text - include a link <a href="myfile.pdf">to the PDF!</a></p>  </object>'
    );
  }

  private initCompanyManagementTabs() {
    this.companyManagementTabs = [
      {
        id: 0,
        text: 'Parse Files',
      },
      {
        id: 1,
        text: 'Notes',
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
        this.initSavedDocs();
        this.loading = false;
      },
      error: error => {
        console.log(error);
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

  private documentSelected($event: any) {
    this.documentUrls = '';
    this.selectedKeys = $event.component.getSelectedRowsData();
    this.selectedKeys.forEach((element: any) => {
      this.documentUrls += element.media_link_original + '|' + element.document_id + ',';
    });
  }

  public patientDocSelected($event: any) {
    const parserId = $event.selectedRowsData[0].parserId;
    if (parserId == null || parserId == '') {
      this.alertService.warning('This is a local document. Cannot be parsed');
      return;
    }
    const documentId = $event.selectedRowsData[0].documentId;
    this.documentId = documentId;
    this.previewLink = $event.selectedRowsData[0].media_link_original;

    this.repository.fetchDocument(this.parserId, this.documentId).subscribe({
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

  addDocument(doc: any) {
    // this.isDocumentPopupVisible = true;
    const parserId = doc.parserId;
    if (parserId == null || parserId == '') {
      this.alertService.warning('This is a local document. Cannot be parsed');
      return;
    }
    const documentId = doc.documentId;
    this.documentId = documentId;
    this.previewLink = doc.media_link_original;

    this.repository.fetchDocument(this.parserId, this.documentId).subscribe({
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
        this.initSavedDocs();
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
  }

  initSavedDocs() {
    const apiUrl = `dataParser/physicianDocs?patientId=${this.patientId}`;
    this.repository.getData(apiUrl).subscribe({
      next: (res: any) => {
        this.existingDocs = res.data as any[];

        if (this.docNameDataSource.length > 0) {
          this.existingDocs.forEach((element: any) => {
            this.docNameDataSource = this.docNameDataSource.filter(
              (entity: any) => entity.document_id !== element.documentId
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
    this.patientDataGrid.instance.refresh();
  }

  onChange(event: any) {
    this.file = event.target.files[0];
  }

  upload() {
    // this.patientId = '145A2431-FB62-EB11-A607-0003FF21D4D4';
    // this.companyId = '0084ADD6-3FDA-E911-B5E9-0003FF1726DD';

    if (!this.file) return;

    const formData = new FormData();
    formData.append(this.file.name, this.file);

    const apiUrl = `DataParser/physicianDoc/SaveLocalDocument?patientId=${this.patientId}&companyId=${this.companyId}`;
    this.repository.uploadDocument(apiUrl, formData).subscribe({
      next: (res: any) => {
        if (res.data > 0) {
          this.alertService.info('Document uploaded succesfully.');
          this.initSavedDocs();
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

  closeDocumentNodesManagementPopup() {
    this.isDocumentPopupVisible = false;
    // throw 'closeDocumentNodesManagementPopup is not implemented';
  }

  createUpdatePatientChartDocumentNodes() {
    throw 'createUpdatePatientChartDocumentNodes is not implemented';
  }
}
