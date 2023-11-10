import {
  Component,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { Constants } from 'src/app/_classes/constants';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { PatientChartTemplateComponent } from '../patient-chart-template/patient-chart-template.component';


declare let tinymce: any;

@Component({
  templateUrl: 'template-manual-editor.component.html',
  selector: 'template-manual-editor',
})
export class TemplateManualEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialContent!: string;
  @Input() templateId!: string;
  @Input() companyId!: string;
  @Output() contentChanged = new EventEmitter<string>();
  isPhrasesHelperVisible = false;
  editor: any;
  editorId: string;
  // fontFamily = 'Verdana';
  // fontSize = '12pt';
  configData: any = {};
  selection: any;
  isCheckDuplicateEnabled: boolean = false;
  cancelDuplicateCheck: boolean = false;

  constructor(
    private patientChart: PatientChartTemplateComponent,
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private envService: EnvironmentUrlService
  ) {
    this.editorId = GuidHelper.generateNewGuid();
  }

  onPhraseSuggestionApplied($event: any) {
    if ($event) {
      const templateContent = this.editor.getContent();

      this.editor.setContent(`${templateContent}${$event}`);
      this.emitContentChange();
    }

    this.isPhrasesHelperVisible = false;
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();

    this.isPhrasesHelperVisible = true;
  }

  ngOnInit() {
    // this.bindEditorConfig();
  }

  ngOnChanges() {
    if (!!this.editor) {
      this.editor.setContent(this.initialContent);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      tinymce.init({
        extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${Constants.expressionItem.attributes.expressionId.toLowerCase()}|${
          Constants.selectableItem.attributes.id
        }|${Constants.mvItem.attributes.mvId.toLowerCase()}|${Constants.varItem.attributes.varId.toLowerCase()}|${
          Constants.selectableItem.attributes.metadata
        }|${Constants.selectableItem.attributes.selectableType}|contenteditable|${
          Constants.selectableItem.attributes.initialValue
        }]`,
        content_style: Constants.tinymceStyles.manualEditor,
        height: '60vh',
        body_class: 'patient-rich-text-editor',
        selector: `#${this.editorId}`,
        plugins: ['export lists table image powerpaste'],
        menubar: true,
        toolbar:
          'export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image',
        powerpaste_allow_local_images: true,
        powerpaste_word_import: 'prompt',
        powerpaste_html_import: 'prompt',
        browser_spellcheck: true,
        //mantener el cursor en su posicion
        auto_focus: false,
        //mantener el cursor en su posicion
        contextmenu: 'undo redo | inserttable | cell row column deletetable',
        //mantener el cursor en su posicion
        custom_undo_redo_levels: 10,
        setup: (editor: any) => {
          this.editor = editor;
          editor.on('focusout', () => {
            this.emitContentChange();
          });
          editor.on('keyup', (event: any) => {
              if (event.keyCode == 32 && this.isCheckDuplicateEnabled)
                this.emitContentChangeAndDuplicateWords();
            }
          );
        },
        init_instance_callback: (editor: any) => {
          editor.setContent(this.initialContent);
        },
      });
    }, 0);
    //  setTimeout(() => {
    //   tinymce.init({
    //     extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${
    //       Constants.selectableItem.attributes.id
    //     }|${Constants.selectableItem.attributes.metadata}|style]`,
    //     //content_style: Constants.tinymceStyles.detailedEditor,
    //     content_style:
    //       "body { font-family: " +
    //       this.configData.fontFamily +
    //       ";font-size:" +
    //       this.configData.fontSize +
    //       " }",
    //     height: 680,
    //     ui_container: ".popup",
    //     selector: `#${this.editorId}`,
    //     plugins: ["export lists table image powerpaste"],
    //     fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt",--
    //     menubar: true,--
    //     toolbar:
    //       "export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image",
    //     powerpaste_allow_local_images: true,
    //     powerpaste_word_import: "prompt",
    //     powerpaste_html_import: "prompt",
    //     browser_spellcheck: true,
    //     // tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
    //     /* without images_upload_url set, Upload tab won't show up*/
    //     // images_upload_url: 'postAcceptor.php',
    //     images_upload_url: `${this.envService.urlAddress}Order/uploadFile`,
    //     setup: (editor) => {
    //       this.editor = editor;
    //       editor.on("focusout", () => {
    //         this.emitContentChange();
    //       });
    //     },
    //     init_instance_callback: (editor: any) => {
    //       editor.setContent(this.initialContent);
    //     },
    //   });
    //  }, 0);
  }

  bindEditorConfig() {
    const apiUrl = 'settings/editor-config';
    this.repositoryService.getData(apiUrl).subscribe({
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

  ngOnDestroy(): void {
    tinymce.remove(this.editor);
  }

  emitContentChange() {
    const content = this.editor.getContent();
    this.contentChanged.emit(content);
  }

  async emitContentChangeAndDuplicateWords() {
    const content = await this.patientChart.callDuplicateWords(this.editor.getContent());
    if (this.patientChart.flag) {
      this.editor.setContent(content);
    }
  }

  toggleView(e: any) {
    if (e.event) {
      if (!this.cancelDuplicateCheck) {
        this.isCheckDuplicateEnabled = false;
      }
    }
  }
}
