import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ErrorHandlerService } from 'src/app/_services/error-handler.service';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  data: any[] = [];
  loading = false;
  dataModel = '';
  id = 0;
  title = '';
  identifier = '';

  constructor(
    private activeRoute: ActivatedRoute,
    private repository: RepositoryService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.id = this.activeRoute.snapshot.params['id'] || 0;
    this.dataModel = this.activeRoute.snapshot.params['dataModel'] || '';
    this.identifier = this.activeRoute.snapshot.params['identifier'] || '';

    this.title = `Audit Trail - ${this.dataModel.toUpperCase()} [${this.identifier}]`;

    if (this.id) {
      this.bindData();
    }
  }

  // bind Data
  public bindData() {
    this.loading = true;

    const apiUrl = `auditTrail/${this.id}/dataModel/${this.dataModel}`;
    this.repository.getData(apiUrl).subscribe({
      next: res => {
        if (res.success) {
          this.data = res.data;
        } else {
          this.data = [];
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
