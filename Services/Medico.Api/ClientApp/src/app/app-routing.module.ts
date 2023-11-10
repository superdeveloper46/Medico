import { PhysicianViewerComponent } from './parser/physician-viewer/physician-viewer.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RootLoginComponent } from './registration/components/root-login/root-login.component';
import { AppointmentSchedulerComponent } from './scheduler/components/appointment-scheduler/appointment-scheduler.component';
import { AuthGuard } from './_guards/auth.guard';
import { RouteRoles } from './_models/role';
import { AdminComponent } from './administration/components/admin/admin.component';
import { PatientsManagementComponent } from './patients/components/patients-management.component';
import { PatientChartComponent } from './patientChart/components/patient-chart/patient-chart.component';
import { CompaniesManagementComponent } from './companiesManagement/components/companies-management/companies-management.component';
import { AppRouteNames } from './_classes/appRouteNames';
import { ContentManagementComponent } from './content-library/components/content-management.component';
import { CanDeactivatePatientChartService } from './patientChart/services/can-deactivate-patient-chart.service';
import { DocListComponent } from './parser/doc-list/doc-list.component';
import { LabOrderHistoryComponent } from './labOrders/lab-order-history/lab-order-history.component';
import { ConfirmEmailComponent } from './registration/confirm-email/confirm-email.component';
import { ResetPasswordComponent } from './registration/reset-password/reset-password.component';
import { ChangePasswordComponent } from './registration/changepassword/changepassword.component';
import { ForgotPasswordComponent } from './registration/forgot-password/forgot-password.component';
import { NotificationComponent } from './notification/notification.component';
import { AuditLogComponent } from './administration/components/audit-log/audit-log.component';
import { PreAuthManagementComponent } from './administration/components/pre-auth-management/pre-auth-management.component';
import { ReminderComponent } from './notification/reminder/reminder.component';
import { LookUpZipCodeComponent } from './lookUpZipCode/components/look-up-zip-code/look-up-zip-code.component';

const routes: Routes = [
  {
    path: AppRouteNames.login,
    component: RootLoginComponent,
  },
  {
    path: AppRouteNames.appointments,
    component: AppointmentSchedulerComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: '',
    redirectTo: '/appointments',
    // canActivate: [AuthGuard],
    data: { roles: RouteRoles.patientsManagement },
    pathMatch: 'full',
  },
  {
    path: AppRouteNames.parser,
    component: DocListComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: 'physician-viewer',
    component: PhysicianViewerComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: 'lab-orders',
    component: LabOrderHistoryComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: 'notifications',
    component: NotificationComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: 'reminders',
    component: ReminderComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: 'notifications/:id',
    component: NotificationComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  // {
  //     path: AppRouteNames.videoChat,
  //     component: VideoRTCComponent,
  //     canActivate: [AuthGuard],
  //     data: { roles: RouteRoles.appointments }
  // },
  {
    path: AppRouteNames.administration,
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.administration },
  },
  {
    path: AppRouteNames.reports,
    loadChildren: () => import('./reports/report.module').then(m => m.ReportModule),
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.companiesManagement },
  },
  {
    path: AppRouteNames.companiesManagement,
    component: CompaniesManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.companiesManagement },
  },
  {
    path: AppRouteNames.lookUpZipCode,
    component: LookUpZipCodeComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.lookUpZipCode },
  },
  {
    path: AppRouteNames.preAuthManagement,
    component: PreAuthManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.patientChart },
  },
  {
    path: AppRouteNames.library,
    component: ContentManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.libraryManagement },
  },
  {
    path: AppRouteNames.patientsManagement,
    component: PatientsManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.patientsManagement },
  },
  {
    path: AppRouteNames.library,
    component: ContentManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.libraryManagement },
  },
  {
    path: `${AppRouteNames.patientChart}/:appointmentId`,
    component: PatientChartComponent,
    canActivate: [AuthGuard],
    canDeactivate: [CanDeactivatePatientChartService],
    data: { roles: RouteRoles.patientChart },
  },
  {
    path: AppRouteNames.errorLogs,
    loadChildren: () =>
      import('./error-logs/error-logs.module').then(m => m.ErrorLogsModule),
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.companiesManagement },
  },
  {
    path: AppRouteNames.physicianViewer,
    component: PhysicianViewerComponent,
    canActivate: [AuthGuard],
    data: { roles: RouteRoles.appointments },
  },
  {
    path: AppRouteNames.confirmEmail,
    component: ConfirmEmailComponent,
  },
  {
    path: AppRouteNames.resetPassword,
    component: ResetPasswordComponent,
  },
  {
    path: AppRouteNames.changePassword,
    component: ChangePasswordComponent,
  },
  {
    path: AppRouteNames.forgotPassword,
    component: ForgotPasswordComponent,
  },
  {
    path: 'audit-trail/:dataModel/:id/:identifier',
    component: AuditLogComponent,
  },
  { path: '**', redirectTo: 'appointments', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
