import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientChartPreAuthComponent } from './patient-chart-pre-auth.component';

describe('PatientChartPreAuthComponent', () => {
  let component: PatientChartPreAuthComponent;
  let fixture: ComponentFixture<PatientChartPreAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PatientChartPreAuthComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientChartPreAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
