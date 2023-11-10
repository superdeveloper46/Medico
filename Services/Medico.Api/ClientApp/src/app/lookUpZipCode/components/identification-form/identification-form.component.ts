import { Component, Input, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { PatientIdentificationCode } from '../../models/patientIdentificationCode';
import { PatientIdentificationCodeType } from '../../models/enums/patientIdentificationCodeType';
import { PatientsModuleConstants } from '../../constants/patientsModuleConstants';
import { PatientIdentificationNumericCodeService } from '../../services/patient-identification-numeric-code.service';
import { PatientIdentificationCodeService } from '../../services/patient-identification-code.service';
import { PatientIdentificationCodeSearchFilter } from '../../models/PatientIdentificationCodeSearchFilter';
import { AlertService } from 'src/app/_services/alert.service';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Subscription } from 'rxjs';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { Company } from 'src/app/_models/company';
import { CompanyService } from 'src/app/_services/company.service';

@Component({
  selector: 'identification-form',
  templateUrl: './identification-form.component.html',
})
export class IdentificationFormComponent
  extends BaseAdminComponent
  implements OnInit, OnDestroy
{
  @ViewChild('identificationCodeForm', { static: false })
  identificationCodeForm!: DxFormComponent;

  companyIdSubscription?: Subscription;
  companyId = GuidHelper.emptyGuid;
  @Input() codeType!: PatientIdentificationCodeType;

  company: Company = new Company();

  identificationCode?: PatientIdentificationCode;
  identificationCodeCopy?: PatientIdentificationCode;

  identificationCodeTypes?: PatientIdentificationCodeType;

  patientsModuleConstants = PatientsModuleConstants;
  DisabledFormFields = false;
  DisabledFormFields1 = false;
  DisabledFormFields2 = false;

  LCode = '';

  constructor(
    private patientIdentificationNumericCodeService: PatientIdentificationNumericCodeService,
    private patientIdentificationCodeService: PatientIdentificationCodeService,
    private alertService: AlertService,
    private companyIdService: CompanyIdService,
    private companyService: CompanyService
  ) {
    super();
  }

  ngOnInit() {
    this.subscribeToCompanyIdChanges();
  }

  ngOnDestroy(): void {
    this.companyIdSubscription?.unsubscribe();
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      this.companyId = companyId;
      this.identificationCode = PatientIdentificationCode.createDefault(
        this.codeType,
        this.companyId
      );

      this.identificationCodeCopy = PatientIdentificationCode.createDefault(
        this.codeType,
        this.companyId
      );

      this.DisabledFormFields = false;
      this.DisabledFormFields1 = false;

      const codeSearchFilter = new PatientIdentificationCodeSearchFilter();
      codeSearchFilter.companyId = this.companyId;
      codeSearchFilter.identificationCodeType = this.codeType;
      this.patientIdentificationCodeService.get(codeSearchFilter).then(code => {
        if (code) {
          this.identificationCode = PatientIdentificationCode.createFromResponse(code);

          if (this.codeType == 1) {
            if (this.identificationCode.id != null || this.identificationCode.id != '') {
              this.patientIdentificationCodeService
                .FINexists(
                  this.identificationCode.identificationCodeString,
                  this.companyId
                )
                .then(code => {
                  if (code) {
                    this.DisabledFormFields = true;
                    this.DisabledFormFields1 = true;
                  } else {
                    this.DisabledFormFields = false;
                  }
                  //console.log(this.DisabledFormFields)
                });
            }
          }

          if (this.codeType == 2) {
            if (this.identificationCode.id != null || this.identificationCode.id != '') {
              this.patientIdentificationCodeService
                .MRNexists(
                  this.identificationCode.identificationCodeString,
                  this.companyId
                )
                .then(code => {
                  if (code) {
                    this.DisabledFormFields = true;
                    this.DisabledFormFields1 = true;
                  } else {
                    this.DisabledFormFields = false;
                  }
                });
            }
          }

          this.identificationCodeCopy =
            PatientIdentificationCode.createFromResponse(code);
          return;
        }

        this.patientIdentificationNumericCodeService
          .get(codeSearchFilter)
          .then(numericCode => {
            this.identificationCode = PatientIdentificationCode.createDefault(
              this.codeType,
              this.companyId
            );

            this.identificationCodeCopy = PatientIdentificationCode.createDefault(
              this.codeType,
              this.companyId
            );

            if (!numericCode) return;

            this.identificationCode.numericCode = numericCode;
            this.identificationCodeCopy.numericCode = numericCode;
          });
        setTimeout(() => {
          this.patientIdentificationCodeService
            .LatterCheckedOrNot(this.companyId)
            .then(code => {
              if (code) {
                this.companyService.getById(this.companyId).then(company => {
                  this.identificationCode = PatientIdentificationCode.createDefault(
                    this.codeType,
                    this.companyId
                  );

                  this.identificationCodeCopy = PatientIdentificationCode.createDefault(
                    this.codeType,
                    this.companyId
                  );
                  this.company = company;
                  this.identificationCodeCopy.letterCode = this.company.letterCode;
                  this.DisabledFormFields1 = true;
                });
              }
            });
        }, 1000);
      });
    });
  }

  saveIdentificationCode() {
    const validationResult = this.identificationCodeForm.instance.validate();

    if (!validationResult.isValid) return;

    if (this.isIdentificationCodeCreated) {
      const previousCode = this.identificationCode?.identificationCodeString;

      const newCode = this.identificationCodeCopy?.identificationCodeString;

      if (previousCode !== newCode) {
        this.alertService
          .confirm(
            'You are going to update patient identification code. This changes might break another app parts where the previous code was used.',
            'Confirmation'
          )
          .then(result => {
            if (result) {
              this.saveIdentificationCodeInternally(1);
            }
          });

        return;
      }
    }

    this.saveIdentificationCodeInternally(0);
  }

  get isIdentificationCodeCreated(): boolean {
    return !!this.identificationCode?.id;
  }

  get identificationCodeString(): string {
    const codeName =
      this.identificationCodeCopy?.type === PatientIdentificationCodeType.Mrn
        ? PatientsModuleConstants.identification.mrnCodeName
        : PatientsModuleConstants.identification.finCodeName;

    return `${codeName}: ${this.identificationCodeCopy?.identificationCodeString}`;
  }

  private saveIdentificationCodeInternally(i: number) {
    if (!this.identificationCodeCopy) return;

    const patientIdentificationCodeApiModel =
      this.identificationCodeCopy.convertToApiModel();

    if (i == 0) {
      patientIdentificationCodeApiModel.id = '00000000-0000-0000-0000-000000000000';
      patientIdentificationCodeApiModel.patientId =
        '00000000-0000-0000-0000-000000000000';
      patientIdentificationCodeApiModel.companyId = this.companyId;
    }

    this.patientIdentificationCodeService
      .save(patientIdentificationCodeApiModel)
      .then(createUpdateResponse => {
        if (createUpdateResponse.errors) {
          this.alertService.alert(
            'Errors happened',
            createUpdateResponse.errors.join(', ')
          );
          return;
        }

        this.identificationCode = PatientIdentificationCode.createFromResponse(
          createUpdateResponse.value
        );

        this.identificationCodeCopy = PatientIdentificationCode.createFromResponse(
          createUpdateResponse.value
        );

        this.alertService.info('Identification code was successfully saved');
        this.ngOnInit();
      });
  }
}
