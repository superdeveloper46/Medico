import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PhraseUsage } from '../models/phraseUsage';
import { ConfigService } from 'src/app/_services/config.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PhraseUsageService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  save(phraseUsage: PhraseUsage): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}phrase-usage/`, phraseUsage)
    );
  }
}
