import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { SelectService } from 'src/app/service/select.service';
import { BillingService, UsioService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-trust-bank-accounts',
  templateUrl: './trust-bank-accounts.component.html',
  styleUrls: ['./trust-bank-accounts.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustBankAccountsComponent implements OnInit, OnChanges {
  @Input() officeId = 0;
  @Input() matterId = 0;
  @Input() opratingMode = 'Create';
  @Input() isFormSubmitted = false;
  @Input() hasExpanded = true;
  @Input() pageType = '';

  public loading = true;
  public bankType: string = null;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public page = new Page();
  public originalOfficeBankList: Array<any> = [];
  public officeBankList: Array<any> = [];
  public selectPageSize = new FormControl('10');
  public pageSelected: number = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public SelectionType = SelectionType;
  public selectedRowsLength: number = 0;
  public searchText: string = null;
  selectedAccounts: any = [];
  selectedId: any;
  next = false;
  merchantAccountFilterList = [
    { id: 1, name: 'Yes' },
    { id: 2, name: 'No' }
  ];
  merchantAccountFilterId: any;
  transactionAccountFilterList = [
    { id: 1, name: 'Credit Card' },
    { id: 2, name: 'ACH' }
  ];
  transactionAccountFilterId = [];
  public title = 'All';
  opratingAccountReadOnlyFlag = false;
  orgSelectedBankList = [];
  public isExpand: boolean = false;
  public isHidden: boolean = true;

  @Output() readonly changeData = new EventEmitter();

  constructor(
    private billingService: BillingService,
    private builder: FormBuilder,
    private selectService: SelectService,
    public usioService: UsioService
  ) {
    this.page.size = 10;
    this.page.pageNumber = 0;
  }

  ngOnInit() {
    // if(this.pageType == "matterDashboard"){
    //   this.footerHeight = 0;
    // }
    this.getUsioTenantTrustBankAccounts();
  }

  toggleExpandRow(row, flag?) {
    if (!flag) {
      this.table.rowDetail.collapseAllRows();
    }
    if (
      this.hasExpanded &&
      row.creditCardAccountNumber != null &&
      row.isCreditCardAccount
    ) {
      this.table.rowDetail.toggleExpandRow(row);
    }
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('officeId')) {
      this.isExpand = false;
      this.officeId = changes.officeId.currentValue;
      if (this.officeId) {
        this.getUsioTenantTrustBankAccounts();
      }
    }
    if (changes.isFormSubmitted && changes.isFormSubmitted.currentValue) {
      this.isFormSubmitted = true;
    }
  }

  public getUsioTenantTrustBankAccounts() {
    this.selectedAccounts = [];
    this.loading = true;
    this.usioService
      .v1UsioGetUsioMatterBankAccountsGet$Response({
        officeId: this.officeId,
        matterId: this.matterId
      })
      .subscribe(
        suc => {
          const res: any = suc;
          this.originalOfficeBankList = JSON.parse(res.body).results;
          this.officeBankList = [...this.originalOfficeBankList];
          this.isExpand = !!(
            this.officeBankList.length > 0 &&
            this.officeBankList[0].creditCardAccountNumber
          );
          if (this.originalOfficeBankList.length == 1) {
            this.onSelect(this.originalOfficeBankList[0]);
            this.opratingAccountReadOnlyFlag = true;
          } else if (this.originalOfficeBankList.length > 1) {
            this.opratingAccountReadOnlyFlag = false;
            this.selectedId = null;
          }

          let selectedArray = [];
          if (this.matterId > 0) {
            this.originalOfficeBankList.filter(orgAcc => {
              if (orgAcc.isSelected) {
                selectedArray.push(orgAcc);
              }
            });
            this.onSelect(selectedArray[0]);
          }

          if (this.opratingMode == 'View') {
            this.officeBankList = selectedArray;
            this.orgSelectedBankList = selectedArray;
          }
          this.updateDatatableFooterPage();
          this.loading = false;
        },
        err => {
          console.log(err);
          this.loading = false;
        }
      );
  }

  public applyFilter() {
    let rows;
    if (this.opratingMode == 'View') {
      rows = [...this.orgSelectedBankList];
    } else {
      rows = [...this.originalOfficeBankList];
    }
    if (this.searchText) {
      rows = this.originalOfficeBankList.filter(f => {
        return (
          (f.name || '')
            .toLowerCase()
            .includes(this.searchText.toLowerCase()) ||
          (
            (f.merchantAccountNumber &&
              f.merchantAccountNumber.substr(
                f.merchantAccountNumber.length - 4
              )) ||
            ''
          )
            .toLowerCase()
            .includes(this.searchText.toLowerCase())
        );
      });
    }

    if (this.merchantAccountFilterId) {
      if (this.merchantAccountFilterId == 1) {
        rows = rows.filter(item => {
          if (item.isMerchantAccount) {
            return item;
          }
        });
      } else {
        rows = rows.filter(item => {
          if (!item.isMerchantAccount) {
            return item;
          }
        });
      }
    }
    if (
      this.transactionAccountFilterId &&
      this.transactionAccountFilterId.length > 0
    ) {
      if (this.transactionAccountFilterId.length == 1) {
        switch (this.transactionAccountFilterId[0]) {
          case 1:
            rows = rows.filter(acc => {
              if (acc.isCreditCardAccount) {
                return acc;
              }
            });
            break;
          case 2:
            rows = rows.filter(acc => {
              if (acc.isAchAccount) {
                return acc;
              }
            });
            break;
        }
      }
    }

    this.officeBankList = [...rows];
    this.updateDatatableFooterPage();
  }

  /******* Calculates Total Page Table ********/
  public calculateTotalPage() {
    this.page.totalPages = Math.ceil(
      this.officeBankList.length / this.page.size
    );
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

  /** update table footer page count */
  public updateDatatableFooterPage() {
    this.page.totalElements = this.officeBankList.length;
    this.page.totalPages = Math.ceil(
      this.officeBankList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  public onSelect(rows: any) {
    if (rows) {
      this.selectedAccounts = [];
      this.selectedAccounts.push(rows);
      this.selectedId =
        this.selectedAccounts.length > 0 ? this.selectedAccounts[0].id : null;
      this.changeData.emit();
    }
  }

  public returnTrustBankAccountData() {
    return this.selectedId;
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.officeBankList) {
      return this.officeBankList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
