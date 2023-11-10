import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientChartAuditReportComponent } from './patient-chart-audit-report.component';

describe('PatientChartAuditReportComponent', () => {
  let component: PatientChartAuditReportComponent;
  let fixture: ComponentFixture<PatientChartAuditReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PatientChartAuditReportComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientChartAuditReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
