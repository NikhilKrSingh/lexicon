import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Page } from '../../../models';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { UtilsHelper } from '../../../shared/utils.helper';
import { EmployeeService } from 'src/common/swagger-providers/services';
import { FormControl } from '@angular/forms';
import * as Constant from 'src/app/modules/shared/const';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-job-families-employees',
  templateUrl: './job-families-employees.component.html',
  styleUrls: ['./job-families-employees.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class JobFamiliesEmployeesComponent implements OnInit {
  public jobFamilyId;
  public employeeList: any = [];
  public page2 = new Page();
  @ViewChild(DatatableComponent, { static: false }) tableEe: DatatableComponent;
  public pageSelected2 = 1;
  public loading = true;
  public pageSelector2 = new FormControl('10');
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public limitArray: Array<number> = [10, 30, 50, 100];
  public counter2 = Array;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;

  constructor(
    private activeModal: NgbActiveModal,
    private employeeService: EmployeeService,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.page2.pageNumber = 0;
    this.page2.size = 10;
  }

  ngOnInit() {
    this.getEmployeeList();
  }

  cancel() {
    this.activeModal.close(false);
  }

  updateDatatableFooterPage2() {
    this.page2.totalElements = this.employeeList.length;
    this.page2.totalPages = Math.ceil(
      this.employeeList.length / this.page2.size
    );
    this.tableEe.offset = 0;
    this.page2.pageNumber = 0;
    this.pageSelected2 = 1;
    UtilsHelper.aftertableInit();
  }

  getEmployeeList() {
    this.loading = true;
    this.employeeService
      .v1EmployeeJobFamilyUsersJobfamilyidGet$Response({
        jobfamilyid: this.jobFamilyId.rowId
      })
      .subscribe(
        suc => {
          const res: any = suc;
          const response = JSON.parse(res.body);
          this.employeeList = response.results;
          this.updateDatatableFooterPage2();
          this.loading = false;
        },
        err => {
          console.log(err);
          this.loading = false;
        }
      );
  }

  public changePageSize2() {
    this.page2.size = +this.pageSelector2.value;
    this.updateDatatableFooterPage2();
  }

  public changePage2() {
    this.page2.pageNumber = this.pageSelected2 - 1;
    if (this.pageSelected2 == 1) {
      this.updateDatatableFooterPage2();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange2(e) {
    this.pageSelected2 = e.page;
    UtilsHelper.aftertableInit();
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

  get footerHeight() {
    if (this.employeeList) {
      return this.employeeList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
