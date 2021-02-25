import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import {
  CalendarService, DocumentPortalService, DocumentSettingService, WorkFlowService
} from 'src/common/swagger-providers/services';
import * as errorData from '../../../modules/shared/error.json';
import { Page } from '../../models';

@Component({
  selector: 'app-dash',
  templateUrl: './dash.component.html',
  styleUrls: ['./dash.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DashComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public errorData: any = (errorData as any).default;
  public activeTasksList: Array<any>;
  public oriactiveTasksList: Array<any>;
  public filterOptions = [
    { id: 1, name: 'All' },
    { id: 2, name: 'Completed' },
    { id: 3, name: 'Incomplete' }
  ];
  public selectedFilter = 3;
  public completedTaskId: number;
  public statusList: Array<any>;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public pageSelected = 1;
  public showTaskList = false;
  public subscription: any;
  userDetails = JSON.parse(localStorage.getItem('profile'));
  redirectUrl: string;

  loading = true;

  constructor(
    private documentSettingService: DocumentSettingService,
    private workflowService: WorkFlowService,
    private toastr: ToastDisplay,
    private router: Router,
    private sharedService: SharedService,
    private activatedRoute: ActivatedRoute,
    private pageTitle: Title,
    private calendarService: CalendarService,
    private portalService: DocumentPortalService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pageTitle.setTitle('Dashboard');
  }

  ngOnInit() {
    this.CreateFoldersForPracticeArea();
    this.subscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        if (res) {
          this.showTaskList = true;
          this.getStatusList();
        }
        const userDetails = JSON.parse(localStorage.getItem('profile'));
        if (localStorage.getItem('fileId')) {
          this.portalService
            .v1DocumentPortalFilesParentFolderHashedFileIdGet({
              hashedFileId: localStorage.getItem('fileId')
            })
            .subscribe(
              s => {
                const res = JSON.parse(s as any);
                if (res) {
                  let sharedFolderId = res.results;
                  console.log(22, sharedFolderId);
                  this.router.navigate(['/manage-folders/document'], {
                    queryParams: { folderId: sharedFolderId }
                  });
                }
              },
              error => {
                this.loading = false;
              }
            );
        } else {
          if (!this.showTaskList) {
            this.router.navigate(['/timekeeping']);
          }
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public CreateFoldersForPracticeArea() {
    this.documentSettingService
      .v1DocumentSettingCreatefoldersforpracticeareaGet()
      .subscribe(
        suc => {
        },
        err => {}
      );
  }

  getActiveTasks() {
    this.workflowService.v1WorkFlowTasksActivetasksGet().subscribe(
      res => {
        const list = JSON.parse(res as any).results;
        this.oriactiveTasksList = list;
        list.forEach((obj, index) => {
          const dueDate = obj.dueDate.split('T');
          const currentDate = moment(new Date()).format('YYYY-MM-DD');
          obj.isOverDue = moment(dueDate[0]).isBefore();
          obj.isSame = moment(dueDate[0]).isSame(currentDate);
          this.oriactiveTasksList[index].isOverDue = obj.isOverDue;
        });
        this.activeTasksList = [...this.oriactiveTasksList];
        this.filterTasks();
        this.loading = false;
      },
      err => {
        this.loading = false;
      }
    );
  }

  filterTasks(event?: any) {
    if (event && event.id) {
      switch (this.selectedFilter) {
        case 1:
          this.selectedFilter = 1;
          this.activeTasksList = [...this.oriactiveTasksList];
          break;
        case 2:
          this.activeTasksList = this.oriactiveTasksList.filter(
            obj => obj.taskStatusId === this.completedTaskId
          );
          break;
        case 3:
          this.activeTasksList = this.oriactiveTasksList.filter(
            obj => obj.taskStatusId !== this.completedTaskId
          );
          break;
      }
    } else {
        this.selectedFilter = 3;
        this.activeTasksList = this.oriactiveTasksList.filter(
          obj => obj.taskStatusId !== this.completedTaskId
        );
    }
    this.updateFooterPage();
  }

  getStatusList() {
    this.workflowService.v1WorkFlowTaskStatusesGet().subscribe(
      res => {
        const list = JSON.parse(res as any).results.workFlowTaskStatuses;
        const row = list.filter(obj => obj.name.toLowerCase() === 'completed');
        this.completedTaskId = row[0].id;
        this.getActiveTasks();
      },
      err => {
        this.loading =false;
      }
    );
  }

  markTaskAsComplete(row) {
    if (row.taskStatusId === this.completedTaskId) {
      return;
    }
    const data = [
      {
        id: row.taskId,
        taskStatusId: this.completedTaskId,
        matterId: row.matterId,
        workflowId: row.workflowId
      }
    ];
    this.workflowService
      .v1WorkFlowTasksUpdateStatusPost$Json({ body: data })
      .subscribe(
        res => {
          this.toastr.showSuccess(this.errorData.task_complete_success);
          this.getActiveTasks();
        },
        err => {}
      );
  }

  /** update Associations table footer page count */
  updateFooterPage() {
    if (this.showTaskList) {
      this.page.totalElements = this.activeTasksList.length;
      this.page.totalPages = Math.ceil(
        this.activeTasksList.length / this.page.size
      );
      this.page.pageNumber = 0;
      this.pageSelected = 1;
      // Whenever the filter changes, always go back to the first page
      this.table.offset = 0;
    }
  }

  public pageChange(e) {
    this.pageSelected = e.page;
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateFooterPage();
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.activeTasksList) {
      return this.activeTasksList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}

