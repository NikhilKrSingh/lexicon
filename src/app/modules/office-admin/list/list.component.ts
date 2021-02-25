import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import * as errorData from 'src/app/modules/shared/error.json';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { OfficeService } from 'src/common/swagger-providers/services';
import { Page } from '../../models/page';
import { UtilsHelper } from '../../shared/utils.helper';
import * as fromRoot from './../../../store';
import * as fromPermissions from './../../../store/reducers/permission.reducer';

@Component({
  selector: 'app-office-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('actionTemplate', { static: false }) actionTemplate: TemplateRef<any>;

  modalOptions: NgbModalOptions;
  closeResult: string;
  public searchString: any = '';
  public title = 'All';
  public title1 = 'All';
  public filterName = 'Apply Filter';
  public selectedState: Array<any> = [];
  public stateList: Array<any> = [];
  public selectedStatus: Array<number> = [];
  public statusList: Array<any> = [];
  public isLoading = false;
  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public columns: any = [];
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected = [];
  public pangeSelected = 1;
  public counter = Array;
  public columnList = [];
  public officeName = '';
  public officeId = '';
  public closingDate = new FormControl('');
  public efftctDate = new FormControl('', [Validators.required]);
  public openingDate = new FormControl(null);
  public effctDate = new FormControl('', [Validators.required]);
  public officeStatus: FormGroup = this.builder.group({
    closingDate: this.closingDate,
    efftctDate: this.efftctDate
  });
  public reopenofficeStatus: FormGroup = this.builder.group({
    openingDate: this.openingDate,
    effctDate: this.effctDate
  });
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public currentActive: number;
  public errorData: any = (errorData as any).default;
  public errorMsg: string;
  public todayDate = new Date();
  public ofc_close_msg: string;
  public officeCloseSuccess = false;
  public loading = true;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };

  constructor(
    private toastDisplay: ToastDisplay,
    private modalService: NgbModal,
    private officeService: OfficeService,
    private exporttocsvService: ExporttocsvService,
    private builder: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title,
    private router: Router,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.pagetitle.setTitle("Offices");
    this.ofc_close_msg = this.errorData.office_close;
    this.getOfficeList();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngAfterViewInit() {
    this.initScrollDetector([this.table]);
    window.onresize = () => {
      UtilsHelper.checkDataTableScroller(this.tables);
    };
  }
  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }
  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  public getOfficeList() {
    this.officeService.v1OfficeTenantGet().subscribe(
      suc => {
        const res: any = suc;
        this.rows = JSON.parse(res).results;
        this.getFilters(this.rows);
        if (this.rows && this.rows.length > 0) {
          this.oriArr = [...this.rows];
          UtilsHelper.aftertableInit();
          this.initScrollDetector([this.table]);
          UtilsHelper.checkDataTableScroller(this.tables);
          const keys = Object.keys(this.rows[0]);
          this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
        }
        this.updateDatatableFooterPage();
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  public getSelectedState(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public getSelectedStatus(event) {
    this.title1 = '';
    if (event.length > 0) {
      this.title1 = event.length;
    } else {
      this.title1 = 'All';
    }
  }

  public clearFilter(type: string) {
    if (type === 'state') {
      this.selectedState = [];
      this.stateList.forEach(item => (item.checked = false));
      this.title = 'All';
    } else {
      this.selectedStatus = [];
      this.statusList.forEach(item => (item.checked = false));
      this.title1 = 'All';
    }
    this.applyFilter();
  }

  public updateFilter(event) {
    this.searchString = event.target.value;
    this.applyFilter();
  }

  public applyFilter() {
    const val = !this.searchString ? '' : this.searchString;
    let filterList = this.oriArr;
    if (this.selectedState && this.selectedState.length > 0) {
      const states = this.stateList
        .filter((obj: { id: any }) => this.selectedState.includes(obj.id))
        .map(({ name }) => name);
      filterList = filterList.filter(item => {
        if (item.state && states.indexOf(item.state) !== -1) {
          return item;
        }
      });
    }
    if (this.selectedStatus && this.selectedStatus.length > 0) {
      const status = this.statusList
        .filter((obj: { id: any }) => this.selectedStatus.includes(obj.id))
        .map(({ name }) => name);
      filterList = filterList.filter(item => {
        if (item.status && status.indexOf(item.status) !== -1) {
          return item;
        }
      });
    }

    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'officeName') ||
          this.matchName(item, val, 'city') ||
          this.matchName(item, val, 'state')
      );
    }

    this.rows = filterList;
    this.updateDatatableFooterPage();
  }

  public open(content: any, className: any, wClass: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        windowClass: wClass,
        backdrop: 'static',
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  private getFilters(data: any[]) {
    this.getStatusList(data);
    this.getStateList(data);
  }

  private getStatusList(data: any[]) {
    let statusLst = data
      .filter((obj: { status: any }) => obj.status !== null)
      .map(({ status }) => status);
    statusLst = statusLst.filter(UtilsHelper.onlyUnique);
    this.statusList = this.getList(statusLst);
  }

  private getStateList(data: any[]) {
    let stateLst = data
      .filter((obj: { state: any }) => obj.state !== null)
      .map(({ state }) => state);
    stateLst = stateLst.filter(UtilsHelper.onlyUnique);
    this.stateList = this.getList(stateLst);
  }

  private getList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      returnList.push({ id: i + 1, name: list[i] });
    }
    return returnList;
  }

  public ExportToCSV() {
    const rows = clone(this.rows);
    let holiday = '';
    rows.map(obj => {
      if (obj.officeHoliday && obj.officeHoliday.length > 0) {
        holiday = '';
        obj.officeHoliday.map(item => {
          holiday +=
            item.holiday +
            '(' +
            moment(item.holidayDate).format('MM-DD-YYYY') +
            ')' +
            '/';
        });
        holiday = holiday.slice(0, -1);
        obj.officeHoliday = holiday;
      }
      if (obj.phoneNumbers && obj.phoneNumbers.length > 0) {
        holiday = '';
        obj.phoneNumbers.map(item1 => {
          holiday += item1.number + '/';
        });
        holiday = holiday.slice(0, -1);
        obj.phoneNumbers = holiday;
      }
      obj.officePractice = obj.officePractice
        ? obj.officePractice.join('/')
        : '';
    });

    this.exporttocsvService.downloadFile(rows, this.columnList, 'OfficeList');
  }

  public updateStatus(id, body, onSucces = () => { }) {
    this.officeService
      .v1OfficeUpdateStatusOfficeIdPut$Json({ officeId: id, body })
      .subscribe(
        suc => {
          this.modalService.dismissAll();
          this.getOfficeList();
          this.officeStatus.reset();
          onSucces();
        },
        err => {
          this.errorMsg = err.error || '';
          if (this.errorMsg.split(';').length > 1) {
            this.errorMsg = this.errorMsg.split(';')[1];
          }
        }
      );
  }

  public updateCloseStatus() {
    if (
      moment(this.officeStatus.value.closingDate) >
      moment(this.officeStatus.value.efftctDate)
    ) {
      this.toastDisplay.showError(
        this.errorData.closedate_lessthen_effectivedate
      );
      return;
    }
    const data = { ...this.officeStatus.value };
    const body = {
      statusId: 3,
      closingDate:
        moment(data.openingDate).format('YYYY-MM-DD') + 'T00:00:00.000Z',
      effectiveDate:
        moment(data.efftctDate).format('YYYY-MM-DD') + 'T00:00:00.000Z'
    };
    this.updateStatus(this.officeId, body, () => {
      this.officeCloseSuccess = true;
    });
  }

  public updateReOpenStatus() {
    if (
      moment(this.reopenofficeStatus.value.openingDate) >
      moment(this.reopenofficeStatus.value.effctDate)
    ) {
      this.toastDisplay.showError(
        this.errorData.closedate_lessthen_effectivedate
      );
      return;
    }
    const data = { ...this.reopenofficeStatus.value };
    const body = {
      statusId: 4,
      openingDate:
        moment(data.openingDate ? data.openingDate : new Date()).format(
          'YYYY-MM-DD'
        ) + 'T00:00:00.000Z',
      effectiveDate:
        moment(data.effctDate).format('YYYY-MM-DD') + 'T00:00:00.000Z'
    };
    this.updateStatus(this.officeId, body);
  }

  public officeClose(content: any, name: string, id, $event) {
    $event.target.closest('datatable-body-cell').blur();
    this.officeId = id;
    this.officeName = name;
    this.resetStatusForm();
    this.open(content, '', 'modal-large-md');
  }

  private resetStatusForm() {
    this.officeStatus.reset();
    this.errorMsg = null;
  }

  public officeArchive(id: string) {
    this.officeId = id;
    const body = { isArchived: true };
    this.updateStatus(this.officeId, body);
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  /** update Attorney table footer page count */
  updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(this.rows.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    event.stopPropagation();
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

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  getStatus(effectiveDate, status) {
    if (effectiveDate !== null) {
      return new Date(effectiveDate) > this.todayDate ? 'Pending' : status;
    } else {
      return status;
    }
  }

  get isExportValid() {
    return (this.rows.length && this.columnList.some(item => item.isChecked));
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
