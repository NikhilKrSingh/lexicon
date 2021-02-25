import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-write-offs',
  templateUrl: './write-offs.component.html',
  styleUrls: ['./write-offs.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WriteOffsComponent implements OnInit {
  exportCsvFlag = false;
  startDates: any;
  endDates: any;
  message: string
  public rows: Array<any> = [];
  public columnList: any = [];
  public loading: boolean = false;

  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Write-Offs Journal Report");
  }

  submitWriteOffReport(){
    const data: any = {
      writeOffStartDate: this.startDates,
      writeOffEndDate: this.endDates
    }
    this.loading = true;
    this.reportService.v1ReportWriteOffJournalReportPost$Json({body: data})
      .subscribe((suc: any) => {
        this.loading = false;
        const res = JSON.parse(suc)
        if(res.results){
          this.rows = [...res.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            const columnListHeader = ["clientNumber", "clientName", "matterNumber", "matterName", 
              "reponsibleAttorney", "billingAttorney", "writeOffBy", "writeOffDateTime", "writeOffCode", 
              "writeOffName", "writeOffAmount", "reason"]
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.formatData(this.rows)
        this.ExportToCSV('Write-Offs Journal Report');
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

  ExportToCSV(reportName) {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      this.columnList,
      reportName
    );
  }

  private formatData(rows: Array<any>) {
    rows.forEach((a) => {
      if (a.writeOffDateTime) {
        a.writeOffDateTime = moment(
          a.writeOffDateTime
        ).format('MM/DD/YYYY');
      } else {
        a.writeOffDateTime = '';
      }
    });
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
