import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { ChiefComplaintKeyword } from '../_models/chiefComplaintKeyword';
import { ChiefComplaintKeywordInfo } from '../_models/chiefComplaintKeywordInfo';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChiefComplaintKeywordService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getByValue(value: string): Promise<ChiefComplaintKeyword> {
    return firstValueFrom(
      this.http.get<ChiefComplaintKeyword>(
        `${this.config.apiUrl}chiefcomplaintkeyword/${value}`
      )
    );
  }

  createIcdCodeMap(keywordValue: string, icdCodeId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}chiefcomplaintkeyword/icdcode/mapping`, {
        keywordValue: keywordValue,
        icdCodeId: icdCodeId,
      })
    );
  }

  addKeywords(chiefComplaintId: string, keywords: any[]): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}chiefcomplaint/keywords`, {
        keywords: keywords,
        chiefComplaintId: chiefComplaintId,
      })
    );
  }

  getByIcdCode(icdCodeId: string): Promise<ChiefComplaintKeyword[]> {
    return firstValueFrom(
      this.http.get<ChiefComplaintKeyword[]>(
        `${this.config.apiUrl}chiefcomplaintkeyword/icdcode/${icdCodeId}`
      )
    );
  }

  getByKeywords(
    keywords: string[],
    companyId: string
  ): Promise<ChiefComplaintKeywordInfo[]> {
    if (!keywords.length) return Promise.resolve([]);

    let url = `${this.config.apiUrl}chiefcomplaintkeyword/company/${companyId}/keywords?keywords=${keywords[0]}`;
    if (keywords.length > 1) {
      for (let i = 1; i < keywords.length; i++) {
        const keyword = keywords[i];
        url += `&keywords=${keyword}`;
      }
    }

    return firstValueFrom(this.http.get<ChiefComplaintKeywordInfo[]>(url));
  }

  deleteIcdCodeMap(keywordId: string, icdCodeId: string) {
    return firstValueFrom(
      this.http.delete<ChiefComplaintKeyword[]>(
        `${this.config.apiUrl}chiefcomplaintkeyword/${keywordId}/icdcode/${icdCodeId}`
      )
    );
  }
}
