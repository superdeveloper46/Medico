import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpInterceptorService implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('authToken');
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // if(request.url.includes("defaultvalue"))
    //   console.log(`${request.method}: ${request.url}`);

    // if(request.url != "http://localhost:5000/api/notification/header-notifications" &&
    // request.url != "http://localhost:5000/api/notification/getNotificationCount")
    // {
    //   console.log(`\t${request.method}: ${request.url}`);
    //   // console.log(token);
    //   if(request.method == "POST") {
    //     // console.log("request.headers:");
    //     // console.log(request.headers);
    //     // console.log("request.params:");
    //     // console.log(request.params);
    //     // console.log("request.body:");
    //     // console.log(request.body);

    //   }
    //   // if (request.url.includes("tobaccohistory")) {
    //   //   console.log("it happened!!!");
    //   // }
    // }

    return next.handle(request);
  }
}
