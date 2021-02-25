import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-write-downs',
  templateUrl: './write-downs.component.html',
  styleUrls: ['./write-downs.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WriteDownsComponent implements OnInit {
  exportCsvFlag = false;
  startDates: any;
  endDates: any;
  message: string
  public rows: Array<any> = [];
  public columnList: any = [];
  public dateRangeType = [
    { code: 1, display: 'Date of Service Range' }, 
    { code: 2, display: 'Write-Down Date Range' }
  ];
  public selectedType: number = 1;
  public loading: boolean = false;

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Write-Downs Journal Report");
  }

  submitWriteDownReport(){
    let data: any;
    if(this.selectedType === 1){
      data = {
        dateofServiceStartDate: this.startDates,
        dateofServiceEndDate: this.endDates
      }
    }else if(this.selectedType === 2){
      data = {
        writeDownStartDate: this.startDates,
        writeDownEndDate: this.endDates
      }
    }
    this.loading = true;

    this.reportService.v1ReportWriteDownJournalReportPost$Json({body: data})
      .subscribe((suc: any) => {
        this.loading = false;
        const res = JSON.parse(suc)
        if(res.results){
          this.rows = [...res.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } 
          else {
            const columnListHeader = ["clientNumber", "clientName", "matterNumber", "matterName", 
              "reponsibleAttorney", "billingAttorney", "dateofService", "chargeCode", "description", "writeDownBy", 
              "writeOffDateTime", "writeDownCode", "writeDownName", "originalAmount", 
              "writeDownAmount", "approvedAmount", "reason"]
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.formatData(this.rows)
        this.ExportToCSV('Write-Downs Journal Report');
      },(err)=>{
        this.loading = false;
      })
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      this.columnList.push({
        Name: keys[i],
        displayName: keys[i] = _.startCase(keys[i])
      });
    }
  }

  private formatData(rows: Array<any>) {
    rows.forEach((a) => {
      if (a.dateofService) {
        a.dateofService = moment(
          a.dateofService
        ).format('MM/DD/YYYY');
      } else {
        a.dateofService = '';
      }

      if (a.writeOffDateTime) {
        a.writeOffDateTime = moment(
          a.writeOffDateTime
        ).format('MM/DD/YYYY');
      } else {
        a.writeOffDateTime = '';
      }
    });
  }

  ExportToCSV(reportName) {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      this.columnList,
      reportName
    );
  }

  startDate(e) {
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
  }
  endDate(e) {
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }

  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
}
