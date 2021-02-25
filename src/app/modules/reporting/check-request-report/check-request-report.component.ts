import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-check-request-report',
  templateUrl: './check-request-report.component.html',
  styleUrls: ['./check-request-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CheckRequestReportComponent implements OnInit {

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
  public title: any;
  public noDataToDisplay = false;
  public exportCsvFlag = false;
  public isAll = true;
  public allTotal = 0;
  public byDefaultSelected: any;
  public tenantTierName: any;
  public bankAccountList: any = [];

  public selectedAccountList = [];

  public placeholder = "Search any operating or trust bank account";
  public filterName = 'Select bank account';
  public selectedMessage = 'bank account selected';

  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'sourceAccountName', displayName: 'Source Account Name' },
    { name: 'sourceAccoutNumber', displayName: 'Source Account Number' },
    { name: 'sourceAccountType', displayName: 'Source Account Type' },
    { name: 'requestedAmount', displayName: 'Requested Amount' },
    { name: 'checkNumber', displayName: 'Check Number' },
    { name: 'clientNumber', displayName: 'Client Number' },
    { name: 'clientName', displayName: 'Client Name' },
    { name: 'matterNumber', displayName: 'Matter Number' },
    { name: 'matterName', displayName: 'Matter Name' },
    { name: 'requestedBy', displayName: 'Requested By' },
    { name: 'requestedDate', displayName: 'Requested Date/Time' }
  ];

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pageTitle: Title
  ) {
    this.pageTitle.setTitle('Check Request Report');
  }

  ngOnInit() {
    this.getBankAccountDetail();
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
    const inclueCreditCardTrustBankAccountsValue = 1;
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
  /** change event of Date Range Type Dropdown */
  dateRangeChange(event) {
    console.log(event);
    this.selectedType = event;
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
  submitCheckTransferReport() {
    let data: any = {};
    data.startDate = this.startDates;
    data.endDate = this.endDates;
    if (this.selectedAccountList && this.selectedAccountList.length == this.allTotal) {
      data.isAllBankAccounts = true;
      data.bankAccounts = []
    } else {
      data.isAllBankAccounts = false;
      data.bankAccounts = this.selectedAccountList
    }
    this.loading = true;

    this.reportService.v1ReportCheckRequestReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loading = false;
        const res: any = suc;
        if (res && res.body && JSON.parse(res.body).results) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          this.formatData(this.rows);
          this.addkeysIncolumnlist();
        }
        this.ExportToCSV('Check Request', this.rows, this.columnList);
      },
      err => {
        this.loading = false;
        console.log(err);
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
      if (a.requestedDate) {
        a.requestedDate = moment(a.requestedDate + 'Z').format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.processingDate = '';
      }

      a.sourceAccountName = a.sourceAccountName || '';
      a.sourceAccoutNumber = a.sourceAccoutNumber || '';
      a.sourceAccountType = a.sourceAccountType || '';

      if (a.requestedAmount) {
        a.requestedAmount = `"${cp.transform(a.requestedAmount, 'USD', 'symbol', '1.2-2')}"`;
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
