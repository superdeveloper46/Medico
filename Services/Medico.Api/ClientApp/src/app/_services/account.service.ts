import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { ValidationResult } from '../_models/validationResult';
import { ValidationResultModel } from '../_models/validation-result-model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  // resetPassword(email: string, password: string): Promise<boolean> {
  //     return firstValueFrom(this.http.post<any>(`${this.config.apiUrl}account/password/resetresult`, { email, password })
  //         );
  // }
  resetPassword(userId: string, password: string, code = ''): Promise<boolean> {
    return firstValueFrom(
      this.http.post<any>(`${this.config.apiUrl}account/password/resetbyuserid`, {
        userId,
        code,
        password,
      })
    );
  }

  checkPassword(email: string, password: string): Promise<boolean> {
    return firstValueFrom(
      this.http.post<any>(`${this.config.apiUrl}account/password`, { email, password })
    );
  }

  checkPasswordComplexity(userPassword: string): Promise<ValidationResult> {
    return firstValueFrom(
      this.http.get<ValidationResult>(
        `${this.config.apiUrl}account/password/${userPassword}`
      )
    );
  }

  checkEmailExistance(userEmail: string, companyId: string): Promise<ValidationResult> {
    return firstValueFrom(
      this.http.get<ValidationResult>(
        `${this.config.apiUrl}account/email/${userEmail}/company/${companyId}`
      )
    );
  }

  forgotPassword(email: string): Promise<ValidationResultModel> {
    return firstValueFrom(
      this.http.get<ValidationResultModel>(
        `${this.config.apiUrl}account/forgot-password/email/${email}`
      )
    );
  }
  sendPassword(id: string): Promise<ValidationResult> {
    return firstValueFrom(
      this.http.get<ValidationResult>(
        `${this.config.apiUrl}account/patientGenerateNewPassword/${id}`
      )
    );
  }
}
