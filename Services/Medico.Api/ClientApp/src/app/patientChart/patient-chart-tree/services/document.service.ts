import { Injectable } from '@angular/core';
import { ConfigService } from 'src/app/_services/config.service';
import { HttpClient } from '@angular/common/http';
import { DateHelper } from 'src/app/_helpers/date.helper';
import { Document } from '../../models/document';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable()
export class DocumentService {
  public emitDocumentSave: Subject<Document> = new Subject<Document>;


  constructor(private http: HttpClient, private config: ConfigService) {}

  save(document: Document) {
    this.emitDocumentSave.next(document);

    document.createDate = DateHelper.jsLocalDateToSqlServerUtc(document.createDate);
    return this.http.post<void>(`${this.config.apiUrl}document`, document);
  }

  getById(documentId: any) {
    return firstValueFrom(
      this.http.get<Document>(`${this.config.apiUrl}document/${documentId}`)
    ).then(document => {
      if (document) {
        document.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          document.createDate
        );
      }

      return document;
    });
  }

  getByPatientId(patientId?: string): Promise<Document> {
    if (!patientId) return Promise.reject();

    return firstValueFrom(
      this.http.get<Document>(`${this.config.apiUrl}document/patient/${patientId}`)
    ).then(document => {
      if (document) {
        document.createDate = DateHelper.sqlServerUtcDateToLocalJsDate(
          document.createDate
        );
      }

      return document;
    });
  }

  uploadFile(appointmentId: string, patientId: string, formData: any) {
    return this.http.post(
      `${this.config.apiUrl}document/upload/${appointmentId}/${patientId}`,
      formData
    );
  }

  uploadTiffFile(appointmentId: string, patientId: string, formData: any) {
    return this.http.post(
      `${this.config.apiUrl}document/upload-tiff/${appointmentId}/${patientId}`,
      formData
    );
  }

  getImageData(filename: string) {
    return this.http.get(`${this.config.apiUrl}document/imagedata/${filename}`);
  }

  delete(documentId: string) {
    return firstValueFrom(
      this.http.delete<void>(`${this.config.apiUrl}document/${documentId}`)
    );
  }
}
