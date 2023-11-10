import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { ISearchableByName } from '../_interfaces/iSearchableByName';
import { ChiefComplaint } from 'src/app/_models/chiefComplaint';
import { Template } from '../_models/template';
import { ChiefComplaintKeyword } from '../_models/chiefComplaintKeyword';
import { ChiefComplaintWithKeywords } from 'src/app/_models/chiefComplaintWithKeywords';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChiefComplaintService implements ISearchableByName {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getWithKeywords(companyId: string) {
    return firstValueFrom(
      this.http.get<ChiefComplaintWithKeywords[]>(
        `${this.config.apiUrl}chiefcomplaint/keywords/company/${companyId}`
      )
    );
  }

  getByName(name: string, companyId: string): Promise<ChiefComplaint> {
    return firstValueFrom(
      this.http.get<ChiefComplaint>(
        `${this.config.apiUrl}chiefcomplaint/name/${name}/company/${companyId}`
      )
    );
  }

  getById(id: string): Promise<ChiefComplaint> {
    return firstValueFrom(
      this.http.get<ChiefComplaint>(`${this.config.apiUrl}chiefcomplaint/${id}`)
    );
  }

  save(chiefComplaint: ChiefComplaint): Promise<ChiefComplaint> {
    return firstValueFrom(
      this.http.post<ChiefComplaint>(
        `${this.config.apiUrl}chiefcomplaint/`,
        chiefComplaint
      )
    );
  }

  getChiefComplaintTemplatesByType(
    chiefComplaintId: string,
    templateTypeId: string
  ): Promise<Template[]> {
    return firstValueFrom(
      this.http.get<Template[]>(
        `${this.config.apiUrl}chiefcomplaint/${chiefComplaintId}/templatetype/${templateTypeId}`
      )
    );
  }

  getChiefComplaintKeywords(chiefComplaintId: string): Promise<ChiefComplaintKeyword[]> {
    return firstValueFrom(
      this.http.get<ChiefComplaintKeyword[]>(
        `${this.config.apiUrl}chiefcomplaint/${chiefComplaintId}/keyword`
      )
    );
  }

  saveChiefComplaintTemplates(
    chiefComplaintId: string,
    templateIds: string[]
  ): Promise<any> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.config.apiUrl}chiefcomplaint/${chiefComplaintId}/template`,
        templateIds
      )
    );
  }

  saveChiefComplaintKeywords(chiefComplaintId: string, keywords: string[]): Promise<any> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.config.apiUrl}chiefcomplaint/${chiefComplaintId}/keyword`,
        keywords
      )
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}chiefcomplaint/${id}`)
    );
  }
}
