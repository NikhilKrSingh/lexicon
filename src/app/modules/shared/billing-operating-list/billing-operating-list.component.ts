import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { UsioService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';

@Component({
  selector: 'app-billing-operating-list',
  templateUrl: './billing-operating-list.component.html',
  styleUrls: ['./billing-operating-list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingOperatingListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public officeId: number;
  @Input() public operatingAccountError: boolean;
  @Input() public paymentMethod: string;
  @Output() readonly selectedOperatingAccount = new EventEmitter();
  @Output() readonly checkAchCredit = new EventEmitter();
  @Input() public selectedOperatingAccountId: number;
  public searchText: string = null;
  public merchantAccountFilterList: any[] = [
    { flag: null, name: 'All' },
    { flag: true, name: 'Yes' },
    { flag: false, name: 'No' }
  ];
  public transactionAccountFilterList: any[] = [
    { id: 0, name: 'All' },
    { id: 1, name: 'ACH' },
    { id: 2, name: 'Credit Card' }
  ];
  public transactionAccountFilterId: number = null;
  public originalOperatingAccountlist: any[] = [];
  public operatingAccountList: any[] = [];
  public selectedOpratingAccounts = [];
  public isMerchantAccount: boolean = null;
  public page = new Page();
  public selectPageSize = new FormControl('10');
  public pageSelected: number = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public usioBankId: number = null;
  public loading: boolean = false;
  public ClumnMode: ColumnMode;
  operatingError = false;
  @ViewChild(DatatableComponent, { static: false })  public table: DatatableComponent;

  public isAchDisabled: boolean = false;
  public isCreditCardAccountDisabled: boolean = false;
  public refreshList: boolean = true;

  constructor(private usioService: UsioService) {
    this.page.size = 10;
    this.page.pageNumber = 0;
  }

  ngOnInit() {
    this.getUsioOperatingAccounts();
  }

  ngOnDestroy(){
    this.loading = false;
  }

  ngOnChanges(changes) {
    this.loading = false;
    this.applyFilter(this.paymentMethod)
    this.refreshList = false;
    let instance = this;
    setTimeout(() => {
      instance.refreshList = true;
    }, 200);

    if (
      changes.operatingAccountError &&
      changes.operatingAccountError.currentValue
    ) {
      this.operatingError = true;
    } else {
      this.operatingError = false;
    }
  }

  /***** Filters list ******/
  public applyFilter(paymentMethod?) {
    let rows = [...this.originalOperatingAccountlist];
    if (this.searchText) {
      rows = this.originalOperatingAccountlist.filter(f => {
        return (
          (f.name || '')
            .toLowerCase()
            .includes(this.searchText.toLowerCase()) ||
          (
            (f.merchantAccountNumber || '').substr(
              (f.merchantAccountNumber || '').length - 4
            ) || ''
          )
            .toLowerCase()
            .includes(this.searchText.toLowerCase())
        );
      });
    }

    if (this.transactionAccountFilterId) {
      if (this.transactionAccountFilterId === 1) {
        rows = rows.filter(f => {
          return f.isAchAccount;
        });
      }

      if (this.transactionAccountFilterId === 2) {
        rows = rows.filter(f => {
          return f.isCreditCardAccount;
        });
      }
    }

    if (this.isMerchantAccount !== null) {
      rows = rows.filter(f => {
        return f.isMerchantAccount == this.isMerchantAccount
          ? true
          : false || null;
      });
    }

    if (this.paymentMethod == 'CREDIT_CARD') {
      rows = rows.filter(f => {
        return f.isMerchantAccount && f.isCreditCardAccount;
      });
    }

    if (this.paymentMethod == 'E-CHECK') {
      rows = rows.filter(f => {
        return f.isMerchantAccount && f.isAchAccount;
      });
    }

    this.operatingAccountList = [...rows];
    if (this.operatingAccountList.length == 1) {
      this.onSelect(this.operatingAccountList[0]);
    }
    this.updateDatatableFooterPage();
  }

  /******* Calculates Total Page Table ********/

  updateDatatableFooterPage() {
    this.page.totalElements = this.operatingAccountList.length;
    this.page.totalPages = Math.ceil(
      this.operatingAccountList.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    // this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
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

  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  /****** Triggers When Row Selected From Table *****/
  public onSelect(rows: any) {
    this.selectedOperatingAccount.emit(rows);
  }

  public async getUsioOperatingAccounts() {
    this.loading = true;
    try {
      let resp: any = await this.usioService
        .v1UsioGetUsioOfficeBankAccountsGet({
          officeId: this.officeId ? +this.officeId : 0,
          usioAccountTypeId: 1
        })
        .toPromise();
      resp = JSON.parse(resp as any).results;
      if (resp) {
        const sortedResp = resp.sort((a, b) => a.name.localeCompare(b.name));
        this.originalOperatingAccountlist = sortedResp;
        this.originalOperatingAccountlist = this.originalOperatingAccountlist.filter(
          val => {
            return val && val.status && val.status == 'Active';
          }
        );
        this.operatingAccountList = [...this.originalOperatingAccountlist];
        if (
          this.originalOperatingAccountlist &&
          this.originalOperatingAccountlist.length
        ) {
          if (this.originalOperatingAccountlist.length === 1) {
            this.onSelect(this.originalOperatingAccountlist[0]);
          }
          this.isAchDisabled = this.originalOperatingAccountlist.some(
            val => val && val.isAchAccount
          );
          this.isCreditCardAccountDisabled = this.originalOperatingAccountlist.some(
            val => val && val.isCreditCardAccount
          );
          console.log(this.isAchDisabled, this.isCreditCardAccountDisabled);
          if (this.isAchDisabled || this.isCreditCardAccountDisabled) {
            this.emitCheck();
          }
        }
      }
      this.updateDatatableFooterPage();
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  public emitCheck() {
    this.checkAchCredit.emit({
      isAchDisabled: this.isAchDisabled,
      isCreditCardAccountDisabled: this.isCreditCardAccountDisabled
    });
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.operatingAccountList) {
      return this.operatingAccountList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
