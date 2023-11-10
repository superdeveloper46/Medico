import { firstValueFrom, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EnvironmentUrlService } from './environment-url.service';

@Injectable({ providedIn: 'root' })
export class RepositoryService {
  selectedSession = '';
  constructor(private http: HttpClient, private envUrl: EnvironmentUrlService) {}

  public getDataNoAuth(route: string): Observable<any> {
    return this.http.get(this.createCompleteRoute(route, this.envUrl.urlAddress));
  }

  public getData(route: string): Observable<any> {
    return this.http.get(
      this.createCompleteRoute(route, this.envUrl.urlAddress),
      this.generateHeaders()
    );
  }

  public donwloadFIle(route: string): Observable<any> {
    return this.http.get(this.createCompleteRoute(route, this.envUrl.urlAddress), {
      responseType: 'blob',
    });
  }

  public create(route: string, body: any): Observable<any> {
    return this.http.post(
      this.createCompleteRoute(route, this.envUrl.urlAddress),
      body,
      this.generateHeaders()
    );
  }

  public update(route: string, body: any): Observable<any> {
    return this.http.put(
      this.createCompleteRoute(route, this.envUrl.urlAddress),
      body,
      this.generateHeaders()
    );
  }

  public delete(route: string): Observable<any> {
    return this.http.delete(
      this.createCompleteRoute(route, this.envUrl.urlAddress),
      this.generateHeaders()
    );
  }

  private createCompleteRoute(route: string, envAddress: string) {
    return `${envAddress}${route}`;
  }

  uploadFile(medicationsPdfFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', medicationsPdfFile);
    formData.append('remote_id', '1');

    console.dir(formData);

    // return this.http.post<void>(`https://api.docparser.com/v1/document/upload/shpyzlcbdywi`, formData, this.generateHeaders1())
    //   .toPromise();

    return firstValueFrom(
      this.http.post<void>(
        `https://api.docparser.com/v1/document/upload/okjfiogvcpwz?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89`,
        formData,
        this.generateHeaders1()
      )
    );
  }

  fetchDoc(parserId: string, documentId: string): Promise<any> {
    return firstValueFrom(
      this.http.get(
        `https://api.docparser.com/v1/results/${parserId}/${documentId}?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89`,
        this.generateHeaders1()
      )
    );
  }

  // created copy
  fetchDocument(parserId: string, documentId: string): Observable<any> {
    return this.http.get(
      `https://api.docparser.com/v1/results/${parserId}/${documentId}?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89`,
      this.generateHeaders1()
    );
  }

  fetchAllDocs(parserId: string): Observable<any> {
    return this.http.get(
      `https://api.docparser.com/v1/results/${parserId}?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89`,
      this.generateHeaders1()
    );
  }

  fetchUploadedDoc(url: string, _remote_id: string): Promise<any> {
    return firstValueFrom(
      this.http.get(
        `https://api.docparser.com/v1/document/fetch/okjfiogvcpwz?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89&url=${url}`,
        this.generateHeaders1()
      )
    );
  }

  uploadDocument(route: string, formData: any): Observable<any> {
    return this.http.post<void>(
      this.createCompleteRoute(route, this.envUrl.urlAddress),
      formData,
      this.generateHeaders1()
    );
  }

  private generateHeaders1() {
    const token = 'Z2xlbm5AbWVkaWNvaW5mb3RlY2guY29tOltBenVyZU9jcjIwMjFd';
    return {
      headers: new HttpHeaders({
        Authorization: 'Basic ' + token,
      }),

      //Basic ZjEwM2QzNGQ4ZDA5MGI3ODgxODcyN2VjNzRhMjFjOWQxNTg4MzM5ZTo=
    };
  }

  private generateHeaders() {
    // logged in user
    const _estmusr = JSON.parse(localStorage.getItem('_estmusr') ?? 'null');

    let token = '';
    if (_estmusr) {
      token = _estmusr.token;
    }

    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, PUT, OPTIONS',
        Authorization: 'Bearer ' + token,
      }),
    };
  }
}
