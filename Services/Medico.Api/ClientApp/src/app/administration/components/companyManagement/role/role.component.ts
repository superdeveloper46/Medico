import { Component, ViewChild } from '@angular/core';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { AlertService } from 'src/app/_services/alert.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { DxFormComponent, DxPopupComponent } from 'devextreme-angular';
import { RepositoryService } from 'src/app/_services/repository.service';

@Component({
  selector: 'role',
  templateUrl: './role.component.html',
})
export class RoleComponent extends BaseAdminComponent {
  @ViewChild('rolePopup', { static: false })
  rolePopup!: DxPopupComponent;
  @ViewChild('roleForm', { static: false })
  roleForm!: DxFormComponent;

  isrolePopupOpened = false;
  roleDataSource: any = {};
  isNewRole: boolean = false;
  role = {};
  selectedRoles: any[] = [];

  constructor(
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    private repositoryService: RepositoryService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();

    this.init();
  }

  private init(): void {
    this.initRoleDataSource();
  }

  private initRoleDataSource(): void {
    this.roleDataSource = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('role'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, _jQueryAjaxSettings) => {},
        this
      ),
    });
  }

  openroleForm() {
    this.isrolePopupOpened = true;
  }

  onrolePopupHidden() {
    this.resetroleForm();
  }

  private resetroleForm() {
    this.isNewRole = true;
    this.role = {};
    this.selectedRoles = [];
  }

  createUpdaterole() {
    console.log(this.role);
    const apiUrl = `role`;
    this.repositoryService.create(apiUrl, this.role).subscribe({
      next: _data => {
        this.isrolePopupOpened = false;
        this.resetroleForm();
        this.init();
      },
      error: err => {
        console.log(err);
      },
    });
  }

  onRoleChanged($event: any) {
    const role = $event.selectedRowKeys[0];
    if (!role) return;

    const roleId = role.id;
    if (!roleId) return;

    const apiUrl = `role/${roleId}`;

    this.repositoryService.getData(apiUrl).subscribe({
      next: role => {
        this.role = role;
        this.isNewRole = false;
        this.isrolePopupOpened = true;
      },
      error: err => {
        console.log(err);
      },
    });
  }
}
