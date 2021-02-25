import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { IOffice, Page } from 'src/app/modules/models';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwIdName } from 'src/common/swagger-providers/models';
import { EmployeeService, MatterService, MiscService } from 'src/common/swagger-providers/services';
import * as errors from '../../../../shared/error.json';

@Component({
  selector: 'app-blocked-employee',
  templateUrl: './blocked-employee.component.html',
  styleUrls: ['./blocked-employee.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddBlockedEmployeeComponent implements OnInit {
  private originalEmployeesRows: Array<any> = [];
  selectedRows: Array<any> = [];
  employeesRows: Array<any> = [];

  alreadyBlockedEmployees: Array<number> = [];
  matterId: number;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];

  public pageSelected = 1;

  @ViewChild(DatatableComponent, { static: false })  employeesTable: DatatableComponent;

  officeList: Array<IOffice>;
  statusList: Array<IOffice>;

  public selectedOffice: Array<number> = [];
  public selectedStatus: Array<number> = [];
  public searchText: string;

  public empOfficeTitle: string = 'All';
  public empStatustitle: string = 'All';
  public filterName: string = 'Apply Filter';

  changeStatusNotes: string;
  error_data = (errors as any).default;

  loading = true;
  allSelected: boolean;

  constructor(
    private matterService: MatterService,
    private activeModal: NgbActiveModal,
    private miscService: MiscService,
    private employeeService: EmployeeService
  ) {
    this.page.size = 10;
    this.page.pageNumber = 0;
    this.officeList = [];
    this.statusList = [
      {
        id: 1,
        name: 'Active'
      },
      {
        id: 2,
        name: 'Inactive'
      }
    ];
  }

  ngOnInit() {
    this.getOffices();
    this.getEmployeeList();
  }

  /**
   * Get employee list
   *
   */
  private getEmployeeList(): void {
    this.employeeService
      .v1EmployeesGet$Response({})
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res: any) => {
        this.removeSelection();
        let response = JSON.parse(res.body);
        if (response.results) {
          if (this.alreadyBlockedEmployees.length) {
            response.results = response.results.filter(
              item => this.alreadyBlockedEmployees.indexOf(item.id) == -1
            );
          }
          this.employeesRows = response.results || [];
        }

        this.employeesRows = this.employeesRows.sort((a, b) =>
          a.lastName.localeCompare(b.lastName)
        );

        this.employeesRows.forEach(employee => {
          employee.fullName = employee.lastName
            ? employee.lastName + ', ' + employee.firstName
            : employee.firstName;
        });

        this.originalEmployeesRows = [...this.employeesRows];

        this.page.totalElements = this.employeesRows.length;
        this.page.totalPages = Math.ceil(
          this.employeesRows.length / this.page.size
        );
        this.page.pageNumber = 0;
        this.pageSelected = 1;

        // Whenever the filter changes, always go back to the first page
        this.employeesTable.offset = 0;
        this.updateDatatableFooterPage();
      });
  }

  private populateSelectedEmployees() {
    this.originalEmployeesRows.forEach(e => {
      if (this.alreadyBlockedEmployees.indexOf(e.id) > -1) {
        this.selectedRows.push(e);
      }
    });
  }

  private getOffices() {
    this.miscService
      .v1MiscOfficesGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdName>;
        })
      )
      .subscribe(res => {
        this.officeList = res;
      });
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
   *
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.employeesRows.length;
    this.page.totalPages = Math.ceil(
      this.employeesRows.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    this.employeesTable.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
    this.checkParentCheckbox();
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   */
  public pageChange(e) {
    this.pageSelected = e.page;
    this.changePage();
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect({ selected }) {
    this.selectedRows.splice(0, this.selectedRows.length);
    this.selectedRows.push(...selected);
  }

  /**
   * select primary office drop down
   *
   * @param {*} event
   */
  public selectDropdwnOffice(event: any): void {
    this.empOfficeTitle = '';
    if (event.length > 0) {
      this.empOfficeTitle = event.length;
    } else {
      this.empOfficeTitle = 'All';
    }
  }

  /**
   *
   * Clear filter of primary office
   */
  public clearFilterPrimaryOffice() {
    this.selectedOffice = [];
    this.officeList.forEach(item => (item.checked = false));
    this.employeesRows = [...this.originalEmployeesRows];
    this.empOfficeTitle = 'All';
    this.applyFilter();
  }

  /**
   * Apply filter for primary office
   *
   */
  public applyFilter() {
    if (
      this.selectedOffice &&
      this.selectedOffice.length > 0 &&
      this.selectedStatus &&
      this.selectedStatus.length > 0
    ) {
      let temp = this.originalEmployeesRows.filter(item => {
        if (
          item.primaryOffice &&
          item.primaryOffice.id &&
          this.selectedOffice.indexOf(item.primaryOffice.id) !== -1 &&
          this.selectedStatus.indexOf(item.isVisible ? 1 : 2) !== -1
        ) {
          return item;
        }
      });

      temp = this.applyFilterForSearchText(temp);

      // update the rows
      this.employeesRows = temp;
      // Whenever the filter changes, always go back to the first page
      this.employeesTable.offset = 0;
      this.updateDatatableFooterPage();
    } else if (this.selectedOffice && this.selectedOffice.length > 0) {
      let temp = this.originalEmployeesRows.filter(item => {
        if (
          item.primaryOffice &&
          item.primaryOffice.id &&
          this.selectedOffice.indexOf(item.primaryOffice.id) !== -1
        ) {
          return item;
        }
      });

      temp = this.applyFilterForSearchText(temp);

      // update the rows
      this.employeesRows = temp;
      // Whenever the filter changes, always go back to the first page
      this.employeesTable.offset = 0;
      this.updateDatatableFooterPage();
    } else if (this.selectedStatus && this.selectedStatus.length > 0) {
      let temp = this.originalEmployeesRows.filter(item => {
        if (this.selectedStatus.indexOf(item.isVisible ? 1 : 2) !== -1) {
          return item;
        }
      });

      temp = this.applyFilterForSearchText(temp);

      // update the rows
      this.employeesRows = temp;
      // Whenever the filter changes, always go back to the first page
      this.employeesTable.offset = 0;
      this.updateDatatableFooterPage();
    } else {
      let temp = [...this.originalEmployeesRows];
      temp = this.applyFilterForSearchText(temp);

      this.employeesRows = temp;
      this.employeesTable.offset = 0;
      this.updateDatatableFooterPage();
    }
  }

  private applyFilterForSearchText(temp: Array<any>) {
    if (this.searchText) {
      temp = temp.filter(
        item =>
          UtilsHelper.matchName(item, this.searchText, 'firstName') ||
          UtilsHelper.matchName(item, this.searchText, 'middleName') ||
          UtilsHelper.matchName(item, this.searchText, 'lastName') ||
          UtilsHelper.matchFullEmployeeName(item, this.searchText) ||
          UtilsHelper.matchName(item, this.searchText, 'jobTitle') ||
          UtilsHelper.matchName(item, this.searchText, 'email')
      );
    }

    return temp;
  }

  /**
   * select status drop down
   *
   * @param {*} event
   */
  public selectEmployeeStatus(event) {
    this.empStatustitle = '';
    if (event.length > 0) {
      this.empStatustitle = event.length;
    } else {
      this.empStatustitle = 'All';
    }
  }

  /**
   * Clear status filter
   *
   */
  public clearStatusFilter() {
    this.selectedStatus = [];
    this.statusList.forEach(item => (item.checked = false));
    this.empStatustitle = 'All';
    this.applyFilter();
  }

  cancel() {
    this.activeModal.close(false);
  }

  save() {
    if (this.selectedRows) {
      this.selectedRows.forEach(a => {
        a['description'] = this.changeStatusNotes;
      });
    }

    this.activeModal.close(this.selectedRows);
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
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
      const existingIndex = this.selectedRows.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selectedRows.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selectedRows.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selectedRows.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selectedRows.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selectedRows.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.employeesRows.forEach(list => {
      const selectedIds = this.selectedRows.filter(selected => selected.id === list.id);
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
    this.employeesRows.forEach(list => {
      list['selected'] = false;
    })
    this.selectedRows = [];
    this.checkParentCheckbox();
  }
}
