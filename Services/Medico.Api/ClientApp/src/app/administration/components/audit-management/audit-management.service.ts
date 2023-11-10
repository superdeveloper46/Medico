import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from 'src/app/_services/config.service';
import { ChartColor } from 'src/app/patientChart/models/chartColor';

@Injectable()
export class AuditManagementService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  /**
   * GET api call that returns saved audit chart colors
   * @returns {ChartColor} saved chart colors
   */
  getColors(): Promise<ChartColor> {
    return firstValueFrom(
      this.http.get<ChartColor>(`${this.config.apiUrl}chart-colors/getColors`)
    );
  }

  /**
   * POST api call to modify saved audit chart colors
   * @param {ChartColor} newColors - the modified ChartColor data structure
   * @returns {boolean} declares if modified colors were successfully set
   */
  setColors(newColors: ChartColor): Promise<boolean> {
    return firstValueFrom(
      this.http.post<any>(`${this.config.apiUrl}chart-colors/updateColors`, newColors)
    );
  }

  /**
   * POST api call to reset audit chart colors to default
   * @returns {ChartColor} default chart colors
   */
  setDefaultColors(): Promise<ChartColor> {
    console.log('setting default colors...');
    return firstValueFrom(
      this.http.post<ChartColor>(`${this.config.apiUrl}chart-colors/setDefault`, {})
    );
  }
}
