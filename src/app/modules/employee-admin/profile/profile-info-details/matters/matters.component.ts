import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { map } from 'rxjs/operators';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { vwEmployee } from 'src/common/swagger-providers/models';
import { EmployeeService } from 'src/common/swagger-providers/services';



@Component({
  selector: 'app-employee-profile-matters',
  templateUrl: './matters.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeProfileMattersComponent implements OnInit {
  @Input() employee: vwEmployee;

  public ColumnMode = ColumnMode;
  public page = {
    size: 10,
    // The total number of elements
    totalElements: 0,
    // The total number of pages
    totalPages: 0,
    // The current page number
    pageNumber: 0,
    pageSize: 0
  };
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pangeSelected: number = 1;
  public counter = Array;
  @ViewChild(DatatableComponent, { static: false }) public table: DatatableComponent;
  public matterList: Array<any> = [];
  public originalMatterList = [];
  public searchText: string;
  public loading = true;

  constructor(private employeeService: EmployeeService,private router: Router,) {}

  ngOnInit() {
    if (this.employee) {
      this.employeeService
        .v1EmployeeMattersEmployeeIdGet({
          employeeId: this.employee.id
        })
        .pipe(
          map(
            res => {
              return JSON.parse(res as any).results as any[];
            }, error => {
              this.loading = false;
            }
          )
        )
        .subscribe(matters => {
          matters = matters || [];

          matters.forEach(row => {
            if (row.clientName) {
              if (row.clientName.isCompany) {
                row['client_name'] = row.clientName.company;
              } else {
                row['client_name'] = row.clientName.lastName
                  ? row.clientName.lastName + ', ' + row.clientName.firstName
                  : row.clientName.firstName;
              }
            }

            if (row.practiceArea && row.practiceArea.length > 0) {
              row['practice_area_name'] = row.practiceArea[0].name;
            }

            if (row.myRole) {
              row.myRole = row.myRole.split('  ');
            }
          });

          this.originalMatterList = matters;
          this.matterList = [...this.originalMatterList];
          this.calcTotalPages();
          this.loading = false;
        }, () => {
          this.loading = false;
        });
    } else {
      this.loading = false;
    }
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = Number(this.pageSelector.value);
    this.calcTotalPages();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected -1;
    if (this.pangeSelected == 1) {
      this.calcTotalPages();
    }
  }

  /**
   * Handle change page numbe
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.matterList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
  }

  /**
   * Apply filter
   *
   * @memberof EmployeeProfileMattersComponent
   */
  public applyFilter() {
    if (this.searchText && this.searchText.trim() != '') {
      let searchTerm = this.searchText.trim().toLowerCase();

      this.matterList = this.originalMatterList.filter(a => {
        return (
          String(a.matterNumber)
            .toLowerCase()
            .includes(searchTerm) ||
          String(a.matterName)
            .toLowerCase()
            .includes(searchTerm)
        );
      });
    } else {
      this.matterList = [...this.originalMatterList];
    }
    this.calcTotalPages();
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
  
  get footerHeight() {
    if (this.matterList) {
      return this.matterList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
