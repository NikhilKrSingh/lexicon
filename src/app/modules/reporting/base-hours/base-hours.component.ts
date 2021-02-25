import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { BaseHourModels } from '../../models/base-hours.model';

@Component({
  selector: 'app-base-hours',
  templateUrl: './base-hours.component.html',
  styleUrls: ['./base-hours.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BaseHoursComponent implements OnInit {
  baseHoursForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string
  startDates: any;
  endDates: any;
  public isTimekeepingAdmin: boolean;
  public loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private auth: AuthGuard,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Base Hours Report");
    this.baseHourReport();
    this.checkPowerUser();
  }
  async checkPowerUser() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.TIMEKEEPING_OTHERSisAdmin) {
      this.isTimekeepingAdmin = true;
    } else {
      this.isTimekeepingAdmin = false;
    }
  }
  baseHourReport() {
    this.baseHoursForm = this.formBuilder.group({
      startDateInput: ['', Validators.required],
      endDateInput: ['', Validators.required]
    });

    this.baseHoursForm.controls['endDateInput'].setValue(this.currentDate());
  }
  submitBaseHourReport() {
    let data: any = new BaseHourModels();
    data.BaseHourStartDate = this.startDates;
    data.BaseHourEndDate = this.endDates;
    data.isTimekeepingAdmin = this.isTimekeepingAdmin ? 1 : 0;
    this.loading = true;
    this.reportService.v1ReportBaseHoursReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['TimeKeeperId', 'TimekeeperName', 'HoursLogged', 'ChargeCode',
              'Description'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('BaseHour', this.rows, this.columnList);
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
