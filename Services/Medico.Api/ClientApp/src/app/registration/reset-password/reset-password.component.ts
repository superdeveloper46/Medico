import { Component, Input, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DxFormComponent } from 'devextreme-angular';
import { AppRouteNames } from 'src/app/_classes/appRouteNames';
import { ResetPassword } from 'src/app/_models/resetPasswordModel';
import { AccountService } from 'src/app/_services/account.service';
import { AlertService } from 'src/app/_services/alert.service';

@Component({
  selector: 'reset-password',
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  @Input() email!: string;
  @ViewChild('resetPasswordForm', { static: false })
  resetPasswordForm!: DxFormComponent;

  resetPasswordModel: ResetPassword = {
    newPassword: undefined,
  };

  passwordFormatValidationMessage =
    "Passwords must be at least 6 characters. Password must have at least one non alphanumeric character. Passwords must have at least one digit ('0'-'9'). Passwords must have at least one upper and lowercase characters";

  constructor(
    private router: Router,
    private alertService: AlertService,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute
  ) {}

  validatePasswordComplexity(params: any) {
    const password = params.value;
    this.accountService.checkPasswordComplexity(password).then(validationResult => {
      const isValidationSucceeded = validationResult.isValid;

      params.rule.isValid = isValidationSucceeded;

      params.validator.validate();
    });

    return false;
  }

  resetPasswordComparison() {
    return this.resetPasswordModel.newPassword;
  }

  resetPassword() {
    const validationResult = this.resetPasswordForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    const userId = this.activatedRoute.snapshot.queryParamMap.get('userId');
    const code = this.activatedRoute.snapshot.queryParamMap.get('code') || '';
    const password = this.resetPasswordModel.newPassword;

    if (!userId || password === undefined) return;
    this.accountService
      .resetPassword(userId, password, code)
      .then(result => {
        if (result) {
          this.resetPasswordModel = {
            newPassword: undefined,
          };

          this.alertService.info('Password was reset successfully');
          this.router.navigate([AppRouteNames.login]);
        } else {
          this.alertService.error('Unable to reset password. Try again later.');
        }
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  cancelResetPassword() {
    this.router.navigate([AppRouteNames.login]);
  }
}
