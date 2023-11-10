import { SelectableItem } from './selectableItem';
import { Constants } from 'src/app/_classes/constants';

export abstract class BaseSelectableComponent {
  protected metadataSeparator = '::';

  abstract get selectableType(): string;

  public tryGetSelectableItem(htmlElement: HTMLElement): any {
    const selectableItemFailedResult = {
      selectableItem: null,
      success: false,
    };

    const selectableItemType = htmlElement.getAttribute(
      Constants.selectableItem.attributes.selectableType
    );

    if (selectableItemType !== this.selectableType) return selectableItemFailedResult;

    const value = htmlElement.innerText;
    const id = htmlElement.getAttribute(Constants.selectableItem.attributes.id);
    const metadata = htmlElement.getAttribute(
      Constants.selectableItem.attributes.metadata
    );

    if (!id || !metadata) return { success: false };

    return {
      selectableItem: new SelectableItem(id, metadata, value),
      success: true,
    };
  }
}
