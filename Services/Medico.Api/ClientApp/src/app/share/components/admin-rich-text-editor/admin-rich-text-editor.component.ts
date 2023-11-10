import { Component, Input, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { ConfigService } from 'src/app/_services/config.service';
import { Constants } from 'src/app/_classes/constants';
import { EnvironmentUrlService } from 'src/app/_services/environment-url.service';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';

declare let tinymce: any;

@Component({
  selector: 'admin-rich-text-editor',
  templateUrl: './admin-rich-text-editor.component.html',
})
export class AdminRichTextEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialContent?: string;
  @Input() height?: number;

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
    //         content_style: Constants.tinymceStyles.detailedEditor,
    //         extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${Constants.expressionItem.attributes.expressionId.toLowerCase()}|${Constants.selectableItem.attributes.id}|${Constants.selectableItem.attributes.metadata}|${Constants.selectableItem.attributes.selectableType}|contenteditable|${Constants.selectableItem.attributes.initialValue}]`,
    //         height: 450,
    //         body_class: "admin-rich-text-editor",
    //         selector: `#${this.editorId}`,
    //         plugins: ["lists table code export image powerpaste"],
    //         fontsize_formats: "8pt 10pt 12pt 14pt 18pt 20pt 24pt",
    //         menubar: true,
    //         resize: false,
    //         toolbar: "export insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table code",
    //         setup: (editor: any) => {
    //             this.editor = editor;
    //         },
    //         init_instance_callback: (editor: any) => {
    //             editor && this.initialContent && editor.setContent(this.initialContent);
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
            if (this.initialContent) {
              this.initialContent = this.initialContent.replace(
                /(\s?&nbsp;)+/g,
                '&nbsp;'
              );
            }
            tinymce.init({
              content_style: Constants.tinymceStyles.detailedEditor,
              extended_valid_elements: `${Constants.selectableItem.tagName.toLowerCase()}[${Constants.expressionItem.attributes.expressionId.toLowerCase()}|${
                Constants.selectableItem.attributes.id
              }|${Constants.mvItem.attributes.mvId.toLowerCase()}|${Constants.varItem.attributes.varId.toLowerCase()}|${Constants.selectableItem.attributes.metadata}|${
                Constants.selectableItem.attributes.selectableType
              }|contenteditable|${Constants.selectableItem.attributes.initialValue}]`,
              height: this.height ?? 450,
              body_class: 'admin-rich-text-editor',
              selector: `#${this.editorId}`,
              plugins: ['lists table code export image powerpaste'],
              fontsize_formats: '8pt 10pt 12pt 14pt 18pt 20pt 24pt',
              menubar: true,
              resize: false,
              toolbar:
                'export insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table code',
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
      error: error => {
        this.errorHandler.handleError(error);
      },
    });
  }

  ngOnDestroy(): void {
    tinymce.remove(this.editor);
  }
}
