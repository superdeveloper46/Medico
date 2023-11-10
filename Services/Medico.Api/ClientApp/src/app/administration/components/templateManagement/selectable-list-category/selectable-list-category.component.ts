import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopupComponent } from 'devextreme-angular/ui/popup';
import { DxFormComponent } from 'devextreme-angular/ui/form';
import { SelectableListCategory } from 'src/app/administration/models/selectableListCategory';
import { AlertService } from 'src/app/_services/alert.service';
import { BaseAdminComponent } from 'src/app/_classes/baseAdminComponent';
import { SelectableListCategoryService } from 'src/app/administration/services/selectable-list-category.service';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { DxDataUrlService } from 'src/app/_services/dxDataUrl.service';
import { SelectableListService } from 'src/app/_services/selectable-list.service';
import { GuidHelper } from 'src/app/_helpers/guid.helper';
import { Subscription } from 'rxjs';
import { CompanyIdService } from 'src/app/_services/company-id.service';
import { DevextremeAuthService } from 'src/app/_services/devextreme-auth.service';
import { ApiBaseUrls } from 'src/app/_models/apiBaseUrls';

@Component({
  selector: 'selectable-list-category',
  templateUrl: './selectable-list-category.component.html',
})
export class SelectableListCategoryComponent
  extends BaseAdminComponent
  implements OnInit, OnDestroy
{
  @ViewChild('categoryDataGrid', { static: false })
  categoryDataGrid!: DxDataGridComponent;
  @ViewChild('categoryPopup', { static: false })
  categoryPopup!: DxPopupComponent;
  @ViewChild('categoryForm', { static: false })
  categoryForm!: DxFormComponent;

  companyId: string = GuidHelper.emptyGuid;
  companyIdSubscription?: Subscription;

  selectedCategories: Array<any> = [];
  category: SelectableListCategory;
  isNewCategory = true;

  categoryDataSource: any = {};

  isCategoryPopupOpened = false;

  constructor(
    private alertService: AlertService,
    private selectableListCategoryService: SelectableListCategoryService,
    private dxDataUrlService: DxDataUrlService,
    private selectableListService: SelectableListService,
    private companyIdService: CompanyIdService,
    private devextremeAuthService: DevextremeAuthService
  ) {
    super();

    this.category = new SelectableListCategory();

    this.init();
  }

  ngOnDestroy(): void {
    this.companyIdSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.subscribeToCompanyIdChanges();
  }

  openCategoryForm() {
    this.isCategoryPopupOpened = true;
  }

  createUpdateCategory() {
    const validationResult = this.categoryForm.instance.validate();

    if (!validationResult.isValid) {
      return;
    }

    if (!this.category.title) return;

    this.selectableListCategoryService
      .getByTitle(this.category.title, this.companyId)
      .then(selectableList => {
        const isSelectableListTitleValid =
          !selectableList || this.category?.id === selectableList.id;

        if (!isSelectableListTitleValid) {
          this.alertService.warning(
            `Category with title '${this.category.title}' already exists`
          );
          return;
        } else {
          if (this.isNewCategory) {
            this.category.companyId = this.companyId;
          }
          this.selectableListCategoryService
            .save(this.category)
            .then(() => {
              this.categoryDataGrid.instance.refresh();

              this.resetCategoryForm();
              this.isCategoryPopupOpened = false;
            })
            .catch(error =>
              this.alertService.error(error.message ? error.message : error)
            );
        }
      });
  }

  onCategorySelected($event: any) {
    const selectedCategory = $event.selectedRowsData[0];
    if (!selectedCategory) return;

    const selectedCategoryId = $event.selectedRowsData[0].id;

    this.selectableListCategoryService
      .getById(selectedCategoryId)
      .then(category => {
        this.category = category;
        this.isNewCategory = false;
        this.isCategoryPopupOpened = true;
      })
      .catch(error => this.alertService.error(error.message ? error.message : error));
  }

  onCategoryPopupHidden() {
    this.resetCategoryForm();
  }

  deleteCategory(category: any, $event: any) {
    $event.stopPropagation();

    const categoryId = category.id;

    this.canDeleteCategory(categoryId).then(canDelete => {
      if (!canDelete) {
        this.alertService.warning('Category already is used. You cannot delete it.');
        return;
      }

      this.continueDeletingCategory(categoryId);
    });
  }

  deactivateCategory(category: SelectableListCategory, $event: any) {
    $event.stopPropagation();

    const categoryId = category.id;
    if (!categoryId) return;

    this.canDeactivateCategory(categoryId).then(canDeactivate => {
      if (!canDeactivate) {
        this.alertService.warning('Catgeory already is used. You cannot deactivate it.');
        return;
      }

      this.continueDeactivatingCategory(categoryId);
    });
  }

  activateCategory(category: SelectableListCategory, $event: any) {
    $event.stopPropagation();

    const categoryId = category.id;
    if (!categoryId) return;

    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to activate the catgeory ?',
      'Confirm activation'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.selectableListCategoryService
          .activateDeactivateCategory(categoryId, true)
          .then(() => {
            this.categoryDataGrid.instance.refresh();
          });
      }
    });
  }

  private continueDeactivatingCategory(categoryId: string): void {
    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to deactivate category ?',
      'Confirm deactivation'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.selectableListCategoryService
          .activateDeactivateCategory(categoryId, false)
          .then(() => {
            this.categoryDataGrid.instance.refresh();
          });
      }
    });
  }

  private continueDeletingCategory(categoryId: string) {
    const confirmationPopup = this.alertService.confirm(
      'Are you sure you want to delete the category ?',
      'Confirm deletion'
    );

    confirmationPopup.then(dialogResult => {
      if (dialogResult) {
        this.selectableListCategoryService.delete(categoryId).then(() => {
          this.categoryDataGrid.instance.refresh();
        });
      }
    });
  }

  private canDeleteCategory(categoryId: string): Promise<boolean> {
    return this.selectableListService
      .getFirstByCategoryId(categoryId, this.companyId)
      .then(selectableList => {
        return !selectableList;
      });
  }

  private canDeactivateCategory(categoryId: string): Promise<boolean> {
    return this.selectableListService
      .getFirstActiveByCategoryId(categoryId, this.companyId)
      .then(selectableList => {
        return !selectableList;
      });
  }

  private resetCategoryForm() {
    this.isNewCategory = true;
    this.category = new SelectableListCategory();
    this.selectedCategories = [];
  }

  private init() {
    this.initCategoryDataSource();
  }

  private initCategoryDataSource() {
    this.categoryDataSource.store = createStore({
      loadUrl: this.dxDataUrlService.getGridUrl(ApiBaseUrls.selectableListCategory),
      onBeforeSend: this.devextremeAuthService.decorateOnBeforeSendMethod(
        (_method, jQueryAjaxSettings) => {
          jQueryAjaxSettings.data.companyId = this.companyId;
        },
        this
      ),
    });
  }

  private subscribeToCompanyIdChanges() {
    this.companyIdSubscription = this.companyIdService.companyId.subscribe(companyId => {
      if (companyId) {
        this.companyId = companyId;
        if (this.categoryDataGrid && this.categoryDataGrid.instance)
          this.categoryDataGrid.instance.refresh();
      }
    });
  }
}
