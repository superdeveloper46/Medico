import { Injectable } from '@angular/core';
import { IcdCode } from '../_models/icdCode';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IcdCodeService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  checkMappingExistence(icdCodeId: string, keyword: string): Promise<boolean> {
    return firstValueFrom(
      this.http.get<boolean>(
        `${this.config.apiUrl}chiefcomplaintkeyword/icdcode/${icdCodeId}/keyword/${keyword}/existence`
      )
    );
  }

  getById(id: string): Promise<IcdCode> {
    return firstValueFrom(this.http.get<IcdCode>(`${this.config.apiUrl}icdcode/${id}`));
  }

  getMappedToKeword(keyword: string): Promise<IcdCode[]> {
    return firstValueFrom(
      this.http.get<IcdCode[]>(`${this.config.apiUrl}icdcode/keyword/${keyword}`)
    );
  }

  deleteIcdCodeMapping(keyword: string, icdCodeId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.config.apiUrl}chiefcomplaintkeyword/keyword/${keyword}/icdcode/${icdCodeId}`
      )
    );
  }
}
