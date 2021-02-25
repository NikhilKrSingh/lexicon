import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { IOffice, Page } from 'src/app/modules/models';
import { CreateNoteError } from 'src/app/modules/models/fillable-form.model';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwIdName } from 'src/common/swagger-providers/models';
import { EmployeeService, MatterService, MiscService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-add-blocked-employee',
  templateUrl: './add-blocked-employee.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class AddBlockedEmployeeComponent implements OnInit {
  private originalEmployeesRows: Array<any> = [];
  selectedRows: Array<any> = [];
  employeesRows: Array<any> = [];

  alreadyBlockedEmployees: Array<number> = [];
  matterId: number;
  clientId: number;

  public footerHeight = 50;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];

  public pageSelected = 1;

  @ViewChild(DatatableComponent, { static: false }) employeesTable: DatatableComponent;

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
  public loading: boolean = true;
  createNoteError: CreateNoteError;

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
    this.createNoteError = new CreateNoteError();
  }

  ngOnInit() {
    this.loading = true;
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
        let response = JSON.parse(res.body);
        this.employeesRows = response.results;
        this.originalEmployeesRows = [...this.employeesRows];
        this.updateDatatableFooterPage();
        this.populateSelectedEmployees();
        UtilsHelper.aftertableInit();
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
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   */
  public pageChange(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
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
    } else {
      let temp = [...this.originalEmployeesRows];
      temp = this.applyFilterForSearchText(temp);

      this.employeesRows = temp;
      this.employeesTable.offset = 0;
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
          UtilsHelper.matchName(item, this.searchText, 'email') ||
          UtilsHelper.matchName(item, this.searchText, 'primaryOffice')
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
    let firstChar: string;
    if (this.changeStatusNotes) {
      firstChar = this.changeStatusNotes.charAt(0)
    }
    const pattern = '[a-zA-Z0-9_]'
    if (this.changeStatusNotes && !firstChar.match(pattern)) {
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.error_data.insecure_input;
    } else {
      if (this.selectedRows) {
        this.selectedRows.forEach(a => {
          a['description'] = this.changeStatusNotes;
        });
      }
      this.activeModal.close(this.selectedRows);
    }
  }

  /** update Attorney table footer page count */
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
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
