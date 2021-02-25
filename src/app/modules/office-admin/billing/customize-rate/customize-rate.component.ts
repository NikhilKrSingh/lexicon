import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { vwRate } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-customize-office-rate',
  templateUrl: './customize-rate.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class CustomizeOfficeRateComponent implements OnInit {
  selectedRateList: Array<vwRate> = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  @ViewChild(DatatableComponent, { static: true }) rateTable: DatatableComponent;

  constructor(private activeModal: NgbActiveModal) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    if(this.selectedRateList) {
      this.calcTotalPages();
      this.selectedRateList.forEach(r => {
        r['isInherited'] = true;
      });
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
    this.page.totalElements = this.selectedRateList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.rateTable.offset = 0;
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.activeModal.close(null);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
