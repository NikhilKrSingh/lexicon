import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { vwCashTransactionReportDateType } from '../../models/report-date-type.enum';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-cash-requirement-rollup-report',
  templateUrl: './cash-requirement-rollup-report.component.html',
  styleUrls: ['./cash-requirement-rollup-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CashRequirementRollupReportComponent implements OnInit {

  public loading = true;
  public dateRangeType = [];
  public selectedType: any;
  public startDates: any;
  public endDates: any;
  public exportCsvFlag = false;
  public isAll = true;
  public allTotal = 0;
  public byDefaultSelected: any;
  public tenantTierName: any;

  reportDateType = vwCashTransactionReportDateType;
  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'accountName', displayName: 'Account Name' },
    { name: 'accountRouting', displayName: 'Account Routing' },
    { name: 'accountNumber', displayName: 'Account Number' },
    { name: 'accountType', displayName: 'Account Type' },
    { name: 'inboundAmount', displayName: 'Inbound Amount' },
    { name: 'outboundAmount', displayName: 'Outbound Amount' },
    { name: 'totalAmount', displayName: 'Total Amount' }
  ]

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pageTitle: Title
  ) {
    this.pageTitle.setTitle('Cash Requirement Rollup Report');
  }

  ngOnInit() {
    this.selectedType = this.reportDateType.POSTING_DATE;
    this.setDateRangeTypeOptionBasedOnTenant();
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
    this.loading = false;
  }

  /** start date change event */
  startDate(e) {
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
  }

  /** end date change event */
  endDate(e) {
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }

  submitCashRequirementRollupReport() {
    let data: any = {};
    data.startDate = this.startDates;
    data.endDate = this.endDates;
    data.dateType = this.selectedType;

    this.loading = true;
    this.reportService.v1ReportCashRequirementRollupReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        const res: any = suc;
        this.loading = false;
        if (res && res.body && JSON.parse(res.body).results) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          this.addkeysIncolumnlist();
        }
        this.ExportToCSV('Cash Requirement Rollup', this.rows, this.columnList);
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
}
