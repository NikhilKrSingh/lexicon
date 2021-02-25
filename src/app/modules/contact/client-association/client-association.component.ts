import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { ContactsService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { IOffice } from '../../models';
import { Page } from '../../models/page';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-client-association',
  templateUrl: './client-association.component.html',
  styleUrls: ['./client-association.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientAssociationComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public searchString: any;
  '';
  public selectedClient: Array<any> = [];
  public selectedStatus: Array<any> = [];
  public selectedMatterType: Array<any> = [];
  public selectedAssociationType: Array<any> = [];
  public associationList: Array<any> = [];
  public oriArr: Array<any> = [];
  public columns: any = [];
  public messages = {emptyMessage: Constant.SharedConstant.NoDataFound};
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected = [];
  public pangeSelected = 1;
  public counter = Array;
  public columnList = [];
  public clientList: Array<IOffice> = [];
  public statusList: Array<IOffice> = [];
  public matterTypeList: Array<IOffice> = [];
  public associationTypeList: Array<IOffice> = [];
  public filterName = 'Apply Filter';
  public title = 'Select client';
  public title1 = 'Select status';
  public title2 = 'Select matter type';
  public title3 = 'Select association type';
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public blocks = 0;
  public currentActive: number;
  public updateStatusContact: string;
  public changeStatusNotes: string;
  public selectedRecord: any = {};
  public loading = true;

  public errorData: any = (errorData as any).default;
  public arch_client_warn: string;
  public block_warn: string;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };

  constructor(
    private modalService: NgbModal,
    private contactsService: ContactsService,
    private store: Store<fromRoot.AppState>,
    private toastDisplay: ToastDisplay,
    private pagetitle: Title,
    private router: Router
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.pagetitle.setTitle("Associations");
    this.arch_client_warn = this.errorData.archive_client_warning;
    this.block_warn = this.errorData.block_contact_warning;
    this.getClientAssociation();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngAfterViewInit() {
    window.onresize = () => {
      this.initScrollDetector([this.table]);
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
    window.onresize = () => {
      UtilsHelper.checkDataTableScroller(this.tables);
    };
  }

  UpdateStatus(content, action, record, event) {
    if (event && event.target) {
      event.target.closest('datatable-body-cell').blur();
    }
    this.selectedRecord = record;
    this.updateStatusContact = action;
    this.open(content, 'lg');
  }

  open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  UpdateStatusClientAssociationContact() {
    const body: any = {
      personId: this.selectedRecord.id,
      reason: this.changeStatusNotes
    };
    this.loading = true;
    if (this.updateStatusContact === 'Deactivate') {
      this.contactsService
        .v1ContactsAssociationDeactivePersonIdDelete$Response(body)
        .subscribe(
          suc => {
            const res: any = suc;
            this.toastDisplay.showSuccess(
              'Client association ' + this.updateStatusContact.toLowerCase() + 'd'
            );
            this.updateStatusContact = '';
            this.getClientAssociation();
          },
          err => {
            this.loading = false;
            console.log(err);
          }
        );
    } else if (this.updateStatusContact === 'Reactivate') {
      this.contactsService
        .v1ContactsAssociationReactivePersonIdDelete$Response(body)
        .subscribe(
          suc => {
            const res: any = suc;
            this.toastDisplay.showSuccess(
              'Client association ' + this.updateStatusContact.toLowerCase() + 'd'
            );
            this.updateStatusContact = '';
            this.getClientAssociation();
          },
          err => {
            this.loading = false;
            console.log(err);
          }
        );
    } else if (this.updateStatusContact === 'Archive') {
      this.contactsService
        .v1ContactsAssociationArchivePersonIdDelete$Response(body)
        .subscribe(
          suc => {
            const res: any = suc;
            this.toastDisplay.showSuccess(
              'Client association ' + this.updateStatusContact.toLowerCase() + 'd'
            );
            this.updateStatusContact = '';
            this.getClientAssociation();
          },
          err => {
            this.loading = false;
            console.log(err);
          }
        );
    } else {
      this.loading = false;
      return false;
    }
    this.selectedRecord = {};
    this.changeStatusNotes = '';
  }

  public getClientAssociation() {
    this.clearFilter('status');
    this.clearFilter('mattertype');
    this.clearFilter('associationtype');
    this.clearFilter('client');
    this.contactsService.v1ContactsAssociationsFromSpGet().subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        if (list && list.persons && list.persons.length > 0) {
          this.associationList = list.persons;
          this.getFilters(this.associationList);
          if (this.associationList && this.associationList.length > 0) {
            this.oriArr = [...this.associationList];
            this.getTotalPages();
            UtilsHelper.aftertableInit();
            UtilsHelper.checkDataTableScroller(this.tables);
            this.oriArr = [...this.associationList];
            const keys = Object.keys(this.associationList[0]);
            this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
          }
        }
        this.loading = false;
      },
      err => {
        this.loading = false;
        console.log(err);
      }
    );
  }

  private setAllassociationList(data: any[]) {
    return data;
  }

  private getFilters(data: any[]) {
    this.getclientList(data);
    this.getStatusList(data);
    this.getmatterTypeList(data);
    this.getAssociationTypeList(data);
  }

  private getclientList(data: any[]) {
    let list = data
      .filter(
        (obj: { client: any }) => obj.client !== null && obj.client.trim() != '' && obj.client.trim() !== ','
      )
      .map(({client}) => client);
    list = list.filter(UtilsHelper.onlyUnique);
    this.clientList = this.getList(list);
    this.clientList = _.orderBy(this.clientList, a => a.name.toLowerCase());
  }

  private getStatusList(data: any[]) {
    let list = data
      .filter((obj: { status: any }) => obj.status !== null)
      .map(({status}) => status);
    list = list.filter(UtilsHelper.onlyUnique);
    this.statusList = this.getList(list);
    this.statusList = _.orderBy(this.statusList, a => a.name.toLowerCase());
  }

  private getmatterTypeList(data: any[]) {
    let list = data
      .filter((obj: { matterType: any }) => !!obj.matterType)
      .map(({matterType}) => matterType);
    list = list.filter(UtilsHelper.onlyUnique);
    this.matterTypeList = this.getList(list);
    this.matterTypeList = _.orderBy(this.matterTypeList, a =>
      a.name.toLowerCase()
    );
  }

  private getAssociationTypeList(data: any[]) {
    let list = data
      .filter((obj: { associationType: any }) => obj.associationType !== null)
      .map(({associationType}) => associationType);
    list = list.filter(UtilsHelper.onlyUnique);
    this.associationTypeList = this.getList(list);
    this.associationTypeList = _.orderBy(this.associationTypeList, a =>
      a.name.toLowerCase()
    );
  }

  private getList(list: any[]) {
    const returnList = new Array<IOffice>();
    for (let i = 0; i < list.length; i++) {
      returnList.push({
        id: i + 1,
        name: list[i]
      });
    }
    return returnList;
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.getTotalPages();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.getTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public getTotalPages() {
    this.page.totalElements = this.associationList.length;
    this.page.totalPages = Math.ceil(
      this.associationList.length / this.page.size
    );
    if(this.table){
      this.table.offset = 0;
    }
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    UtilsHelper.aftertableInit();
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public getSelectedClient(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'Select client';
    }
  }

  public getSelectedStatus(event) {
    this.title1 = '';
    if (event.length > 0) {
      this.title1 = event.length;
    } else {
      this.title1 = 'Select status';
    }
  }

  public getselectedMatterType(event) {
    this.title1 = '';
    if (event.length > 0) {
      this.title2 = event.length;
    } else {
      this.title2 = 'Select matter type';
    }
  }

  public getselectedAssociationType(event) {
    this.title3 = '';
    if (event.length > 0) {
      this.title3 = event.length;
    } else {
      this.title3 = 'Select association type';
    }
  }

  public clearFilter(type: string) {
    if (type === 'client') {
      this.selectedClient = [];
      this.clientList.forEach(item => (item.checked = false));
      this.title = 'Select client';
    } else if (type === 'mattertype') {
      this.selectedMatterType = [];
      this.matterTypeList.forEach(item => (item.checked = false));
      this.title2 = 'Select matter type';
    } else if (type === 'associationtype') {
      this.selectedAssociationType = [];
      this.associationTypeList.forEach(item => (item.checked = false));
      this.title3 = 'Select association type';
    } else {
      this.selectedStatus = [];
      this.statusList.forEach(item => (item.checked = false));
      this.title1 = 'Select status';
    }
    this.applyFilter();
  }

  public updateFilter(event) {
    this.searchString = event.target.value;
    this.applyFilter();
  }

  public applyFilter() {
    const val = !this.searchString ? '' : this.searchString;
    let filterList = this.oriArr;
    if (this.selectedClient && this.selectedClient.length > 0) {
      const office = this.clientList
        .filter((obj: { id: any }) => this.selectedClient.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.client && office.indexOf(item.client) !== -1) {
          return item;
        }
      });
    }
    if (this.selectedMatterType && this.selectedMatterType.length > 0) {
      const matterType = this.matterTypeList
        .filter((obj: { id: any }) => this.selectedMatterType.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.matterType && matterType.indexOf(item.matterType) !== -1) {
          return item;
        }
      });
    }
    if (
      this.selectedAssociationType &&
      this.selectedAssociationType.length > 0
    ) {
      const association = this.associationTypeList
        .filter((obj: { id: any }) =>
          this.selectedAssociationType.includes(obj.id)
        )
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (
          item.associationType &&
          association.indexOf(item.associationType) !== -1
        ) {
          return item;
        }
      });
    }
    if (this.selectedStatus && this.selectedStatus.length > 0) {
      const status = this.statusList
        .filter((obj: { id: any }) => this.selectedStatus.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.status && status.indexOf(item.status) !== -1) {
          return item;
        }
      });
    }

    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'officeName') ||
          this.matchName(item, val, 'name') ||
          this.matchName(item, val, 'client') ||
          this.matchName(item, val, 'matterType') ||
          this.matchName(item, val, 'associationType') ||
          this.matchName(item, val, 'email') ||
          this.matchName(item, val, 'phones') ||
          this.matchName(item, val, 'attorney') ||
          this.matchName(item, val, 'uniqueNumber') ||
          ((item.name && item.name.replace(',', '')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.name && item.name.split(',').reverse().toString().trim().replace(',', ' ')) || '').toLowerCase().includes(val.toLowerCase())
      );
    }

    this.associationList = filterList;
    this.getTotalPages();
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

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.associationList) {
      return this.associationList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
