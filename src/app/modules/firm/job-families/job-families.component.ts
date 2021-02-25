import { AfterViewInit, Component, NgZone, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NavigationExtras, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { AuthService, EmployeeService, MiscService } from 'src/common/swagger-providers/services';
import { IOffice, Page } from '../../models';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';
import * as fromRoot from './../../../store';
import { JobFamiliesEmployeesComponent } from './job-families-employees/job-families-employees.component';

@Component({
  selector: 'app-job-families',
  templateUrl: './job-families.component.html',
  styleUrls: ['./job-families.component.scss'],
  encapsulation: ViewEncapsulation.Emulated

})
export class JobFamiliesComponent implements OnInit, AfterViewInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) table2: DatatableComponent;

  @ViewChild('actionTemplate', { static: false }) actionTemplate: TemplateRef<any>;

  public columnList: any = [];
  public modalOptions: NgbModalOptions;
  public closeResult: string;
  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public isLoading = false;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page1 = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public title = 'All';
  public filterName = 'Apply Filter';

  public selected = [];
  public officeList: Array<IOffice> = [];
  public callFlag = true;
  public errorData: any = (errorData as any).default;
  public pageSelected1 = 1;
  public counter = Array;
  public permissionList: any = {};
  public currentActive: number;
  public loading = true;
  public jobName = '';
  public isExist = false;
  public isEdit = false;
  public isDelete = false;
  public editRecord: any;
  public deleteRecord: any;
  public message = '';
  public employeeList: any = [];
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private employeeService: EmployeeService,
    private misc: MiscService,
    private authService: AuthService,
    private toastrService: ToastDisplay,
    private exportToCsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private pageTitle: Title,
    private ngZone: NgZone
  ) {
    this.page1.pageNumber = 0;
    this.page1.size = 10;
  }

  ngOnInit() {
    this.pageTitle.setTitle('Job Families');
    this.getDetails();
  }

  ngAfterViewInit() {
    window.onresize = (e) => {
      this.initScrollDetector([this.table]);
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
    window.onresize = () => {
      UtilsHelper.checkDataTableScroller(this.tables);
    };
  }

  /**
   * Get employee list
   */
  public getDetails() {
    this.loading = true;
    this.employeeService.v1EmployeeJobFamilyFromSpGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        const response = JSON.parse(res.body);
        this.rows = response.results;
        this.oriArr = [...this.rows];
        this.updateDatatableFooterPage();
        UtilsHelper.checkDataTableScroller(this.tables);
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  public changePageSize() {
    this.page1.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page1.pageNumber = this.pageSelected1 - 1;
    if (this.pageSelected1 == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }


  public pageChange(e) {
    this.pageSelected1 = e.page;
    UtilsHelper.aftertableInit();
  }

  public searchFilter(event) {
    const val = event.target.value;
    const temp = this.oriArr.filter(item => this.matchName(item, val, 'name'));
    this.rows = [...temp];
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;

    searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';

    return (
      searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ',')) > -1
    );
  }

  open(
    content,
    row: any = null,
    edit: any = false,
    className: any,
    windowClass?: any
  ) {
    if (edit) {
      this.isEdit = true;
      this.editRecord = row;
      this.jobName = row.name;
    }
    this.modalService
      .open(content, {
        size: className,
        windowClass,
        centered: true,
        backdrop: 'static'
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
    this.columnList.forEach(element => (element.isChecked = false));
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  /** update Attorney table footer page1 count */
  updateDatatableFooterPage() {
    this.page1.totalElements = this.rows.length;
    this.page1.totalPages = Math.ceil(this.rows.length / this.page1.size);
    this.page1.pageNumber = 0;
    this.pageSelected1 = 1;
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

  isExistJob(isEdit) {
    const isExist = this.rows.filter(item => {
      if (isEdit) {
        if (
          item.name.toUpperCase() == this.jobName.toUpperCase() &&
          item.id != this.editRecord.id
        ) {
          return item;
        }
      } else {
        if (item.name.toUpperCase() == this.jobName.toUpperCase()) {
          return item;
        }
      }
    });
    if (isExist.length > 0) {
      return (this.isExist = true);
    } else {
      return (this.isExist = false);
    }
  }

  saveJobFamily() {
    this.loading = true;
    const id = this.isEdit ? this.editRecord.id : 0;
    const noOfEmp = this.isEdit ? this.editRecord.numberOfEmployee : 0;
    if (this.isEdit) {
      this.employeeService
        .v1EmployeeJobFamilyPut$Json$Response({
          body: {
            id,
            name: this.jobName,
            numberOfEmployee: noOfEmp
          }
        })
        .subscribe(
          () => {
            this.getDetails();
            this.message = 'Job family updated.';
            setTimeout(() => {
              this.message = null;
            }, 5000);
            this.isEdit = false;
            this.jobName = null;
            this.editRecord = null;
            this.loading = false;
          },
          err => {
            console.log(err);
            this.loading = false;
          }
        );
    } else {
      this.employeeService
        .v1EmployeeJobFamilyPost$Json$Response({
          body: {
            id,
            name: this.jobName,
            numberOfEmployee: noOfEmp
          }
        })
        .subscribe(
          () => {
            this.getDetails();
            this.message = 'Job family created.';
            setTimeout(() => {
              this.message = null;
            }, 5000);
            this.isEdit = false;
            this.jobName = null;
            this.editRecord = null;
            this.loading = false;
          },
          err => {
            console.log(err);
            this.loading = false;
          }
        );
    }
  }

  deleteJob() {
    this.loading = true;
    const id = this.isDelete ? this.deleteRecord.id : 0;
    this.employeeService.v1EmployeeJobFamilyJobfamilyidDelete({ jobfamilyid: id }).subscribe(
      () => {
        this.getDetails();
        this.toastrService.showSuccess('Job family deleted.');
        this.isDelete = false;
        this.isEdit = false;
        this.jobName = null;
        this.editRecord = null;
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  getEmployeeList(jobId) {
    this.loading = true;
    this.employeeService.v1EmployeeJobFamilyUsersJobfamilyidGet$Response({ jobfamilyid: jobId }).subscribe(
      suc => {
        const res: any = suc;
        const response = JSON.parse(res.body);
        this.employeeList = response.results;
        this.updateDatatableFooterPage();
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  redirectEmployeePage(id) {
    this.modalService.dismissAll();
    const navigationExtras: NavigationExtras = {
      queryParams: {
        employeeId: id
      }
    };
    this.router.navigate(['/employee/profile'], navigationExtras);
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  /**** function to open view employee modal */
  viewEmployees(rowId) {
    let modalRef = this.modalService.open(JobFamiliesEmployeesComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });
    modalRef.componentInstance.jobFamilyId = { rowId };
  }

  get footerHeight() {
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
