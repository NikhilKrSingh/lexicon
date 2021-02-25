import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientDetailsComponent implements OnInit {

  public loading = false;
  public dateRangeType = [];
  public selectedType: any;
  public startDates: any;
  public endDates: any;
  public exportCsvFlag = false;
  public isAll = true;
  public allTotal = 0;
  public byDefaultSelected: any;
  public isActive = true;
  public isInActive = false;
  public isClient = true;
  public isPotentialClient = false;
  public isArchived = false;
  public removeStartDate: boolean = false;

  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'clientNumber', displayName: 'Client Number' },
    { name: 'name', displayName: 'Name' },
    { name: 'type', displayName: 'Type' },
    { name: 'individualOrCorporate', displayName: 'Individual/Corporate' },
    { name: 'emailAddress', displayName: 'Email Address' },
    { name: 'primaryPhoneNumber', displayName: 'Primary Phone Number' },
    { name: 'cellPhoneNumber', displayName: 'Cell Phone Number' },
    { name: 'preferredContactMethod', displayName: 'Preferred Contact Method' },
    { name: 'address1', displayName: 'Address 1' },
    { name: 'address2', displayName: 'Address 2' },
    { name: 'city', displayName: 'City' },
    { name: 'state', displayName: 'State' },
    { name: 'zipCode', displayName: 'Zip Code' },
    { name: 'consultLawOffice',displayName:'Consult Law Office'},
    { name: 'primanyLawOffice', displayName: 'Primary Law Office' },
    { name: 'consultAttorney',displayName:'Consult Attorney'},
    { name: 'responsibleAttoney', displayName: 'Responsible Attorney' },
    { name: 'billingAttorney', displayName: 'Billing Attorney' },
    { name: 'originatingAttorney', displayName: 'Originating Attorney' },
    { name: 'initialContactDate', displayName: 'Initial Contact Date' },
    { name: 'retentionDate', displayName: 'Retention Date' },
    { name: 'retentionDecision',displayName:'Retention Decision'},
    { name: 'activeMatter', displayName: 'Active Matters' },
    { name: 'closedMatter', displayName: 'Closed Matters' },
    { name: 'status', displayName: 'Status' }
  ];
  userInfo: any;
  userId = '';

  isPCReadOnly = true;

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pageTitle: Title
  ) {
    this.pageTitle.setTitle('Client Details Report');
  }

  ngOnInit() {
    this.userInfo = UtilsHelper.getLoginUser();
    this.userId = this.userInfo  ? this.userInfo.id : '';
    this.selectedType = 'RETENTATION_DATE';
    this.dateRangeType = [
      { key: 'RETENTATION_DATE', value: 'Retention Date Range' },
      { key: 'INITIAL_CONTACT_DATE', value: 'Initial Contact Date Range' }
    ];
  }

  changeDateRangeType() {
    if (this.selectedType == 'RETENTATION_DATE') {
      this.isPCReadOnly = true;
      this.isPotentialClient = false;
    } else {
      this.isPCReadOnly = false;
    }
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
  rangeTypeChange(event){
    this.removeStartDate = true;
  }

  submitClientDetailReport() {
    let data: any = {};
    if (this.selectedType == 'RETENTATION_DATE') {
      data.retentionStartDate = this.startDates;
      data.retentionEndDate = this.endDates;
    } else if (this.selectedType == 'INITIAL_CONTACT_DATE') {
      data.intialContactStartDate = this.startDates;
      data.intialContactEndDate = this.endDates;
    }
    if (this.isClient && !this.isPotentialClient) {
      data.clientAndContactType = 1;
    } else if (!this.isClient && this.isPotentialClient) {
      data.clientAndContactType = 2;
    } else if (this.isClient && this.isPotentialClient) {
      data.clientAndContactType = 3;
    }
    data.tenantId = this.userInfo.tenantId;
    data.userId = this.userId;
    let status = [];
    if (this.isActive) {
      status.push('Active');
    }
    if (this.isInActive) {
      status.push('Inactive');
    }
    if (this.isArchived) {
      status.push('Archived');
    }
    data.status = status.map(x=>x).join(',');
    this.loading = true;
    this.reportService
      .v1ReportClientDetailReportPost$Json$Response({ body: data })
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
          this.ExportToCSV('Client Details', this.rows, this.columnList);
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
      if (a.initialContactDate) {
        a.initialContactDate = moment(a.initialContactDate).format(
          'MM/DD/YYYY'
        );
      } else {
        a.initialContactDate = '';
      }

      if (a.retentionDate) {
        a.retentionDate = moment(a.retentionDate).format('MM/DD/YYYY');
      } else {
        a.retentionDate = '';
      }

      if (a.primaryPhoneNumber) {
        a.primaryPhoneNumber = this.getNumberMasking(a.primaryPhoneNumber);
      }

      if (a.cellPhoneNumber) {
        a.cellPhoneNumber = this.getNumberMasking(a.cellPhoneNumber);
      }
    });
  }

  getNumberMasking(phoneNumber) {
    try {
      let x = phoneNumber.replace(/\D/g, '').match(/(\d{3})(\d{3})(\d{4})/);
      x = '(' + x[1] + ') ' + x[2] + '-' + x[3];
      return x;
    } catch {
      return phoneNumber;
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
