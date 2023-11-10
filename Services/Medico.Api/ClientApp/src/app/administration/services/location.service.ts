import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { Location } from '../models/location';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LocationService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  save(location: Location): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.config.apiUrl}location/`, location)
    );
  }

  getById(id: string): Promise<Location> {
    return firstValueFrom(this.http.get<Location>(`${this.config.apiUrl}location/${id}`));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.config.apiUrl}location/${id}`));
  }
}
