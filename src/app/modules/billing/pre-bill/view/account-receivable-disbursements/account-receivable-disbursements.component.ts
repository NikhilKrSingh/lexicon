import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { removeAllBorders } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-account-receivable-disbursements',
  templateUrl: './account-receivable-disbursements.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class AccountReceivableDisbursementsComponent implements OnInit {
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected: number = 1;
  public counter = Array;
  @ViewChild(DatatableComponent, { static: true }) table: DatatableComponent;
  disbursementList: Array<PreBillingModels.vwBillingLines>;
  selectedRow: any;

  constructor() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.disbursementList = [];
  }

  ngOnInit() {
    if (this.prebillingSettings) {
      const data = this.prebillingSettings.recordDisbursement || [];
      this.disbursementList = data.filter(a => a.disbursementType && a.disbursementType.isBillable);
      this.calcTotalPages();
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.disbursementList.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
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
    this.page.totalElements = this.disbursementList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-account-receivable-disbursements');
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
