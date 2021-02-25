import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import { TenantTier } from 'src/app/modules/models/tenant-tier.enum';
import { vwClientAssociation } from 'src/app/modules/models/vw-client-association.model';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { vwClient } from 'src/common/swagger-providers/models';
import { ClientAssociationService, ClientService, MiscService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { IOffice } from '../../../models';
import { Page } from '../../../models/page';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy, AfterViewInit {
  modalOptions: NgbModalOptions;
  closeResult: string;

  @ViewChild('deactivateClient', { static: false }) model;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('deactivateClient2', { static: false }) deactivateClient2: TemplateRef<any>;

  public columnList: any = [];

  public rows: Array<any> = [];
  public exportRows: Array<any> = [];
  public oriArr: Array<any> = [];
  public isLoading = false;
  public isLoadingCSV = false;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
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
  public loading = true;
  public isFirstLoad = true;
  public searchString: string = '';

  public dropdownList1: Array<any> = [
    {
      id: 'active',
      name: 'Active',
      checked: false
    },
    {
      id: 'inactive',
      name: 'Inactive',
      checked: false
    },
    {
      id: 'archived',
      name: 'Archived',
      checked: false
    }
  ];

  public dropdownList2: Array<any> = [
    {
      id: 'individual',
      name: 'Individual',
      checked: false
    },
    {
      id: 'corporate',
      name: 'Corporate',
      checked: false
    }
  ];
  public selected = [];
  public officeList: Array<IOffice> = [];
  public resattrList1: Array<IOffice> = [];
  public callFlag = true;
  public errorData: any = (errorData as any).default;
  public pangeSelected = 1;
  public counter = Array;
  public selectedRow: vwClient;
  public clientAssociatList: Array<vwClientAssociation>;
  public originalClientAssociatList: Array<vwClientAssociation>;
  public selectedAssociatClient: Array<vwClientAssociation> = [];
  public deactivateClientWarn = true;
  public changeStatusNotes = '';
  public isReactivateCorporateContacts = true;
  public archiveReason = '';
  public modalReference: any;
  public archiveClientWarn = true;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public currentActive: number;

  public deactiv_client_war_row: string;
  public deactiv_client_warn: string;
  public dis_client_assoc: string;
  public rect_client_assoc: string;
  public deact_client_fail: string;
  public react_client: string;
  public arch_client_warn: string;

  userInfo: any;
  tenantTier = TenantTier;
  exportDisable: boolean = true;
  isEmerging: boolean = false;
  constructor(
    private modalService: NgbModal,
    private clientService: ClientService,
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>,
    private clientAssociationService: ClientAssociationService,
    private router: Router,
    private indexDbService: IndexDbService,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');

    this.userInfo = UtilsHelper.getLoginUser();
    this.isEmerging = this.userInfo && this.userInfo.tenantTier && this.userInfo.tenantTier.tierName == TenantTier.Emerging;
  }

  ngOnInit() {
    this.pagetitle.setTitle("Clients");
    this.deactiv_client_war_row = this.errorData.deactivate_client_warning_row;
    this.deactiv_client_warn = this.errorData.deactivate_client_warning;
    this.dis_client_assoc = this.errorData.disable_client_associations;
    this.rect_client_assoc = this.errorData.reactivate_client_associations;
    this.deact_client_fail = this.errorData.deactivate_client_fail;
    this.react_client = this.errorData.reactivate_client;
    this.arch_client_warn = this.errorData.archive_client_warning;
    this.getDetails();
    this.getOffices();
    this.getResposibleAttorny();
    this.getHeaders();
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
    this.table.bodyHeight = 400;
  }

  /**
   * Get client list
   *
   * @memberof ListComponent
   */
  public getDetails() {
    this.isLoading = true;
    this.clientService.v1ClientGetAllClientsNewFromSpGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        if (res && res.body) {
          this.oriArr = JSON.parse(res.body).results;
          this.rows = [...this.oriArr];
          this.isLoading = false;
          this.updateDatatableFooterPage();
          UtilsHelper.aftertableInit();
          this.loading = false;
          this.applyFilterForList();
        } else {
          this.loading = false;
        }
      },
      err => {
        this.isLoading = false;
        this.loading = false;
        console.log(err);
      }
    );
  }

  /**
   * Export CSV
   *
   * @param {(any[] | string[])} keys
   * @memberof ListComponent
   */
  addkeysIncolumnlist(keys: any[] | string[]) {
    for (let i = 0; i < keys.length; i++) {
      this.columnList.push({ Name: keys[i] });
    }
  }

  /**
   * Get office list
   *
   * @memberof ListComponent
   */
  public getOffices() {
    this.isLoading = true;
    this.misc.v1MiscOfficesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.officeList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  /**
   * Get responsible attorney list
   *
   * @memberof ListComponent
   */

  public getResposibleAttorny() {
    this.isLoading = true;
    this.misc.v1MiscAttornysGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.resattrList1 = JSON.parse(res.body).results;
        this.resattrList1 = this.resattrList1.filter(item => item && (item.name || '').trim());
      },
      err => {
        console.log(err);
      }
    );
  }

  /**
   * Change per page size
   *
   * @memberof ListComponent
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   * @memberof ListComponent
   */
  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  /**
   * Apply filter for primary office
   *
   * @memberof ListComponent
   */

  public applyFilterForList(){
    var temp = [...this.oriArr];
    if (this.selectedOffice && this.selectedOffice.length > 0) {
       temp = temp.filter(item => {
        if (
          item.primaryOfficeId &&
          this.selectedOffice.indexOf(item.primaryOfficeId) !== -1
        ) {
          return item;
        }
      });
    }

    if (this.responattorn && this.responattorn.length > 0) {
      temp = temp.filter(item => {
        if (
          item.responsibleAttorneyId &&
          this.responattorn.indexOf(item.responsibleAttorneyId) !== -1
        ) {
          return item;
        }
      });
    }

    if (this.typeselect && this.typeselect.length > 0) {
      temp = temp.filter(item => {
        if (
          this.typeselect.indexOf((item.type || '').toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    }

    if (this.selections1 && this.selections1.length > 0) {
      temp = temp.filter(item => {
        if (
          this.selections1.indexOf((item.status || '').toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    }

    if (this.searchString !== '') {
      temp = temp.filter(
        item =>
          this.matchClientSearch(item, this.searchString, 'name') ||
          this.matchClientSearch(item, this.searchString, 'preferredContactMethod') ||
          this.matchClientSearch(item, this.searchString, 'primaryContactName') || 
          this.matchClientSearch(item, this.searchString, 'primaryOffice') || 
          this.matchClientSearch(item, this.searchString, 'responsibleAttorney') || 
          this.matchClientSearch(item, this.searchString, 'status') || 
          this.matchClientSearch(item, this.searchString, 'type') || 
          this.matchClientSearch(item, this.searchString, 'uniqueNumber') ||
          this.matchClientSearch(item, this.searchString, 'email') ||
          this.matchClientSearch(item, this.searchString, 'primaryPhoneNumber') ||
          (item.name || '').replace(/[, ]+/g, ' ').toLowerCase().includes((this.searchString || '').replace(/[, ]+/g, ' ').toLocaleLowerCase()) || (item.name || '').split(',').reverse().join(' ').toLowerCase().includes((this.searchString || '').toLocaleLowerCase())
      );
    }
      // update the rows
    this.rows = [...temp];
    this.updateDatatableFooterPage();

  }

  private matchClientSearch(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toLowerCase()
      : '';
    return searchName.search(searchValue.toString().trim().toLowerCase()) > -1;
  }



  public applyFilterPrimaryOffice() {
    if (this.selectedOffice && this.selectedOffice.length > 0) {
      const temp = this.oriArr.filter(item => {
        if (
          item.primaryOfficeId  &&
          this.selectedOffice.indexOf(item.primaryOfficeId) !== -1
        ) {
          return item;
        }
      });
      // update the rows
      this.rows = temp;
      this.updateDatatableFooterPage();
    }
  }

  /**
   * Apply filter for responsible attorney
   *
   * @memberof ListComponent
   */
  public applyFilterResponsibleAttorney() {
    if (this.responattorn && this.responattorn.length > 0) {
      const temp = this.oriArr.filter(item => {
        let returnItem: boolean = false;
        if (item.responsibleAttorneys && item.responsibleAttorneys.length) {
          item.responsibleAttorneys.filter(responsible => {
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

  /**
   * Apply filter for status
   *
   * @memberof ListComponent
   */
  public applyFilterstatus() {
    if (this.selections1 && this.selections1.length > 0) {
      const temp = this.oriArr.filter(item => {
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

  /**
   * Apply filter for type
   *
   * @memberof ListComponent
   */
  public applyFiltertype() {
    if (this.typeselect && this.typeselect.length > 0) {
      const temp = this.oriArr.filter(item => {
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

  /**
   *
   * Clear filter of primary office
   * @memberof ListComponent
   */
  public clearFilterPrimaryOffice() {
    this.selectedOffice = [];
    this.officeList.forEach(item => (item.checked = false));
    this.title = 'All';
    this.applyFilterForList();
  }

  /**
   *
   * Clear filter of responsible attorney
   * @memberof ListComponent
   */
  public clearFilterResponsibleAttorney() {
    this.responattorn = [];
    this.resattrList1.forEach(item => (item.checked = false));
    this.titlereasatt = 'All';
    this.applyFilterForList();
  }

  /**
   * search filter
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public searchFilter(event) {
    const val = event.target.value;
    const temp = this.oriArr.filter(
      item =>
        this.matchName(item, val, 'id') ||
        this.matchName(item, val, 'lastName') ||
        this.matchName(item, val, 'firstName') ||
        this.matchName(item, val, 'clientName') ||
        this.matchName(item, val, 'clientNamefl') ||
        this.matchName(item, val, 'clientNamelf') ||
        this.matchName(item, val, 'primaryContactName') ||
        this.matchName(item, val, 'primaryContactNamefl') ||
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

  /**
   * search record from tables
   *
   * @private
   * @param {*} item
   * @param {string} searchValue
   * @param {*} fieldName
   * @returns {boolean}
   * @memberof ListComponent
   */
  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'preferredContactMethod') {
      if (item.preferredContactMethod == 'Email') {
        searchName = item.email ? item.email.toString().toUpperCase() : '';
      } else if (
        item.preferredContactMethod == 'Text' ||
        item.preferredContactMethod == 'Call'
      ) {
        if (item.phones) {
          let number = item.phones.find(a => a.isPrimary);
          searchName = number ? number.number : '';
        } else {
          searchName = '';
        }
      } else {
        searchName = '';
      }
    } else if (fieldName === 'primaryContactNamefl') {
      searchName = (item.primaryContactPerson && item.primaryContactPerson.name) ? item.primaryContactPerson.name
              : (item.firstName) ? item.firstName + ' ' + item.firstName : (item.lastName) ? item.lastName : '';
    } else if (fieldName === 'responsibleAttorneys') {
      searchName =
        item[fieldName] && item[fieldName].length > 0
          ? item[fieldName][0]['name'] ? item[fieldName][0]['name'].toString().toUpperCase() : ''
          : '';
    } else if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName]['name']
          ? item[fieldName]['name'].toString().toUpperCase()
          : '';
    }

    else if (fieldName === 'clientName') {
      if (item['companyName']) {
        searchName =
          item['companyName']
            ? item['companyName'].toString().toUpperCase()
            : '';
      } else {
        searchName = item['lastName'] ? item['lastName'].toString().toUpperCase().trim() + ',' + item['firstName'].toString().toUpperCase().trim() :
          item['firstName'].toString().toUpperCase().trim();
      }
    } else if (fieldName === 'clientNamefl') {
      if (item['companyName']) {
        searchName =
          item['companyName']
            ? item['companyName'].toString().toUpperCase()
            : '';
      } else {
        searchName = item['firstName'] ? item['firstName'].toString().toUpperCase().trim() + ' ' + item['lastName'].toString().toUpperCase().trim() :
          item['lastName'].toString().toUpperCase().trim();
      }
    } else if (fieldName === 'clientNamelf') {
      if (item['companyName']) {
        searchName =
          item['companyName']
            ? item['companyName'].toString().toUpperCase()
            : '';
      } else {
        searchName = item['lastName'] ? item['lastName'].toString().toUpperCase().trim() + ' ' + item['firstName'].toString().toUpperCase().trim() :
          item['firstName'].toString().toUpperCase().trim();
      }
    }
    else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ",")) > -1;
  }
  /**
   * select primary office drop down
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public selectDropdwnPo(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  /**
   * select responsible attorney drop down
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public selectDropdwnRa(event) {
    this.titlereasatt = '';
    if (event.length > 0) {
      this.titlereasatt = event.length;
    } else {
      this.titlereasatt = 'All';
    }
  }

  /**
   * select type drop down
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public selecttype(event) {
    this.titletype = '';
    if (event.length > 0) {
      this.titletype = event.length;
    } else {
      this.titletype = 'All';
    }
  }

  /**
   * select status drop down
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public selectStatus(event) {
    this.titlestatus = '';
    if (event.length > 0) {
      this.titlestatus = event.length;
    } else {
      this.titlestatus = 'All';
    }
  }

  public onMultiSelectSelectedOptions(event) {
    // this.possibleLocationMultiSelectSelectedOptions = event;
  }

  /**
   * Clear status filter
   *
   * @memberof ListComponent
   */
  public clearFilter1() {
    this.selections1 = [];
    this.dropdownList1.forEach(item => (item.checked = false));
    this.titlestatus = 'All';
    this.applyFilterForList();
   // this.rows = [...this.oriArr];
   // this.applyFilterstatus();
  }

  /**
   * Clear type filter
   *
   * @memberof ListComponent
   */
  public clearFilter2() {
    this.typeselect = [];
    this.dropdownList2.forEach(item => (item.checked = false));
    //this.rows = [...this.oriArr];
    this.titletype = 'All';
    //this.applyFiltertype();
    this.applyFilterForList();
  }

  openPersonalinfo(content: any, className, winClass, item) {
    this.selectedRow = item;
    this.getClientAssociation(item.id);
    this.openModal(content, className, winClass);
  }

  /*** function to open modal */
  openModal(content: any, className: any, winClass: string) {
    this.modalReference = this.modalService
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

  public getClientAssociation(id) {
    if (id) {
      this.loading = true;
      this.clientAssociationService
        .v1ClientAssociationAllClientIdGet$Response({ clientId: id })
        .subscribe(
          suc => {
            this.loading = false;
            const res = suc as any;
            this.clientAssociatList = JSON.parse(res.body).results || [];
            this.selectedAssociatClient = this.clientAssociatList;
            this.clientAssociatList = this.clientAssociatList.filter(
              a => !a.isSharedByOther &&
                (
                  a.associationType === 'Opposing Party' ||
                  a.associationType === 'Opposing Counsel' ||
                  a.associationType === 'Vendor' ||
                  a.associationType === 'Subsidiary' ||
                  a.associationType === 'Expert Witness'
                )
            );
            this.originalClientAssociatList = [...this.clientAssociatList];
            this.clientAssociatList = _.uniqBy(
              this.clientAssociatList,
              a => a.personId
            );
          },
          err => {
            this.loading = false;
            console.log(err);
          }
        );
    }
  }

  public onSelectClientAssociat({ selected }) {
    this.selectedAssociatClient.splice(0, this.selectedAssociatClient.length);
    this.selectedAssociatClient.push(...selected);
  }

  public clientStatusChange(action: string) {
    const ids = this.selectedAssociatClient.map(a => a.personId);

    const body: any = {
      clientId: this.selectedRow.id,
      deactivatedClientAssociations: ids,
      isReactivateCorporateContacts: (action === 'isReactivating') ? this.isReactivateCorporateContacts : false
    };

    body[action] = true;
    body.changeStatusNotes = this.changeStatusNotes;

    if (action === 'isArchiving' || action === 'isUnArchiving') {
      body.archiveReason = this.archiveReason;
    }

    let observable = this.clientService.v1ClientDeactivateArchiveDelete$Json$Response(
      { body }
    );

    if (action === 'isReactivating') {
      delete body.deactivatedClientAssociations;
      body.reactivatedClientAssociations = ids;
      observable = this.clientService.v1ClientReactivateUnarchivePut$Json$Response(
        { body }
      );
    }
    this.loading = true;
    observable.subscribe(
      (res: any) => {
        this.loading = false;
        const response = JSON.parse(res.body);
        this.changeStatusNotes = '';
        this.archiveReason = '';
        if (response && response.results) {
          this.hideModalToast(action, true);
          this.getDetails();
        } else {
          this.hideModalToast(action);
          if (response && response.detail) {
            this.openModal(this.deactivateClient2, 'lg', 'modal-has-alert');
          } else {
            this.toastDisplay.showError(this.errorData.server_error);
          }
        }
      },
      err => {
        this.loading = false;
      }
    );
  }

  /**** common function to display message according to the status */
  hideModalToast(action: string, showMessage?: boolean) {
    switch (action) {
      case 'isArchiving':
        this.archiveReason = '';
        document.getElementById('close-archive-md').click();
        if (showMessage) {
          this.toastDisplay.showSuccess(this.errorData.archive_user);
        }
        break;
      case 'isDeactivating':
        document.getElementById('close-deactivate-md').click();
        if (showMessage) {
          this.toastDisplay.showSuccess(this.errorData.deactivate_user);
        }
        break;
      case 'isReactivating':
        document.getElementById('close-reactivate-md').click();
        if (showMessage) {
          this.toastDisplay.showSuccess(this.errorData.reactivate_user);
        }
        break;
    }
  }

  private getDismissReason(reason: any): string {
    this.columnList.forEach(element => (element.isChecked = false));
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  getHeaders() {
    this.isLoadingCSV = true;
    this.clientService.v1ClientGetAllClientsHeaderGet$Response({}).subscribe(
      suc => {
        this.isLoadingCSV = false;
        const res: any = suc;
        if (res && res.body) {
          this.isFirstLoad = true;
          const clientList = JSON.parse(res.body).results;
          const rows = clientList;
          if (rows.length > 0) {
            const keys = Object.keys(rows[0]);
            this.addkeysIncolumnlist(keys);
          }
        }
      },
      err => {
        console.log(err);
        this.isLoadingCSV = false;
      }
    );
  }

  getExportToCSVData() {

    this.isLoadingCSV = true;
    this.clientService.v1ClientGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        if (res && res.body) {
          this.isFirstLoad = true;
          const rows = [];
          const clientList = JSON.parse(res.body).results;
          for (let i = 0; i < clientList.length; i++) {
            const obj = clientList[i];
            obj.name = obj.isCompany
              ? obj.companyName
              : obj.firstName
                ? obj.lastName + ', ' + obj.firstName
                : obj.lastName;
            obj.status = obj.isVisible
              ? 'Active'
              : obj.isArchived
                ? 'Archived'
                : 'Inactive';
            rows.push(obj);
          }
          this.exportRows = rows;
          if (this.exportRows && this.exportRows.length > 0) {
            this.exportRows.map(obj => {
              if (
                obj.responsibleAttorneys &&
                obj.responsibleAttorneys.length > 0
              ) {
                obj.rname = obj.responsibleAttorneys[0].name;
              }
            });
          }
        }
        this.isLoadingCSV = false;
        this.ExportToCSV();
      },
      err => {
        this.isLoadingCSV = false;
        console.log(err);
      }
    );
  }

  ExportToCSV() {
    const temprows = JSON.parse(JSON.stringify(this.exportRows));
    const selectedrows = Object.assign([], temprows);

    selectedrows.map(obj => {
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
        obj.matterStatus.map(item => {
          matterStatus = matterStatus + item.number + '/';
        });
        obj.matterStatus = matterStatus;
      }
      if (obj.matterType && obj.matterType.length > 0) {
        let matterType = '';
        obj.matterType.map(item => {
          matterType = matterType + item.number + '/';
        });
        obj.matterType = matterType;
      }
      if (obj.responsibleAttorneys && obj.responsibleAttorneys.length > 0) {
        let responsibleAttorneys = '';
        obj.responsibleAttorneys.map(item => {
          responsibleAttorneys = responsibleAttorneys + item.number + '/';
        });
        obj.responsibleAttorneys = responsibleAttorneys;
      }
      if (obj.role && obj.role.length > 0) {
        let role = '';
        obj.role.map(item => {
          role = role + item.number + '/';
        });
        obj.role = role;
      }
      if (obj.phones && obj.phones.length > 0) {
        let phones = '';
        obj.phones.map(item => {
          phones = phones + item.number + '/';
        });
        obj.phones = phones;
      }
      if (obj.secondaryOffices && obj.secondaryOffices.length > 0) {
        let secondaryOffices = '';
        obj.secondaryOffices.map(item => {
          secondaryOffices = secondaryOffices + item.number + '/';
        });
        obj.secondaryOffices = secondaryOffices;
      }
      if (obj.retainerPracticeAreas && obj.retainerPracticeAreas.length > 0) {
        let retainerPracticeAreas = '';
        obj.retainerPracticeAreas.map(item => {
          retainerPracticeAreas = retainerPracticeAreas + item.number + '/';
        });
        obj.retainerPracticeAreas = retainerPracticeAreas;
      }
      if (
        obj.initialConsultPracticeAreas &&
        obj.initialConsultPracticeAreas.length > 0
      ) {
        let initialConsultPracticeAreas = '';
        obj.initialConsultPracticeAreas.map(item => {
          initialConsultPracticeAreas =
            initialConsultPracticeAreas + item.number + '/';
        });
        obj.initialConsultPracticeAreas = initialConsultPracticeAreas;
      }
      if (obj.states && obj.states.length > 0) {
        let states = '';
        obj.states.map(item => {
          states = states + item.number + '/';
        });
        obj.states = states;
      }
      if (obj.groups && obj.groups.length > 0) {
        let groups = '';
        obj.groups.map(item => {
          groups = groups + item.number + '/';
        });
        obj.groups = groups;
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

  /** update Attorney table footer page count */
  updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(this.rows.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
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

  createNewClient() {
    const user: any = UtilsHelper.getLoginUser();
    this.router.navigate(['/client-create/create']);
  }

  changedExportValidation($event) {
    if (this.rows.length && this.columnList.some(item => item.isChecked)) {
      this.exportDisable = false;
    } else {
      this.exportDisable = true;
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
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
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  checkNaN(value: any) {
    return isNaN(value);
  }
}
