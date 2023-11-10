import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { firstValueFrom, Observable, Subject, Subscription } from 'rxjs';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxScrollViewComponent } from 'devextreme-angular/ui/scroll-view';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import DataSource from 'devextreme/data/data_source';
import ArrayStore from 'devextreme/data/array_store';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { DocumentService } from '../../services/document.service';
import { Document } from '../../../models/document';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { PatientChartTrackService } from '../../../../_services/patient-chart-track.service';
import { AlertService } from '../../../../_services/alert.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { SelectableListsNames } from 'src/app/_classes/selectableListsNames';
import { SelectableListConfig } from 'src/app/_models/selectableListConfig';
import { LibrarySelectableListIds } from 'src/app/_classes/librarySelectableListIds';
import { PatientChartNodeType } from 'src/app/_models/patientChartNodeType';
import { MedicalRecordService } from '../../services/medical-record.service';
import { MedicalRecord } from 'src/app/patientChart/models/medicalRecord';
import { SelectedPatientChartNodeService } from 'src/app/_services/selected-patient-chart-node.service';
import { WebcamImage } from 'ngx-webcam';
import ImageEditor from 'tui-image-editor';

declare let scanner: any;
declare let Tiff: any;
declare let $: any;

@Component({
  templateUrl: 'scan-document.component.html',
  selector: 'scan-document',
  styleUrls: ['scan-document.component.css'],
})
export class ScanDocumentComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isSignedOff!: boolean;
  @Input() patientId!: string;
  @Input() appointmentId!: string;
  @Input() pageNum!: string;
  @Input() companyId!: string;

  @ViewChild('scanDocumentForm', { static: false })
  scanDocumentForm!: DxFormComponent;
  @ViewChild('list', { static: false })
  list!: DxListComponent;
  // @ViewChild(ToastUiImageEditorComponent, { static: false })
  // editorComponent: ToastUiImageEditorComponent;
  @ViewChild('scrollView', { static: false })
  scrollView!: DxScrollViewComponent;

  private subscription: Subscription = new Subscription();

  patientChartNodeId?: string;

  canOpenUploadImageForm = false;

  imageEditor: any;
  documentType: any = {};
  icdCodesDataSource: any = {};
  isGetImagePopupOpened = false;
  isSetQualityPopupOpened = false;

  value: any[] = [];
  previewImage: any = '';
  documentsource: any = 1;

  scale = 1;

  document: Document = new Document();

  public pageCount = 0;

  public currentPage = 0;

  public webcamImage?: WebcamImage;

  public currentImage: string = '';

  //Tiff Drawing Variables
  public isTiff = false;
  public isCurrentMultiTiff = false;
  public tiffCanvas: any[] = [];
  public currentTiffPage = 0;

  public documentData: any[] = [];
  public documentList?: DataSource;

  private trigger: Subject<void> = new Subject<void>();

  scrollByContent = true;
  scrollByThumb = true;
  scrollbarMode: string = 'onScroll';
  pullDown = false;

  public imageEditorOptions: any = {
    includeUI: {
      menu: ['draw', 'crop', 'flip', 'text', 'rotate'],
    },
  };

  //todo: include 'from scanner' source when we will have scanner device
  //availableFileSources: Array<string> = ['From Computer', 'From Webcam', 'From Scanner'];
  availableFileSources: Array<string> = ['From Computer', 'From Webcam'];

  formActions: Array<string> = ['Save', 'Update'];
  formAction: string = this.formActions[0];

  get isSaveActionApplied(): boolean {
    return this.formAction === this.formActions[0];
  }

  currentDocumentData: any = {
    documentSource: this.availableFileSources[0],
  };

  constructor(
    private dxDataUrlService: DxDataUrlService,
    private selectableListService: SelectableListService,
    private documentService: DocumentService,
    private patientChartTrackService: PatientChartTrackService,
    private alertService: AlertService,
    private devextremeAuthService: DevextremeAuthService,
    private medicalRecordService: MedicalRecordService,
    private selectedPatientChartNodeService: SelectedPatientChartNodeService
  ) {
    this.initSelectedPatientChartNodeSubscription();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  createUpdateMedicalRecord() {
    const medicalRecordValidationResult = this.validateMedicalRecord(
      this.currentDocumentData
    );

    if (!medicalRecordValidationResult.success) {
      this.alertService.error(medicalRecordValidationResult.errorMessage);
      return;
    }

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to update medical record?',
      'Confirm medical record saving'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        const medicalRecordId = this.currentDocumentData.medicalRecordId;
        const successMessage = 'Medical record successfully saved';

        //new medical record
        if (!medicalRecordId) {
          this.createMedicalRecord(this.currentDocumentData)
            .then(() => {
              this.alertService.info(successMessage);
            })
            .catch(error =>
              this.alertService.error(error.message ? error.message : error)
            );

          return;
        }

        //need to check medical record existence before making decision about operation type
        this.medicalRecordService
          .getById(medicalRecordId)
          .then(medicalRecord => {
            const isUpdateOperation = !!medicalRecord;
            const updateMedicalRecordPromise = isUpdateOperation
              ? this.updateMedicalRecord(this.currentDocumentData)
              : this.createMedicalRecord(this.currentDocumentData);

            updateMedicalRecordPromise
              .then(() => {
                this.alertService.info(successMessage);
              })
              .catch(error =>
                this.alertService.error(error.message ? error.message : error)
              );
          })
          .catch(error => this.alertService.error(error.message ? error.message : error));
      }
    });
  }

  onPhraseSuggestionApplied($event: any) {
    this.currentDocumentData.notes = $event;
  }

  get associatedDocumentationListValues(): string[] {
    return this.selectableListService.getSelectableListValuesFromComponent(
      this,
      SelectableListsNames.scanDocuments.associatedDocumentation
    );
  }

  get isPcFileSourceSelected(): boolean {
    return this.currentDocumentData.documentSource === this.availableFileSources[0];
  }

  get isWeCameraFileSourceSelected(): boolean {
    return this.currentDocumentData.documentSource === this.availableFileSources[1];
  }

  onFileSourceChanged($event: any) {
    this.currentDocumentData.documentSource = $event.value;
  }

  ngOnInit() {
    const _imageEditor = new ImageEditor('#tuiImageEditor', {});

    this.initSelectableLists();
    this.initIcdCodeDataSource();
  }

  ngAfterViewInit() {
    this.initImageEditor();
    this.init();
  }

  openGetImageForm() {
    this.isGetImagePopupOpened = true;
  }

  updateTopContent(_e: any) {}

  updateBottomContent(_e: any) {}

  fullScreenImage() {}

  zoomInImage() {
    const _imageEditorWindow = $('#tuiImageEditor .tui-image-editor');
    const initWidth = $('#tuiImageEditor .tui-image-editor').css('width');
    const initHeight = $('#tuiImageEditor .tui-image-editor').css('height');
    $('#tuiImageEditor .tui-image-editor').css(
      'width',
      parseInt(initWidth, 10) * 1.1 + 'px'
    );
    $('#tuiImageEditor .tui-image-editor').css(
      'height',
      parseInt(initHeight, 10) * 1.1 + 'px'
    );
    $('#tuiImageEditor')
      .find('canvas, .tui-image-editor-canvas-container')
      .css('max-width', parseInt(initWidth, 10) * 1.1 + 'px')
      .css('max-height', parseInt(initHeight, 10) * 1.1 + 'px');
  }
  zoomOutImage() {
    const _imageEditorWindow = $('#tuiImageEditor .tui-image-editor');
    const initWidth = $('#tuiImageEditor .tui-image-editor').css('width');
    const initHeight = $('#tuiImageEditor .tui-image-editor').css('height');
    $('#tuiImageEditor .tui-image-editor').css(
      'width',
      parseInt(initWidth, 10) * 0.9 + 'px'
    );
    $('#tuiImageEditor .tui-image-editor').css(
      'height',
      parseInt(initHeight, 10) * 0.9 + 'px'
    );
  }

  private createMedicalRecord(currentDocumentData: any): Promise<void> {
    const newMedicalRecord = new MedicalRecord();

    newMedicalRecord.documentType = currentDocumentData.documentType;
    newMedicalRecord.createDate = currentDocumentData.doucmentDate;
    newMedicalRecord.notes = currentDocumentData.notes;
    newMedicalRecord.patientId = this.patientId;

    return this.medicalRecordService.save(newMedicalRecord).then(medicalRecord => {
      currentDocumentData.medicalRecordId = medicalRecord.id;
      return;
    });
  }

  private updateMedicalRecord(currentDocumentData: any): Promise<any> {
    return this.medicalRecordService
      .getById(currentDocumentData.medicalRecordId)
      .then(medicalRecord => {
        medicalRecord.documentType = currentDocumentData.documentType;
        medicalRecord.createDate = currentDocumentData.doucmentDate;
        medicalRecord.notes = currentDocumentData.notes;

        return this.medicalRecordService.save(medicalRecord);
      });
  }

  private validateMedicalRecord(currentDocumentData: any) {
    const validationResult = {
      success: true,
      errorMessage: '',
    };

    const documentType = currentDocumentData.documentType;
    if (!documentType) {
      validationResult.success = false;
      validationResult.errorMessage = 'Document type is not set';
      return validationResult;
    }

    const documentNotes = currentDocumentData.notes;
    if (!documentNotes) {
      validationResult.success = false;
      validationResult.errorMessage = 'Document notes are not set';
      return validationResult;
    }

    const documentCreateDate = currentDocumentData.doucmentDate;
    if (!documentCreateDate) {
      validationResult.success = false;
      validationResult.errorMessage = 'Document create date is not set';
      return validationResult;
    }

    return validationResult;
  }

  private initIcdCodeDataSource(): void {
    this.icdCodesDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getLookupUrl('icdcode'),
      key: 'Id',
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  private initImageEditor() {
    // this.imageEditor = this.editorComponent.editorInstance;
    this.imageEditor = new ImageEditor(
      document.querySelector('#tuiImageEditor') as Element,
      {
        includeUI: {
          menu: ['draw', 'crop', 'flip', 'text', 'rotate', 'filter'],
          initMenu: '',
          uiSize: {
            width: '100%',
            height: '100%',
          },
          menuBarPosition: 'bottom',
        },
        cssMaxWidth: 1000,
        cssMaxHeight: 1000,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70,
        },
      }
    );
    $('#tuiImageEditor .tui-image-editor').on('mousewheel', (e: any) => {
      const _imageOriginalSize = {
        width: this.imageEditor._graphics.canvasImage.width,
        height: this.imageEditor._graphics.canvasImage.height,
      };
      const wDelta = e.originalEvent.wheelDelta || e.originalEvent.deltaY;
      const imageEditorWindow = e.currentTarget;
      const scrollContainer = $('.tui-image-editor-wrap');
      const initWidth = imageEditorWindow.style.width;
      const initHeight = imageEditorWindow.style.height;
      const scrollContainerInitial = {
        top: scrollContainer.scrollTop(),
        left: scrollContainer.scrollLeft(),
        height: scrollContainer[0].scrollHeight,
        width: scrollContainer[0].scrollWidth,
      };
      const mousePosition = {
        top: e.clientY - $(imageEditorWindow).offset().top,
        left: e.clientX - $(imageEditorWindow).offset().left,
      };
      let newWidth;
      let newHeight;
      // Zoom step 10%
      if (wDelta > 0) {
        newWidth = parseInt(initWidth, 10) * 1.1;
        newHeight = parseInt(initHeight, 10) * 1.1;
        // Limit maximum zoom by image resolution
      } else {
        newWidth = parseInt(initWidth, 10) * 0.9;
        newHeight = parseInt(initHeight, 10) * 0.9;
        // Limit minimum zoom by 0.3 of original container size
        if (parseInt(imageEditorWindow.dataset.minWidth, 10) * 0.3 > newWidth) {
          newWidth = parseInt(imageEditorWindow.dataset.minWidth, 10) * 0.3;
          newHeight = parseInt(imageEditorWindow.dataset.minHeight, 10) * 0.3;
        }
      }
      imageEditorWindow.style.width = newWidth + 'px';
      imageEditorWindow.style.height = newHeight + 'px';
      $(imageEditorWindow)
        .find('canvas, .tui-image-editor-canvas-container')
        .css('max-width', imageEditorWindow.style.width)
        .css('max-height', imageEditorWindow.style.height);

      // Save initial size of container
      if (imageEditorWindow.dataset.minHeight === undefined) {
        imageEditorWindow.dataset.minHeight = initHeight;
        imageEditorWindow.dataset.minWidth = initWidth;
      }

      // Calculate scroll offset for new position
      const offsetY =
        (scrollContainer[0].scrollHeight - scrollContainerInitial.height) *
        (mousePosition.top / scrollContainerInitial.height);
      const offsetX =
        (scrollContainer[0].scrollWidth - scrollContainerInitial.width) *
        (mousePosition.left / scrollContainerInitial.width);

      scrollContainer.scrollTop(scrollContainerInitial.top + offsetY);
      scrollContainer.scrollLeft(scrollContainerInitial.left + offsetX);

      e.preventDefault();
      e.stopPropagation();
    });
    // Prevent scroll with wheel
    $('.tui-image-editor-wrap')[0].onwheel = function () {
      return false;
    };
    // Prevent overlapping from toolbar
    $('.tui-image-editor-wrap').css('height', '100%');
    // Hide Header
    $('.tui-image-editor-header').hide();
  }
  public begin() {
    const dataUrl = this.imageEditor.toDataURL();
    const ctx = this.tiffCanvas[this.currentTiffPage].getContext('2d');
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
    this.currentTiffPage = 0;
    this.drawTiff();
  }

  public end() {
    const dataUrl = this.imageEditor.toDataURL();
    const ctx = this.tiffCanvas[this.currentTiffPage].getContext('2d');
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;

    this.currentTiffPage = this.tiffCanvas.length - 1;
    this.drawTiff();
  }

  public previous() {
    const dataUrl = this.imageEditor.toDataURL();
    const ctx = this.tiffCanvas[this.currentTiffPage].getContext('2d');
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;

    if (this.currentTiffPage > 0) {
      this.currentTiffPage -= 1;
      this.drawTiff();
    }
  }

  public next() {
    const dataUrl = this.imageEditor.toDataURL();
    const ctx = this.tiffCanvas[this.currentTiffPage].getContext('2d');
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;

    if (this.tiffCanvas.length > this.currentTiffPage + 1) {
      this.currentTiffPage += 1;
      this.drawTiff();
    }
  }

  public selectDocument(_e: any) {
    const selectedId = this.list.selectedItemKeys[0];
    if (selectedId <= this.documentData.length) {
      this.setPageNum(selectedId);
    }
  }

  public save() {
    const validationResult = this.scanDocumentForm.instance.validate();

    if (!validationResult.isValid) return;

    if (
      this.currentDocumentData.documentName != '' &&
      this.currentDocumentData.documentName != null
    ) {
      if (!this.isTiff) {
        this.currentImage = this.imageEditor.toDataURL();
        this.uploadImageToServer(this.currentImage);
      } else {
        const dataUrl = this.imageEditor.toDataURL();
        const ctx = this.tiffCanvas[this.currentTiffPage].getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          this.uploadTiffToServer();
        };
        img.src = dataUrl;
      }
    }
  }

  public getPageNum() {
    if (this.documentData.length > 0) {
      return this.documentData[this.documentData.length - 1].pageNum + 1;
    }
    return 1;
  }

  private uploadImageToServer(imageDataURI: any, fileName = '') {
    const imageFile = this.dataURItoBlob(imageDataURI);
    const formdata = new FormData();
    let filename = '';

    if (fileName != '') {
      filename = fileName;
    } else {
      filename = this.getRandomFileName() + '.' + imageFile.type.split('/')[1];
    }

    formdata.append('file', imageFile, filename);
    this.documentService
      .uploadFile(this.appointmentId, this.patientId, formdata)
      .subscribe({
        next: (response: any) => {
          /// Create A Document Data After Upload Image to Server
          let document: any = {};
          document['imageData'] = response['dbPath'];

          const currentDocumentData = this.scanDocumentForm.instance.option('formData');
          document = { ...currentDocumentData, ...document };
          if (this.isSaveActionApplied) {
            //save new
            document['pageNum'] = this.getPageNum();
            this.documentData.push(document);
          } else {
            //update exist
            this.documentData[this.currentPage - 1] = document;
          }

          /// Update Document List Data
          this.updateDocumentList();

          /// Save data
          this.saveAll();
          this.isGetImagePopupOpened = false;
        },
        error: error => {
          console.log(error);
        },
      });
  }

  private uploadTiffToServer() {
    const formData = new FormData();
    for (let i = 0; i < this.tiffCanvas.length; i++) {
      const imageFile = this.dataURItoBlob(this.tiffCanvas[i].toDataURL());
      const filename = this.getRandomFileName() + '.' + imageFile.type.split('/')[1];
      formData.append('file', imageFile, filename);
    }
    const tiffFileName = this.getRandomFileName() + '.tiff';
    formData.append('filename', tiffFileName);
    this.documentService
      .uploadTiffFile(this.appointmentId, this.patientId, formData)
      .subscribe({
        next: (response: any) => {
          /// Create A Document Data After Upload Image to Server
          let document: any = {};
          document['imageData'] = response['dbPath'];

          const currentDocumentData = this.scanDocumentForm.instance.option('formData');
          document = { ...currentDocumentData, ...document };

          if (this.isSaveActionApplied) {
            //save new
            document['pageNum'] = this.getPageNum();
            this.documentData.push(document);
          } else {
            //update exist
            this.documentData[this.currentPage - 1] = document;
          }

          /// Update Document List Data
          this.updateDocumentList();

          /// Save data
          this.saveAll();
          this.isGetImagePopupOpened = false;
        },
        error: error => {
          console.log(error);
        },
      });
  }

  public saveAll() {
    if (this.document == null) {
      this.document = new Document();
    }
    this.document.patientId = this.patientId;
    this.document.documentData = JSON.stringify(this.documentData);
    firstValueFrom(this.documentService.save(this.document)).then(_document => {
      this.patientChartTrackService.emitPatientChartChanges(
        PatientChartNodeType.ScanDocumentNode
      );
    });
  }

  public setPageNum(pageNum: number) {
    if (pageNum > 0) {
      this.currentPage = pageNum;
      let pageIdx = 0;
      for (let idx = 0; idx < this.documentData.length; idx++) {
        if (this.documentData[idx].pageNum == this.currentPage) {
          pageIdx = idx;
          break;
        }
      }
      this.currentDocumentData = {
        ...this.documentData[pageIdx],
        ...this.currentDocumentData,
      };
      this.scale = 1;
      this.documentService.getImageData(this.documentData[pageIdx].imageData).subscribe({
        next: (response: any) => {
          this.currentImage = response['dataUrl'];
          this.processWithImage();
        },
        error: error => {
          console.log(error);
        },
      });
    } else {
      this.currentPage = 0;
      const canvasSize = this.imageEditor.getCanvasSize();
      this.imageEditor.ui.resizeEditor({
        imageSize: {
          oldWidth: canvasSize.oldWidth,
          oldHeight: canvasSize.oldHeight,
          newWidth: 0,
          newHeight: 0,
        },
      });
    }
  }

  private drawImage(image: any, name: string, _isMultiTiff = false) {
    this.previewImage = image;
    this.imageEditor
      .loadImageFromURL(image, name)
      .then((result: any) => {
        this.imageEditor.resizeCanvasDimension(1000, 1000);
        this.imageEditor.ui.activeMenuEvent();
        this.imageEditor.ui.resizeEditor({
          imageSize: {
            oldWidth: result.oldWidth,
            oldHeight: result.oldHeight,
            newWidth: result.newWidth,
            newHeight: result.newHeight,
          },
        });
      })
      .catch((err: any) => {
        console.error('Something went wrong:', err);
      });
  }

  private updateDocumentList() {
    //todo: temporary fix:  exclude null documents
    const data = this.documentData
      .filter(document => !!document)
      .map((value, index) => {
        return { id: index + 1, text: value.documentName };
      });

    this.documentList = new DataSource({
      store: new ArrayStore({
        key: 'id',
        data,
      }),
    });
  }

  private drawTiff() {
    let name = '';
    if (this.currentPage > this.documentData.length) {
      name = 'Untitled';
    } else {
      name = this.currentDocumentData.documentName;
    }
    const image = this.tiffCanvas[this.currentTiffPage].toDataURL();
    this.previewImage = image;
    this.drawImage(image, name, this.isCurrentMultiTiff);
  }

  public deleteDocument() {
    const deleteDocumentConfirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete this document ?',
      'Confirm deletion'
    );

    deleteDocumentConfirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.documentData = this.documentData.filter(
          document => document.imageData != this.currentDocumentData.imageData
        );
        this.saveAll();
        this.alertService.info('document is deleted successfully');
        if (this.documentData.length != 0) {
          if (this.currentPage != 1) {
            this.setPageNum(this.currentPage - 1);
          } else {
            this.setPageNum(this.currentPage);
          }
        } else {
          this.setPageNum(0);
        }
      }
    });
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.currentImage = webcamImage.imageAsDataUrl;
    this.isTiff = false;
    this.isCurrentMultiTiff = false;
    this.drawImage(this.currentImage, 'Untitled');
    this.previewImage = this.currentImage;
  }

  public fileUploaderValueChange(event: any) {
    const value = event.value[0];
    const extenstion = value.name.split('.').pop().toLowerCase();
    const tiffFileTypes = ['tiff', 'tif'];
    const reader = new FileReader();
    reader.onload = (_e: any) => {
      /// Tiff
      if (tiffFileTypes.indexOf(extenstion) > -1) {
        this.isTiff = true;
      } else {
        this.isTiff = false;
      }
      this.previewImage = reader.result;
      this.processScannedImage(reader.result);
    };
    reader.readAsDataURL(value);
  }

  public processWithImage() {
    if (!this.checkTiff(this.currentImage)) {
      this.isTiff = false;
      this.isCurrentMultiTiff = false;
      this.drawImage(this.currentImage, this.currentDocumentData.documentName);
    } else {
      this.isTiff = true;
      this.processTiff(this.currentImage);
    }
  }

  private init() {
    this.documentService.getByPatientId(this.patientId).then(document => {
      if (document != null) {
        this.document = document;
        if (document.documentData != '') {
          this.documentData = JSON.parse(document.documentData || 'null');
        }

        this.updateDocumentList();
      }
      this.setPageNum(parseInt(this.pageNum));
    });
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public scanToJpg() {
    scanner.scan(this.displayImagesOnPage, {
      output_settings: [
        {
          type: 'return-base64',
          format: 'jpg',
        },
      ],
    });
  }

  private displayImagesOnPage(successful: boolean, msg: Nullable<string>, response: any) {
    if (!successful) {
      // On error
      console.error('Failed: ' + msg);
      return;
    }
    if (successful && msg && msg.toLowerCase().indexOf('user cancel') >= 0) {
      // User cancelled.
      console.info('User cancelled');
      return;
    }
    const scannedImages = scanner.getScannedImages(response, true, false); // returns an array of ScannedImage
    for (let i = 0; scannedImages instanceof Array && i < scannedImages.length; i++) {
      const scannedImage = scannedImages[i];
      this.processScannedImage(scannedImage);
    }
  }

  private processScannedImage(scannedImage: any) {
    this.currentImage = scannedImage;
    if (!this.isTiff) {
      this.drawImage(this.currentImage, 'Untitled');
    } else {
      this.processTiff(this.currentImage);
    }
  }

  private processTiff(tiffImageDataUri: string) {
    const tiffblob = this.dataURItoBlob(tiffImageDataUri);
    const reader = new FileReader();
    reader.readAsArrayBuffer(tiffblob);
    this.currentTiffPage = 0;
    reader.onload = (_e: any) => {
      Tiff.initialize({ TOTAL_MEMORY: 16777216 * 10 });
      const tiff = new Tiff({ buffer: reader.result });

      const len = tiff.countDirectory();
      if (len > 1) {
        this.isCurrentMultiTiff = true;
      } else {
        this.isCurrentMultiTiff = false;
      }
      this.tiffCanvas = [];
      for (let i = 0; i < len; i++) {
        tiff.setDirectory(i);
        this.tiffCanvas.push(tiff.toCanvas());
      }
      this.drawTiff();
    };
  }

  private dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);

    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  private getRandomFileName() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const lengthOfCode = 16;
    let text = '';
    for (let i = 0; i < lengthOfCode; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private checkTiff(dataURI: string) {
    const type = dataURI.substring('data:image/'.length, dataURI.indexOf(';base64'));
    if (
      type.toLowerCase().indexOf('tif') !== -1 ||
      type.toLowerCase().indexOf('tiff') !== -1
    )
      return true;
    return false;
  }

  private initSelectableLists() {
    const associatedDocumentationListConfig = new SelectableListConfig(
      this.companyId,
      SelectableListsNames.scanDocuments.associatedDocumentation,
      LibrarySelectableListIds.scanDocuments.associatedDocumentation
    );

    const selectableLists = [associatedDocumentationListConfig];

    this.selectableListService
      .setSelectableListsValuesToComponent(selectableLists, this)
      .then(() => {
        this.canOpenUploadImageForm = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  private initSelectedPatientChartNodeSubscription() {
    const subscription =
      this.selectedPatientChartNodeService.selectedPatientChartNodeId.subscribe(
        selectedPatientChartNodeId =>
          (this.patientChartNodeId = selectedPatientChartNodeId)
      );

    this.subscription.add(subscription);
  }
}
