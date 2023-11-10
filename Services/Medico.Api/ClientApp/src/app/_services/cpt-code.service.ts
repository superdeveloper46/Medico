import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { CptCode } from '../_models/cptCode';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CptCodeService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getById(id: string): Promise<CptCode> {
    return firstValueFrom(this.http.get<CptCode>(`${this.config.apiUrl}cptcode/${id}`));
  }
}
