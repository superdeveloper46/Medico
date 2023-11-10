import { Component, OnInit } from '@angular/core';
import notify from 'devextreme/ui/notify';
import { FontFamily } from 'src/app/_classes/fontFamily';
import { FontSize } from 'src/app/_classes/fontSize';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-editor-config',
  templateUrl: './editor-config.component.html',
  styleUrls: ['./editor-config.component.sass'],
})
export class EditorConfigComponent implements OnInit {
  configData: any = {};
  fontFamilyList = FontFamily.values;
  fontSizeList = FontSize.values;
  loading = false;

  constructor(
    private repositoryService: RepositoryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.bindEditorConfig();
  }

  bindEditorConfig() {
    const apiUrl = 'settings/editor-config';
    this.repositoryService.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.configData = res.data;
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }

  saveEditorConfig() {
    const apiUrl = `settings/editor-config/${this.configData.id}`;
    this.repositoryService.update(apiUrl, this.configData).subscribe({
      next: res => {
        if (res.success) {
          this.configData = res.data;
          notify(res.message, 'info', 800);
        }
        this.loading = false;
      },
      error: error => {
        this.errorHandler.handleError(error);
        this.loading = false;
      },
    });
  }
}
