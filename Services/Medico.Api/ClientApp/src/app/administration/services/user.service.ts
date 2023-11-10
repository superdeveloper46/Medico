import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { MedicoApplicationUser } from '../models/medicoApplicationUser';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { EntityExistenceModel } from '../models/entityExistenceModel';
import { LookupModel } from 'src/app/_models/lookupModel';
import { PreAuthVM } from '../models/preAuthVM';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  savePreAuth(treeNode: PreAuthVM): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}preAuth/`, treeNode)
    );
  }
  getPreAuth(companyId: string): Promise<void> {
    return firstValueFrom(
      this.http.get<void>(`${this.config.apiUrl}preAuth/companyId/` + companyId)
    );
  }

  save(user: MedicoApplicationUser): Promise<void> {
    user.dateOfBirth = DateHelper.jsLocalDateToSqlServerUtc(user.dateOfBirth);

    return firstValueFrom(this.http.post<void>(`${this.config.apiUrl}user/`, user));
  }

  getById(id: string): Promise<MedicoApplicationUser> {
    return firstValueFrom(
      this.http.get<MedicoApplicationUser>(`${this.config.apiUrl}user/${id}`)
    ).then(user => {
      user.dateOfBirth = DateHelper.sqlServerUtcDateToLocalJsDate(user.dateOfBirth);
      return user;
    });
  }

  getByEmail(email: string): Promise<MedicoApplicationUser> {
    return firstValueFrom(
      this.http.get<MedicoApplicationUser>(
        `${this.config.apiUrl}user/medicoUser/${email}`
      )
    ).then(user => {
      user.dateOfBirth = DateHelper.sqlServerUtcDateToLocalJsDate(user.dateOfBirth);
      return user;
    });
  }

  getUserExistence(email: string): Promise<EntityExistenceModel> {
    return firstValueFrom(
      this.http.get<EntityExistenceModel>(`${this.config.apiUrl}user/email/${email}`)
    );
  }

  getUserCompanies(email: string): Promise<LookupModel[]> {
    return firstValueFrom(
      this.http.get<LookupModel[]>(`${this.config.apiUrl}user/companies/email/${email}`)
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.config.apiUrl}user/${id}`));
  }
}
