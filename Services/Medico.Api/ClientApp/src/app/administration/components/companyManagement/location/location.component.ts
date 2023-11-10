import { Component, AfterViewInit, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Company } from 'src/app/_models/company';
import { CompanyService } from 'src/app/_services/company.service';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { Location } from 'src/app/administration/models/location';
import { LocationService } from 'src/app/administration/services/location.service';
import { AlertService } from 'src/app/_services/alert.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { RoomService } from 'src/app/administration/services/room.service';
import { AppointmentService } from 'src/app/_services/appointment.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { Subscription } from 'rxjs';
import { ZipCodeType } from 'src/app/patients/models/zipCodeType';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';

@Component({
  selector: 'location',
  templateUrl: './location.component.html',
})
export class LocationComponent
  extends BaseAdminComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  @ViewChild('locationForm', { static: false })
  locationForm!: DxFormComponent;
  @ViewChild('locationDataGrid', { static: false })
  locationDataGrid!: DxDataGridComponent;
  @ViewChild('locationPopup', { static: false })
  locationPopup!: DxPopupComponent;
  @ViewChild('companyForm', { static: false })
  companyForm!: DxFormComponent;
  //@ViewChild("extraFieldsTab") extraFieldsTab: ExtraFieldsTabComponent;
  company: Company = new Company();
  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;

  locationDataSource: any = {};
  location: Location = new Location();

  selectedLocations: Array<any> = [];

  isLocationPopupOpened = false;

  isNewLocation = true;
  isLocationSet = false;

  constructor(
    private locationService: LocationService,
    private alertService: AlertService,
    private dxDataUrlService: DxDataUrlService,
    //private extraFieldsAppService: ExtraFieldsAppService,
    private appointmentService: AppointmentService,
    private roomService: RoomService,
    private companyIdService: CompanyIdService,
    private companyService: CompanyService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();

    this.init();
  }

  get zipMask(): string {
    switch (this.location.zipCodeType) {
      case ZipCodeType.FiveDigit:
        return this.validationMasks.fiveDigitZip;
      case ZipCodeType.NineDigit:
        return this.validationMasks.nineDigitZip;
    }
  }

  isFiveDigitCode(zipCodeType: ZipCodeType) {
    return zipCodeType === ZipCodeType.FiveDigit;
  }

  isNineDigitCode(zipCodeType: ZipCodeType) {
    return zipCodeType === ZipCodeType.NineDigit;
  }

  ngOnInit(): void {
    this.subscribeToCompanyIdChanges();

    this.companyService
      .getById(this.companyId)
      .then(company => {
        this.company = company;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  ngAfterViewInit() {
    this.registerEscapeBtnEventHandler(this.locationPopup);

    // this.extraFieldsAppService
    //     .addExtraColumnsToGridIfNeeded(TableNames.location, this.locationDataGrid);
  }

  ngOnDestroy(): void {
    this.companyIdSubscription?.unsubscribe();
  }

  updateCompany(): void {
    const isCompanyFormValid = this.companyForm.instance.validate().isValid;

    if (!isCompanyFormValid) return;

    this.company.id = this.companyId;
    this.companyService
      .save(this.company)
      .then(() => {
        this.alertService.info('Company was successfully updated');
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  getState(data: any) {
    const stateNumber = data.state;
    return this.states.filter(s => s.value === stateNumber)[0].name;
  }

  getAddress(data: any) {
    const address = data.address;
    const secondaryAddress = data.secondaryAddress;

    return secondaryAddress ? `${address}; ${secondaryAddress}` : address;
  }

  openLocationForm() {
    this.isLocationPopupOpened = true;
    this.isLocationSet = true;
  }

  onLocationPopupHidden() {
    this.resetCreateUpdateLocationForm();
  }

  createUpdateLocation() {
    const validationResult = this.locationForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (this.isNewLocation) {
      this.location.companyId = this.companyId;
    }
    this.locationService
      .save(this.location)
      // .then(() => {
      //     return this.extraFieldsTab
      //         .saveExtraFields();
      // })
      .then(() => {
        this.locationDataGrid.instance.refresh();

        this.resetCreateUpdateLocationForm();
        this.isLocationPopupOpened = false;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onLocationSelected($event: any) {
    const selectedLocation = $event.selectedRowsData[0];
    if (!selectedLocation) {
      return;
    }

    const selectedLocationId = $event.selectedRowsData[0].id;

    this.locationService
      .getById(selectedLocationId)
      .then(location => {
        this.location = location;
        this.isLocationSet = true;
        this.isNewLocation = false;
        this.isLocationPopupOpened = true;
      })
      .catch(error => {
        this.selectedLocations = [];
        this.alertService.error(error.message ? error.message : error);
      });
  }

  // onExtraFieldsTabCreated($event: any) {
  //     if ($event: any) {
  //         this.locationCreationForm.items[0]["tabs"].push($event);
  //         this.locationCreationForm.instance.repaint();
  //     }
  // }

  onLocationFieldChanged($event: any) {
    const dataField = $event.dataField;
    if (!this.isNewLocation && dataField === 'isActive' && !$event.value) {
      const locationId = this.location.id;
      if (!locationId) return;

      this.canDeactivateDeleteLocation(locationId, false).then(canDeactivate => {
        if (!canDeactivate) {
          this.location.isActive = true;
          this.alertService.warning(
            'Location already is used. You cannot deactivate it.'
          );
        }
      });
    }
  }

  deleteLocation(location: any, $event: any) {
    $event.stopPropagation();
    const locationId = location.id;

    this.canDeactivateDeleteLocation(locationId, true).then(canDelete => {
      if (!canDelete) {
        this.alertService.warning('Location already is used. You cannot delete it.');
        return;
      }

      this.continueDeletingLocation(locationId);
    });
  }

  private canDeactivateDeleteLocation(
    locationId: string,
    isDeleteAction: boolean
  ): Promise<boolean> {
    const roomsPromise = this.roomService.getByLocationId(locationId);
    const appointmentPromise = this.appointmentService.getByLocationId(locationId);

    return Promise.all([roomsPromise, appointmentPromise]).then(result => {
      const rooms = result[0];
      const appointment = result[1];

      const areActiveLocationRoomsExist = isDeleteAction
        ? !!rooms.length
        : !!rooms.filter(r => r.isActive).length;

      return !areActiveLocationRoomsExist && !appointment;
    });
  }

  private continueDeletingLocation(locationId: string): void {
    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the location ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.locationService.delete(locationId).then(() => {
          this.locationDataGrid.instance.refresh();
        });
      }
    });
  }

  private resetCreateUpdateLocationForm() {
    this.isLocationSet = false;
    this.isNewLocation = true;
    this.location = new Location();
    this.selectedLocations = [];
  }

  private init(): any {
    this.initLocationDataSource();
  }

  private initLocationDataSource(): any {
    this.locationDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl('location'),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });

    // this.locationDataSource.store =
    //     this.extraFieldsAppService
    //         .getExtraFieldDataSource(this.locationDataService, TableNames.location, "Id", this.adjustLocationBeforeRenderInGrid, this);
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        if (this.locationDataGrid && this.locationDataGrid.instance)
          this.locationDataGrid.instance.refresh();
      }
    });
  }
}
