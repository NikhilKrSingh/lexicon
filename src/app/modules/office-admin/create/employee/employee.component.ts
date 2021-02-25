import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subscription } from 'rxjs';
import Sortable from 'sortablejs';
import { IEmployeeCreateStepEvent } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service.js';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper.js';
import { EmployeeService, OfficeService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import * as clone from 'clone';
import * as _ from 'lodash';

@Component({
  selector: 'app-office-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class OfficeEmployeeComponent implements OnInit, AfterViewInit {
  @Output() readonly nextStep = new EventEmitter<IEmployeeCreateStepEvent>();
  @Output() readonly prevStep = new EventEmitter<IEmployeeCreateStepEvent>();

  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  searchString = '';
  displaySection = 'first';
  employeeList: Array<any> = [];
  filterEmployeeList: Array<any> = [];
  gridEmployeeList: Array<any> = [];
  attorneysList: Array<any> = [];
  consultAttorneyList: Array<any> = [];
  ColumnMode = ColumnMode;
  messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  employeeSubscribe: Subscription;
  errorData: any = (errorData as any).default;
  sortable1: any;
  sortable: any;
  responsibleAttorneyType = true;
  consultAttorneyType = true;
  officeDetails: any;
  consultVisibilityId = 1;
  responsibleVisibilityId = 1;
  searchTimeout: any;
  loading = false;
  showSearchBox = false;

  isSearchLoading = false;

  constructor(
    private employeeService: EmployeeService,
    private officeService: OfficeService,
    private dialogService: DialogService
  ) { }

  ngOnInit() {
    const info = UtilsHelper.getObject('office');
    if (info && info.employeesDetails && Object.keys(info.employeesDetails).length) {
      this.responsibleAttorneyType = info.employeesDetails.rankingView ? info.employeesDetails.rankingView : true;
      this.consultAttorneyType = info.employeesDetails.consultRankingView ? info.employeesDetails.consultRankingView : true;
      this.gridEmployeeList = info.employeesDetails.grid && info.employeesDetails.grid.length ? info.employeesDetails.grid : [];
      this.attorneysList = info.employeesDetails.attorneys && info.employeesDetails.attorneys.length ? info.employeesDetails.attorneys : [];
      this.consultAttorneyList = info.employeesDetails.consultant && info.employeesDetails.consultant.length ? info.employeesDetails.consultant : [];
      this.responsibleVisibilityId = info.employeesDetails.responsibleVisibilityId ? info.employeesDetails.responsibleVisibilityId : 1;
      this.consultVisibilityId = info.employeesDetails.consultVisibilityId ? info.employeesDetails.consultVisibilityId : 1;
    }
    this.addConfigs();
  }

  ngAfterViewInit() {
    let el : any
    let el2 :any
    if (document.getElementById('responsible-attorneys-sortable')) {
      el = document.getElementById('responsible-attorneys-sortable');
      this.sortable = new Sortable(el, {
        swap: true,
        swapThreshold: 1,
        animation: 300,
        sort: true,
        dragoverBubble: false,
        removeCloneOnHide: true,
        disabled: true,
        onEnd: (evt) => {
          this.sortable.option('disabled', true);
          this.updateResponsibleAttorny(evt);
        },
      });
    }
    /*** initialize drag and drop */
    if (document.getElementById('consult-attorneys-sortable-add')) {
      el2 = document.getElementById('consult-attorneys-sortable-add');
      this.sortable1 = new Sortable(el2, {
        swap: true,
        swapThreshold: 1,
        animation: 300,
        sort: true,
        dragoverBubble: false,
        removeCloneOnHide: true,
        disabled: true,
        onEnd: (evt) => {
          this.sortable1.option('disabled', true);
          this.updateConsultAttorny(evt);
        },
      });
    }
  }


  startStorting(event: any): void {
    event.preventDefault();
    this.changeSortingOption(false);
  }

  startStortingCon(event: any): void {
    event.preventDefault();
    this.changeSortingConOption(false);
  }

  endSorting(event: any): void {
    event.preventDefault();
    this.changeSortingOption(true);
  }

  endSortingCon(event: any): void {
    event.preventDefault();
    this.changeSortingConOption(true);
  }

  /**** function to change disabled option for sortable js */
  changeSortingOption(disabled: boolean): void {
    if (this.sortable) {
      this.sortable.option('disabled', disabled);
    }
  }

  /**** function to change disabled option for sortable js */
  changeSortingConOption(disabled: boolean): void {
    if (this.sortable) {
      this.sortable1.option('disabled', disabled);
    }
  }

  public listRank(event, type) {
    if (type === 'Responsible') {
      const el: any = document.getElementById('responsible-attorneys-sortable');
      this.sortable = new Sortable(el, {
        swap: true,
        swapThreshold: 1,
        animation: 300,
        sort: this.responsibleAttorneyType,
        dragoverBubble: false,
        removeCloneOnHide: true,
        disabled: true,
        onEnd: (evt) => {
          if (this.responsibleAttorneyType) {
            this.sortable.option('disabled', true);
            this.updateResponsibleAttorny(evt);
          }
        },
      });
    } else {
      const el2: any = document.getElementById('consult-attorneys-sortable-add');
      this.sortable1 = new Sortable(el2, {
        swap: true,
        swapThreshold: 1,
        animation: 300,
        sort: this.consultAttorneyType,
        dragoverBubble: false,
        removeCloneOnHide: true,
        disabled: true,
        onEnd: (evt) => {
          if (this.consultAttorneyType) {
            this.sortable1.option('disabled', true);
            this.updateConsultAttorny(evt);
          }
        },
      });
    }
  }

  private updateResponsibleAttorny(event) {
    if (event) {
      this.attorneysList.splice(event.newIndex, 0, this.attorneysList.splice(event.oldIndex, 1)[0]);
    }
    this.attorneysList.map((x, i) => {
      if (x.rank !== -1) {
        x.rank = i + 1;
      }
    });
  }

  private updateConsultAttorny(event) {
    if (event) {
      this.consultAttorneyList.splice(event.newIndex, 0, this.consultAttorneyList.splice(event.oldIndex, 1)[0]);
    }
    this.consultAttorneyList.map((x, i) => {
      if (x.consultRank !== -1) {
        x.consultRank = i + 1;
      }
    });
  }

  next() {
    const finalEmp = [];
    this.gridEmployeeList.forEach(x => {
      const obj = {
        employeeId: x.id,
        responsibleRank: this.getRankValue(x.id),
        consultRank: this.getRankValue(x.id, true)
      };
      finalEmp.push(obj);
    });
    const employeeInfo = {
      rankingView: this.responsibleAttorneyType,
      consultRankingView: this.consultAttorneyType,
      employees: finalEmp,
      grid: this.gridEmployeeList,
      attorneys: this.attorneysList,
      consultant: this.consultAttorneyList,
      responsibleVisibilityId: +this.responsibleVisibilityId,
      consultVisibilityId: +this.consultVisibilityId
    };

    const tmp: any = UtilsHelper.getObject('office') ? UtilsHelper.getObject('office') : {} ;
    tmp.employeesDetails = employeeInfo;
    UtilsHelper.setObject('office', tmp);
    this.nextStep.emit({
      nextStep: 'settings',
      currentStep: 'employee',
    });
  }

  getRankValue(id, consult?: boolean) {
    const key = consult ? 'consultRank' : 'rank';
    const arr = consult ? this.consultAttorneyList : this.attorneysList;
    const idx = arr.findIndex(x => x.id === id);
    if (idx > -1) {
      return arr[idx][key];
    }
    return null;
  }

  prev() {
    this.prevStep.emit({
      currentStep: 'employee',
      prevStep: 'basic',
    });
  }

  public addConfigs() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: false
    };
  }

  public updateFilter(event) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    const val = event.target.value;
    if (val && val.trim() !== '') {
      this.searchTimeout = setTimeout(async () => {
        try {
          this.loading = true;
          const res: any = await this.employeeService.v1EmployeeSearchGet({ search: val }).toPromise();
          this.loading = false;
          let list = JSON.parse(res).results;
          let newList = [];
          list.forEach(employee => {
            if (employee.isActivated && employee.isVisible && !this.gridEmployeeList.some(x => x.id == employee.id)) {
                newList.push(employee)
            }
          });
          this.filterEmployeeList = newList;
          this.showSearchBox = true;
        } catch (e) {
          this.loading = false;
          this.filterEmployeeList = [];
        }
      }, 1000);
    } else {
      this.filterEmployeeList = [];
    }
  }

  public selectEmployee(item: any) {
    item.roleName = item.role.map(x => x.name);
    item.officeAssociation = 'Secondary';

    if (
      item.roleName && item.roleName.indexOf('Employee') > -1 &&
      item.rank !== -1
    ) {
      this.setEmpArrs('gridEmployeeList', item);
    }

    if (
      item.roleName && item.roleName.indexOf('Responsible Attorney') > -1 &&
      item.rank !== -1
    ) {
      let rank = this.attorneysList.filter((item) => item.rank !== -1);
      item.rank = (rank) ? rank.length + 1 : 1;
      this.setEmpArrs('attorneysList', item);
    }

    if (
      item.roleName && item.roleName.indexOf('Consult Attorney') > -1 &&
      item.consultRank !== -1
    ) {
      let consultRank = this.consultAttorneyList.filter((item) => item.consultRank !== -1);
      item.consultRank = (consultRank) ? consultRank.length + 1 : 1;
      this.setEmpArrs('consultAttorneyList', item);
    }

    this.searchString = '';
    this.filterEmployeeList = [];
  }

  private setEmpArrs(arr, item) {
    const temp = clone(this[arr]);
    if (!temp.length) {
      temp.push(item);
    } else {
      const idx = temp.findIndex(x => x.id === item.id);
      if (idx === -1) {
        temp.push(item);
      }
    }
    let newArr = []
    if (arr === 'consultAttorneyList' || arr === 'attorneysList') {
      const key = arr === 'consultAttorneyList' ? 'consultRank' : 'rank';
      const unrank = temp.filter((item) => item[key] === -1);
      const rank = temp.filter((item) => item[key] !== -1);
      newArr = rank.concat(unrank);
    } else {
      newArr = temp;
    }
    this[arr] = clone(newArr);
  }

  public delete(id) {
    this.dialogService
      .confirm(
        this.errorData.employee_delete_confirm,
        'Delete',
        'Cancel',
        'Delete Employee',
        true
      )
      .then((result) => {
        if (result) {
          this.removeEmployee('gridEmployeeList', id);
          this.removeEmployee('attorneysList', id, true);
          this.removeEmployee('consultAttorneyList', id, true);
        }
      });
  }

  removeEmployee(arr, id, ranking?) {
    const temp = [...this[arr]];
    const idx = temp.findIndex(x => x.id === id);
    if (idx > -1) {
      temp.splice(idx, 1);
    }
    if (ranking) {
      const key = arr === 'consultAttorneyList' ? 'consultRank' : 'rank';
      temp.map((x, indx) => {
        if (x[key] !== -1) {
          x[key] = indx + 1;
        }
      });
    }
    this[arr] = temp;
  }


  public removeAttorneyRank(index) {
    this.dialogService
      .confirm(this.errorData.unrank_respon_attorney, 'Confirm', 'Cancel', 'Confirm', true)
      .then(res => {
        if (res) {
          this.update(index, 'attorneysList');
        }
      });
  }

  public removeAttorneyConRank(index) {
    this.dialogService
      .confirm(this.errorData.unrank_consult_attorney, 'Confirm', 'Cancel', 'Confirm', true)
      .then(res => {
        if (res) {
          this.update(index, 'consultAttorneyList');
        }
      });
  }

  private update(i, arr) {
    const key = arr === 'consultAttorneyList' ? 'consultRank' : 'rank';
    this[arr][i][key] = -1;
    this[arr].push(this[arr].splice(i, 1)[0]);
    this[arr].map((x, idx) => {
      if (x[key] !== -1) {
        x[key] = idx + 1;
      }
    });
    this[arr].map((ele) => {
      if (ele[key] == -1) {
        ele.isDisabled = true;
      } else {
        ele.isDisabled = false;
      }
    });
    this[arr] = clone(this[arr]);
  }

  setRank(arr, i) {
    let msg = arr === 'consultAttorneyList' ? this.errorData.rank_respon_attorney : this.errorData.rank_respon_attorney;
    this.dialogService
      .confirm(msg, 'Confirm', 'Cancel', 'Confirm', true)
      .then(res => {
        if (res) {
          const key = arr === 'consultAttorneyList' ? 'consultRank' : 'rank';
          this[arr][i][key] = 1;
          this[arr].map((x, idx) => {
            if (x[key] !== -1) {
              x[key] = idx + 1;
            }
          });
          this[arr].map((ele) => {
            if (ele[key] == -1) {
              ele.isDisabled = true;
            } else {
              ele.isDisabled = false;
            }
          });
        }
      });

  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  onsearchResultOutsideClick(event) {
    this.showSearchBox = false;
  }
}
