import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceUnavailableTrackService {
  private _serviceUnavailableTrackSource = new Subject<void>();

  serviceUnavailableErrorHappened = this._serviceUnavailableTrackSource.asObservable();

  emitServiceUnavailableError() {
    this._serviceUnavailableTrackSource.next();
  }
}
