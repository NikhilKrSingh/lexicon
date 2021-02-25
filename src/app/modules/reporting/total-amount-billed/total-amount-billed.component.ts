import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { TotalAmountBilledModel } from '../../models/total-amount-billed.model';

@Component({
  selector: 'app-total-amount-billed',
  templateUrl: './total-amount-billed.component.html',
  styleUrls: ['./total-amount-billed.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TotalAmountBilledComponent implements OnInit {
  totalAmountBilledForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string;
  startDates: any;
  endDates: any;
  public loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Total Amount Billed/WIP Report");
    this.totalAmountForm();
  }

  totalAmountForm() {
    this.totalAmountBilledForm = this.formBuilder.group({
      dateOfPostStartDateInput: ['', Validators.required],
      dateOfPostEndDateInput: ['', Validators.required]
    });

    this.totalAmountBilledForm.controls['dateOfPostEndDateInput'].setValue(this.currentDate());
  }

  submitTotalAmountBilledReport() {
    let data: any = new TotalAmountBilledModel();
    data.DateOfPostStartDate = this.startDates;
    data.DateOfPostEndDate = this.endDates;
    this.loading = true;

    this.reportService.v1ReportTotalAmountBilledWipReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['DateOfPost', 'billableAmount', 'disbursementsAmount', 
            'fixedFeeServicesAmount','fixedFeeAddOnsAmount', 'totalAmountReleived', 'TotalAmountBilled'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('TotalAmountBilledWIPReport', this.rows, this.columnList);
      },(err)=>{
        this.loading = false;
      });
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == "billableAmount") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Billable Time $'
        });
      }else if (keys[i] == "disbursementsAmount") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Disbursements $'
        });
      }else if (keys[i] == "fixedFeeServicesAmount") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Fixed Fee Services $'
        });
      }else if (keys[i] == "fixedFeeAddOnsAmount") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Fixed Fee Add-Ons $'
        });
      }else if (keys[i] == "totalAmountReleived") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Total Amount Relieved'
        });
      }
      else {
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] = _.startCase(keys[i])
        });
      }

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
  startDate(e) {
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
    this.noDataToDisplay = false;
  }
  endDate(e) {
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }
}
