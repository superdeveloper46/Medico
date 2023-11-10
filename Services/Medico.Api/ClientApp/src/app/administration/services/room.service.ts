import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'src/app/_services/config.service';
import { Room } from '../models/room';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoomService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  getByLocationId(locationId: string): Promise<Room[]> {
    return firstValueFrom(
      this.http.get<Room[]>(`${this.config.apiUrl}room/location/${locationId}`)
    );
  }

  save(room: Room): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.config.apiUrl}room/`, room));
  }

  getById(id: string): Promise<Room> {
    return firstValueFrom(this.http.get<Room>(`${this.config.apiUrl}room/${id}`));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.config.apiUrl}room/${id}`));
  }
}
