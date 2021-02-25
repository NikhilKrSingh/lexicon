import { Component, EventEmitter, Input, OnChanges, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwEmployee } from 'src/common/swagger-providers/models';
import { EmployeeService } from 'src/common/swagger-providers/services';
import * as fromPermissions from '../../../../../store/reducers/permission.reducer';
import { Page } from '../../../../models';
import { EditReportingRelationshipsComponent } from '../../edit-employee-info/reporting-relationships/reporting-relationships.component';

@Component({
  selector: 'app-employee-profile-reporting-relations',
  templateUrl: './reporting-relations.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeReportingRelationsComponent implements OnChanges {
  @Input() employee: vwEmployee;
  @Output() readonly openModel = new EventEmitter<string>();
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  reportingRelations: any;
  reportingRelationsLoading = false;
  subordinates = [];
  originalSubordinates = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public relationshipTypes = [
    'All',
    'Direct Manager',
    'Approving Manager',
    'Practice Manager'
  ];
  public selectedFilter = 'All';
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public searchText = '';

  constructor(
    private employeeService: EmployeeService,
    private modalService: NgbModal,
    private toastrService: ToastDisplay,
    private store: Store<any>
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges() {
    if (this.employee) {
      this.getReportingRelations();
    }
  }

  getReportingRelations() {
    this.reportingRelationsLoading = true;
    this.employeeService
      .v1EmployeeReportingEmployeeIdGet({
        employeeId: this.employee.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        })
      )
      .subscribe(
        res => {
          this.subordinates = [];
          this.originalSubordinates = [];
          this.reportingRelations = res;

          if (
            this.reportingRelations &&
            this.reportingRelations.reportingSubordinates
          ) {
            this.reportingRelations.reportingSubordinates.forEach(
              reportingSubordinate => {
                reportingSubordinate.fullName =
                  reportingSubordinate.lastName +
                  ', ' +
                  reportingSubordinate.firstName;
                reportingSubordinate.relationshipType = 'Direct Manager';
                this.originalSubordinates.push(reportingSubordinate);
              }
            );
          }

          if (
            this.reportingRelations &&
            this.reportingRelations.approvingSubordinates
          ) {
            this.reportingRelations.approvingSubordinates.forEach(
              approvingSubordinate => {
                approvingSubordinate.fullName =
                  approvingSubordinate.lastName +
                  ', ' +
                  approvingSubordinate.firstName;
                approvingSubordinate.relationshipType = 'Approving Manager';
                this.originalSubordinates.push(approvingSubordinate);
              }
            );
          }

          if (
            this.reportingRelations &&
            this.reportingRelations.practiceSubordinates
          ) {
            this.reportingRelations.practiceSubordinates.forEach(
              practiceSubordinate => {
                practiceSubordinate.fullName =
                  practiceSubordinate.lastName +
                  ', ' +
                  practiceSubordinate.firstName;
                practiceSubordinate.relationshipType = 'Practice Manager';
                this.originalSubordinates.push(practiceSubordinate);
              }
            );
          }

          this.originalSubordinates = this.originalSubordinates.filter(
            a => a.id != this.employee.id
          );

          let uniqueOrdinates = _.groupBy(this.originalSubordinates, a => a.id);

          this.originalSubordinates = [];

          for (let key in uniqueOrdinates) {
            let subordinates = uniqueOrdinates[key];

            let ordinate = subordinates[0];
            ordinate.relationshipTypes = subordinates
              .map(a => a.relationshipType)
              .join(', ');
            this.originalSubordinates.push(ordinate);
          }

          this.subordinates = [...this.originalSubordinates];
          this.subordinates = this.subordinates.filter(
            a => a.id != this.employee.id
          );

          this.search();

          this.page.totalElements = this.subordinates.length;
          this.page.totalPages = Math.ceil(
            this.subordinates.length / this.page.size
          );
          this.reportingRelationsLoading = false;
        },
        () => {
          this.reportingRelationsLoading = false;
        }
      );
  }

  public modelPopup() {
    const modalRef = this.modalService.open(
      EditReportingRelationshipsComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false
      }
    );
    const componentInstance = modalRef.componentInstance;
    componentInstance.reportingRelations = JSON.parse(
      JSON.stringify(this.reportingRelations)
    );
    componentInstance.employee = JSON.parse(JSON.stringify(this.employee));
    modalRef.result.then((managerData) => {
      // if ((Object.values(managerData)).some(x => x)) {
        this.reportingRelationsLoading = true;
        this.employeeService.v1EmployeeReportingRelationsEmployeeIdPut$Json({
          employeeId: this.employee.id, body: managerData
        }).subscribe(() => {
          this.getReportingRelations();
          this.toastrService.showSuccess('Reporting relationships updated.');
          this.reportingRelationsLoading = false;
        }
        )
      // }
    }
    ).catch(() => {
    });
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

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.subordinates.length;
    this.page.totalPages = Math.ceil(this.subordinates.length / this.page.size);
    // this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  public search() {
    const val = this.searchText;

    let temp = [...this.originalSubordinates];

    if (this.searchText) {
      temp = temp.filter(
        item =>
          this.matchName(item, val, 'firstName') ||
          this.matchName(item, val, 'email') ||
          this.matchName(item, val, 'primaryOffice') ||
          this.matchName(item, val, 'jobTitle') ||
          this.matchName(item, val, 'middleName') ||
          this.matchName(item, val, 'lastName') ||
          UtilsHelper.matchFullEmployeeName(item, val) ||
          this.matchName(item, val, 'empName')
      );
    }

    if (this.selectedFilter && this.selectedFilter != 'All') {
      temp = temp.filter(a =>
        a.relationshipTypes.includes(this.selectedFilter)
      );
    }

    this.subordinates = [...temp];
    this.subordinates = this.subordinates.filter(a => a.id != this.employee.id);
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'empName') {
      searchName = item.lastName
        ? item.lastName
          .toString()
          .toUpperCase()
          .trim() +
        ',' +
        item.firstName
          .toString()
          .toUpperCase()
          .trim()
        : item.firstName
          .toString()
          .toUpperCase()
          .trim();
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return (
      searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ',')) > -1
    );
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.subordinates) {
      return this.subordinates.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
