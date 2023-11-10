import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreAuthManagementComponent } from './pre-auth-management.component';

describe('PreAuthManagementComponent', () => {
  let component: PreAuthManagementComponent;
  let fixture: ComponentFixture<PreAuthManagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PreAuthManagementComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreAuthManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
