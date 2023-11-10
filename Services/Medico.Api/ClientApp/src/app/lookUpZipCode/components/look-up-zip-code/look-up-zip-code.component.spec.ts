import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LookUpZipCodeComponent } from './look-up-zip-code.component';

describe('LookUpZipCodeComponent', () => {
  let component: LookUpZipCodeComponent;
  let fixture: ComponentFixture<LookUpZipCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LookUpZipCodeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LookUpZipCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
