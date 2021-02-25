import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { vwResultSet } from '../../../../../common/models/vwResultSet';
import { vwEmployee } from '../../../../../common/swagger-providers/models';
import { EmployeeService } from '../../../../../common/swagger-providers/services';
import { Page } from '../../../models';
import { UtilsHelper } from '../../../shared/utils.helper';

@Component({
  selector: 'app-add-users',
  templateUrl: './add-users.component.html',
  styleUrls: ['./add-users.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddUsersComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false })  employeeTable: DatatableComponent;

  public Offices;
  public primaryOfficeId: number;
  public addLoading: boolean;
  public searchOfficeEmployee: string = '';
  public oriOfficeEmployees: Array<vwEmployee>;
  public OfficeEmployees: Array<vwEmployee>;
  public page = new Page();
  public pangeSelected: number = 1;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected: Array<any>;
  public messages = {
    emptyMessage: 'No data found.'
  };
  public pageSelector = new FormControl('10');
  public alreadyAddedUsers;

  constructor(
    private activeModal: NgbActiveModal,
    private EmpService: EmployeeService
  ) {}

  ngOnInit() {
    this.Offices = this.Offices.offices;
    this.alreadyAddedUsers = this.alreadyAddedUsers.employees;
    this.OfficeEmployees = new Array<vwEmployee>();
    this.selected = new Array<number>();
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.searchOfficeEmployee = '';
    this.primaryOfficeId = null;
    this.getUsers();
  }

  cancel() {
    this.activeModal.close(false);
  }

  /***
   * function to assign employee data
   */
  assignEmpData(data: any) {
    this.oriOfficeEmployees = data;
    this.OfficeEmployees = [...this.oriOfficeEmployees];
    this.OfficeEmployees = this.OfficeEmployees.filter(
      a => a.role && a.role.some(r => r.name == 'Employee')
    );

    this.oriOfficeEmployees = [...this.OfficeEmployees];

    this.OfficeEmployees.forEach(employee => {
      employee['status'] =
        !employee.isActivated && employee.isVisible
          ? 'Pending'
          : employee.isVisible
          ? 'Active'
          : 'Inactive';
    });

    this.updateDatatableFooterPage();
  }

  /***
   * function to get users
   */
  async getUsers(): Promise<any> {
    this.addLoading = true;
    this.oriOfficeEmployees = [];
    this.OfficeEmployees = [];
    try {
      let resp: any = await this.EmpService.v1EmployeesGet$Response().toPromise();
      this.addLoading = false;
      resp = JSON.parse(resp.body);

      let users =[];
      let result;
      if (this.alreadyAddedUsers) {
        this.alreadyAddedUsers.forEach(user => {
          users.push(user.id)
        })
        result = resp.results.filter((d: any) => {
          return users.indexOf(d.id) == -1
        });
        this.assignEmpData(result);
      } else {
        result = resp.results
        this.assignEmpData(result);
      }
    } catch (err) {
      this.addLoading = false;
    }
  }

  /**** function to apply when primary office changed */
  public applyFilter() {
    let rows = [...this.oriOfficeEmployees];

    if (this.primaryOfficeId) {
      rows = rows.filter(a => a.primaryOffice && a.primaryOffice.id == this.primaryOfficeId);
    }

    this.OfficeEmployees = [...rows];

    if (this.searchOfficeEmployee) {
      rows = rows.filter(
        item =>
          this.matchName(item, this.searchOfficeEmployee, 'firstName') ||
          this.matchName(item, this.searchOfficeEmployee, 'email') ||
          this.matchName(item, this.searchOfficeEmployee, 'primaryOffice') ||
          this.matchName(item, this.searchOfficeEmployee, 'jobTitle') ||
          this.matchName(item, this.searchOfficeEmployee, 'middleName') ||
          this.matchName(item, this.searchOfficeEmployee, 'lastName')
      );
    }

    this.OfficeEmployees = [...rows]
    this.updateDatatableFooterPage();
  }

  /**
   * search record from tables
   *
   * @private
   * @param {*} item
   * @param {string} searchValue
   * @param {*} fieldName
   * @returns {boolean}
   * @memberof ListComponent
   */
  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName]['name']
          ? item[fieldName]['name'].toString().toUpperCase()
          : '';
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  /** update table footer page count */
  public updateDatatableFooterPage() {
    this.page.totalElements = this.OfficeEmployees.length;
    this.page.totalPages = Math.ceil(
      this.OfficeEmployees.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.employeeTable.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  saveAddUsers() {
    this.activeModal.close({selected: this.selected, officeEmployees: this.OfficeEmployees});
  }

  get footerHeight() {
    if (this.OfficeEmployees) {
      return this.OfficeEmployees.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
