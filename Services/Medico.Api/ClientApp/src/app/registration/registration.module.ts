import { NgModule } from '@angular/core';
import { RootLoginComponent } from './components/root-login/root-login.component';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ConfirmEmailComponent } from './confirm-email/confirm-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangePasswordComponent } from './changepassword/changepassword.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import {AccountService} from "../_services/account.service";
import {AlertService} from "../_services/alert.service";

@NgModule({
  imports: [DxFormModule, DxButtonModule, CommonModule, RouterModule],
  declarations: [
    RootLoginComponent,
    LoginComponent,
    ConfirmEmailComponent,
    ResetPasswordComponent,
    ChangePasswordComponent,
    ForgotPasswordComponent,
  ],
  providers: [
    AccountService,
    AlertService,
    Router,
  ],
})
export class RegistrationModule {}
