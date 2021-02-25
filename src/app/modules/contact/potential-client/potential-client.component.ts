import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import * as Constant from 'src/app/modules/shared/const';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwClient } from 'src/common/swagger-providers/models';
import { ClientService, ContactsService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { TenantTier } from '../../models/tenant-tier.enum';
import { vwPotentialClient } from '../../models/vw-potential-client.model';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-potential-client',
  templateUrl: './potential-client.component.html',
  styleUrls: ['./potential-client.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PotentialClientComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  @ViewChild('deactivateClient2', {static: false}) deactivateClient2: TemplateRef<any>;

  modalOptions: NgbModalOptions;
  closeResult: string;
  public searchString: any;
  public selectedOffice: Array<any> = [];
  public selectedStatus: Array<any> = [];
  public selectedAttorney: Array<any> = [];
  public contactList: Array<any> = [];
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
  public officeList: Array<any> = [];
  public statusList: Array<any> = [];
  public decisionStatusList: Array<any> = [];
  public attorneyList: Array<any> = [];
  public filterName = 'Apply Filter';
  public title = 'Select office';
  public title1 = 'Select status';
  public title2 = 'Select attorney';
  public blocks = 0;
  public selectedRow: vwClient;
  public clientAssociatList: Array<any> = [];
  public changeStatusNotes = '';
  public selectedAssociatClient = [];
  public archiveReason = '';
  public errorData: any = (errorData as any).default;
  public archiveClientWarn = true;
  public currentActive: number;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public block_warn: string;
  public arch_client_warn: string;
  public dis_client_assoc: string;
  public deact_client_fail: string;
  public loading = true;
  public searchInput: string;

  userInfo: any;
  tenantTier = TenantTier;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  title3 = 'All decisions';
  public selectedDecisionStatus: Array<any> = [];
  constructor(
    private modalService: NgbModal,
    private contactsService: ContactsService,
    private clientService: ClientService,
    private toastDisplay: ToastDisplay,
    private router: Router,
    private store: Store<fromRoot.AppState>,
    private indexDbService: IndexDbService,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');

    this.userInfo = UtilsHelper.getLoginUser();
  }

  ngOnInit() {
    this.pagetitle.setTitle("Potential Clients");
    this.block_warn = this.errorData.block_contact_warning;
    this.arch_client_warn = this.errorData.archive_client_warning;
    this.dis_client_assoc = this.errorData.disable_client_associations;
    this.deact_client_fail = this.errorData.deactivate_client_fail;
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getPotentialcontact();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.initScrollDetector([this.table]);
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

  addPotentialClient() {
    localStorage.removeItem('contactDetails');
    localStorage.removeItem('pccreatestep');
    localStorage.removeItem('attorney_id');
    const user: any = UtilsHelper.getLoginUser();
    if (user && user.tenantTier) {
      if (UtilsHelper.validTenantTier().includes(user.tenantTier.tierName)) {
        this.router.navigate(['/potential-client/new-potential-client-intake']);
        return;
      }
    }
    this.router.navigate(['/potential-client/new-potential-client-intake']);
  }

  public getPotentialcontact() {
    this.contactsService.v1ContactsPotentialFromSpGet().subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        this.blocks = list.blocks;
        this.searchInput = '';
        this.title = 'Select office';
        this.title1 = 'Select status';
        this.title2 = 'Select attorney';
        this.title3 = 'All decisions';
        this.contactList =
          list && list.persons ? this.setAllContactlist(list.persons) : [];
        this.getFilters(this.contactList);
        this.selectedStatus = [];
        this.selectedAttorney = [];
        this.selectedOffice = [];
        this.selectedDecisionStatus = [];

        if (this.contactList && this.contactList.length > 0) {
          this.oriArr = [...this.contactList];
          const keys = Object.keys(this.contactList[0]);
          this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
        }
        this.getTotalPages();
        UtilsHelper.aftertableInit();
        UtilsHelper.checkDataTableScroller(this.tables);
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  private setAllContactlist(data: vwPotentialClient[]) {
    const isEmerging = this.userInfo && this.userInfo.tenantTier && this.userInfo.tenantTier.tierName == TenantTier.Emerging;
    return data;
  }

  private getFilters(data: any[]) {
    this.getOfficeList(data);
    this.getStatusList(data);
    this.getAttorneyList(data);
    this.getDecisionList(data);
  }

  private getOfficeList(data: any[]) {
    let list = data
      .filter((obj: { primaryOffice: any }) => obj.primaryOffice !== null)
      .map(({primaryOffice}) => primaryOffice);
    list = list.filter(UtilsHelper.onlyUnique);
    this.officeList = this.getList(list);
  }
  private getDecisionList(data: any[]) {
    let list = data
      .filter((obj: { consultationFeeRecordStatus: any }) => obj.consultationFeeRecordStatus !== null)
      .map(({consultationFeeRecordStatus}) => consultationFeeRecordStatus);
    list = list.filter(UtilsHelper.onlyUnique);
    this.decisionStatusList = this.getList(list);
  }


  private getStatusList(data: any[]) {
    let list = data
      .filter((obj: { status: any }) => obj.status !== null)
      .map(({status}) => status);
    list = list.filter(UtilsHelper.onlyUnique);
    this.statusList = this.getList(list);
  }

  private getAttorneyList(data: any[]) {
    let list = data
      .filter((obj: { responsibleAttorney: any }) => obj.responsibleAttorney !== null)
      .map(({responsibleAttorney}) => responsibleAttorney);
    list = list.filter(UtilsHelper.onlyUnique);
    this.attorneyList = this.getList(list);
  }

  private getList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      returnList.push({id: i + 1, name: list[i]});
    }
    return returnList;
  }

  openPersonalinfo(
    content: any,
    className,
    winClass,
    item: any,
    clientAssociation: boolean = true
  ) {
    this.selectedRow = item;
    if (clientAssociation) {
      this.getClientAssociation(item.id);
    }
    this.openModal(content, className, winClass);
  }

  /*** function to open modal */
  openModal(content: any, className: any, winClass: string) {
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

  /**
   * function to get client associtaion
   */
  public getClientAssociation(id) {
    if (id) {
      this.clientService
        .v1ClientAssociationsListClientIdGet$Response({clientId: id})
        .subscribe(
          suc => {
            const res = suc as any;
            this.clientAssociatList = JSON.parse(res.body).results;
          },
          err => {
            console.log(err);
          }
        );
    }
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
    this.table.offset = 0;
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
  public getSelectedDecisionStatus(event) {
    this.title3 = '';
    if (event.length > 0) {
      this.title3 = event.length;
    } else {
      this.title3 = 'All decisions';
    }
  }


  public getSelectedAttorney(event) {
    this.title2 = '';
    if (event.length > 0) {
      this.title2 = event.length;
    } else {
      this.title2 = 'Select attorney';
    }
  }

  public clearFilter(type: string) {
    if (type === 'office') {
      this.selectedOffice = [];
      this.officeList.forEach(item => (item.checked = false));
      this.title = 'Select office';
    } else if (type === 'attorney') {
      this.selectedAttorney = [];
      this.attorneyList.forEach(item => (item.checked = false));
      this.title2 = 'Select attorney';
    } 
      else if (type === 'decisionStatus') {
        this.selectedDecisionStatus = [];
        this.decisionStatusList.forEach(item => (item.checked = false));
        this.title3 = 'All decisions';
      }
    else {
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
    if (this.selectedOffice && this.selectedOffice.length > 0) {
      const office = this.officeList
        .filter((obj: { id: any }) => this.selectedOffice.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.primaryOffice && office.indexOf(item.primaryOffice) !== -1) {
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
    if (this.selectedDecisionStatus && this.selectedDecisionStatus.length > 0) {
      const status = this.decisionStatusList
        .filter((obj: { id: any }) => this.selectedDecisionStatus.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.consultationFeeRecordStatus && status.indexOf(item.consultationFeeRecordStatus) !== -1) {
          return item;
        }
      });
    }
    if (this.selectedAttorney && this.selectedAttorney.length > 0) {
      const attorney = this.attorneyList
        .filter((obj: { id: any }) => this.selectedAttorney.includes(obj.id))
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.responsibleAttorney && attorney.indexOf(item.responsibleAttorney) !== -1) {
          return item;
        }
      });
    }

    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'primaryOffice') ||
          this.matchName(item, val, 'name') ||
          this.matchName(item, val, 'preferredContact') ||
          this.matchName(item, val, 'responsibleAttorney') ||
          this.matchName(item, val, 'uniqueNumber') ||
          (UtilsHelper.formatPhoneNumber(item.preferredContact) || '').includes(val) ||
          ((item.name && item.name.replace(',', '')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.name && item.name.split(',').reverse().toString().trim().replace(',', ' ')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.name && item.name.split(',').reverse().toString().trim().replace(',', ', ')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.responsibleAttorney && item.responsibleAttorney.replace(',', '')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.responsibleAttorney && item.responsibleAttorney.split(',').reverse().toString().trim().replace(',', ' ')) || '').toLowerCase().includes(val.toLowerCase()) ||
          ((item.responsibleAttorney && item.responsibleAttorney.split(',').reverse().toString().trim().replace(',', ', ')) || '').toLowerCase().includes(val.toLowerCase())
      );
    }

    this.contactList = filterList;
    this.getTotalPages();
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

  public onSelectClientAssociat({selected}) {
    this.selectedAssociatClient.splice(0, this.selectedAssociatClient.length);
    this.selectedAssociatClient.push(...selected);
  }

  /*** change potential client status */
  public clientStatusChange(action: string) {
    const ids = this.selectedAssociatClient.map(obj => obj.id);
    const body: any = {
      clientId: this.selectedRow.id,
      deactivatedClientAssociations: ids
    };
    body[action] = true;
    this.loading = true;
    body.changeStatusNotes = this.changeStatusNotes;
    if (action === 'isArchiving' || action === 'isDeactivating') {
      body.archiveReason = this.archiveReason;
    }
    let url: any = this.clientService.v1ClientDeactivateArchiveDelete$Json$Response(
      {body}
    );
    if (action === 'isReactivating') {
      url = this.clientService.v1ClientReactivateUnarchivePut$Json$Response({
        body
      });
    }
    url.subscribe(
      (res: any) => {
        const response = JSON.parse(res.body);
        this.changeStatusNotes = '';
        this.archiveReason = '';
        if (response && response.results) {
          this.hideModalToast(action, true);
          this.getPotentialcontact();
        } else {
          this.hideModalToast(action);
          if (response && response.detail) {
            this.openModal(this.deactivateClient2, 'lg', 'modal-has-alert');
          } else {
            this.toastDisplay.showError(this.errorData.server_error);
          }
          this.loading = false;
        }
      },
      () => {
        this.loading = false;
      }
    );
  }

  /**** common function to display message according to the status */
  hideModalToast(action: string, showMessage?: boolean) {
    switch (action) {
      case 'isArchiving':
        this.archiveReason = '';
        if (showMessage) {
          this.toastDisplay.showSuccess(this.errorData.archive_user);
        }
        break;
      case 'isDeactivating':
        if (showMessage) {
          this.toastDisplay.showSuccess(this.errorData.deactivate_Contact);
        }
        break;
      case 'isReactivating':
        if (showMessage) {
          this.toastDisplay.showSuccess(this.errorData.reactivate_user);
        }
        break;
    }
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

  public navigateUrl(row) {
    this.router.navigate(['/contact/client-conversion'], {
      queryParams: {
        clientId: row.id,
        type: row.isCompany ? 'company' : 'individual'
      }
    });
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }
  /***** function to check if a string is email or phone */
  checkPhoneOrEmail(contactMethod: string) {
    const patt = new RegExp("^([A-Za-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$");
    if (patt.test(contactMethod)) {
      return contactMethod;
    }
    return contactMethod ? '(' + contactMethod.substr(0, 3) + ') ' + contactMethod.substr(3, 3)  +'-' + contactMethod.substr(6, 4) : '-';
  }

  get footerHeight() {
    if (this.contactList) {
      return this.contactList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
