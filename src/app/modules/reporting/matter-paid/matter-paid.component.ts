import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { MatterPaidVsTotalDetailsReport } from '../../models/matter-paid-total-detail.model';

@Component({
  selector: 'app-matter-paid',
  templateUrl: './matter-paid.component.html',
  styleUrls: ['./matter-paid.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterPaidComponent implements OnInit {
  matterPaidVsTotalDetailForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string;
  startDates:any;
  endDates:any;
  public loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }
  ngOnInit() {
    this.pagetitle.setTitle("Matter Paid vs. Total Detail Report");
    this.matterPaidVsTotalDetailReport();
  }
  matterPaidVsTotalDetailReport() {
    this.matterPaidVsTotalDetailForm = this.formBuilder.group({
      startDateInput: ['', Validators.required],
      endDateInput: ['', Validators.required]
    });

    this.matterPaidVsTotalDetailForm.controls['endDateInput'].setValue(this.currentDate());
  }
  submitMatterPaidVsTotalDetailReport() {
    let data : any = new MatterPaidVsTotalDetailsReport();
    data.DateOpen = this.startDates;
    data.DateClose = this.endDates;
    this.loading = true;
    this.reportService.v1ReportMatterPaidVsTotalDetailReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loading = false;
        const res: any = suc;
        if (res && res.body) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            var columnListHeader = ['MatterNumber', 'MatterName', 'TotalBilled', 'PaymentSource', 'TotalPaid'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('MatterPaidVsTotalDetails', this.rows, this.columnList);

      },(err)=>{
        this.loading = false;
      });
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
  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
  startDate(e){
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
    this.noDataToDisplay =false;
  }
  endDate(e){
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }
}
