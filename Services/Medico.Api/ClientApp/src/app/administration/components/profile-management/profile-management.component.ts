import { Component, OnInit, ViewChild } from '@angular/core';
import { DxFormComponent } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { Gender } from 'src/app/_classes/gender';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { RepositoryService } from 'src/app/_services/repository.service';
import { AlertService } from 'src/app/_services/alert.service';
import { AuthenticationService } from 'src/app/_services/authentication.service';
import { ZipCodeType } from 'src/app/lookUpZipCode/models/zipCodeType';
import { EmployeeTypeList } from '../../classes/employeeTypeList';

@Component({
  selector: 'app-profile-management',
  templateUrl: './profile-management.component.html',
  styleUrls: ['./profile-management.component.sass'],
})
export class ProfileManagementComponent extends BaseAdminComponent implements OnInit {
  @ViewChild('profileForm', { static: false })
  profileForm!: DxFormComponent;

  private subscription: Subscription = new Subscription();

  companyIdSubscription?: Subscription;
  companyId: string = GuidHelper.emptyGuid;
  loading = false;
  profile = {
    firstName: 'Super',
    lastName: 'admin',
    dateOfBirth: '2019-05-05 07:00:00.0000000',
    gender: 1,
    employeeType: 5,
    role: [5],
    address: 'texas',
    city: 'texas',
    state: 43,
    zipCodeType: 1,
    zip: '12345',
    primaryPhone: '9283770225',
    email: 'superadmin@mail.com',
  };
  gender: any[] = Gender.values;
  employeeType: any[] = EmployeeTypeList.values;
  roleStatic: any[] = [
    {
      value: 1,
      name: 'Physician',
    },
    {
      value: 2,
      name: 'Nurse',
    },
    {
      value: 3,
      name: 'Medical Assistant',
    },
    {
      value: 4,
      name: 'Support Staff',
    },
    {
      value: 5,
      name: 'Administrative',
    },
    {
      value: 6,
      name: 'Non-Medical',
    },
    {
      value: 7,
      name: 'Patient',
    },
  ];
  email: Nullable<string>;

  get zipMask(): string {
    switch (this.profile.zipCodeType) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      // case ZipCodeType.NineDigit:
      default:
        return this.validationMasks.nineDigitZip;
    }
  }

  constructor(
    private companyIdService: CompanyIdService,
    private repository: RepositoryService,
    private authenticationService: AuthenticationService,
    private alertService: AlertService
  ) {
    super();
  }

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
    this.subscription.add(
      this.authenticationService.currentUser.subscribe(currentUser => {
        this.email = currentUser?.user?.email;
        this.bindProfile(this.email);
      })
    );
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
      }
    });
  }

  bindProfile(args: any) {
    const apiUrl = `user/getProfile/${args}`;
    this.repository.getData(apiUrl).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (args !== 'superadmin@mail.com') {
            // this.profile = this.profile;
          } else {
            this.profile = res.data;
          }
        }
        this.loading = false;
      },
      error: _error => {
        if (typeof _error.error === 'object') {
          this.alertService.error(
            "Can't connect to the API Server.<br>Please confirm your net connection or contact admin."
          );
        } else {
          this.alertService.error(_error.error);
        }
        this.loading = false;
      },
    });
  }

  updateprofile(): void {}
}
