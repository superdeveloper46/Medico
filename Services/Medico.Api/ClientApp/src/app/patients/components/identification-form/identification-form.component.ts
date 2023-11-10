import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PatientIdentificationCode } from '../../models/patientIdentificationCode';
import { PatientIdentificationCodeType } from '../../models/enums/patientIdentificationCodeType';
import { PatientsModuleConstants } from '../../constants/patientsModuleConstants';
import { PatientIdentificationNumericCodeService } from '../../services/patient-identification-numeric-code.service';
import { PatientIdentificationCodeService } from '../../services/patient-identification-code.service';
import { PatientIdentificationCodeSearchFilter } from '../../models/PatientIdentificationCodeSearchFilter';
import { AlertService } from 'src/app/_services/alert.service';
import { DxFormComponent } from 'devextreme-angular/ui/form';

@Component({
  selector: 'identification-form',
  templateUrl: './identification-form.component.html',
})
export class IdentificationFormComponent implements OnInit {
  @ViewChild('identificationCodeForm', { static: false })
  identificationCodeForm!: DxFormComponent;

  @Input() patientId?: string;
  @Input() codeType!: PatientIdentificationCodeType;

  identificationCode?: PatientIdentificationCode;
  identificationCodeCopy?: PatientIdentificationCode;
  identificationCodeTypes?: PatientIdentificationCodeType;

  patientsModuleConstants = PatientsModuleConstants;

  constructor(
    private patientIdentificationNumericCodeService: PatientIdentificationNumericCodeService,
    private patientIdentificationCodeService: PatientIdentificationCodeService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.identificationCode = PatientIdentificationCode.createDefault(
      this.codeType,
      this.patientId
    );

    this.identificationCodeCopy = PatientIdentificationCode.createDefault(
      this.codeType,
      this.patientId
    );

    const codeSearchFilter = new PatientIdentificationCodeSearchFilter();
    codeSearchFilter.patientId = this.patientId;
    codeSearchFilter.identificationCodeType = this.codeType;

    this.patientIdentificationCodeService.get(codeSearchFilter).then(code => {
      if (code) {
        this.identificationCode = PatientIdentificationCode.createFromResponse(code);

        this.identificationCodeCopy = PatientIdentificationCode.createFromResponse(code);

        return;
      }

      this.patientIdentificationNumericCodeService
        .get(codeSearchFilter)
        .then(numericCode => {
          this.identificationCode = PatientIdentificationCode.createDefault(
            this.codeType,
            this.patientId
          );

          this.identificationCodeCopy = PatientIdentificationCode.createDefault(
            this.codeType,
            this.patientId
          );

          if (!numericCode) return;

          this.identificationCode.numericCode = numericCode;
          this.identificationCodeCopy.numericCode = numericCode;
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
              this.saveIdentificationCodeInternally();
            }
          });

        return;
      }
    }

    this.saveIdentificationCodeInternally();
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

  private saveIdentificationCodeInternally() {
    const patientIdentificationCodeApiModel =
      this.identificationCodeCopy?.convertToApiModel();

    if (!patientIdentificationCodeApiModel) return;

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
      });
  }
}
