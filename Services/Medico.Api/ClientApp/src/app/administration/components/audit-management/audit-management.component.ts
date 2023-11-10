import { Component, QueryList, ViewChildren } from '@angular/core';
import { DxColorBoxComponent } from 'devextreme-angular';
import { ChartColor } from 'src/app/patientChart/models/chartColor';
import { AuditManagementService } from './audit-management.service';

@Component({
  selector: 'audit-management',
  templateUrl: './audit-management.component.html',
  styleUrls: ['./audit-management.component.scss'],
})
export class AuditManagementComponent {
  @ViewChildren(DxColorBoxComponent) colorBox!: QueryList<DxColorBoxComponent>;

  // model that stores colors
  chartColors: ChartColor = new ChartColor();
  // used to control event handler looping when resetting color
  resettingColor: boolean = false;
  // used to display the proper name
  categoryFrontEnd: Array<string> = [
    'No Content Changed',
    'Content Updated',
    'Default Or Incomplete',
    'Abnormal Values',
  ];
  // connects the changed color to the correct SQL column name
  categoryBackEnd: Array<string> = [
    'NoContentChanged',
    'Updated',
    'DefaultOrIncomplete',
    'Abnormal',
  ];
  // used to identify the different color boxes
  classNames: Array<Array<string>> = [
    [
      // category_1
      'cat_1Color',
      'cat_1Border',
    ],
    [
      // category_2
      'cat_2Color',
      'cat_2Border',
    ],
    [
      // category_3
      'cat_3Color',
      'cat_3Border',
    ],
    [
      // category_4
      'cat_4Color',
      'cat_4Border',
    ],
  ];

  constructor(private auditManagementService: AuditManagementService) {
    this.auditManagementService.getColors().then(colors => {
      console.log(colors);
      this.chartColors.setAll(colors);
    });
  }

  /**
   * event handler called when a new color is set
   */
  onColorChange($event: any): void {
    if (!$event || !$event.value || !$event.previousValue || !$event.element.id) return;
    if (this.resettingColor == true) {
      this.resettingColor = false;
      return;
    }

    console.log(this.colorBox);
    console.log($event);
    const newColor: string = $event.value;
    const oldColor: string = $event.previousValue;
    const name: string = $event.element.id;
    const verifyColor: RegExp = new RegExp('^#[a-zA-Z0-9]{1,6}$', 'g');
    let colorName: string = '';

    // make sure the color is of a normal hex format
    if (!newColor.match(verifyColor)) {
      return;
    }

    // colorName has to match an entry in the SQL table
    name.includes('cat_1')
      ? (colorName = this.categoryBackEnd[0])
      : name.includes('cat_2')
      ? (colorName = this.categoryBackEnd[1])
      : name.includes('cat_3')
      ? (colorName = this.categoryBackEnd[2])
      : (colorName = this.categoryBackEnd[3]);

    if (name.includes('Border')) colorName = 'Border' + colorName;

    console.log(colorName, oldColor, newColor);
    this.chartColors.change(colorName, newColor);

    this.auditManagementService
      .setColors(this.chartColors)
      .then(success => {
        if (!success) {
          // if this returns false, change the color back to the previous one
          this.chartColors.change(colorName, oldColor);
          this.resettingColor = true;
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  /**
   * event handler called when 'Restore Defaults' is clicked
   */
  setDefaultColors(): void {
    console.log('in setDefaultColors');
    this.auditManagementService.setDefaultColors().then(newColors => {
      if (newColors) this.chartColors.setAll(newColors);
    });
  }
}
