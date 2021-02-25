import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice, Page } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { vwClient } from 'src/common/swagger-providers/models';
import { ClientService, MiscService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-office-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientListComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() officeId: number;

  public columnList: any[] = [];

  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public isLoading = false;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound,
  };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];

  public title = 'All';
  public titlereasatt = 'All';
  public titletype = 'All';
  public titlestatus = 'All';
  public filterName = 'Apply Filter';
  public selectedOffice: Array<number> = [];
  public responattorn: Array<number> = [];
  public typeselect: Array<any> = [];
  public selections1: Array<any> = [];
  public selectionstatus: Array<number> = [];

  public dropdownList1: Array<any> = [
    {
      id: 'active',
      name: 'Active',
      checked: false,
    },
    {
      id: 'inactive',
      name: 'Inactive',
      checked: false,
    },
    {
      id: 'archive',
      name: 'Archived',
      checked: false,
    },
  ];

  public dropdownList2: Array<any> = [
    {
      id: 'individual',
      name: 'Individual',
      checked: false,
    },
    {
      id: 'corporate',
      name: 'Corporate',
      checked: false,
    },
  ];
  public selected = [];
  public resattrList1: Array<IOffice> = [];
  public callFlag = true;
  public errorData: any = (errorData as any).default;
  public pangeSelected = 1;
  public counter = Array;
  public selectedRow: vwClient;
  public loading = true;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  public currentActive: number;
  private modalReference: NgbModalRef<any>;

  constructor(
    private modalService: NgbModal,
    private clientService: ClientService,
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>,
    private router: Router
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    this.getClientList();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.table.bodyHeight = 400;
  }

  public getClientList() {
    this.isLoading = true;

    this.clientService
      .v1ClientOfficeOfficeTypeOfficeIdGet$Response({
        officeId: this.officeId,
        officeType: 1
      })
      .subscribe(
        (suc) => {
          const res: any = suc;
          if (res && res.body) {
            const persons: any[] = JSON.parse(res.body).results || [];

            persons.forEach((obj) => {
              obj['name'] = obj.isCompany
                ? obj.companyName
                : obj.firstName
                  ? obj.lastName + ', ' + obj.firstName
                  : obj.lastName;

              obj['status'] = obj.isVisible
                ? 'Active'
                : obj.isArchived
                  ? 'Archived'
                  : 'Inactive';
            });

            this.rows = [...persons];

            if (this.rows.length > 0) {
              const keys = Object.keys(this.rows[0]);
              this.addkeysIncolumnlist(keys);
            }

            this.resattrList1 = [];

            if (this.rows && this.rows.length > 0) {
              this.rows.map((obj) => {
                if (
                  obj.responsibleAttorneys &&
                  obj.responsibleAttorneys.length > 0
                ) {
                  this.resattrList1.push(obj.responsibleAttorneys[0]);
                  obj.rname = obj.responsibleAttorneys[0].name;
                }
              });

              this.oriArr = [...this.rows];
              this.isLoading = false;
              this.updateDatatableFooterPage();
              UtilsHelper.aftertableInit();

              this.resattrList1 = _.uniqBy(this.resattrList1, a => a.id);
            }
          }
          this.loading = false;
        },
        (err) => {
          this.isLoading = false;
          this.loading = false;
          console.log(err);
        }
      );
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    for (let i = 0; i < keys.length; i++) {
      this.columnList.push({
        Name: keys[i],
        displayName: keys[i] == 'notifySmS' ? 'Notify SMS' : _.startCase(keys[i])
      });
    }
  }

  public getPreferredContact(row: vwClient) {
    if (row) {
      if (row.preferredContactMethod == 'Email') {
        return row.email;
      } else if (
        row.preferredContactMethod == 'Text' ||
        row.preferredContactMethod == 'Call' ||
        row.preferredContactMethod == 'Cell'
      ) {
        if (row.phones) {
          let number1 = row.phones.find((a) => a.isPrimary);
          let number = (number1) ? number1.number : null

          return number
            ? '(' +
            number.substr(0, 3) +
            ') ' +
            number.substr(3, 3) +
            '-' +
            number.substr(6, 4)
            : '-';
        } else {
          return '--';
        }
      } else {
        return '--';
      }
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  public applyFilterPrimaryOffice() {
    if (this.selectedOffice && this.selectedOffice.length > 0) {
      const temp = this.oriArr.filter((item) => {
        if (
          item.primaryOffice &&
          item.primaryOffice.id &&
          this.selectedOffice.indexOf(item.primaryOffice.id) !== -1
        ) {
          return item;
        }
      });
      // update the rows
      this.rows = temp;
      this.updateDatatableFooterPage();
    }
  }

  public applyFilterResponsibleAttorney() {
    if (this.responattorn && this.responattorn.length > 0) {
      const temp = this.oriArr.filter((item) => {
        let returnItem: boolean = false;
        if (item.responsibleAttorneys && item.responsibleAttorneys.length) {
          item.responsibleAttorneys.filter((responsible) => {
            if (
              responsible.id &&
              this.responattorn.indexOf(responsible.id) !== -1
            ) {
              returnItem = true;
            }
          });
        }
        if (returnItem) return item;
      });
      // update the rows
      this.rows = temp;
      this.updateDatatableFooterPage();
    }
  }

  public applyFilterstatus() {
    if (this.selections1 && this.selections1.length > 0) {
      const temp = this.oriArr.filter((item) => {
        if (item.isVisible && this.selections1.indexOf('active') !== -1) {
          return item;
        }
        if (
          !item.isVisible &&
          !item.isArchived &&
          this.selections1.indexOf('inactive') !== -1
        ) {
          return item;
        }
        if (
          item.isArchived &&
          !item.isVisible &&
          this.selections1.indexOf('archive') !== -1
        ) {
          return item;
        }
      });
      // update the rows
      this.rows = temp;
      this.updateDatatableFooterPage();
    }
  }

  public applyFiltertype() {
    if (this.typeselect && this.typeselect.length > 0) {
      const temp = this.oriArr.filter((item) => {
        if (item.isCompany && this.typeselect.indexOf('corporate') !== -1) {
          return item;
        }
        if (!item.isCompany && this.typeselect.indexOf('individual') !== -1) {
          return item;
        }
      });
      // update the rows
      this.rows = temp;
      this.updateDatatableFooterPage();
    }
  }

  public clearFilterResponsibleAttorney() {
    this.responattorn = [];
    this.resattrList1.forEach((item) => (item.checked = false));
    this.rows = [...this.oriArr];
    this.titlereasatt = 'All';
    this.applyFilterResponsibleAttorney();
  }

  public searchFilter(event) {
    const val = event.target.value;
    const temp = this.oriArr.filter(
      (item) =>
        this.matchName(item, val, 'id') ||
        this.matchName(item, val, 'lastName') ||
        this.matchName(item, val, 'firstName') ||
        this.matchName(item, val, 'primaryContactPerson.name') ||
        this.matchName(item, val, 'preferredContactMethod') ||
        this.matchName(item, val, 'primaryOffice') ||
        this.matchName(item, val, 'companyName') ||
        this.matchName(item, val, 'responsibleAttorneys') ||
        this.matchName(item, val, 'uniqueNumber')
    );
    // update the rows
    this.rows = temp;
    this.updateDatatableFooterPage();
  }

  /** update Attorney table footer page count */
  updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(this.rows.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'preferredContactMethod') {
      if (item.preferredContactMethod == 'Email') {
        searchName = item.email ? item.email.toString().toUpperCase() : '';
      }
      else if(fieldName === 'uniqueNumber'){
        let number = item.uniqueNumber.find((a) => a.isPrimary).uniqueNumber;
          searchName = number ? number : '';
      }
      else if (
        item.preferredContactMethod == 'Text' ||
        item.preferredContactMethod == 'Call'
      ) {
        if (item.phones && item.phones.length) {
          let number = item.phones.find((a) => a.isPrimary).number;
          searchName = number ? number : '';
        } else {
          searchName = '';
        }
      } else {
        searchName = '';
      }
    } else if (fieldName === 'responsibleAttorneys') {
      searchName =
        item[fieldName] && item[fieldName].length > 0
          ? item[fieldName][0]['name'].toString().toUpperCase()
          : '';
    } else if (fieldName === 'primaryOffice') {
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

  public selectDropdwnPo(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public selectDropdwnRa(event) {
    this.titlereasatt = '';
    if (event.length > 0) {
      this.titlereasatt = event.length;
    } else {
      this.titlereasatt = 'All';
    }
  }

  public selecttype(event) {
    this.titletype = '';
    if (event.length > 0) {
      this.titletype = event.length;
    } else {
      this.titletype = 'All';
    }
  }

  public selectStatus(event) {
    this.titlestatus = '';
    if (event.length > 0) {
      this.titlestatus = event.length;
    } else {
      this.titlestatus = 'All';
    }
  }

  public onMultiSelectSelectedOptions(event) {
  }

  public clearFilter1() {
    this.selections1 = [];
    this.dropdownList1.forEach((item) => (item.checked = false));
    this.titlestatus = 'All';
    this.rows = [...this.oriArr];
    this.applyFilterstatus();
  }

  public clearFilter2() {
    this.typeselect = [];
    this.dropdownList2.forEach((item) => (item.checked = false));
    this.rows = [...this.oriArr];
    this.titletype = 'All';
    this.applyFiltertype();
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
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

  openPersonalinfo(content: any, className, winClass, item) {
    this.selectedRow = item;

    this.columnList.forEach(a => {
      a.isChecked = false;
    });

    this.openModal(content, className, winClass);
  }

  openModal(content: any, className: any, winClass: string) {
    this.modalReference = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
    });
  }

  ExportToCSV() {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);

    selectedrows.map((obj) => {
      obj.primaryOffice = obj.primaryOffice ? obj.primaryOffice.name : '';
      obj.reportingManager = obj.reportingManager
        ? obj.reportingManager.name.replace(/,/g, ' ')
        : '';
      obj.approvingManager = obj.approvingManager
        ? obj.approvingManager.name.replace(/,/g, ' ')
        : '';
      obj.practiceManager = obj.practiceManager
        ? obj.practiceManager.name.replace(/,/g, ' ')
        : '';
      obj.primaryContactPerson = obj.primaryContactPerson
        ? obj.primaryContactPerson.name.replace(/,/g, ' ')
        : '';

      if (obj.matterStatus && obj.matterStatus.length > 0) {
        let matterStatus = '';
        obj.matterStatus.map((item) => {
          matterStatus = matterStatus + item.number + '/';
        });
        obj.matterStatus = matterStatus;
      }
      if (obj.matterType && obj.matterType.length > 0) {
        let matterType = '';
        obj.matterType.map((item) => {
          matterType = matterType + item.number + '/';
        });
        obj.matterType = matterType;
      }
      if (obj.responsibleAttorneys && obj.responsibleAttorneys.length > 0) {
        let responsibleAttorneys = '';
        obj.responsibleAttorneys.map((item) => {
          responsibleAttorneys = responsibleAttorneys + item.number + '/';
        });
        obj.responsibleAttorneys = responsibleAttorneys;
      }
      if (obj.role && obj.role.length > 0) {
        let role = '';
        obj.role.map((item) => {
          role = role + item.number + '/';
        });
        obj.role = role;
      }
      if (obj.phones && obj.phones.length > 0) {
        let phones = '';
        obj.phones.map((item) => {
          phones = phones + item.number + '/';
        });
        obj.phones = phones;
      }
      if (obj.secondaryOffices && obj.secondaryOffices.length > 0) {
        let secondaryOffices = '';
        obj.secondaryOffices.map((item) => {
          secondaryOffices = secondaryOffices + item.number + '/';
        });
        obj.secondaryOffices = secondaryOffices;
      }
      if (obj.retainerPracticeAreas && obj.retainerPracticeAreas.length > 0) {
        let retainerPracticeAreas = '';
        obj.retainerPracticeAreas.map((item) => {
          retainerPracticeAreas = retainerPracticeAreas + item.number + '/';
        });
        obj.retainerPracticeAreas = retainerPracticeAreas;
      }
      if (
        obj.initialConsultPracticeAreas &&
        obj.initialConsultPracticeAreas.length > 0
      ) {
        let initialConsultPracticeAreas = '';
        obj.initialConsultPracticeAreas.map((item) => {
          initialConsultPracticeAreas =
            initialConsultPracticeAreas + item.number + '/';
        });
        obj.initialConsultPracticeAreas = initialConsultPracticeAreas;
      }
      if (obj.states && obj.states.length > 0) {
        let states = '';
        obj.states.map((item) => {
          states = states + item.number + '/';
        });
        obj.states = states;
      }
      if (obj.groups && obj.groups.length > 0) {
        let groups = '';
        obj.groups.map((item) => {
          groups = groups + item.number + '/';
        });
        obj.groups = groups;
      } else {
        obj.groups = '';
      }
    });

    this.exporttocsvService.downloadFile(
      selectedrows,
      this.columnList,
      'ClientList'
    );
  }

  public over(event) {
    event.target
      .closest('.datatable-row-wrapper')
      .classList.add('datatable-row-hover');
  }

  public out(event) {
    event.target
      .closest('.datatable-row-wrapper')
      .classList.remove('datatable-row-hover');
  }

  get isClientExportValid() {
    return (this.rows.length && this.columnList.some(item => item.isChecked));
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
