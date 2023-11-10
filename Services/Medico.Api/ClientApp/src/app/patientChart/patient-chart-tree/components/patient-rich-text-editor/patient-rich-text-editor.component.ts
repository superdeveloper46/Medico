import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Constants } from 'src/app/_classes/constants';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';

declare let tinymce: any;
@Component({
  templateUrl: 'patient-rich-text-editor.component.html',
  selector: 'patient-rich-text-editor',
})
export class PatientRichTextEditorComponent
  implements AfterViewInit, OnInit, OnDestroy, OnChanges
{
  @Input() initialContent: string = '';
  @Input() companyId?: string;

  @Output() editorChange = new EventEmitter<any>();
  @Output() editorReady = new EventEmitter<boolean>();

  editor: any;
  editorId: string;
  configData: any = {};

  constructor(
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private envService: EnvironmentUrlService
  ) {
    this.editorId = GuidHelper.generateNewGuid();
  }

  ngOnChanges(_changes: SimpleChanges) {
    if (this.initialContent && this.editor) this.editor.setContent(this.initialContent);
  }

  insertContent(content: string) {
    const wrappedContent = `<span>&nbsp;</span>${content}<span>&nbsp;</span>`;

    this.editor.execCommand('mceInsertContent', false, wrappedContent);
  }

  get content(): string {
    return this.editor.getContent();
  }

  ngOnInit() {
    this.bindEditorConfig();
  }

  ngAfterViewInit(): void {
    // setTimeout(() => {
    //     tinymce.init({
    //         extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${Constants.selectableItem.attributes.id}|${Constants.selectableItem.attributes.metadata}|style]`,
    //         content_style: Constants.tinymceStyles.detailedEditor,
    //         height: 760,
    //         ui_container: ".popup",
    //         selector: `#${this.editorId}`,
    //         plugins: ["export lists table image powerpaste"],
    //         fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt",
    //         menubar: true,
    //         toolbar: "export insertfile undo redo | fontsizeselect | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | image",
    //         powerpaste_allow_local_images: true,
    //         powerpaste_word_import: 'prompt',
    //         powerpaste_html_import: 'prompt',
    //         browser_spellcheck: true,
    //         // tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | code wordcount' },
    //         /* without images_upload_url set, Upload tab won't show up*/
    //         // images_upload_url: 'postAcceptor.php',
    //         images_upload_url: `${this.envService.urlAddress}Order/uploadFile`,
    //         setup: (editor: any) => {
    //             this.editor = editor;
    //             editor.on("focusout", () => { this.emitContentChange(); });
    //         },
    //         init_instance_callback: (editor: any) => {
    //             editor && this.initialContent && editor.setContent(this.initialContent);
    //             this.editorReady.next(true);
    //         }
    //     });
    // }, 0);
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
                editor.setMode('readonly');
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

  private emitContentChange() {
    const content = this.editor.getContent();
    this.editorChange.emit(content);
  }

}
