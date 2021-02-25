import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { vwRate } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-rate-table',
  templateUrl: './rate-table.component.html',
  styleUrls: ['./rate-table.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RateTableComponent implements OnInit, AfterViewInit {
  @ViewChild(DatatableComponent, { static: false }) tableratetable: DatatableComponent;

  public rateList: Array<vwRate> = [];
  public allRateList: Array<vwRate> = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;


  constructor(
    private activeModal: NgbActiveModal
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.page.totalElements = 0;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.rateList) {
        this.calcTotalPages();
      }
    }, 500);
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
    this.tableratetable.offset = 0;
  }

  public valueChange(event, row) {
    let oldRow = this.allRateList.find(item => item.id === row.id);
    if (row.rateAmount && +oldRow.rateAmount !== +(+row.rateAmount).toFixed(2)) {
      row.isCustom = true;
      row.customRateAmount = row.rateAmount;
    } else {
      row.isCustom = false;
      row.customRateAmount = null;
    }
  }

  public rateFormat(row) {
    row.rateAmount = (row.rateAmount) ? (+row.rateAmount).toFixed(2) : row.rateAmount;
  }

  public close() {
    this.activeModal.close(true);
  }

  public save() {
    this.activeModal.close(true);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
