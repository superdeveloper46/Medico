import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { ConfigService } from 'src/app/_services/config.service';
import { Constants } from 'src/app/_classes/constants';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';

declare let tinymce: any;

@Component({
  selector: 'notes-editor',
  templateUrl: './notes-editor.component.html',
  styleUrls: ['./notes-editor.component.sass'],
})
export class NotesEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialContent?: string = '';
  @Input() height = 320;
  @Output() contentChanged = new EventEmitter<string>();

  editor: any;
  editorId: string;
  configData: any = {};
  constructor(
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService,
    private envService: EnvironmentUrlService,
    private configService: ConfigService
  ) {
    this.editorId = GuidHelper.generateNewGuid();
  }

  insertContent(content: string) {
    const spaceRemovedContent = content.replace(/(\s?&nbsp;)+/g, '&nbsp;');
    const wrappedContent = `${spaceRemovedContent}`;

    this.editor.execCommand('mceInsertContent', false, wrappedContent);
  }

  get content(): string {
    return this.editor.getContent();
  }

  public clearContent() {
    this.editor.setContent('');
  }

  ngOnInit() {
    this.bindEditorConfig();
  }

  ngAfterViewInit(): void {
  }

  showPhrasesHelper($event: any) {
    $event.preventDefault();
    //this.isPhrasesHelperVisible = true;
  }

  bindEditorConfig() {
    const apiUrl = 'settings/editor-config';
    this.repositoryService.getData(apiUrl).subscribe({
      next: (res:any) => {
        if (res.success) {
          this.configData = res.data;
          setTimeout(() => {
            tinymce.init({
              extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${
                Constants.selectableItem.attributes.id
              }|${Constants.selectableItem.attributes.metadata}|style]`,
              content_style: Constants.tinymceStyles.detailedEditor,
              //content_style: "body { font-family: " + this.configData.fontFamily + ";font-size:" + this.configData.fontSize + " }",
              height: this.height,
              body_class: 'admin-rich-text-editor',
              ui_container: '.popup',
              selector: `#${this.editorId}`,
              plugins: ['lists table code export image powerpaste'],
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
              },
              init_instance_callback: (editor: any) => {
                editor && this.initialContent && editor.setContent(this.initialContent);
              },
            });
          }, 0);
        }
      },
      error: (error:any) => {
        this.errorHandler.handleError(error);
      },
    });
  }

  ngOnDestroy(): void {
    tinymce.remove(this.editor);
  }

  private emitContentChange() {
    const content = this.editor.getContent();
    console.log(content);
    this.contentChanged.emit(content);
  }
}
