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
import { Page } from '../../models';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';
import { WarningMessageDialogComponent } from '../../shared/warning-message-dialog/warning-message-dialog.component';


@Component({
  selector: 'app-corporate-contact',
  templateUrl: './corporate-contact.component.html',
  styleUrls: ['./corporate-contact.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CorporateContactComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public searchString: any ='';
  public selectedCompany: Array<any> = [];
  public selectedStatus: Array<any> = [];
  public selectedcontactType: Array<any> = [];
  public corporateContactList: Array<any> = [];
  public corporateContactListNew: Array<any> = [];
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
  public companyList: Array<any> = [];
  public statusList: Array<any> = [];
  public contactTypeList: Array<any> = [];
  public filterName = 'Apply Filter';
  public title = 'Select company';
  public title1 = 'Select status';
  public title2 = 'Select contact type';
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public blocks = 0;
  public currentActive: number;
  public updateStatusContact: string;
  public changeStatusNotes: string;
  public selectedRecord: any = {};
  public block_warn: string;
  public errorData: any = (errorData as any).default;
  public loading = true;
  public searchInput: string;
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
    this.pagetitle.setTitle("Corporate Contacts");
    this.block_warn = this.errorData.block_contact_warning;
    // this.getPotentialcontactNew(null);
    this.getPotentialcontact(null);
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngAfterViewInit() {
    this.initScrollDetector([this.table]);
    window.onresize = () => {
      UtilsHelper.checkDataTableScroller(this.tables);
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

  UpdateStatus($event, content, action, record) {
    $event.target.closest('datatable-body-cell').blur();
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

  showWarningPopup(msg) {
    this.loading = false;
    const activeModal = this.modalService
      .open(WarningMessageDialogComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
    activeModal.componentInstance.warningMessage = msg;
  }

  UpdateStatusCorporateContact() {
    const body: any = {
      personId: this.selectedRecord.id,
      reason: this.changeStatusNotes
    };
    this.loading = true;
    if (this.updateStatusContact === 'Deactivate') {
      this.contactsService
        .v1ContactsCorporateDeactivePersonIdDelete$Response(body)
        .subscribe(suc => {
            const res: any = suc;
              let data = JSON.parse(res.body as any).results;
              if(data == -1){
                this.showWarningPopup(this.errorData.deactivate_corporate_contact);
              }
              else{
                this.getPotentialcontact(
                  'Corporate contact ' + this.updateStatusContact.toLowerCase() + 'd.'
                );
                this.updateStatusContact = '';
              }

          },
          err => {
            console.log(err);
          }
        );
    } else if (this.updateStatusContact === 'Reactivate') {
      this.contactsService
        .v1ContactsCorporateReactivePersonIdDelete$Response(body)
        .subscribe(() => {
            this.getPotentialcontact(
              'Corporate contact ' + this.updateStatusContact.toLowerCase() + 'd.'
            );
            this.updateStatusContact = '';
          },
          err => {
            console.log(err);
          }
        );
    } else if (this.updateStatusContact === 'Archive') {
      this.contactsService
        .v1ContactsCorporateArchivePersonIdDelete$Response(body)
        .subscribe(() => {
            this.getPotentialcontact(
              'Corporate contact ' + this.updateStatusContact.toLowerCase() + 'd.'
            );
            this.updateStatusContact = '';
          },
          err => {
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

  public getPotentialcontact(msg) {
    this.contactsService.v1ContactsCorporateAllNewFromSpGet().subscribe(
      suc => {
        if (msg) {
          this.toastDisplay.showSuccess(msg);
        }
        this.searchInput = '';
        this.title = 'Select company';
        this.title2 = 'Select contact type';
        this.title1 = 'Select status';
        this.selectedStatus = [];
        this.selectedcontactType = [];
        this.selectedCompany = [];
        const res: any = suc;
        const list = JSON.parse(res).results;
        this.blocks = list.blocks;
        if (list.persons && list.persons.length > 0) {
          this.corporateContactListNew = this.setAllcorporateContactlist(
            list.persons
          );
          if (
            this.corporateContactListNew &&
            this.corporateContactListNew.length > 0
          ) {
            this.corporateContactListNew.forEach(item => {
              if(item.corporateContactTypes) {
                const itm = item.corporateContactTypes.split(', ').map(x => x.trim());
                item.corporateContactTypes = _.sortBy(itm).join(', ');
              }
            })
            this.oriArr = [...this.corporateContactListNew];
            UtilsHelper.aftertableInit();
            this.initScrollDetector([this.table]);
            UtilsHelper.checkDataTableScroller(this.tables);
            const keys = Object.keys(this.corporateContactListNew[0]);
            this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
          }
          this.getTotalPages();
          this.getFilters(this.corporateContactListNew);
          this.loading = false;
        } else {
          this.loading = false;
        }
      },
      err => {
        this.loading = false;
        console.log(err);
      }
    );
  }
//Do not delete
  // public getPotentialcontactNew(msg) {
  //   this.contactsService.v1ContactsCorporateAllNewFromSpGet().subscribe(
  //     suc => {
  //       if (msg) {
  //         this.toastDisplay.showSuccess(msg);
  //       }
  //       this.searchInput = '';
  //       this.title = 'Select company';
  //       this.title2 = 'Select contact type';
  //       this.title1 = 'Select status';
  //       const res: any = suc;
  //       const list = JSON.parse(res).results;
  //       this.blocks = list.blocks;
  //       if (list.persons && list.persons.length > 0) {
  //         this.corporateContactListNew = this.setAllcorporateContactlist(
  //           list.persons
  //         );
  //         if (
  //           this.corporateContactListNew &&
  //           this.corporateContactListNew.length > 0
  //         ) {
  //           this.oriArr = [...this.corporateContactListNew];
  //           UtilsHelper.aftertableInit();
  //           const keys = Object.keys(this.corporateContactListNew[0]);
  //           this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
  //         }
  //         this.getTotalPages();
  //         this.getFilters(this.corporateContactListNew);
  //         this.loading = false;
  //       } else {
  //         this.loading = false;
  //       }
  //       this.loading = false;
  //     },
  //     err => {
  //       console.log(err);
  //       this.loading = false;
  //     }
  //   );
  // }

  private setAllcorporateContactlist(data: any[]) {
    if (data && data.length > 0) {
      data.map(obj => {
        if (obj.doNotContact) {
          obj.preferredContact = 'Do Not Contact';
        }
      });
      return data;
    } else {
      return [];
    }
  }
  // private setAllcorporateContactlist(data: any[]) {
  //   if (data && data.length > 0) {
  //     data.map(obj => {
  //       if (obj.doNotContact) {
  //         obj.preferredContact = 'Do Not Contact';
  //       }
  //       obj.corporateContactTypes = obj.corporateContactTypes.join(',');
  //     });
  //     return data;
  //   } else {
  //     return [];
  //   }
  // }

  private getFilters(data: any[]) {
    this.getCompanyList(data);
    this.getStatusList(data);
    this.getContactTypeList(data);
  }

  private getCompanyList(data: any[]) {
    let list = data
      .filter((obj: { companyName: any }) => obj.companyName !== null && obj.companyName !== "" )
      .map(({companyName}) => companyName);
    list = list.filter(UtilsHelper.onlyUnique);
    this.companyList = this.getList(list);
  }

  private getStatusList(data: any[]) {
    let list = data
      .filter((obj: { status: any }) => obj.status !== null)
      .map(({status}) => status);
    list = list.filter(UtilsHelper.onlyUnique);
    this.statusList = this.getList(list);
  }

  private getContactTypeList(data: any[]) {
    this.contactTypeList = this.getList([
      'Primary Contact',
      'General Counsel',
      'Billing Contact'
    ]);
  }

  private getList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      returnList.push({id: i + 1, name: list[i]});
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
    this.page.totalElements = this.corporateContactListNew.length;
    this.page.totalPages = Math.ceil(
      this.corporateContactListNew.length / this.page.size
    );
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
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public getSelectedCompany(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'Select company';
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

  public getselectedcontactType(event) {
    this.title2 = '';
    if (event.length > 0) {
      this.title2 = event.length;
    } else {
      this.title2 = 'Select contact type';
    }
  }

  public clearFilter(type: string) {
    if (type === 'company') {
      this.selectedCompany = [];
      this.companyList.forEach(item => (item.checked = false));
      this.title = 'Select company';
    } else if (type === 'type') {
      this.selectedcontactType = [];
      this.contactTypeList.forEach(item => (item.checked = false));
      this.title2 = 'Select contact type';
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
    const val = !this.searchString ? '' : this.searchString.trim();
    let filterList = this.oriArr;
    if (this.selectedCompany && this.selectedCompany.length > 0) {
      const company = this.companyList
        .filter((obj: { id: any }) => this.selectedCompany.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.companyName && company.indexOf(item.companyName) !== -1) {
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
    if (this.selectedcontactType && this.selectedcontactType.length > 0) {
      let attorney: any = this.contactTypeList
        .filter((obj: { id: any }) => this.selectedcontactType.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        return ((item.corporateContactTypes.includes(_.sortBy(attorney).join(', ')))
          || (_.sortBy(attorney).join(', ').includes(item.corporateContactTypes))
          || attorney.map(x => item.corporateContactTypes && item.corporateContactTypes.includes(x))[0])
            && item.corporateContactTypes;
      });
    }

    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'companyName') ||
          this.matchName(item, val, 'name') ||
          this.matchName(item, val, 'contactInformation') ||
          this.matchName(item, val, 'phoneNumber') ||
          this.matchName(item, val, 'uniqueNumber') ||
          (UtilsHelper.formatPhoneNumber(item.phoneNumber) || '').includes(val)||
          ((item.name && item.name.replace(',', '')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.name && item.name.split(',').reverse().toString().trim().replace(',', ' ')) || '').toLowerCase().includes(val.toLowerCase())
      );
    }

    this.corporateContactListNew = filterList;
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
    if (this.corporateContactListNew) {
      return this.corporateContactListNew.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
