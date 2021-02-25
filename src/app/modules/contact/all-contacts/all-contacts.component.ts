import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import * as Constant from 'src/app/modules/shared/const';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { ContactsService } from 'src/common/swagger-providers/services';
import { Page } from '../../models/page';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-all-contacts',
  templateUrl: './all-contacts.component.html',
  styleUrls: ['./all-contacts.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AllContactsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public searchString: any;
  '';
  public selectedOffice: Array<any> = [];
  public selectedStatus: Array<any> = [];
  public contactList: Array<any> = [];
  public oriArr: Array<any> = [];
  public columns: any = [];
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected = [];
  public pangeSelected = 1;
  public counter = Array;
  public columnList = [];
  public officeList: Array<any> = [];
  public statusList: Array<any> = [];
  public filterName: string = Constant.SharedConstant.ApplyFilter;
  public title = 'Select office';
  public title1 = 'Select status';
  public selectedContact = 'pc';
  public currentActive: number;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public loading = true;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };

  constructor(
    private modalService: NgbModal,
    private contactsService: ContactsService,
    private router: Router,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.pagetitle.setTitle("All Contacts");
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getAllcontact();
  }

  ngAfterViewInit() {
    window.onresize = () => {
      this.initScrollDetector([this.table]);
      window.onresize = () => {
        UtilsHelper.checkDataTableScroller(this.tables);
      };
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  public getAllcontact() {
    this.contactsService.v1ContactsGetAllContactsFromSpGet().subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        this.contactList = this.setAllContactlist(list.persons);
        this.getFilters(this.contactList);
        if (this.contactList && this.contactList.length > 0) {
          this.oriArr = [...this.contactList];
          this.getTotalPages();
          UtilsHelper.aftertableInit();
          UtilsHelper.checkDataTableScroller(this.tables);
          const keys = Object.keys(this.contactList[0]);
          this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
        }
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  private setAllContactlist(data: any[]) {
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if(data[i].uniqueNumber){
          data[i].uniqueNumber = data[i].uniqueNumber.toString();
        }

        if (data[i].doNotContact) {
          data[i].preferredContact = Constant.ContactConstant.DoNotContact;
        } else {
          data[i].preferredContact = data[i].preferredContact ? data[i].preferredContact : '-';
        }        
      }
      return data;
    } else {
      return [];
    }
  }

  // private setAllContactlist(data: any[]) {
  //   if (data) {
  //     for (let i = 0; i < data.length; i++) {
  //       if(data[i].uniqueNumber){
  //         data[i].uniqueNumber = data[i].uniqueNumber.toString();
  //       }

  //       if (data[i].preferredContact === 'Email' && !data[i].doNotContact) {
  //         data[i].preferredContact = data[i].email;
  //       } else if (
  //         data[i].preferredContact === 'Cell' &&
  //         !data[i].doNotContact
  //       ) {
  //         try {
  //           const num = data[i].phones;
  //           const res = '(' + num.slice(0, 3) + ')-';
  //           const res1 = num.slice(3, 6) + '-';
  //           data[i].preferredContact = res + res1 + num.slice(6, 10);
  //         } catch {}
  //       } else if (data[i].doNotContact) {
  //         data[i].preferredContact = Constant.ContactConstant.DoNotContact;
  //       } else {
  //         data[i].preferredContact = '-';
  //       }
  //       data[i].corporateContactTypes = data[i].isPotentialClient
  //         ? Constant.SharedConstant.PC
  //         : data[i].isCorporate
  //         ? Constant.SharedConstant.CC
  //         : data[i].isClientAssociation
  //         ? Constant.SharedConstant.CA
  //         : '';
  //       data[i].status = data[i].isArchived
  //         ? Constant.Status.Archived
  //         : data[i].isVisible
  //         ? Constant.Status.Active
  //         : Constant.Status.Inactive;
  //     }
  //     return data;
  //   } else {
  //     return [];
  //   }
  // }

  private getFilters(data: any[]) {
    this.getOfficeList(data);
    this.getStatusList(data);
  }

  private getOfficeList(data: any[]) {
    let list = data
      .filter((obj: { officeName: any }) => obj.officeName !== null && obj.officeName !== "")
      .map(({ officeName }) => officeName);
    list = list.filter(UtilsHelper.onlyUnique);
    this.officeList = this.getList(list);
  }

  private getStatusList(data: any[]) {
    let list = data
      .filter((obj: { status: any }) => obj.status !== null)
      .map(({ status }) => status);
    list = list.filter(UtilsHelper.onlyUnique);
    this.statusList = this.getList(list);
  }

  private getList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      returnList.push({ id: i + 1, name: list[i] });
    }
    return returnList;
  }

  public updateFilter(event) {
    this.searchString = event.target.value;
    this.applyFilter();
  }

  public applyFilter() {
    const val = !this.searchString ? '' : this.searchString;
    let filterList = this.oriArr;
    if (this.selectedOffice && this.selectedOffice.length > 0) {
      const office = this.officeList
        .filter((obj: { id: any }) => this.selectedOffice.includes(obj.id))
        .map(({ name }) => name);
      filterList = filterList.filter(item => {
        if (item.officeName && office.indexOf(item.officeName) !== -1) {
          return item;
        }
      });
    }
    if (this.selectedStatus && this.selectedStatus.length > 0) {
      const status = this.statusList
        .filter((obj: { id: any }) => this.selectedStatus.includes(obj.id))
        .map(({ name }) => name);
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
          this.matchName(item, val, 'namefl') ||
          this.matchName(item, val, 'namelf') ||
          this.matchName(item, val, 'email') ||
          this.matchName(item, val, 'phones') ||
          this.matchName(item, val, 'attorney') ||
          this.matchName(item, val, 'uniqueNumber') ||
          this.matchName(item, val, 'preferredContact') ||
          ((item.name && item.name.replace(',', '')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.name && item.name.split(',').reverse().toString().trim().replace(',', ' ')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.name && item.name.split(',').reverse().toString().trim().replace(',', ', ')) || '').toLowerCase().includes(val.toLowerCase())
      );
    }

    this.contactList = filterList;
    this.getTotalPages();
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
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
    this.page.totalElements = this.contactList.length;
    this.page.totalPages = Math.ceil(this.contactList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    let searchName = '';
    if (fieldName === 'namefl') {
      searchName = item.firstName ? item.firstName.toString().toUpperCase().trim() + ' ' +
        item.lastName.toString().toUpperCase().trim()
        : (item.lastName) ? item.lastName.toString().toUpperCase().trim() : '';
    } else if (fieldName === 'namelf') {
      searchName = item.lastName ? item.lastName.toString().toUpperCase().trim() + ' ' +
        item.firstName.toString().toUpperCase().trim()
        : (item.firstName) ? item.firstName.toString().toUpperCase().trim() : '';
    } else {
      searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    }
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public getSelectedState(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'Select office';
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

  public clearFilter(type: string) {
    if (type === 'office') {
      this.selectedOffice = [];
      this.officeList.forEach(item => (item.checked = false));
      this.title = 'Select office';
    } else {
      this.selectedStatus = [];
      this.statusList.forEach(item => (item.checked = false));
      this.title1 = 'Select status';
    }
    this.applyFilter();
  }

  public createContact() {
    this.modalService.dismissAll();
    const url =
      this.selectedContact === 'pc'
        ? '/potential-client/new-potential-client-intake'
        : this.selectedContact === 'cc'
        ? '/contact/create-corporate-contact'
        : '/contact/create-client-association';
    this.router.navigateByUrl(url);
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

  public viewEdit(raw, type) {
    let url;
    if (raw.corporateContactTypes == "Potential Client") {
      url = `/contact/view-potential-client`;
    } else if (raw.corporateContactTypes == "Corporate Contact") {
      url = `/contact/create-corporate-contact`;
    } else if (raw.corporateContactTypes =="ClientAssociation") {
      url = `/contact/edit-client-association`;
    }
    const parameter: any = {};
    if (raw.corporateContactTypes == "Corporate Contact") {
      parameter.contactId = raw.id;
    }
    else{
      parameter.clientId = raw.id;
    }
    
    if (type === 'view') {
      if (raw.corporateContactTypes == "Potential Contact") {
        parameter.state = 'view';
      }
      if (raw.corporateContactTypes == "Corporate Contact") {
        parameter.state = 'view';
      }
      if (raw.corporateContactTypes =="ClientAssociation") {
        parameter.isViewMode = 1;
      }
    } else {
      if (raw.corporateContactTypes =="ClientAssociation") {
        parameter.isEditMode = 1;
      }
      if (raw.corporateContactTypes == "Potential Contact") {
        parameter.state = 'edit';
      }
      if (raw.corporateContactTypes == "Corporate Contact") {
        parameter.state = 'edit';
      }
    }
    this.router.navigate([url], { queryParams: parameter });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.contactList) {
      return this.contactList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
