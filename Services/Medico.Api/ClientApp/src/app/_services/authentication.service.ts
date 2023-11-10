import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../_models/user';
import { ConfigService } from './config.service';
import { ApplicationUser } from '../_models/applicationUser';
import { ValidationResultModel } from '../_models/validation-result-model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private userLocalStorageName = 'Medico.CurrentUser';

  private currentUserSubject: BehaviorSubject<Nullable<ApplicationUser>>;

  currentUser: Observable<Nullable<ApplicationUser>>;

  constructor(private http: HttpClient, private config: ConfigService) {
    const localStorageUser = JSON.parse(
      localStorage.getItem(this.userLocalStorageName) ?? 'null'
    );

    const user = localStorageUser ? localStorageUser : new User();
    const applicationUser = new ApplicationUser(user);

    this.currentUserSubject = new BehaviorSubject<Nullable<ApplicationUser>>(
      applicationUser
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  get currentUserValue(): Nullable<ApplicationUser> {
    return this.currentUserSubject.value;
  }

  async login(loginModel: any): Promise<User> {
    const user = await firstValueFrom(
      this.http.post<any>(`${this.config.apiUrl}account/login`, loginModel)
    );
    if (user && user.isAuthenticated) {
      localStorage.setItem(this.userLocalStorageName, JSON.stringify(user));
      this.setUserDetails();
      const applicationUser = new ApplicationUser(user);
      this.currentUserSubject.next(applicationUser);
    }
    return user ? user : new User();
  }

  setUserDetails() {
    if (localStorage.getItem(this.userLocalStorageName)) {
      const _userDetails = new User();
      const _decodeUserDetails = JSON.parse(
        localStorage.getItem(this.userLocalStorageName) ?? 'null'
      );
      // console.log(window.atob(decodeUserDetails.token.split('.')[1]));
      //   userDetails.userName = decodeUserDetails.sub;
      //   userDetails.firstName = decodeUserDetails.firstName;
      //   userDetails.isLoggedIn = true;
      //   userDetails.role = decodeUserDetails.role;

      //   this.userData.next(userDetails);
    }
  }

  confirmEmail(userId: string, code: string): Promise<ValidationResultModel> {
    return firstValueFrom(
      this.http.get<ValidationResultModel>(
        `${this.config.apiUrl}account/confirm-email?userId=${userId}&code=${code}`
      )
    );
  }

  logout(): Promise<any> {
    localStorage.removeItem(this.userLocalStorageName);
    this.currentUserSubject.next(null);

    return firstValueFrom(this.http.post(`${this.config.apiUrl}account/logout`, {}));
  }

  clearPreviouslySavedUser() {
    localStorage.removeItem(this.userLocalStorageName);
  }
}
