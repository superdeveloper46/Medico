import { BaseSelectableComponent } from './baseSelectableComponent';
import { SelectableItem } from './selectableItem';

export interface IPatientSelectableComponent {
  selectableComponent: BaseSelectableComponent;

  selectableItem: Nullable<SelectableItem>;

  isPreviewMode: boolean;

  visible: boolean;

  getSelectableItems(htmlContent: string): Promise<SelectableItem[]>;
}
