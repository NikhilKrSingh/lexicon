import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { StringifyOptions } from 'querystring';
import { Observable, Subscription } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { MatterListSearchOption, Page, vwMatterResponse } from 'src/app/modules/models';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { MatterService, UsioService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { calculateTotalPages } from '../math.helper';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-office-trust-bank-account',
  templateUrl: './office-trust-bank-account.component.html',
  styleUrls: ['./office-trust-bank-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class OfficeTrustBankAccountComponent implements OnInit, OnDestroy, AfterViewInit {
  hiddenMenu: boolean = false;
  @Output() readonly selectedTrustAccount = new EventEmitter();
  @Input() editCreditCard: boolean = false;
  @Input() bankType: string = null;
  @Input() bankAccountName: string = null;
  @Input() trustAccountError: boolean = false;
  @Input() creditCardBankId: any;
  @Input() mode: string = null;
  @Input() officeId: number = null;

  public searchText: string = null;
  public merchantAccountFilterId: number = null;
  public transactionAccountFilterId: number = null;
  public merchantAccountFilterList: Array<any> = [
    { id: 0, name: 'All' },
    { id: 1, name: 'Yes' },
    { id: 2, name: 'No' }];
  public transactionAccountFilterList: Array<any> = [
    { id: 0, name: 'All' },
    { id: 1, name: 'ACH' },
    { id: 2, name: 'Credit Card' }];;
  public ColumnMode: ColumnMode;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public page = new Page();
  public originalOfficeBankList: Array<any> = [];
  public officeBankList: Array<any> = [];
  public selectPageSize = new FormControl('10');
  public pageSelected: number = 1;
  public loading: boolean = true;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public SelectionType = SelectionType;
  public trustAccountLengthOneFlag: boolean = false;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};
  public selectedRowsLength: number = 0;
  public isEdit: boolean = false;
  public trustAccountIds: any[] = [];
  selected: any[] = [];
  public subscriptionList: any;
  public matterAssigned: number = 0;
  public currentActive: number;
  closeResult: string;
  matterList: Array<vwMatterResponse> = [];
  selectedAccount: string;
  searchString: string = null;
  public pageSelector = new FormControl('10');
  searchResults: Array<vwMatterResponse> = [];
  showSearchResults = false;
  searchOption: MatterListSearchOption;
  isView: boolean = false;
  isChecked: boolean = false;
  orgMatterList: Array<vwMatterResponse> = [];
  selectedRows: Array<vwMatterResponse> = [];
  public page1 = new Page();
  public selectPageSize1 = new FormControl('10');
  public pageSelected1: number = 1;
  public isCheckBoxHidden : boolean = false;
  constructor(
    public usioService: UsioService,
    public modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private sharedService: SharedService,
    private matterService: MatterService
  ) {
    this.searchOption = new MatterListSearchOption();
    this.page.size = 10;
    this.page.pageNumber = 0;
    this.page1.size = 10;
    this.page1.pageNumber = 0;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.subscriptionList = this.sharedService.listTrustBankSource$.subscribe(
      res => {
        if (res) {
          this.loadData();
        }
      }
    );

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnDestroy() {
    this.editCreditCard = false;
    if (this.subscriptionList) {
      this.subscriptionList.unsubscribe();
      this.sharedService.changeSourceBankTrust(null);
    }
  }

  ngAfterViewInit() {
    this.loadData();
  }

  async loadData() {
    if (this.bankType && this.mode !== 'view') {
      this.matterAssigned = 0;
      this.isChecked = false;
      switch (this.bankType) {

        case 'trustBankAccount':
          await this.getUsioTenantTrustBankAccounts(2);
          break;
        case 'creditCardTrustBank':
          await this.getUsioTenantTrustBankAccounts(3);
          break;
      }
    } else {
      this.matterAssigned = 0;
      this.isChecked = false;
      switch (this.bankType) {
        case 'trustBankAccount':
          await this.editOfficeBankAccount(2);
          break;
        case 'creditCardTrustBank':
          await this.getUsioTenantTrustBankAccounts(3);
          break;
      }
    }

    if (this.creditCardBankId && this.officeBankList.length) {
      const idx = this.officeBankList.findIndex(row => row.usioBankAccountId == +this.creditCardBankId);
      if (idx > -1) {
        this.onSelect(this.officeBankList[idx]);
      }
    }
  }

  /****** Triggers When Filter Applied ******/
  public applyFilter() {
    let rows = [...this.originalOfficeBankList];
    if (this.searchText) {
      rows = this.originalOfficeBankList.filter(f => {
        return (
          (f.name || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
          (((f.merchantAccountNumber || f.nonMerchantAccountNumber) || '').substr(((f.merchantAccountNumber || f.nonMerchantAccountNumber) || '').length - 4) || '').toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    }

    if (this.transactionAccountFilterId) {
      if (this.transactionAccountFilterId === 1) {
        rows = rows.filter(f => {
          return f.isAchAccount || false;
        });
      }

      if (this.transactionAccountFilterId === 2) {
        rows = rows.filter(f => {
          return f.isCreditCardAccount || false;
        });
      }
    }

    if (this.merchantAccountFilterId) {
      if (this.merchantAccountFilterId === 1) {
        rows = rows.filter(f => {
          return f.isMerchantAccount || false;
        });
      }

      if (this.merchantAccountFilterId === 2) {
        rows = rows.filter(f => {
          return !f.isMerchantAccount || false;
        });
      }
    }

    this.officeBankList = [...rows];
    this.updateDatatableFooterPage1();
  }

  /******* Calculates Total Page Table ********/

  updateDatatableFooterPage1() {
    this.page1.totalElements = this.officeBankList.length;
    this.page1.totalPages = Math.ceil(
      this.officeBankList.length / this.page1.size
    );
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page1.pageNumber = 0;
    this.pageSelected1 = 1;
    UtilsHelper.aftertableInit();
  }

  /****** Data Table Items per page *****/
  public pageSizeChange1(): void {
    this.page1.size = +this.selectPageSize1.value;
    this.updateDatatableFooterPage1();
  }

  /****** Change Page Drop Down */
  public changePageDropDown1(e) {
    this.pageSelected1 = e.page;
  }

  /******* Changes Data Table Page ******/
  public changePage1() {
    this.page1.pageNumber = this.pageSelected1 - 1;
    if (this.pageSelected1 == 1) {
      this.updateDatatableFooterPage1();
    }
  }

  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  /****** Triggers When Row Selected From Table *****/
  public onSelect(rows: any) {
    this.selectedRows = rows;
    if (rows.selected) {
      this.selected = rows.selected;
      this.selectedRowsLength = rows.selected.length;
      this.selectedTrustAccount.emit(rows.selected);
    } else {
      let row: any[] = new Array<any>(rows);
      this.selectedRowsLength = row.length;
      this.selectedTrustAccount.emit(row);
    }
  }

  /***** Getting Tenant Trust Bank Account ****/
  public async getUsioTenantTrustBankAccounts(uid: number) {
    try {
      this.loading = true;
      const resp = await this.usioService
        .v1UsioGetUsioTenantBankAccountsGet({
          officeId: 0,
          usioAccountTypeId: uid
        })
        .toPromise();
      this.originalOfficeBankList = JSON.parse(resp as any).results;
      this.officeBankList = [...this.originalOfficeBankList];
      UtilsHelper.aftertableInit();
      if ((this.officeBankList.length === 1) && (this.bankType === 'trustBankAccount')) {
        this.onSelect({ selected: this.officeBankList });
      }
      if(this.originalOfficeBankList.length==1)
      this.isCheckBoxHidden=true;

      if (UtilsHelper.getObject('officeSetTrustAccount') && UtilsHelper.getObject('officeSetTrustAccount').selectedTrustAccountList) {
        this.trustAccountIds = UtilsHelper.getObject('officeSetTrustAccount')
          .selectedTrustAccountList.map(account => account.usioBankAccountId);
        this.onSelect({
          selected: UtilsHelper.getObject('officeSetTrustAccount')
            .selectedTrustAccountList
        });
      }
      this.officeBankList.forEach(x => {
        if (x.matterAssigned >= 1) {
          this.isView = true;
          return;
        }
      });
      // this.calculateTotalPage();
      this.updateDatatableFooterPage1();
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  /********* Triggers When Edit Button Clicked ******/
  public async editOfficeBankAccount(uid) {
    this.loading = true;
    if (!this.isEdit) {
      try {
        const resp = await this.usioService
          .v1UsioGetUsioOfficeBankAccountsGet({
            officeId: this.officeId,
            usioAccountTypeId: uid
          })
          .toPromise();
        this.originalOfficeBankList = JSON.parse(resp as any).results;
        this.officeBankList = [...this.originalOfficeBankList];
        UtilsHelper.aftertableInit();
        if ((this.officeBankList.length === 1) && (this.bankType === 'trustBankAccount')) {
          this.onSelect({ selected: this.officeBankList });
        }
        if(this.originalOfficeBankList.length==1)
      this.isCheckBoxHidden=true;
      } catch (error) {
        this.loading = false;
      }
    } else {
      try {
        const resp = await this.usioService
          .v1UsioGetUsioTenantBankAccountsGet({
            officeId: this.officeId,
            usioAccountTypeId: uid
          })
          .toPromise();
        this.originalOfficeBankList = JSON.parse(resp as any).results;
        this.originalOfficeBankList.sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.officeBankList = [...this.originalOfficeBankList];
        if(this.originalOfficeBankList.length==1)
        this.isCheckBoxHidden=true;
        UtilsHelper.aftertableInit();
        this.onSelect({
          selected: this.officeBankList.filter(item => {
            return item && item.isSelected
          })
        });
      } catch (error) {
        this.loading = false;
      }
    }

    this.officeBankList.forEach(x => {
      x["dummyIsSelected"] = x.isSelected;
    });
    this.officeBankList.forEach(x => {
      if (x.matterAssigned >= 1) {
        this.isView = true;
        return;
      }
    });
    this.loading = false;
    this.updateDatatableFooterPage1();
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.officeBankList) {
      return this.officeBankList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  onCheckBoxChange(row: any, rowIndex,event) {
    if (rowIndex >= 0 && row.matterAssigned > 0 && row.dummyIsSelected) {
      this.isChecked = row.isSelected;
      this.officeBankList[rowIndex].isSelected = true;
      setTimeout(() => {
        this.onSelect({
          selected: this.officeBankList.filter(item => {
            return item && item.isSelected
          })
        });
      }, 500);

      let officeList = JSON.parse(JSON.stringify(this.officeBankList));
      this.officeBankList = [];
      let self = this;
      setTimeout(() => {
        self.officeBankList = officeList;
      }, 200);
    }
    else {
      this.officeBankList[rowIndex].dummyIsSelected = row.isSelected;
      this.officeBankList[rowIndex].isSelected = event.target.checked;
      let self = this;
      setTimeout(() => {
        self.officeBankList = this.officeBankList;
      }, 200);
    }
    if (row.matterAssigned >= 1 && row.dummyIsSelected) {
      this.matterAssigned = row.matterAssigned;
    }
    else {
      this.matterAssigned = 0;

    }
  }

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

  open(content: any, className: any, winClass, row: any) {
    this.matterAssigned = 0;
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
    //this.searchOfficeEmployee = '';
    //this.primaryOfficeId = null;
    this.selectedAccount = row.name;
    this.getMatters(row);
  }

  getMatters(row: any) {

    this.loading = true;
    this.matterService
      .v1MatterAssignedMatterBankAccountIdGet$Response({ bankAccountId: row.id })
      .subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);

          if (parsedRes) {
            this.matterList = parsedRes.results;
            this.orgMatterList = parsedRes.results;
            UtilsHelper.aftertableInit();
            this.updateDatatableFooterPage();
            this.loading = false;
          } else {
            this.matterList = [];
            this.loading = false;
          }
          
          if (this.orgMatterList && this.orgMatterList.length > 0) {
            this.orgMatterList.map(obj => {
              if (
                obj.clientName &&
                (obj.clientName.company === '' ||
                  obj.clientName.company === null)
              ) {
                obj.cname = obj.clientName.firstName
                  ? obj.clientName.lastName + ', ' + obj.clientName.firstName
                  : obj.clientName.lastName;
              } else {
                obj.cname =
                  obj.clientName && obj.clientName.company
                    ? obj.clientName.company
                    : '';
              }
              if (
                obj.responsibleAttorney &&
                obj.responsibleAttorney.length > 0
              ) {
                obj.rname = obj.responsibleAttorney[0].firstName
                  ? obj.responsibleAttorney[0].lastName +
                  ', ' +
                  obj.responsibleAttorney[0].firstName
                  : obj.responsibleAttorney[0].lastName;
              }

              if (obj.matterName) {
                obj.matterName = obj.matterName.trim();
              }

              if (obj.cname && obj.cname.length > 0) {
                obj.cname = obj.cname.trim();
              }

              if (obj.rname && obj.rname.length > 0) {
                obj.rname = obj.rname.trim();
              }
              if (obj.isFixedFee) {
                obj.billType = 'Fixed Fee'
              } else {
                obj.billType = 'Hourly'
              }
            });
           
          }
          UtilsHelper.aftertableInit();
        }
      }, err => {
        this.loading = false;
      }
      );
  }

  /**
    * Change Page size from Paginator
    */
  changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changeMatterPage() {
    this.page.pageNumber = this.pageSelected - 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
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
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public applyMatterFilter() {
    if (this.searchOption && this.matterList) {
      this.matterList = this.matterList.filter(a => {
        let matching = true;

        if (+this.searchOption.officeId > 0) {
          matching =
            matching &&
            a.matterPrimaryOffice &&
            a.matterPrimaryOffice.id == this.searchOption.officeId;
        }

        if (this.searchOption.openDate) {
          matching =
            matching &&
            a.matterOpenDate &&
            +new Date(a.matterOpenDate).setHours(0, 0, 0, 0) ==
            +new Date(this.searchOption.openDate).setHours(0, 0, 0, 0);
        }

        if (this.searchOption.closeDate) {
          matching =
            matching &&
            a.matterCloseDate &&
            +new Date(a.matterCloseDate).setHours(0, 0, 0, 0) ==
            +new Date(this.searchOption.closeDate).setHours(0, 0, 0, 0);
        }

        if (this.searchOption.statusId) {
          matching =
            matching &&
            a.matterStatus &&
            a.matterStatus.id == this.searchOption.statusId;
        }
        if (this.searchOption.billTypeId) {
          const billTypeFilterId = this.searchOption.billTypeId;
          matching = (billTypeFilterId === 1) ? matching && !a.isFixedFee : matching && a.isFixedFee;
        }

        return matching;
      });

      if (this.searchString && this.searchString.trim() != '') {
        this.newFilter(this.searchString, this.matterList);
      } else {
        this.updateDatatableFooterPage();
      }
    }
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.matterList.length;
    this.page.totalPages = Math.ceil(this.matterList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  /****** Data Table Items per page *****/
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.updateDatatableFooterPage();
  }

  /****** Change Page Drop Down */
  public changePageDropDown(e) {
    this.pageSelected = e.page;
  }

  /******* Changes Data Table Page ******/
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  newFilter(val, list) {
    const temp = list.filter(
      item =>
        this.matchName(item, val, 'matterNumber') ||
        this.matchName(item, val, 'matterName') ||
        this.matchName(item, val, 'matterPrimaryOffice') ||
        this.matchName(item, val, 'clientName') ||
        this.matchName(item, val, 'matterType.name') ||
        this.matchName(item, val, 'primaryContactPerson.name') ||
        this.matchName(item, val, 'preferredContactMethod') ||
        this.matchName(item, val, 'primaryOffice') ||
        this.matchName(item, val, 'companyName') ||
        this.matchName(item, val, 'responsibleAttorney') ||
        UtilsHelper.matchFullEmployeeName(item.clientName, val) ||
        UtilsHelper.matchFullEmployeeName(item.responsibleAttorney[0], val)
    );
    // update the rows
    this.matterList = temp;
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'matterName') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    }
    else if (fieldName === 'preferredContactMethod') {
      if (item.preferredContactMethod === 'Email') {
        searchName = item.email ? item.email.toString().toUpperCase() : '';
      } else if (
        item.preferredContactMethod === 'Text' ||
        item.preferredContactMethod === 'Call'
      ) {
        if (item.phones) {
          const phone = item.phones.find(a => a.isPrimary).number;
          searchName = phone ? phone : '';
        } else {
          searchName = '';
        }
      } else {
        searchName = '';
      }
    } else if (fieldName === 'responsibleAttorney') {
      if (item[fieldName].length > 0) {
        searchName = item[fieldName][0].firstName
          ? item[fieldName][0].firstName.toString().toUpperCase() +
          ' ' +
          item[fieldName][0].lastName.toString().toUpperCase()
          : '';
      }
    } else if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'matterPrimaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'clientName') {
      if (item[fieldName] && item[fieldName]['isCompany']) {
        searchName =
          item[fieldName] && item[fieldName].company
            ? item[fieldName].company.toString().toUpperCase()
            : '';
      } else {
        searchName =
          item[fieldName] && item[fieldName].firstName
            ? item[fieldName].lastName.toString().toUpperCase().trim() +
            ',' +
            item[fieldName].firstName.toString().toUpperCase().trim()
            : '';
      }
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return searchName
      ? searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ",")) > -1
      : null;
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

  public searchFilter(event) {
    const searchValue = event.target.value;
    let rows = [...this.orgMatterList];
    if (searchValue.trim() !== '') {
      rows = rows.filter(f => {
        return (f.matterNumber.toString() || '').toLowerCase().includes(searchValue.toLowerCase()) ||
          (f.matterName || '').toLowerCase().includes(searchValue.toLowerCase())
          ;
      });
    }


    this.matterList = [];
    this.matterList = [...rows];
    this.updateDatatableFooterPage();
  }
  dismissFaviconError() {
    this.matterAssigned = 0;
  }

  closeDialog() {
    this.modalService.dismissAll();
  }

}
