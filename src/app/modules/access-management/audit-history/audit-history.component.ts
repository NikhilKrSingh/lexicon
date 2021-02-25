import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwResultSet } from '../../../../common/models/vwResultSet';
import { SiteLogService } from '../../../../common/swagger-providers/services';
import { Page } from '../../models/page';
import { calculateTotalPages } from '../../shared/math.helper';

@Component({
  selector: 'app-audit-history',
  templateUrl: './audit-history.component.html',
  styleUrls: ['./audit-history.component.scss']
})
export class AuditHistoryComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public rows: Array<any>;
  public counter = Array;
  public pangeSelected: number = 1;
  public loading = true;

  constructor(
    private siteLogService: SiteLogService,
    private toaster: ToastDisplay
  ) {}

  ngOnInit() {
    this.rows = new Array<any>();
    let start = new Date(1990, 1, 1, 0, 0, 0, 0);
    let end = new Date(2030, 1, 1, 0, 0, 0, 0);

    this.siteLogService
      .siteLogGet$Response({
        eventTypeBand: 'SecurityGroup',
        startTime: start.toJSON(),
        endTime: end.toJSON()
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        s => {
          let results: any = s.body;
          let actualData: vwResultSet = JSON.parse(results);
          if (actualData) {
            this.page.pageNumber = 0;
            this.page.size = 10;
            this.rows = actualData.results;

            this.updateDatatableFooterPage();
          } else {
            this.toaster.showError('Api throws error');
          }
        },
        () => {
          this.toaster.showError('Other than 200 status code returned');
        }
      );
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  private calcTotalPages() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /** update table footer page count */
  public updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(this.rows.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
