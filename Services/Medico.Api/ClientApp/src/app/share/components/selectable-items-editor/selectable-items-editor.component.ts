import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  EventEmitter,
  Output,
  HostListener,
} from '@angular/core';
import { SelectableItemHtmlService } from 'src/app/_services/selectable-item-html.service';
import { SelectableItem } from 'src/app/share/classes/selectableItem';
import { Constants } from 'src/app/_classes/constants';
import { PatientSelectableRootComponent } from 'src/app/share/components/patient-selectable-root/patient-selectable-root.component';
import { ExpressionItemService } from 'src/app/_services/expression-item.service';
import { ExpressionExecutionService } from 'src/app/_services/expression-execution.service';
import { ExpressionExecutionRequest } from 'src/app/_models/expression-execution-request';
import { ExpressionTestEntityIds } from 'src/app/_classes/expressionTestEntityIds';

@Component({
  templateUrl: 'selectable-items-editor.component.html',
  selector: 'selectable-items-editor',
  styleUrls: ['selectable-items-editor.component.sass'],
})
export class SelectableItemsEditorComponent implements OnInit, AfterViewInit {
  private selectableItemTagName = 'label';
  private isComponentInitiallySetup = false;

  @ViewChild('selectableItemsEditor', { static: false })
  selectableItemsEditor?: ElementRef;
  @ViewChild('patientSelectableRoot', { static: false })
  patientSelectableRoot?: PatientSelectableRootComponent;
  @ViewChild('nextSelectableItemBtn', { static: false })
  nextSelectableItemBtn?: ElementRef;
  @ViewChild('previousSelectableItemBtn', { static: false })
  previousSelectableItemBtn?: ElementRef;

  private _templateContent: string = '';

  @Input() companyId?: string;
  @Input() admissionId?: string;
  @Input() expressions?: any;

  @Input()
  get templateContent(): string {
    return this._templateContent;
  }
  set templateContent(value: string) {
    this._templateContent = this.modifyStringForFreeSelect(value);

    if (this.isComponentInitiallySetup)
      setTimeout(
        () => this.handleSelectableItemSelection(this.currentSelectableItemIndex),
        0
      );
    else this.isComponentInitiallySetup = true;
    setTimeout(() => this.setevents(), 1);
  }

  arrLength: number = 0;

  templateContentToEmit: string = '';
  renderedContent = false;

  @Output() contentChanged = new EventEmitter<string>();

  selectableItems: SelectableItem[] = [];
  currentSelectableItem: Nullable<SelectableItem>;
  currentSelectableHtmlElement: any;
  currentSelectableItemIndex: number = -1;

  constructor(
    private selectableItemHtmlService: SelectableItemHtmlService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private expressionItemService: ExpressionItemService,
    private expressionExecutionService: ExpressionExecutionService
  ) {}

  get doesContentContainSelectableItems(): boolean {
    return !!this.selectableItems.length;
  }

  ngOnInit() {
    this.selectableItems = this.selectableItemHtmlService.getSelectableItems(
      this.templateContent,
      [
        Constants.selectableItemTypes.list,
        Constants.selectableItemTypes.date,
        Constants.selectableItemTypes.range,
        Constants.selectableItemTypes.variable,
      ]
    );

    const expressionExecutionRequest = new ExpressionExecutionRequest();

    console.log('this.admissionId', this.admissionId);
    if(this.admissionId) {
      expressionExecutionRequest.admissionId = this.admissionId;
    }
    else {
      expressionExecutionRequest.admissionId = ExpressionTestEntityIds.admissionId;
    }

    expressionExecutionRequest.patientId = ExpressionTestEntityIds.patientId;
    expressionExecutionRequest.companyId = this.companyId;
    expressionExecutionRequest.detailedTemplateContent = this.templateContent;

    console.log('select:', expressionExecutionRequest);

    this.expressionExecutionService
    .calculateExpression(expressionExecutionRequest)
    .then(detailedTemplateContent => {
      // this.templateContent.detailedTemplateHtml = detailedTemplateContent;
      // this.patientChartTrackService.emitPatientChartChanges(
      //   PatientChartNodeType.TemplateNode
      // );
      this.templateContent = this.expressionItemService.evaluateExpressionHtmlElement(this.expressions, detailedTemplateContent);
      this.templateContentToEmit = detailedTemplateContent;
      this.renderedContent = true;
    });

    // this.templateContent = this.expressionItemService.evaluateExpressionHtmlElement(this.expressions, this.templateContent);
    // this.templateContentToEmit = this.templateContent;
  }

  ngAfterViewInit(): void {
    if (this.doesContentContainSelectableItems) {
      const firstSelectableItemIndex = 0;

      setTimeout(() => this.handleSelectableItemSelection(firstSelectableItemIndex), 0);
      this.nextSelectableItemBtn?.nativeElement.focus();
    }
  }

  modifyStringForFreeSelect(htmlString: string) {
    if(htmlString) {
      htmlString = htmlString.replace(/<label /g, "<label class='name' ");
    }
    else {
      htmlString = '';
    }

    const needle = "class='name'";
    const re = new RegExp(needle, 'gi');

    const results = []; //this is the results you want
    while (re.exec(htmlString)) {
      results.push(re.lastIndex);
    }
    //Indexing
    results.forEach((i, index) => {
      htmlString = htmlString.replace(
        "class='name'",
        "class='name" + index + "' index='" + index + "'"
      );
    });
    this.arrLength = results.length;
    return htmlString;
  }
  setevents() {
    for (let i = 0; i < this.arrLength; i++) {
      if (this.elementRef.nativeElement.querySelector('.name' + i)) {
        this.elementRef.nativeElement
          .querySelector('.name' + i)
          .addEventListener('dblclick', this.selectItem.bind(this));
      }
    }
  }

  selectItem(item: any) {
    this.clearSelectedMark();
    const index = item.target.attributes.index.value;
    // this.checkDefaultMaxRange(index);
    this.handleSelectableItemSelection(index);
  }

  onSelectableItemValueChanged(selectableItemsToChange: SelectableItem[]) {
    if (selectableItemsToChange && selectableItemsToChange.length) {
      for (let i = 0; i < selectableItemsToChange.length; i++) {
        const selectableItemToChange = selectableItemsToChange[i];
        const value = selectableItemToChange.value;
        this.renderer.setProperty(this.currentSelectableHtmlElement, 'innerHTML', value);

        this.replacePreviousSelectableValueToNew(value);
      }

      this.emitContentChange();
      this.moveToNextSelectableItem();
    }
  }

  moveToNextSelectableItem() {
    const currentSelectableItemIndex = this.getCurrentSelectableItemIndex();

    this.checkDefaultMaxRange(currentSelectableItemIndex);

    const isIndexOfLastItem =
      currentSelectableItemIndex === this.selectableItems.length - 1;

    if (isIndexOfLastItem) return;

    this.clearSelectedMark();

    this.handleSelectableItemSelection(currentSelectableItemIndex + 1);
  }

  checkDefaultMaxRange(index: number) {
    //change default range to max ItemCount
    const value = this.selectableItems[index].value;
    if (value.indexOf('---') > 0) {
      const valArr = value.split('---');
      if (valArr[0].trim() === valArr[1].trim()) {
        this.renderer.setProperty(
          this.currentSelectableHtmlElement,
          'innerHTML',
          valArr[1].trim()
        );
        this.replacePreviousSelectableValueToNew(valArr[1].trim());
        this.emitContentChange();
      }
    }
  }

  moveToPreviousSelectableitem() {
    const currentSelectableItemIndex = this.getCurrentSelectableItemIndex();

    const isIndexOfFirtsItem = currentSelectableItemIndex === 0;

    if (isIndexOfFirtsItem) return;

    this.clearSelectedMark();

    this.handleSelectableItemSelection(currentSelectableItemIndex - 1);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydownKeyboardEvent(event: KeyboardEvent) {
    if (!this.doesContentContainSelectableItems) return;

    const lefttBtnCode = 37;
    const rightBtnCode = 39;

    const keyboardKeyCode = event.keyCode;

    const isRightBtnClicked = keyboardKeyCode === rightBtnCode;

    if (isRightBtnClicked) {
      this.nextSelectableItemBtn?.nativeElement.focus();
      this.moveToNextSelectableItem();
      return;
    }

    const isLeftBtnClicked = keyboardKeyCode === lefttBtnCode;

    if (isLeftBtnClicked) {
      this.previousSelectableItemBtn?.nativeElement.focus();
      this.moveToPreviousSelectableitem();
    }
  }

  private replacePreviousSelectableValueToNew(value: string) {
    const templateContentContainer = document.createElement('div');

    templateContentContainer.innerHTML = this.templateContentToEmit;

    const selectableItemIdQuerySelector = `${this.selectableItemTagName}[id="${this.currentSelectableItem?.id}"]`;

    const changedSelectableElement = templateContentContainer.querySelector(
      selectableItemIdQuerySelector
    );

    if (changedSelectableElement) changedSelectableElement.innerHTML = value;

    this.templateContentToEmit = templateContentContainer.innerHTML;
  }

  private handleSelectableItemSelection(selectedItemIndex: number) {
    const isSelectableItemExecutionNeeded =
      selectedItemIndex !== this.currentSelectableItemIndex;
    this.currentSelectableItemIndex = selectedItemIndex;

    this.currentSelectableItem = this.selectableItems[selectedItemIndex];
    const selectableItemIdQuerySelector = `${this.selectableItemTagName}[id="${this.currentSelectableItem?.id}"]`;

    this.currentSelectableHtmlElement =
      this.selectableItemsEditor?.nativeElement.querySelector(
        selectableItemIdQuerySelector
      );

    this.markCurrentSelectableItem();

    this.scrollToCurrentSelectableItemIfNeeded();
    if(!this.currentSelectableHtmlElement) return;
    if (isSelectableItemExecutionNeeded)
      this.patientSelectableRoot?.tryExecuteSelectableItem(
        this.currentSelectableHtmlElement,
        false
      );
  }

  private scrollToCurrentSelectableItemIfNeeded() {
    const selectableItemsEditorHtmlElement = this.selectableItemsEditor?.nativeElement;

    var selectableItemsEditorHeight = 0;
    var doesScrollExistInEditor = false;
    if(typeof selectableItemsEditorHtmlElement != 'undefined') {
      selectableItemsEditorHeight = selectableItemsEditorHtmlElement.clientHeight;

      doesScrollExistInEditor = selectableItemsEditorHtmlElement.scrollHeight > selectableItemsEditorHeight;

    }

    if (!doesScrollExistInEditor) return;

    const currentSelectableItemOffsetTop = this.getSelectableItemOffsetTopValue(
      this.currentSelectableHtmlElement
    );

    const selectableItemsEditorScrollTop = selectableItemsEditorHtmlElement.scrollTop;

    const indent = 5;

    //case when we need to scroll to top
    if (currentSelectableItemOffsetTop < selectableItemsEditorScrollTop) {
      this.renderer.setProperty(
        selectableItemsEditorHtmlElement,
        'scrollTop',
        currentSelectableItemOffsetTop - indent
      );
      return;
    }

    //case when scrolling is not needed
    if (
      selectableItemsEditorScrollTop + selectableItemsEditorHeight >
      currentSelectableItemOffsetTop
    )
      return;

    //case when we need to scroll to bottom
    const scrollToBottomValue =
      currentSelectableItemOffsetTop -
      selectableItemsEditorHeight +
      this.currentSelectableHtmlElement.offsetHeight +
      indent;

    this.renderer.setProperty(
      selectableItemsEditorHtmlElement,
      'scrollTop',
      scrollToBottomValue
    );
  }

  private markCurrentSelectableItem() {
    if (this.currentSelectableHtmlElement) {
      this.renderer.setStyle(
        this.currentSelectableHtmlElement,
        'border',
        '1px solid red'
      );

      this.renderer.setStyle(this.currentSelectableHtmlElement, 'padding', '3px');

      this.renderer.setAttribute(this.currentSelectableHtmlElement, 'selected', '');
    }
  }

  private clearSelectedMark() {
    if (this.currentSelectableHtmlElement) {
      this.renderer.removeStyle(this.currentSelectableHtmlElement, 'border');

      this.renderer.removeStyle(this.currentSelectableHtmlElement, 'padding');

      this.renderer.removeAttribute(this.currentSelectableHtmlElement, 'selected');
    }
  }

  private getCurrentSelectableItemIndex() {
    const currentSelectableItemId = this.currentSelectableItem?.id;
    if (currentSelectableItemId) {
      const allSelectableItemIds = this.selectableItems.map(s => s.id);

      return allSelectableItemIds.indexOf(currentSelectableItemId);
    }

    return -1;
  }

  private emitContentChange() {
    this.contentChanged.emit(this.templateContentToEmit);
  }

  private getSelectableItemOffsetTopValue(selectableHtmlElement: any): number {
    const isOffsetAdjustmentNeeded = this.isOffsetAdjustmentNeeded(selectableHtmlElement);

    if (!isOffsetAdjustmentNeeded) {
      return selectableHtmlElement.offsetTop;
    }

    const tableTag = 'TABLE';
    let offset = selectableHtmlElement.offsetTop;

    while (selectableHtmlElement.parentElement.tagName !== tableTag) {
      offset += selectableHtmlElement.parentElement.offsetTop;
      selectableHtmlElement = selectableHtmlElement.parentElement;
    }

    offset += selectableHtmlElement.parentElement.offsetTop;

    return offset;
  }

  private isOffsetAdjustmentNeeded(selectableHtmlElement: any) {
    const tags = ['TD', 'TH', 'TABLE'];

    while (selectableHtmlElement.parentElement) {
      if (tags.indexOf(selectableHtmlElement.parentElement.tagName) !== -1) {
        return true;
      }

      selectableHtmlElement = selectableHtmlElement.parentElement;
    }

    return false;
  }
}
