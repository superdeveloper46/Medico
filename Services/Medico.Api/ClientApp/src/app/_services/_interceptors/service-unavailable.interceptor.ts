import { Observable, throwError } from 'rxjs';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { ServiceUnavailableTrackService } from '../service-unavailable-track.service';
import { AlertService } from '../alert.service';

@Injectable()
export class ServiceUnavailableInterceptor implements HttpInterceptor {
  private isExceptionHandled = false;

  constructor(
    private serviceUnavailableTrackService: ServiceUnavailableTrackService,
    private alertService: AlertService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.serviceUnavailableTrackService.emitServiceUnavailableError();
        return throwError(() => error);
      })
    );
  }
}
