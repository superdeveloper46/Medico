import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable()
export class EnvironmentUrlService {
  public urlAddress: string = environment.apiUrl;

  constructor() {}
}
