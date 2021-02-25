import { AfterContentInit, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { vwIdName } from 'src/common/swagger-providers/models';
import { Page } from '../../models';
import { calculateTotalPages } from '../math.helper';

@Component({
  selector: 'app-table-paginator',
  templateUrl: './table-paginator.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class TablePaginatorComponent implements AfterContentInit {
  pageSelector = new FormControl(10);

  @Input() page: Page = new Page();
  @Input() pageSelected = 1;

  public limitArray: Array<vwIdName>;
  public pageArray: Array<vwIdName> = [];
  public counter = Array;

  @Input() curPage;
  @Input() rowCount;
  @Input() offset;
  @Input() pageSize;

  @Output() readonly pageChange = new EventEmitter();
  @Output() readonly pageSizeChange = new EventEmitter();

  constructor() {
    this.limitArray = [
      {
        id: 10,
        name: '10'
      },
      {
        id: 30,
        name: '30'
      },
      {
        id: 50,
        name: '50'
      },
      {
        id: 100,
        name: '100'
      }
    ];
  }

  ngAfterContentInit() {
    this.createPageArray();
  }

  private createPageArray() {
    if (this.page.totalPages > 0) {
      this.pageArray = [];
      for (let i = 1; i <= this.page.totalPages; i++) {
        let item = {
          id: i,
          name: 'Page ' + i + ' of ' + this.page.totalPages
        };

        this.pageArray.push(item);
      }
    } else {
      this.pageArray = [];
    }
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
    this.createPageArray();
    this.pageSizeChange.emit(this.pageSelector.value);
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
  public pageChangeEvent(e) {
    this.pageSelected = e.page;
    this.pageChange.emit(e);
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  private calcTotalPages() {
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
  }
}
