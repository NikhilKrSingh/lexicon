import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { IOffice, IPRofile, Page } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { RateTableMappingService, RateTableService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';
import { ConfirmModelComponent } from '../create-rate-table/confirm-model/confirm-model.component';

interface IRateTable {
  baseRate?: number;
  clientAssigned?: number;
  description?: string;
  effectiveDate?: string;
  id?: number;
  matterAssigned?: number;
  name?: string;
  status?: boolean;
  tableRate?: number;
}

@Component({
  selector: 'app-firm-rate-table',
  templateUrl: './rate-table.component.html',
  styleUrls: ['./rate-table.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FirmRateTableComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) ratetablelist: DatatableComponent;

  public message: string = null;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public errorData: any = (errorData as any).default;
  public pangeSelected: number = 1;
  public isLoading = false;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelector = new FormControl('10');
  public counter = Array;
  public currentActive: number;
  public status: number;
  public statusList: Array<IOffice> = [
    {
      id: 1,
      name: 'Active',
      checked: false
    },
    {
      id: 2,
      name: 'Inactive',
      checked: false
    }
  ];
  public rateTables: Array<IRateTable> = [];
  public oriArr: Array<IRateTable> = [];
  public loginUser: IPRofile;
  public rateTableSearch: string;

  constructor(
    private pagetitle: Title,
    private dialogService: DialogService,
    private rateTableMappingService: RateTableMappingService,
    private route: ActivatedRoute,
    private router: Router,
    private rateTableService: RateTableService,
    private modalService: NgbModal,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    this.route.queryParams.subscribe(params => {
      let created = params['created'];
      if (created === 'yes') {
        this.message = this.errorData.rate_table_created;
        setTimeout(() => {
          this.reoveMsg();
        }, 5000);
      }
    });
    this.pagetitle.setTitle('Rate Tables');
    this.getRateTables();
  }

  public reoveMsg() {
    this.message = null
    this.router.navigate(['.'], { relativeTo: this.route, queryParams: {} });
  }

  public getRateTables() {
    this.isLoading = true;
    this.rateTableMappingService.v1RateTableMappingGet()
    .pipe(map(UtilsHelper.mapData)).subscribe((res) => {
      this.status = null;
      this.isLoading = false;
      if (res && res.length > 0) {
        res.map((obj) => {
          if (obj.effectiveDate && !moment(obj.effectiveDate).isAfter(new Date())) {
            obj.effectiveDate = null;
          }
        });
        this.rateTables = res;
        this.oriArr = [...this.rateTables];
        this.updateDatatableFooterPage();
      }
    }, err => {this.isLoading = false;});
  }

  public searchFilter() {

    this.rateTables = this.oriArr.filter(a => {
      let matching = true;

      if (this.status) {
        let sttaus = (this.status === 1) ? true : false;
        matching = matching && a.status === sttaus;
      }
      if (this.rateTableSearch) {
        matching = matching && (UtilsHelper.matchName(a, this.rateTableSearch, 'name') || UtilsHelper.matchName(a, this.rateTableSearch, 'description'))
      }
      return matching;
    });

    this.updateDatatableFooterPage();
  }



  public disableRate(row) {
    let message = (row.status) ? 'Are you sure you want to disable this rate table?' :
      'Are you sure you want to enable this rate table?';
    const yesbtn = (row.status) ? 'Yes, disable rate table' : 'Yes, enable rate table';
    const header = (row.status) ? 'Disable Rate Table' : 'Enable Rate Table';
    const ableToDisb = (row.clientAssigned == 0 && row.matterAssigned == 0) ? true : false;
    if (!ableToDisb && row.status) {
      message = 'You cannot disable this rate table, because it is assigned to at least one client or matter.';
    }
    this.dialogService
      .confirm(
        message,
        yesbtn,
        (ableToDisb) ? 'Cancel' : 'Close',
        header,
        true,
        'modal-smd',
        (row.status) ? ableToDisb : true
      )
      .then((response) => {
        if (response) {
          this.isLoading = true;
          const body = {
            id: row.id,
            isvisible: !row.status
          };
          this.rateTableService.v1RateTableEnableDisableRateTablePost$Json({body: body}).pipe(map(UtilsHelper.mapData))
          .subscribe((res) => {
            this.isLoading = false;
            this.message = (row.status) ? 'Rate table has been disabled.' : 'Rate table has been enabled.';
            setTimeout(() => {
              this.reoveMsg();
            }, 5000);
            this.getRateTables();
          }, err => {
            this.isLoading = false;
          });
        }
      });
  }

  /***
   * open menu on action click
   */
  openMenu(index: number, event): void {
    event.stopPropagation();
    setTimeout(() => {
      if (this.currentActive != index) {
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        this.currentActive = index;
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

  /***
   * closed menu on body click
   */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * Change per page size
   *
   * @memberof ListComponent
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  /**
   * Update datatable footer
   */
  updateDatatableFooterPage() {
    this.page.totalElements = this.rateTables.length;
    this.page.totalPages = Math.ceil(this.rateTables.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.ratetablelist.offset = 0;
    UtilsHelper.aftertableInit();
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }



  public editRateTbl(row) {
    if (row && row.effectiveDate && moment(row.effectiveDate).isAfter(moment(new Date()))) {
      let modalRef = this.modalService.open(ConfirmModelComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: 'modal-smd',
      });
      modalRef.componentInstance.effectiveDate = moment(row.effectiveDate).format('MM/DD/YYYY');

      modalRef.result.then(res => {
        if (res === 'newchanges') {
          this.router.navigate(['/firm/edit-rate-table'], {queryParams: { rateTableId: row.id, newChanges : 'newchanges'}});
        } else if (res) {
          this.router.navigate(['/firm/edit-rate-table'], {queryParams: { rateTableId: row.id}});
        }
      });
    } else {
      this.router.navigate(['/firm/edit-rate-table'], {queryParams: { rateTableId: row.id}});
    }
  }

  get footerHeight() {
    if (this.rateTables) {
      return this.rateTables.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

}
