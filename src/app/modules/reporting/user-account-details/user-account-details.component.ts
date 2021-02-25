import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-user-account-details',
  templateUrl: './user-account-details.component.html',
  styleUrls: ['./user-account-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UserAccountDetailsComponent implements OnInit {
  public loading = false;
  public startDates: any;
  public endDates: any;
  public exportCsvFlag = false;
  public isActive = true;
  public isInActive = false;
  public isPending = false;
  userInfo: any;

  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'employeeID', displayName: 'Employee ID' },
    { name: 'lastName', displayName: 'Last Name' },
    { name: 'firstName', displayName: 'First Name' },
    { name: 'emailAddress', displayName: 'Email Address' },
    { name: 'groups', displayName: 'Groups' },
    { name: 'status', displayName: 'Status' },
    { name: 'lastLoggedIn', displayName: 'Last Login' }
  ];

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pageTitle: Title
  ) {
    this.pageTitle.setTitle('User Account Details Report');
  }

  ngOnInit() {
    this.userInfo = UtilsHelper.getLoginUser();
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

  submitUserAccountDetailReport() {
    let data: any = {};
    data.lastLoggedInStartDate = this.startDates;
    data.lastLoggedInEndDate = this.endDates;
    data.tenantId = this.userInfo.tenantId;
    let status = [];
    if (this.isActive) {
      status.push('Active');
    }
    if (this.isInActive) {
      status.push('Inactive');
    }
    if (this.isPending) {
      status.push('Pending');
    }
    data.status = status.map(x => x).join(',');
    this.loading = true;
    this.reportService
      .v1ReportUserDetailReportPost$Json$Response({ body: data })
      .subscribe(
        (suc: {}) => {
          const res: any = suc;
          this.loading = false;
          if (res && res.body && JSON.parse(res.body).results) {
            var records = JSON.parse(res.body);
            this.rows = [...records.results];
            this.formatData(this.rows);
            this.addkeysIncolumnlist();
          }
          this.ExportToCSV('User Account Details', this.rows, this.columnList);
        },
        () => {
          this.loading = false;
        }
      );
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

    rows.forEach(a => {
      if(a.lastLoggedIn){
        a.lastLoggedIn = moment(a.lastLoggedIn + 'Z').format('MM/DD/YYYY hh:mm:ss');
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
}
