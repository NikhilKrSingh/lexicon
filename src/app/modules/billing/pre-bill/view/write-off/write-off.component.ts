import { Component, EventEmitter, Input, OnChanges, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { addBlueBorder, removeBlueBorder } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-pre-bill-write-off',
  templateUrl: './write-off.component.html',
  styleUrls: ['./write-off.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class PreBillWriteOffComponent implements OnChanges {
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;
  @Input() isDisabled = false;
  @Input() viewmode: boolean;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public pageSelected: number = 1;

  @ViewChild(DatatableComponent, { static: true }) table: DatatableComponent;

  writeOffs: Array<PreBillingModels.MatterWriteOff>;

  public selected = [];

  @Output() readonly selectWriteOff = new EventEmitter<PreBillingModels.MatterWriteOff[]>();

  @Output() readonly selectedPreBill = new EventEmitter();

  constructor() {
    this.writeOffs = [];
  }

  ngOnChanges(changes) {
    if (this.prebillingSettings) {
      const data = this.prebillingSettings.matterWriteOffs || [];
      data.forEach((w) => {
        if (!w.applicableDate) {
          w.applicableDate = new Date().toJSON();
        }
      });
      this.selected = [...data];
      this.writeOffs = _.orderBy(data, ['applicableDate', 'createdBy']);
    }
    if (changes.hasOwnProperty('viewmode')) {
      this.viewmode = changes.viewmode.currentValue;
    }
  }

  toggleExpandRow(row: any, expanded: boolean, $event: any) {
    this.table.rowDetail.toggleExpandRow(row);
    if (expanded) {
      removeBlueBorder($event);
    } else {
      addBlueBorder($event);
    }
  }

  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);

    this.selectWriteOff.emit(this.selected);
    this.selectedPreBill.emit({type: 'write-off', selected: this.selected})
  }

  getSummaryOfAmount(cells: number[]) {
    const filteredCells = cells.filter((cell) => !!cell);
    let sum = filteredCells.reduce((a, b) => a + b, 0);
    if (sum) {
      return (
        '-' +
        sum.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      return null;
    }
  }
}
