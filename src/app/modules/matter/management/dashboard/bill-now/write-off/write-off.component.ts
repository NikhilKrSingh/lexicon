import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { vmWriteOffs } from 'src/app/modules/models';
import { addBlueBorder, removeBlueBorder } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-bill-now-write-off',
  templateUrl: './write-off.component.html',
  styleUrls: ['./write-off.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillNowWriteOffComponent implements OnInit, OnChanges {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  @Input() writeOffsList:Array<vmWriteOffs> = [];
  @Input() writeOffSelected: Array<vmWriteOffs>;
  @Input() workComplete: boolean;
  @Output() readonly validateSaveBtn = new EventEmitter<{selected : Array<vmWriteOffs>, type: string}>();

  public currentActive: number;
  public currentActiveDetls: number;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public disbWriteDownBtn;
  public selectedRow: vmWriteOffs;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('workComplete')) {
      this.workComplete = changes.workComplete.currentValue;
    }
  }


  /**
   *
   * @param row Display
   */
  toggleExpandRow(row, expanded, $event) {
    this.table.rowDetail.toggleExpandRow(row);
    if (expanded) {
      removeBlueBorder($event);
    } else {
      addBlueBorder($event);
    }
  }


  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  /**
   * Get summary for disbursement amount
   * @param cells
   */
  public getSummaryOfAmount(cells: number[]) {
    const filteredCells = cells.filter(cell => !!cell);
    let sum = filteredCells.reduce((a, b) => a + b, 0);
    if (sum) {
      return "-" + sum.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      return null;
    }
  }

  /**
   * closed menu on body click
   * @param event
   * @param index
   */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) this.currentActive = null;
  }


  public onSelect(event?: any) {
    if (event && event.selected) {
      this.writeOffSelected = event.selected
    } else {
      this.writeOffSelected = [];
    }
    this.validateSaveBtn.emit({selected: event.selected, type: 'writeoff'});
  }

}
