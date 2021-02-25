import { Component, EventEmitter, Input, OnChanges, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { vwRate } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-employee-admin-rate-table',
  templateUrl: './rate-table.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeAdminRateTableComponent implements OnChanges {
  @Input() rateList: Array<vwRate>;
  @Input() selectedRateList: Array<vwRate>;
  @Output() readonly selectRow = new EventEmitter<Array<vwRate>>();

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  @ViewChild(DatatableComponent, { static: true }) public table: DatatableComponent;
  public selectedRate: Array<vwRate> = [];
  public loading = true;

  constructor() {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnChanges() {
    if (this.rateList) {
      this.loading = false;
      this.calcTotalPages();
    } else {
      this.loading = false;
    }
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.rateList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect(row: vwRate) {
    const isSelected = this.selectedRate.filter(rate => rate.code === row.code).length > 0;
    if (!isSelected) {
      this.selectedRate.push(row);
    } else {
      this.selectedRate.splice(this.selectedRate.indexOf(row), 1);
    }
    this.selectRow.emit(this.selectedRate);
  }

  public selectAllRates(isChecked) {
    this.rateList.forEach((list, index) => {
      this.rateList[index]['checked'] = isChecked;
    });
    this.selectedRate = this.rateList;
    this.selectRow.emit(this.selectedRate);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
