import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ControlDefaultValues } from '../_classes/controlDefaultValues';
import { SelectableListConfig } from '../_models/selectableListConfig';
import { SelectableListResult } from '../_models/selectableListResult';
import { ApiBaseUrls } from '../_models/apiBaseUrls';
import { SelectableListSearchFilter } from '../administration/models/selectableListSearchFilter';
import { BaseSelectableListService } from './base-selectable-list.service';
import { ConfigService } from './config.service';
import { firstValueFrom, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectableListService extends BaseSelectableListService {
  baseSelectableListUrl: string = ApiBaseUrls.selectableList;
  emitSelectableOptions: Subject<any> = new Subject<any>;

  constructor(http: HttpClient, config: ConfigService) {
    super(http, config);
  }

  importLibrarySelectableLists(
    companyId: string,
    categoryId: string,
    selectedListsIds: string[]
  ) {
    const patchObject = [];

    patchObject.push({
      op: 'add',
      path: '/companyId',
      value: companyId,
    });

    patchObject.push({
      op: 'add',
      path: '/libraryCategoryId',
      value: categoryId,
    });

    for (let i = 0; i < selectedListsIds.length; i++) {
      const libraryListId = selectedListsIds[i];
      patchObject.push({
        op: 'add',
        path: '/libraryEntityIds/-',
        value: libraryListId,
      });
    }

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseSelectableListUrl}/imported-lists`,
        patchObject
      )
    );
  }

  syncWithSelectableListTemplate(id: string, version?: number) {
    const patchObject = [];

    if (!version) version = 1;

    patchObject.push({
      op: 'add',
      path: '/version',
      value: version,
    });

    return firstValueFrom(
      this.http.patch(
        `${this.config.apiUrl}${this.baseSelectableListUrl}/${id}/version`,
        patchObject
      )
    );
  }

  getSelectableListDefaultValueFromComponent(
    component: any,
    selectableListName: string
  ): string {
    const selectabelList: SelectableListResult = component[selectableListName];
    return selectabelList && selectabelList.defaultValue
      ? selectabelList.defaultValue
      : '';
  }

  getSelectableListValuesFromComponent(
    component: any,
    selectableListName: string
  ): any[] {
    const selectabelList = component[selectableListName];
    return selectabelList && selectabelList.values && selectabelList.values.length
      ? component[selectableListName].values
      : [];
  }

  setSelectableListsValuesToComponent(
    selectableListsConfigs: SelectableListConfig[],
    component: any
  ): Promise<void> {
    const companyId = selectableListsConfigs[0].companyId;

    const filter = new SelectableListSearchFilter();
    filter.companyId = companyId;
    filter.librarySelectableListIds = selectableListsConfigs.map(
      c => c.librarySelectableListId
    );

    return this.getByFilter(filter).then(selectableLists => {
      for (let i = 0; i < selectableLists.length; i++) {
        const selectableList = selectableLists[i];
        const librarySelectableListId = selectableList.librarySelectableListId;

        const selectableListResult = new SelectableListResult();

        const selectabelListConfig = selectableListsConfigs.find(
          c => c.librarySelectableListId === librarySelectableListId
        );
        if (!selectabelListConfig) continue;

        const selectabelListName = selectabelListConfig.name;
        const includeNotSetValue = selectabelListConfig.includeNotSetValue;

        const selectableListValues = selectableList.selectableListValues;

        if (selectableListValues.length) {
          const stringValues = selectableListValues.map(s => s.value);

          if (includeNotSetValue) {
            stringValues.push(ControlDefaultValues.selectBox);
          }

          const defaultSelectableListValue = selectableListValues.find(s => s.isDefault);

          //every selectable list has to have default value
          //todo: create patcher to set default value for selectable list if doesn't exist
          selectableListResult.defaultValue = defaultSelectableListValue
            ? defaultSelectableListValue.value
            : selectableListValues[0].value;

          selectableListResult.values = stringValues;
        }

        component[selectabelListName] = selectableListResult;

        if (selectableList.title == "Education"
        || selectableList.title == "MED_Allergy"
        || selectableList.title == "Medications Directions"
        || selectableList.title == "Medications Forms"
        || selectableList.title == "MED_Units"
        || selectableList.title == "MED_Route"
        || selectableList.title == "MED_Status"
        ) {
          this.emitSelectableOptions.next(selectableList);
        }
      }
    });
  }
}
