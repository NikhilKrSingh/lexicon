import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Page } from 'src/app/modules/models';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { MiscService, OfficeService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-client-attorney-search',
  templateUrl: './attorney-search.component.html',
  styleUrls: ['./attorney-search.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientAttorneySearchComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false })
  attorneytable: DatatableComponent;

  public officeList: Array<any> = [{ id: 0, name: 'All' }];
  public attorneyList: Array<any> = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public selectedIds: Array<number> = [];
  public pageType: string;
  attorneyForm = new FormGroup({
    attorneys: new FormArray([])
  });
  public selectedRow;
  public data: {
    officeId?: number;
    practiceId?: number;
    stateId?: number;
    search?: any;
    isAdvancedSearch?: boolean;
  };
  public isLoading: boolean = true;
  txtQueryChanged: Subject<string> = new Subject<string>();

  constructor(
    private activeModal: NgbActiveModal,
    private officeService: OfficeService,
    private miscService: MiscService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.getOffices();

    this.txtQueryChanged
      .debounceTime(500) // wait 1 sec after the last event before emitting last event
      .distinctUntilChanged() // only emit if value is different from previous value
      .subscribe(model => {
        this.data.search = model;
        // Call your function which calls API or do anything you would like do after a lag of 1 sec
        this.getAttorney();
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    document.getElementById('advncesercehrd').click();
  }

  /**
   * Get office list
   *
   * @memberof BasicInfoComponent
   */
  public getOffices() {
    this.miscService.v1MiscOfficesGet$Response({}).subscribe(
      suc => {
        let res: any = suc;
        this.officeList = [...this.officeList, ...JSON.parse(res.body).results];
        this.getAttorney();
      },
      err => {
        console.log(err);
      }
    );
  }

  public getAttorney() {
    this.isLoading = true;
    this.data.isAdvancedSearch = true;
    this.officeService
      .v1OfficeReDesignAttorneysGet(this.data)
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        res => {
          res = res || [];
          res = res.filter(a => !!a.name);

          if (
            this.attorneyForm.value &&
            this.attorneyForm.value.attorneys &&
            this.attorneyForm.value.attorneys.length > 0
          ) {
            this.selectedIds = this.attorneyForm.value.attorneys.map(
              item => item.id
            );
          }
          res = res.filter(item => this.selectedIds.indexOf(item.id) === -1);

          if (this.data.officeId) {
            let otherOffice;
            res = res.filter(item => {
              otherOffice = item.secondaryOffices
                ? item.secondaryOffices.split(',')
                : [];
              otherOffice = otherOffice.map(Number);
              return (
                +this.data.officeId === +item.primaryOfficeId ||
                otherOffice.indexOf(+this.data.officeId) > -1
              );
            });
            if (res && res.length > 0) {
              let sortView = res.some(item => item.rankingView);
              if (!sortView) {
                res = _.sortBy(res, a => (a.name || '').toLowerCase());
              }
            }
          } else {
            res = _.sortBy(res, a => (a.name || '').toLowerCase());
          }
          if (res.length > 0) {
            this.selectedRow = res[0];
          }
          this.attorneyList = res;
          this.calcTotalPages();
          this.isLoading = false;
        },
        err => {
          this.isLoading = false;
        }
      );
  }

  officeChange() {
    this.getAttorney();
    UtilsHelper.aftertableInit();
  }

  searchAttorneys() {
    this.txtQueryChanged.next(this.data.search);
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = Number(this.pageSelector.value);
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    }
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
    this.page.totalElements = this.attorneyList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.attorneytable.offset = 0;
  }

  public close() {
    this.activeModal.close(null);
  }

  public onSelected(row) {
    this.selectedRow = row;
  }

  public save() {
    this.activeModal.close(this.selectedRow);
  }

  getRank(row: any) {
    if (this.data.officeId && row) {
      if (
        row.rankingView &&
        row.rankingView !== null &&
        row.rankingView !== ''
      ) {
        if (row.rank > 0) {
          return row.rank;
        } else {
          return '-';
        }
      } else {
        return '-';
      }
    } else {
      return '-';
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.attorneyList) {
      return this.attorneyList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
