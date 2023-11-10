import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppRouteNames } from 'src/app/_classes/appRouteNames';
import { AccountService } from 'src/app/_services/account.service';
import { AlertService } from 'src/app/_services/alert.service';
import {UserService} from "../../administration/services/user.service";
import {DxFormComponent} from "devextreme-angular/ui/form";

@Component({
  selector: 'forgot-password',
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild('emailForm', { static: false })
  emailForm!: DxFormComponent;

  emailModel: any = { email: '' };

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private accountService: AccountService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    const { userId, code } = this.activatedRoute.snapshot.queryParams;
    if (userId && code) {
      this.router.navigate([AppRouteNames.resetPassword], {
        queryParams: { userId: userId, code: code },
      });
    }
  }

  btnForgotPassword() {
    const email = this.emailModel.email;
    const isEmailValid = this.emailForm.instance.validate().isValid;
    if (!isEmailValid) return;
    this.accountService
      .forgotPassword(email)
      .then(validationResult => {
        if (validationResult.isValid) {
          this.emailForm = email;
          this.alertService.info(
            `The instructions were sent. You will receive an email to ${email}, please also check your spam folder!`
          );
          this.router.navigate([AppRouteNames.login]);
        }
        else{
          this.userService
            .getUserExistence(email)
            .then(userExistenceModel => {
              if (userExistenceModel.isEntityExist) this.emailModel.email = email;
              else this.alertService.error(`Unable to find user with such email: ${email}`);
            })
            .catch(error => this.alertService.error(error.message ? error.message : error));
        }
        }
      )
      .catch(this.emailModel.email = null);


  }

  onBackToEmailForm(): void {
    this.router.navigate([AppRouteNames.login]);
  }
}
