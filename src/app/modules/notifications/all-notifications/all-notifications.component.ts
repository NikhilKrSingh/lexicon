import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as Constant from 'src/app/modules/shared/const';
import { SharedDataService } from 'src/app/service/shared-data.service';
import { NotificationService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-all-notifications',
  templateUrl: './all-notifications.component.html',
  styleUrls: ['./all-notifications.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AllNotificationsComponent implements OnInit, OnDestroy {

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pangeSelected = 1;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public counter = Array;

  public viewAllList = [];
  public originalResultList = [];
  public datePipe = new DatePipe('en-US');

  public isLoading = false;
  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private sharedDataService: SharedDataService,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.loadViewAll();
  }

  ngOnDestroy() {
    localStorage.removeItem('clearNotificationCount');
  }

  loadViewAll() {
    this.viewAllList = [];
    this.isLoading = true;
    this.notificationService
      .v1NotificationGetNotificationReadUnreadGet$Response({isAll: true}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          const parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            const viewAllList = parsedRes.results;
            const formatDate = (date: Date) => this.datePipe.transform(date, 'MM/dd/yy');
            const formatTime = (date: Date) => this.datePipe.transform(date, 'hh:mm a');
            viewAllList.forEach(item => {
              if (item.lastUpdated) {
                if (!item.lastUpdated.includes('Z')) {
                  item.lastUpdated = item.lastUpdated + 'Z';
                }
              } else {
                item.lastUpdated =  new Date();
              }
              if (this.checkTodaysDate(item.lastUpdated)) {
                item.notificationDate = formatTime(item.lastUpdated);
              } else {
                item.notificationDate = formatDate(item.lastUpdated);
              }
            });

            this.viewAllList = viewAllList;
            this.originalResultList = JSON.parse(JSON.stringify(viewAllList));

            this.updateDatatableFooterPage();
            this.markAsRead();
          }
        }
        this.isLoading = false;
      }, () => {
        this.viewAllList = [];
        this.updateDatatableFooterPage();
        this.isLoading = false;
      });
  }

  checkTodaysDate(inputDate) {
    const todaysDate = new Date();
    inputDate = new Date(inputDate);
    return inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0);
  }

  markAsRead() {
    const unReadMessageIds = [];
    this.viewAllList.forEach(record => {
      if (!record.markAsRead) {
        unReadMessageIds.push(record.id);
      }
    });

    if (!unReadMessageIds.length) {
      return;
    }

    this.notificationService
    .v1NotificationUpdateMarkAsReadPut$Json$Response({ body: unReadMessageIds }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        const parsedRes = JSON.parse(res.body);
        if (parsedRes != null && parsedRes.results) {
        }
        UtilsHelper.setObject('clearNotificationCount', null);
        this.sharedDataService.changeNotificationCount(0);
      }
    },
    () => {
    });
  }

  openMessage(row) {
    switch (row.category) {
      case 'Matter':
        this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.targetEntityId } });
        break;
      case 'Matters':
        this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.targetEntityId } });
        break;
      case 'Matter Ledger':
          this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.targetEntityId, selectedtab: 'ledger' } });
          break;
      case 'Client':
        this.router.navigate(['/client-view/individual'], { queryParams: { clientId: row.targetEntityId } });
        break;
      case 'Potential Client':
        this.router.navigate(['/contact/view-potential-client'], { queryParams: { clientId: row.targetEntityId, state: 'view' } });
        break;
      case 'Potential Clients':
        this.router.navigate(['/contact/view-potential-client'], { queryParams: { clientId: row.targetEntityId, state: 'view' } });
        break;
      case 'Employee':
        this.router.navigate(['/employee/profile'], { queryParams: { employeeId: row.targetEntityId } });
        break;
      case 'Calendar':
        this.router.navigate(['/calendar/list']);
        break;
      case 'Office':
        this.router.navigate(['/office/detail'], { queryParams: { officeId: row.targetEntityId, state: 'view' } });
        break;
      case 'Profile Billing':
        this.router.navigate(['/employee/profile'], { queryParams: { employeeId: row.targetEntityId } });
        break;
      case 'Pre Bill':
        this.router.navigate(['/billing/pre-bills/list']);
        break;
      case 'Calendar Event':
        this.router.navigate(['/calendar/list'], { queryParams: { eventId: row.targetEntityId } });
        break;
      case 'Timesheet':
        this.router.navigate(['/timekeeping/all-timesheets']);
        break;
      case 'JobFamily':
        this.router.navigate(['/firm/job-families/edit/' + row.targetEntityId]);
        break;
      case 'DMS Path':
        this.router.navigate(['/manage-folders/document'], { queryParams: { folderId: row.targetEntityId } });
        break;
      case 'DMS Matter Folder':
        this.router.navigate(['/manage-folders/document'], { queryParams: { folderId: row.targetEntityId } });
        break;
    }
  }

  getAction(category) {
    let actionName = '';
    switch (category) {
      case 'Matter':
        actionName = 'View Matter';
        break;
      case 'Matters':
        actionName = 'View Matter';
        break;
      case 'Matter Ledger':
        actionName = 'View Matter';
        break;
      case 'Matter Ledger':
          actionName = 'View Billing';
          break;
      case 'Client':
        actionName = 'View Client';
        break;
      case 'Potential Client':
        actionName = 'View Potential Client';
        break;
      case 'Potential Clients':
        actionName = 'View Potential Client';
        break;
      case 'Employee':
        actionName = 'View Employee';
        break;
      case 'Calendar':
        actionName = 'View Calendar';
        break;
      case 'Office':
        actionName = 'View Office';
        break;
      case 'Profile Billing':
        actionName = 'View Billing';
        break;
      case 'Pre Bill':
        actionName = 'View Pre-Bill';
        break;
      case 'Calendar Event':
        actionName = 'View Calendar';
        break;
      case 'Timesheet':
        actionName = 'View Timesheet';
        break;
      case 'JobFamily':
        actionName = 'Edit Job Family';
        break;
      case 'DMS Path':
        actionName = 'View Document';
        break;
      case 'DMS Matter Folder':
        actionName = 'View Document';
        break;

      }
    return actionName;
  }


   /**
    * Change per page size
    *
    */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.originalResultList.length;
    this.page.totalPages = Math.ceil(this.originalResultList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    if (this.table) {
      this.table.offset = 0;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
