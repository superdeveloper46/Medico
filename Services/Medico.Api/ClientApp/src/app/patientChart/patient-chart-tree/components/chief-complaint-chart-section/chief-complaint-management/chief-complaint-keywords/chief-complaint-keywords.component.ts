import { Component, ViewChild, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { ChiefComplaintService } from 'src/app/_services/chief-complaint.service';
import { ChiefComplaintWithKeywords } from 'src/app/_models/chiefComplaintWithKeywords';

@Component({
  templateUrl: 'chief-complaint-keywords.component.html',
  selector: 'chief-complaint-keywords',
})
export class ChiefComplaintKeywordsComponent implements OnInit {
  @Output() mappedTemplatesAdded: EventEmitter<any> = new EventEmitter();

  @Input() companyId!: string;

  @ViewChild('chiefComplaintsGrid', { static: false })
  chiefComplaintsGrid!: DxDataGridComponent;

  chiefComplaints: ChiefComplaintWithKeywords[] = [];

  canAddTemplates = false;

  templatesData: any = {
    chiefComplaintId: '',
  };

  constructor(private chiefComplaintService: ChiefComplaintService) {}

  ngOnInit(): void {
    this.loadChiefComplaints();
  }

  addTemplates(chiefComplaintId: string) {
    this.templatesData.chiefComplaintId = chiefComplaintId;
    this.canAddTemplates = true;
  }

  onTemplatesCanceled() {
    this.canAddTemplates = false;
    this.resetTemplatesData();
  }

  onTemplatesAdded($event: any) {
    this.canAddTemplates = false;
    this.resetTemplatesData();
    this.mappedTemplatesAdded.next($event);
  }

  private loadChiefComplaints() {
    this.chiefComplaintService.getWithKeywords(this.companyId).then(chiefComplaints => {
      this.chiefComplaints = chiefComplaints;
    });
  }

  private resetTemplatesData(): any {
    this.templatesData.chiefComplaintId = '';
  }
}
