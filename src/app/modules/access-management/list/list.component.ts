import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwResultSet } from 'src/common/models/vwResultSet';
import { vwSecurityGroupHierarchyModel } from 'src/common/models/vwSecurityGroupHierarchyModel';
import { vwSecurityGroup } from 'src/common/swagger-providers/models';
import { SecurityGroupService } from 'src/common/swagger-providers/services';
import { Page } from '../../models/page';
import { calculateTotalPages } from '../../shared/math.helper';
import { UtilsHelper } from '../../shared/utils.helper';
import * as Constant from 'src/app/modules/shared/const';
import * as errors from 'src/app/modules/shared/error.json';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public pangeSelected = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public originalData: Array<vwSecurityGroup>;
  public tableData: Array<vwSecurityGroup>;
  public firmData: Array<vwSecurityGroupHierarchyModel>;
  public searchGroup: string;
  public counter = Array;

  public title = 'All';
  public filterName = 'Apply Filter';
  public selections: Array<number> = [];
  public dropdownList: Array<any> = [];
  public currentActive: number;
  public loading = true;
  public selected = [];
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  public error_data = (errors as any).default;

  constructor(
    private groupService: SecurityGroupService,
    private router: Router,
    private toaster: ToastDisplay,
    private pagetitle: Title
  ) {}

  ngOnInit() {
    this.pagetitle.setTitle("Groups");
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.loadGrid(null);
  }

  private loadGrid(msg: string) {
    this.groupService.v1SecurityGroupGet$Response().subscribe(
      s => {
        if (msg) {
          this.toaster.showSuccess(this.error_data[msg]);
        }
        let results: any = s.body;
        let actualData: vwResultSet = JSON.parse(results);
        if (actualData !== null && actualData !== undefined) {
          this.tableData = actualData.results;
          this.tableData = this.tableData.filter(data => !data.readOnly);
          this.calcTotalPages();
          UtilsHelper.aftertableInit();
          this.originalData = this.tableData;
          let groupIds = this.tableData.map(m => m.id);
          this.loading = false;

          this.groupService
            .v1SecurityGroupHierarchyListPost$Json$Response({
              body: groupIds
            })
            .subscribe(
              s => {
                results = s.body;
                actualData = JSON.parse(results);
                if (actualData) {
                  this.firmData = actualData.results;
                  let tData = this.firmData.filter(x => x.hierarchy);
                  this.dropdownList = tData.map(f => ({
                    id: f.hierarchyId,
                    name: f.hierarchy
                  }));
                }
              },
              () => {
                this.toaster.showError('Other than 200 status code returned');
              }
            );
        } else {
          this.loading = false;
          this.toaster.showError('Api throws error');
        }
      },
      () => {
        this.toaster.showError('Other than 200 status code returned');
        this.loading = false;
      }
    );
  }

  public changePageSize() {
    this.page.size = Number(this.pageSelector.value);
    this.calcTotalPages();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.calcTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.tableData.length;

    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public getDropdownSelected(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public onMultiSelectSelectedOptions(event) {}

  public clearFilter() {
    this.selections = [];
    this.dropdownList.forEach(item => (item.checked = false));
    this.title = 'All';
    this.tableData = this.originalData;
    this.table.offset = 0;
    this.pangeSelected = 1;
    this.calcTotalPages();
  }

  public applyFilter() {
    if (this.searchGroup) {
      if (this.selections && this.selections.length > 0) {
        let tId = new Array<number>();
        for (let count = 0; count < this.firmData.length; count++) {
          for (let sCount = 0; sCount < this.selections.length; sCount++) {
            let sel = this.selections[sCount];
            if (sel == this.firmData[count].hierarchyId) {
              tId.push(this.firmData[count].securityGroupId);
            }
          }
        }

        this.tableData = this.originalData.filter(
          item =>
            tId.indexOf(item.id) >= 0 &&
            item.name.toLowerCase().indexOf(this.searchGroup.toLowerCase()) >= 0
        );
      } else {
        this.tableData = this.originalData.filter(
          item =>
            item.name.toLowerCase().indexOf(this.searchGroup.toLowerCase()) >= 0
        );
      }
    } else {
      if (this.selections && this.selections.length > 0) {
        let tId = new Array<number>();
        for (let count = 0; count < this.firmData.length; count++) {
          for (let sCount = 0; sCount < this.selections.length; sCount++) {
            let sel = this.selections[sCount];
            if (sel == this.firmData[count].hierarchyId) {
              tId.push(this.firmData[count].securityGroupId);
            }
          }
        }

        this.tableData = this.originalData.filter(
          item => tId.indexOf(item.id) >= 0
        );
      } else {
        this.tableData = this.originalData;
      }
    }

    this.pangeSelected = 1;
    this.table.offset = 0;
    this.calcTotalPages();
  }

  public searchGroupName() {
    this.applyFilter();
  }

  public createNewGroup() {
    this.router.navigate(['/access-management/create']);
  }

  public EditGroup(groupId: number) {
    this.router.navigate(['/access-management/create'], {
      queryParams: { groupId }
    });
  }

  public GroupAuditHistory(groupId: number) {
    this.router.navigate(['/access-management/audit-history'], {
      queryParams: { groupId }
    });
  }

  public CopyGroup(groupId: number) {
    this.searchGroup = '';
    this.groupService
      .v1SecurityGroupDuplicateIdGet$Response({
        id: groupId
      })
      .pipe(finalize(() => {}))
      .subscribe(
        s => {
          const results: any = s.body;
          const actualData: vwResultSet = JSON.parse(results);
          if (actualData) {
            this.loadGrid('group_copied');
          } else {
            this.toaster.showError('Api throws error');
          }
        },
        err => {
          this.toaster.showError('Other than 200 status code returned');
        }
      );
  }

  public DeactivateGroup(groupId: number) {
    this.searchGroup = '';
    this.groupService
      .v1SecurityGroupIdDelete$Response({
        id: groupId
      })
      .pipe(finalize(() => {}))
      .subscribe(
        s => {
          const results: any = s.body;
          const actualData: vwResultSet = JSON.parse(results);
          if (actualData !== null && actualData !== undefined) {
            this.loadGrid('group_deactivated');
          } else {
            this.toaster.showError('Api throws error');
          }
        },
        () => {
          this.toaster.showError('Other than 200 status code returned');
        }
      );
  }

  public ReactivateGroup(groupId: number) {
    this.searchGroup = '';
    this.groupService
      .v1SecurityGroupReactivateIdGet$Response({
        id: groupId
      })
      .pipe(finalize(() => {}))
      .subscribe(
        s => {
          const results: any = s.body;
          const actualData: vwResultSet = JSON.parse(results);
          if (actualData !== null && actualData !== undefined) {
            this.loadGrid('group_activated');
          } else {
            this.toaster.showError('Api throws error');
          }
        },
        () => {
          this.toaster.showError('Other than 200 status code returned');
        }
      );
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

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.tableData) {
      return this.tableData.length > 10 ? 50 : 0
    }
    else {
      return 0
    }
  }
}
