import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-wip-detail',
  templateUrl: './wip-detail.component.html',
  styleUrls: ['./wip-detail.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WipDetailComponent implements OnInit {

  public loading = false;
  public dateRangeType = [];
  public selectedType: any;
  public startDates: any;
  public endDates: any;
  public exportCsvFlag = false;
  public isAll = true;
  public allTotal = 0;
  public byDefaultSelected: any;
  userInfo: any;

  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'clientNumber', displayName: 'Client Number' },
    { name: 'clientName', displayName: 'Client Name' },
    { name: 'matterNumber', displayName: 'Matter Number' },
    { name: 'matterName', displayName: 'Matter Name' },
    { name: 'reponsibleAttorney', displayName: 'Responsible Attorney' },
    { name: 'billingAttorney', displayName: 'Billing Attorney' },
    { name: 'timeKeeperName', displayName: 'Timekeeper Name' },
    { name: 'dateOfService', displayName: 'Date of Service' },
    { name: 'postingDate', displayName: 'Posting Date' },
    { name: 'chargeCode', displayName: 'Charge Code' },
    { name: 'description', displayName: 'Description' },
    { name: 'feeAmount', displayName: 'Fee Amount' },
    { name: 'disbursementAmount', displayName: 'Disbursement Amount' },
    { name: 'writeDownAmount', displayName: 'Write-Down Amount' },
  ]
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};
  isAdmin = 0;
  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pageTitle: Title,
    private store: Store<fromRoot.AppState>,
  ) {
    this.pageTitle.setTitle('WIP Detail Report');
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.userInfo = UtilsHelper.getLoginUser();
    this.selectedType = 'SERVICE_DATE';
    this.dateRangeType = [
      { 'key': 'SERVICE_DATE', 'value': 'Date of Service Range' },
      { 'key': 'POSTING_DATE', 'value': 'Posting Date Range' }
    ]
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.permissionList.ACCOUNTINGisAdmin || this.permissionList.ACCOUNTINGisEdit
            || this.permissionList.BILLING_MANAGEMENTisAdmin
            || this.permissionList.BILLING_MANAGEMENTisEdit) {
              this.isAdmin = 1;
          }
        }
      }
    });
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

  submitWIPDetailReport() {
    let data: any = {};
    if (this.selectedType == 'SERVICE_DATE') {
      data.dateOfServiceStartDate = this.startDates;
      data.dateOfServiceEndDate = this.endDates;
    } else if (this.selectedType == 'POSTING_DATE') {
      data.postingDateStartDate = this.startDates;
      data.postingDateEndDate = this.endDates;
    }
    data.tenantId = this.userInfo.tenantId;
    data.isAdmin  = this.isAdmin;
    this.loading = true;
    this.reportService.v1ReportWipDetailReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        const res: any = suc;
        this.loading = false;
        if (res && res.body && JSON.parse(res.body).results) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          this.formatData(this.rows);
          this.addkeysIncolumnlist();
        }
        this.ExportToCSV('WIP Detail', this.rows, this.columnList);
      }, () => {
        this.loading = false;
      });
  }

  private formatData(rows: Array<any>) {
    let cp = new CurrencyPipe('en-US');
    rows.forEach(a => {
      if(a.dateOfService){
        a.dateOfService = moment(a.dateOfService).format('MM/DD/YYYY');
      }
      if(a.postingDate){
        a.postingDate = moment(a.postingDate).format('MM/DD/YYYY');
      }
      if (a.feeAmount) {
        a.feeAmount = `"${cp.transform(a.feeAmount, 'USD', 'symbol', '1.2-2')}"`;
      }

      if (a.disbursementAmount) {
        a.disbursementAmount = `"${cp.transform(a.disbursementAmount, 'USD', 'symbol', '1.2-2')}"`;
      }

      if (a.writeDownAmount) {
        a.writeDownAmount = `"${cp.transform(a.writeDownAmount, 'USD', 'symbol', '1.2-2')}"`;
      }

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
