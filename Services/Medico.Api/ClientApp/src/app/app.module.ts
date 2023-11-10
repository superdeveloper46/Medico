import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { CommonModule } from '@angular/common';
import { NgxMaskModule } from 'ngx-mask';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { RegistrationModule } from './registration/registration.module';
import { AppHeaderComponent } from './_components/app.header/app.header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppLoaderComponent } from './_components/app.loader/app.loader.component';
import { LoadingScreenInterceptor } from './_services/_interceptors/loading.interceptor';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AdministrationModule } from './administration/administration.module';
import { PatientsModule } from './patients/patients.module';
import { PatientChartModule } from './patientChart/patient-chart.module';
import { VideoChatModule } from './videoChat/video-chat.module';
import { CompanySwitcherComponent } from './_components/app.header/company-switcher/company-switcher.component';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { CompaniesManagementModule } from './companiesManagement/companies-management.module';
import { AuthCookieInterceptor } from './_services/_interceptors/auth-cookie.interceptor';
import { NotAuthorizedInterceptor } from './_services/_interceptors/not-authorized.interceptor';
import { ContentLibraryModule } from './content-library/content-library.module';
import { ServiceUnavailableInterceptor } from './_services/_interceptors/service-unavailable.interceptor';
import { RepositoryService } from './_services/repository.service';
import { EnvironmentUrlService } from './_services/environment-url.service';
import { ErrorHandlerService } from './_services/error-handler.service';
import { ParserModule } from './parser/parser.module';
import { LabOrderModule } from './labOrders/lab-order-history/lab-order.module';
import { NotificationModule } from './notification/notification.module';
import { HttpInterceptorService } from './_services/_interceptors/http-interceptor.service';
import { DxCheckBoxModule, DxToastModule } from 'devextreme-angular';
import { LookUpZipCodeModule } from './lookUpZipCode/lookUp-zipCode.module';
import { EditStatusService } from './patientChart/services/edit-status.service';
import { AuditManagementService } from './administration/components/audit-management/audit-management.service';
import { AppointmentStatusColorManagementService } from './administration/components/appointment-status-color-management/appointment-status-color-management.service';
// import { IdentificationFormComponent } from './lookUpZipCode/components/identification-form/identification-form.component';

@NgModule({
  declarations: [
    AppComponent,
    AppHeaderComponent,
    AppLoaderComponent,
    CompanySwitcherComponent,
    // IdentificationFormComponent
  ],
  imports: [
    CommonModule,
    DxDataGridModule,
    DxPopupModule,
    DxScrollViewModule,
    DxFormModule,
    NgxMaskModule,
    NgxSpinnerModule,
    SchedulerModule,
    RegistrationModule,
    AdministrationModule,
    PatientsModule,
    ParserModule,
    LabOrderModule,
    NotificationModule,
    PatientChartModule,
    VideoChatModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    DxSelectBoxModule,
    CompaniesManagementModule,
    LookUpZipCodeModule,
    ContentLibraryModule,
    DxCheckBoxModule,
    DxToastModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ServiceUnavailableInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NotAuthorizedInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingScreenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthCookieInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
    RepositoryService,
    EnvironmentUrlService,
    ErrorHandlerService,
    EditStatusService,
    AuditManagementService,
    AppointmentStatusColorManagementService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
