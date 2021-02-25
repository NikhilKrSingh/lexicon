import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { vwCashTransactionReportDateType } from '../../models/report-date-type.enum';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-cash-transfer-report',
  templateUrl: './cash-transfer-report.component.html',
  styleUrls: ['./cash-transfer-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CashTransferReportComponent implements OnInit {

  public loading = true;
  public dateRangeType = [];
  public selectedType: any;
  public searchText: string = "";
  public searchTextMinCount = 3;
  public isPerformSearch = false;
  public isSelectAllWithoutSearchManually = true;
  public isSelectAllWithSearchManually = true;
  public startDates: any;
  public endDates: any;
  public title: any = 'All';
  public noDataToDisplay = false;
  public exportCsvFlag = false;
  public isAll = true;
  public allTotal = 0;
  public byDefaultSelected: any;
  public tenantTierName: any;
  public bankAccountList: any = [];

  public selectedAccountList = [];

  public placeholder = "Search operating, trust, or credit card trust bank account";
  public filterName = 'Select bank account';
  public selectedMessage = 'bank account selected';

  reportDateType = vwCashTransactionReportDateType;
  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'transactionDate', displayName: 'Transaction Date' },
    { name: 'postingDate', displayName: 'Posting Date/Time' },
    { name: 'processingDate', displayName: 'Processing Date/Time' },
    { name: 'transactionId', displayName: 'Transaction ID' },
    { name: 'status', displayName: 'Status' },
    { name: 'sourceName', displayName: 'Transaction Source Name' },
    { name: 'sourceNumber', displayName: 'Transaction Source Number' },
    { name: 'targetName', displayName: 'Transaction Target Name' },
    { name: 'targetNumber', displayName: 'Transaction Target Number' },
    { name: 'requestedAmount', displayName: 'Requested Amount' },
    { name: 'processedAmount', displayName: 'Processed Amount' },
    { name: 'lastChangedBy', displayName: 'Last Changed By' },
    { name: 'lastChangedDate', displayName: 'Last Changed Date/Time' },
    { name: 'rejectReason', displayName: 'Reject Reason' }
  ]

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pageTitle: Title
  ) {
    this.pageTitle.setTitle('Cash Transfer Report');
  }

  ngOnInit() {
    this.selectedType = this.reportDateType.POSTING_DATE;
    this.setDateRangeTypeOptionBasedOnTenant();
    this.getBankAccountDetail();
  }

  /** persmission for Ascending and Iconic tenants */
  setDateRangeTypeOptionBasedOnTenant() {
    this.loading = true;
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantTier) {
      this.tenantTierName = userInfo.tenantTier.tierName;
      if (this.tenantTierName === 'Iconic' || this.tenantTierName === 'Ascending') {
        this.dateRangeType = [
          { 'key': this.reportDateType.POSTING_DATE, 'value': 'Posting Date Range' },
          { 'key': this.reportDateType.TRANSACTION_DATE, 'value': 'Transaction Date Range' },
          { 'key': this.reportDateType.PROCESSING_DATE, 'value': 'Processing Date Range' }
        ];
      }
      else {
        this.dateRangeType = [
          { 'key': this.reportDateType.POSTING_DATE, 'value': 'Posting Date Range' },
          { 'key': this.reportDateType.TRANSACTION_DATE, 'value': 'Transaction Date Range' }
        ]
      }
    }
  }

  public applyFilter() {

  }

  public scrollEnd() {
    if (this.loading) {
      return;
    }
    if (this.searchText) {
      return;
    }

  }

  isAllStatus(isAll) {
    this.isAll = isAll;
  }


  /** get Bank acounts details */
  getBankAccountDetail() {
    const inclueCreditCardTrustBankAccountsValue = 2;
    this.reportService.v1ReportBankAccountsInclueCreditCardTrustBankAccountsGet$Response({
      inclueCreditCardTrustBankAccounts: inclueCreditCardTrustBankAccountsValue
    }).subscribe(
      (data: {}) => {
        this.bankAccountList = [];
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            if (parsedRes.results.length) {
              let filteredArray = [];
              let selectedBankAccountList = [];
              let instance = this;
              parsedRes.results.filter(function (item) {
                let newRecord = {};
                newRecord['id'] = item.id;
                if (item.accountName === null) {
                  newRecord['accountName'] = ' (' + item.id + ')';
                } else {
                  newRecord['accountName'] = item.accountName;
                }
                if (item.accountNumber === null) {
                  newRecord['accountNumber'] = ' (' + item.id + ')';
                } else {
                  newRecord['accountNumber'] = item.accountNumber;
                }
                newRecord['checked'] = true;
                filteredArray.push(newRecord);
                selectedBankAccountList.push(item.id);
              });
              this.title = 'All';
              this.allTotal = parsedRes.results.length;
              this.selectedAccountList = [...this.selectedAccountList, ...selectedBankAccountList];

              this.bankAccountList = [...this.bankAccountList, ...filteredArray];
              this.bankAccountList.sort(this.sort);

              this.bankAccountList = JSON.parse(JSON.stringify(this.bankAccountList));
            }
          }
        }
        this.loading = false;
      },
      err => {
        this.loading = false;
        console.log(err);
      })
  }

  clrBankList() {
    this.selectedAccountList = [];
    this.title = 0;
    this.bankAccountList.forEach(item => (item.checked = false));
  }

  applyBankFilter(event: any) {

  }

  onMultiSelectSelectedOptions(event: any) {

  }
  getBanksSelected(event: any) {
    this.selectedAccountList = [];
    if (!event.length) {
      this.title = 0;
    } else {
      this.selectedAccountList = event;
      this.title = (event.length == this.bankAccountList.length) ? 'All' : event.length;
    }
  }
  /** start date change event */
  startDate(e) {
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
    this.noDataToDisplay = false;
  }

  /** end date change event */
  endDate(e) {
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }

  submitCashTransferReport() {
    let data: any = {};
    data.startDate = this.startDates;
    data.endDate = this.endDates;
    data.dateType = this.selectedType;

    if (this.selectedAccountList && this.selectedAccountList.length == this.allTotal) {
      data.isAllBankAccounts = true;
      data.bankAccounts = []
    } else {
      data.isAllBankAccounts = false;
      data.bankAccounts = this.selectedAccountList
    }

    this.loading = true;
    this.reportService.v1ReportCashTransactionReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        const res: any = suc;
        this.loading = false;
        if (res && res.body && JSON.parse(res.body).results) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          this.formatData(this.rows);
          this.addkeysIncolumnlist();
        }
        this.ExportToCSV('Cash Transfer', this.rows, this.columnList);
      }, () => {
        this.loading = false;
      });
  }

  addkeysIncolumnlist() {
    this.columnList = [];
    for (let i = 0; i < this.columnHeaderObj.length; i++) {
      this.columnList.push({
        Name: this.columnHeaderObj[i].name,
        displayName: this.columnHeaderObj[i].displayName
      });
    }
  }

  private formatData(rows: Array<any>) {
    let cp = new CurrencyPipe('en-US');

    rows.forEach(a => {
      a.transactionDate = moment(a.transactionDate + 'Z').format('MM/DD/YYYY');
      a.postingDate = moment(a.postingDate + 'Z').format('MM/DD/YYYY hh:mm:ss');

      if (a.processingDate) {
        a.processingDate = moment(a.processingDate + 'Z').format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.processingDate = '';
      }

      a.sourceName = a.sourceName || '';
      a.sourceNumber = a.sourceNumber || '';
      a.targetName = a.targetName || '';
      a.targetNumber = a.targetNumber || '';

      a.lastChangedDate = moment(a.lastChangedDate + 'Z').format('MM/DD/YYYY hh:mm:ss');

      if (a.requestedAmount) {
        a.requestedAmount = `"${cp.transform(a.requestedAmount, 'USD', 'symbol', '1.2-2')}"`;
      }

      if (a.processedAmount) {
        a.processedAmount = `"${cp.transform(a.processedAmount, 'USD', 'symbol', '1.2-2')}"`;
      }
    });
  }

  ExportToCSV(fileName, rows, columnList) {
    const temprows = JSON.parse(JSON.stringify(rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      columnList,
      fileName
    );
  }

  GetColumnHeaderList() {
    return [];
  }
  sort(a, b) {
    if (a.accountName && b.accountName) {
      if (a.accountName.toLowerCase() < b.accountName.toLowerCase()) {
        return -1;
      }
      if (a.accountName.toLowerCase() > b.accountName.toLowerCase()) {
        return 1;
      }
      return 0;
    } else {
      if (a.accountName < b.accountName) {
        return -1;
      }
      if (a.accountName > b.accountName) {
        return 1;
      }
      return 0;
    }

  }
}
