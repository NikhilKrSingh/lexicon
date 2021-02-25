import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { PaymentHistoryModels } from '../../models/payment-history.model';

@Component({
  selector: 'app-payment-history',
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PaymentHistoryComponent implements OnInit {
  paymentHistoryForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  startDates:any;
  endDates:any;
  noDataToDisplay = false;
  exportCsvFlag = false;
  public loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Payment History Report");
    this.paymentHistoryReport();
  }

  paymentHistoryReport() {
    this.paymentHistoryForm = this.formBuilder.group({
      postingHistoryStartDateInput: ['', Validators.required],
      postingHistoryEndDateInput: ['', Validators.required]
    });
    this.paymentHistoryForm.controls['postingHistoryEndDateInput'].setValue(this.currentDate());
  }
  submitPaymentHistoryReport() {
    let data : any = new PaymentHistoryModels();
    data.PostingStartDate = this.startDates;
    data.PostingEndDate = this.endDates;
    this.loading = true;
    this.reportService.v1ReportPaymentHistoryReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['Client Number', 'Client Name','Matter Number', 'Matter Name', 
              'Practice Area', 'Matter Type', 'Office Name', 'Posting Date',
              'Payment Method', 'Amount', 'Employee ID', 'Employee Name'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('Payment History');
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

  ExportToCSV(reportName) {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      this.columnList,
      reportName
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

