import { Component, Input } from '@angular/core';

@Component({
  selector: 'changepassword',
  templateUrl: './changepassword.component.html',
})
export class ChangePasswordComponent {
  @Input() email!: string;

  emailModel: any = { email: '' };

  onBackToEmailForm() {
    throw `onBackToEmailForm is not implemented`;
  }

  btnForgetPassword() {
    throw `btnForgetPassword is not implemented`;
  }
}
