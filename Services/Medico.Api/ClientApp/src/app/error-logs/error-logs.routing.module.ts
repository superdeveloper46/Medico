import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ErrorLogListComponent } from './components/error-log-list/error-log-list.component';

const routes: Routes = [{ path: '', component: ErrorLogListComponent }];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class ErrorLogsRoutingModule {}
