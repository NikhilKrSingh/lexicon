import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { IOffice } from 'src/app/modules/models/office.model';
import { Page } from 'src/app/modules/models/page';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { BlockService, EmployeeService, MiscService } from 'src/common/swagger-providers/services';
import { ToastDisplay } from '../../../../../guards/toast-service';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-add-blocked-users',
  templateUrl: './add-blocked-users.component.html',
  styleUrls: ['./add-blocked-users.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddBlockedUsersComponent implements OnInit {
  
  @ViewChild(DatatableComponent, { static: false })  employeesTable: DatatableComponent;
  public empOfficeTitle = 'All';
  public selectedOffice: Array<number> = [];
  public dofficeList: Array<IOffice>;
  public filterName = 'Apply Filter';
  public originalEmployeesRows: Array<any> = [];
  public employeesRows: Array<any> = [];
  public ColumnMode = ColumnMode;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public SelectionType = SelectionType;
  public pageEmployee = new Page();
  public pageSelectedEmployee = 1;
  public selectedStatus: Array<number> = [];
  public empStatustitle = 'All';
  public dstatusList: Array<IOffice> = [
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
  public corporateContactLoading: boolean;
  public selectedEmployee: Array<any> = [];
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public pageSelectorEmployee = new FormControl('10');
  public blockDesc: string;
  public clientId;
  public errorData: any = (errorData as any).default;
  public addBlockUserLoading: boolean;
  public blockUserList;
  public alreadyCompanyList;
  allSelected: boolean;

  constructor(
    private activeModal: NgbActiveModal,
    private blockService: BlockService,
    private toastDisplay: ToastDisplay,
    private employeeService: EmployeeService,
    private miscService: MiscService
  ) {}

  ngOnInit() {
    this.pageEmployee.pageNumber = 0;
    this.pageEmployee.size = 10;
    this.clientId = this.clientId.id;
    this.selectedOffice = new Array<number>();
    this.selectedStatus = new Array<number>();
    this.selectedEmployee = new Array<number>();
    this.blockUserList = this.blockUserList.list;
    this.alreadyCompanyList = this.alreadyCompanyList.list
    this.getEmployeeList();
    this.getOffices();
  }

  getEmployeeList(): void {
    this.addBlockUserLoading = true;
    this.employeeService.v1EmployeesGet$Response({}).subscribe(
      (res: any) => {
        this.removeSelection();
        const response = JSON.parse(res.body);
        let users = [];
        if (this.blockUserList) {
          this.blockUserList.forEach(user => {
            users.push(user.id);
          });
          this.employeesRows = response.results.filter((d: any) => {
            return users.indexOf(d.id) == -1;
          }) || [];
        } else {
          this.employeesRows = response.results || [];
        }

        this.employeesRows.forEach(emp => {
          if (emp.lastName) {
            emp.fullName = emp.lastName + ', ' + emp.firstName;
          } else {
            emp.fullName = emp.firstName;
          }
        });
        this.originalEmployeesRows = [...this.employeesRows];

        this.updateFooterforEmployee();
        this.addBlockUserLoading = false;
      },
      () => {
        this.addBlockUserLoading = false;
      }
    );
  }

  public getOffices() {
    this.miscService.v1MiscOfficesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.dofficeList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  cancel() {
    this.activeModal.close(false);
  }

  public selectDropdwnOffice(event: any): void {
    this.empOfficeTitle = '';
    if (event.length > 0) {
      this.empOfficeTitle = event.length;
      const temp = this.originalEmployeesRows.filter(item => {
        if (
          item.primaryOffice &&
          item.primaryOffice.id &&
          event.indexOf(item.primaryOffice.id) !== -1
        ) {
          return item;
        }
      });
      this.resetEmployeesRows(temp);
    } else {
      this.empOfficeTitle = 'All';
      this.resetEmployeesRows(this.originalEmployeesRows);
    }
  }

  private resetEmployeesRows(arr: any) {
    this.employeesRows = [...arr];
    this.employeesTable.offset = 0;
    this.updateFooterforEmployee();
  }

  updateFooterforEmployee() {
    this.pageEmployee.totalElements = this.employeesRows.length;
    this.pageEmployee.totalPages = Math.ceil(
      this.employeesRows.length / this.pageEmployee.size
    );
    // Whenever the filter changes, always go back to the first page
    this.employeesTable.offset = 0;
    this.pageEmployee.pageNumber = 0;
    this.pageSelectedEmployee = 1;
    UtilsHelper.aftertableInit();
    this.checkParentCheckbox();
  }

  /**
   *
   * Clear filter of primary office
   */
  public clearFilterPrimaryOffice() {
    this.selectedOffice = [];
    this.dofficeList.forEach(item => (item.checked = false));
    this.employeesRows = [...this.originalEmployeesRows];
    this.empOfficeTitle = 'All';
    this.applyFilterPrimaryOffice();
  }

  /**
   * Apply filter for primary office
   *
   */
  public applyFilterPrimaryOffice() {
    if (
      this.selectedOffice &&
      this.selectedOffice.length > 0 &&
      this.selectedStatus &&
      this.selectedStatus.length > 0
    ) {
      const temp = this.originalEmployeesRows.filter(item => {
        if (
          item.primaryOffice &&
          item.primaryOffice.id &&
          this.selectedOffice.indexOf(item.primaryOffice.id) !== -1 &&
          this.selectedStatus.indexOf(item.isVisible ? 1 : 2) !== -1
        ) {
          return item;
        }
      });
      // update the rows
      this.resetEmployeesRows(temp);
    } else if (this.selectedOffice && this.selectedOffice.length > 0) {
      const temp = this.originalEmployeesRows.filter(item => {
        if (
          item.primaryOffice &&
          item.primaryOffice.id &&
          this.selectedOffice.indexOf(item.primaryOffice.id) !== -1
        ) {
          return item;
        }
      });
      this.resetEmployeesRows(temp);
    } else if (this.selectedStatus && this.selectedStatus.length > 0) {
      const temp = this.originalEmployeesRows.filter(item => {
        if (this.selectedStatus.indexOf(item.isVisible ? 1 : 2) !== -1) {
          return item;
        }
      });
      this.resetEmployeesRows(temp);
    } else {
      this.resetEmployeesRows(this.originalEmployeesRows);
    }
  }

  /**
   * select status drop down
   *
   */
  public selectEmployeeStatus(event) {
    this.empStatustitle = '';
    if (event.length > 0) {
      this.empStatustitle = event.length;
      const temp = this.originalEmployeesRows.filter(item => {
        if (event.indexOf(item.isVisible ? 1 : 2) !== -1) {
          return item;
        }
      });
      this.resetEmployeesRows(temp);
    } else {
      this.empStatustitle = 'All';
      this.resetEmployeesRows(this.originalEmployeesRows);
    }
  }

  public clearStatusFilter() {
    this.selectedStatus = [];
    this.dstatusList.forEach(item => (item.checked = false));
    this.empStatustitle = 'All';
    this.applyFilterPrimaryOffice();
  }

  searchEmployee(event: any): void {
    const val = event.target.value;
    const temp = this.originalEmployeesRows.filter(
      item =>
        this.matchName(item, val, 'firstName') ||
        this.matchName(item, val, 'email') ||
        this.matchName(item, val, 'primaryOffice') ||
        this.matchName(item, val, 'jobTitle') ||
        this.matchName(item, val, 'lastName')
    );
    this.resetEmployeesRows(temp);
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    let searchName;
    if (fieldName === 'createdBy' || fieldName === 'primaryOffice') {
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

  public onSelectEmployee({ selected }): void {
    this.selectedEmployee.splice(0, this.selectedEmployee.length);
    this.selectedEmployee.push(...selected);
  }

  onActivate(event) {
    if (event.type == 'click' && event.value !== '') {
      event.rowElement.querySelector('[type="checkbox"]').click();
    }
  }

  /**
   * Change Page size from Paginator
   */
  changePageSizeEmployee() {
    this.pageEmployee.size = +this.pageSelectorEmployee.value;
    this.updateFooterforEmployee();
  }

  public changePageEmployee() {
    this.pageEmployee.pageNumber = Number(this.pageSelectedEmployee) - 1;
    if (Number(this.pageSelectedEmployee) == 1) {
      this.updateFooterforEmployee();
    }
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  private calcTotalPagesEmployee() {
    this.pageEmployee.totalElements = this.employeesRows.length;
    this.pageEmployee.totalPages = Math.ceil(
      this.employeesRows.length / this.pageEmployee.size
    );
    // Whenever the filter changes, always go back to the first page
    this.employeesTable.offset = 0;
    this.pageEmployee.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  /**
   * Handle change page number
   */
  public pageChangeEmployee(e) {
    this.pageSelectedEmployee = Number(e.page);
    this.changePageEmployee();
  }

  public saveSelectedBlockUser() {
    if (this.selectedEmployee.length) {
      const selectedID: any = this.selectedEmployee.map((value, index) => {
        const data = {
          personId: value['id'],
          targetPersonId: this.clientId,
          description: this.blockDesc
        };
        return data;
      });

      this.blockService
        .v1BlockPost$Json$Response({ body: selectedID })
        .subscribe(
          (res: any) => {
            this.toastDisplay.showSuccess(
              this.errorData.employee_blocked_success
            );
            this.activeModal.close(true);
          },
          err => {}
        );
    }
  }


  get footerHeight() {
    if (this.employeesRows) {
      return this.employeesRows.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.employeesTable.bodyComponent.temp.forEach(row => {
      const index = this.employeesRows.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.employeesRows[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selectedEmployee.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selectedEmployee.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selectedEmployee.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selectedEmployee.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selectedEmployee.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selectedEmployee.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.employeesRows.forEach(list => {
      const selectedIds = this.selectedEmployee.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.employeesTable.bodyComponent.temp.forEach(row => {
        const existing = this.employeesRows.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    if (this.employeesRows && this.employeesRows.length) {
      this.employeesRows.forEach(list => {
        list['selected'] = false;
      });
    }
    this.selectedEmployee = [];
    this.checkParentCheckbox();
  }
}
