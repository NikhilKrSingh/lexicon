import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { Page } from 'src/app/modules/models';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { EmployeeService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-employee-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class GroupsComponent implements OnInit {
  @Input() employeeId: number;

  groups: Array<any> = [];

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected: number = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  loading = true;

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.employeeService
      .v1EmployeeGroupsEmployeeIdGet({
        employeeId: this.employeeId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.loading = false;
            this.groups = res || [];

            this.page.totalElements = this.groups.length;
            this.page.totalPages = Math.ceil(
              this.groups.length / this.page.size
            );
            this.updateDatatableFooterPage();
          } else {
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.groups.length;
    this.page.totalPages = Math.ceil(this.groups.length / this.page.size);
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  onSelectGroup($event) {
    if ($event.type === 'click') {
      this.viewGroup($event.row.securityGroupId);
    }
  }

  public viewGroup(securityGroupId) {
    this.router.navigate(['/access-management/create'], {
      queryParams: { groupId: securityGroupId, employeeId: this.employeeId }
    });
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.groups) {
      return this.groups.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
