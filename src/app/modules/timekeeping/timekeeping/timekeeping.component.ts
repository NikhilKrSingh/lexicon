import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { vwCalendarSettings, vwFullPerson } from 'src/common/swagger-providers/models';
import { CalendarService, ClockService, MiscService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../modules/shared/error.json';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import { vwAllTimesheetInfo, vwMyTimesheetModel } from '../../models/timesheet.model';
import { calculateTotalPages } from '../../shared/math.helper';
import { padNumber, UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-timekeeping',
  templateUrl: './timekeeping.component.html',
  styleUrls: ['./timekeeping.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TimekeepingComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('actionTemplate', { static: false }) actionTemplate: TemplateRef<
    any
  >;

  public rows: Array<vwFullPerson> = [];
  public oriArr: Array<vwFullPerson> = [];
  public columns: any = [];

  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected = [];
  public pageSelected = 1;
  public counter = Array;
  public columnList = [];

  public selectedState: Array<any> = [];
  public stateList: Array<any> = [];
  public myTimesheetDetail: Array<vwMyTimesheetModel> = [];
  public title = 'All';
  public filterName = 'Apply Filter';

  public searchString: string;
  public selectedStatus = '';
  public statusList = [
    {
      id: '',
      name: 'All'
    },
    {
      id: 'true',
      name: 'Active'
    },
    {
      id: 'false',
      name: 'Inactive'
    }
  ];

  public arr: any = [-1, -2];

  TotalRate: any;
  totalHours: any;

  startDate: any;
  endDate: any;

  alltmesheetInfo: vwAllTimesheetInfo;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  loggedinUser: any;
  public loading = true;
  public myTimeLoading = true;
  public calendarSettings: vwCalendarSettings;
  closeResult: string;
  userDetails = JSON.parse(localStorage.getItem('profile'));
  public errorData: any = (errorData as any).default;
  redirectUrl: string;

  allTimesheetFilterText: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private calendarService: CalendarService,
    private clockService: ClockService,
    private store: Store<fromRoot.AppState>,
    private pageTitle: Title,
    private modalService: NgbModal,
    private miscService: MiscService,
    private toastr: ToastDisplay
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.endDate = new Date();

    const curr = new Date();
    curr.setDate(curr.getDate() - 6);
    this.startDate = curr;

    this.permissionList$ = this.store.select('permissions');

    const profile = localStorage.getItem('profile');
    if (profile) {
      this.loggedinUser = JSON.parse(profile);
    }
  }

  ngOnInit() {
    this.getAllTimesheets();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (!this.permissionList.TIMEKEEPING_OTHERSisAdmin && this.permissionList.TIMEKEEPING_SELFisEdit && !this.permissionList.TIMEKEEPING_OTHERSisViewOnly) {
            this.router.navigate(['/timekeeping/my-timesheet']);
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  /**
   * getAllTimesheets
   */
  public getAllTimesheets() {
    if (this.loggedinUser) {
      const param = {
        personId: this.loggedinUser.id,
        startSunOfWeek: this.startDate.toDateString(),
        endSatOfWeek: this.endDate.toDateString()
      };

      this.clockService
        .v1ClockTenantAllTimesheetInfoPersonIdGet(param)
        .subscribe(
          suc => {
            const res: any = suc;
            this.alltmesheetInfo = JSON.parse(res).results;
            this.pageTitle.setTitle('All Timesheet');
            let list = this.alltmesheetInfo.employeeList || [];
            list.forEach(i => {
              if (i.isCompany) {
                i['name'] = i.companyName;
              } else {
                i['name'] = i.lastName + ', ' + i.firstName;
              }
            });
            list = _.orderBy(list, 'name', 'asc');

            if (this.permissionList.TIMEKEEPING_SELFisNoVisibility) {
              list = list.filter(a => a.id != this.loggedinUser.id);
            }

            this.rows = [...list];
            this.oriArr = [...this.rows];

            this.page.totalElements = this.rows.length;
            this.page.totalPages = calculateTotalPages(
              this.page.totalElements,
              this.page.size
            );

            this.getStateList(this.rows);

            this.myTimesheetDetail = this.alltmesheetInfo.myTimesheetInfo;
            const lia = this.myTimesheetDetail.map(a => a.matterClientClocks);
            this.getAllInfo(lia);
            this.loading = false;
          },
          err => {
            console.log(err);
            this.loading = false;
          }
        );
    }
  }

  getAllInfo(data) {
    let billableHour = 0;
    let billableMin = 0;
    let nonbillableHour = 0;
    let nonbillableMin = 0;
    let BillableRate = 0;
    let NonBillableRate = 0;
    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        if (item) {
          for (let k = 0; k < item.disbursementTypes.length; k++) {
            const dType = item.disbursementTypes[k];
            if (dType.isBillableToClient) {
              billableHour += dType.hours;
              billableMin += dType.minutes;
              const tmin = dType.hours * 60 + dType.minutes;

              if (!item.isFixedFeeMatter) {
                if (dType.billType && dType.billType.code == 'HOURLY') {
                  BillableRate += tmin * (dType.rate / 60);
                } else {
                  BillableRate += dType.rate;
                }
              }
            } else {
              nonbillableHour += dType.hours;
              nonbillableMin += dType.minutes;

              if (!item.isFixedFeeMatter) {
                const tmin = dType.hours * 60 + dType.minutes;

                if (dType.billType && dType.billType.code == 'HOURLY') {
                  NonBillableRate += tmin * (dType.rate / 60);
                } else {
                  NonBillableRate += dType.rate;
                }
              }
            }
          }
        }
      }
    }

    this.totalHours = this.gethoursInString(
      billableHour + nonbillableHour,
      billableMin + nonbillableMin
    );
    this.TotalRate = BillableRate + NonBillableRate;
    this.myTimeLoading = false;
  }

  private gethoursInString(hour, min) {
    const tmin = hour * 60 + min;
    const hours = Math.floor(tmin / 60);
    const minutes = tmin % 60;
    return this.getTimeString(hours, minutes);
  }

  getTimeString(hour: string | number, min: string | number) {
    const timeDisplay = localStorage.getItem('timeformat');
    if (min >= 60) {
      hour = +hour + 1;
      min = +min - 60;
    }

    if (timeDisplay === 'jira') {
      return hour + 'h' + ' ' + min + 'm';
    } else if (timeDisplay === 'standard') {
      return hour + ':' + padNumber(+min);
    } else if (timeDisplay === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return (hours + minutes / 60).toFixed(2);
    } else {
      return hour + 'h' + ' ' + min + 'm';
    }
  }

  private getStateList(data: vwFullPerson[]) {
    let stateLst = data
      .filter(obj => obj.primaryOffice !== null)
      .map(({ primaryOffice: { name } }) => name);
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

  updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(
      this.rows.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  public pageChange(e) {
    this.pageSelected = e.page;
  }

  public getStartdate() {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    this.startDate = d;
  }

  public getSelectedState(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public clearFilter(type: string) {
    if (type === 'state') {
      this.selectedState = [];
      this.stateList.forEach(item => (item.checked = false));
      this.title = 'All';
    }
    this.applyFilter();
  }

  public updateFilter(text: any) {
    this.searchString = this.allTimesheetFilterText || '';
    this.applyFilter();
  }

  public applyFilter() {
    const val = !this.searchString ? '' : this.searchString;
    let filterList = [...this.oriArr];

    if (this.selectedState && this.selectedState.length > 0) {
      const states = this.stateList
        .filter((obj: { id: any }) => this.selectedState.includes(obj.id))
        .map(({ name }) => name);
      filterList = filterList.filter(item => {
        if (
          item.primaryOffice &&
          item.primaryOffice.name &&
          states.indexOf(item.primaryOffice.name) !== -1
        ) {
          return item;
        }
      });
    }

    if (this.selectedStatus) {
      filterList = filterList.filter(item => {
        if (item && item.isVisible === (this.selectedStatus === 'true')) {
          return item;
        }
      });
    }

    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'primaryOffice') ||
          this.matchName(item, val, 'firstName') ||
          this.matchName(item, val, 'lastName') ||
          UtilsHelper.matchFullEmployeeName(item, val) ||
          this.matchName(item, val, 'companyName') ||
          this.matchName(item, val, 'jobTitle') ||
          this.matchName(item, val, 'clientName')
      );
    }

    this.rows = filterList;
    this.table.offset = 0;
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'clientName') {
      if (item.companyName) {
        searchName = item.companyName
          ? item.companyName.toString().toUpperCase()
          : '';
      } else {
        searchName = item.lastName
          ? item.lastName
              .toString()
              .toUpperCase()
              .trim() +
            ',' +
            item.firstName
              .toString()
              .toUpperCase()
              .trim()
          : item.firstName
              .toString()
              .toUpperCase()
              .trim();
      }
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return (
      searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ',')) > -1
    );
  }

  openTimesheet(row: vwFullPerson) {
    if (this.loggedinUser && row.id == this.loggedinUser.id) {
      this.router.navigate(['/timekeeping/my-timesheet']);
    } else {
      this.router.navigate(['/timekeeping/my-timesheet'], {
        queryParams: {
          personId: row.id,
          name: row.firstName + ' ' + row.lastName
        }
      });
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
