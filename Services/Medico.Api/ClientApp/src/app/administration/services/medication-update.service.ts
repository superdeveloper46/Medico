import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MedicationUpdateService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  downloadMedicationsExcelFile(fileName: string) {
    return firstValueFrom(
      this.http.get(
        `${this.config.apiUrl}medications-scheduled-item/download/medications/${fileName}`,
        { responseType: 'blob' }
      )
    );
  }

  scheduleMedicationsUpdate(medicationsExcelFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', medicationsExcelFile);

    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}medications-scheduled-item/`, formData)
    );
  }

  uploadFile(medicationsPdfFile: File, parserId: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', medicationsPdfFile);
    formData.append('remote_id', '1');

    console.dir(formData);

    // return firstValueFrom(this.http.post<void>(`https://api.docparser.com/v1/document/upload/shpyzlcbdywi`, formData, this.generateHeaders1())
    //   );
    // okjfiogvcpwz
    return firstValueFrom(
      this.http.post<void>(
        `https://api.docparser.com/v1/document/upload/${parserId}?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89`,
        formData,
        this.generateHeaders1()
      )
    );
  }

  fetchDoc(documentId: string) {
    // return firstValueFrom(this.http.get(`https://api.docparser.com/v1/results/shpyzlcbdywi/${documentId}`, this.generateHeaders1())
    //   );

    return firstValueFrom(
      this.http.get(
        `https://api.docparser.com/v1/results/okjfiogvcpwz/${documentId}?api_key=345cbe872d85bfba629f58fe9d2f9c43b565ae89`,
        this.generateHeaders1()
      )
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
}
