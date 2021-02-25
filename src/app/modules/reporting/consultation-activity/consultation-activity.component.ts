import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { ConsultationActivityModels } from '../../models/consultation-activity.model';

@Component({
  selector: 'app-consultation-activity',
  templateUrl: './consultation-activity.component.html',
  styleUrls: ['./consultation-activity.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ConsultationActivityComponent implements OnInit {
  consultingActivityForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  isBillingOrResponsibleAttorney: boolean = true;
  isConsultAttorney: boolean = true;
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
    this.pagetitle.setTitle("Consultation Activity Report");
    this.consultationActivityReport();
  }
  consultationActivityReport() {
    this.consultingActivityForm = this.formBuilder.group({
      startDateInput: ['', Validators.required],
      endDateInput: ['', Validators.required]
    });
    this.consultingActivityForm.controls['endDateInput'].setValue(this.currentDate());
  }
  submitconsultationActivityReport() {

    let data: any = new ConsultationActivityModels();
    data.EventStartDate = this.startDates;
    data.EventEndDate = this.endDates;
    data.PowerUser = this.isBillingOrResponsibleAttorney ? true : this.isConsultAttorney ? true : false;
    this.loading = true;
    this.reportService.v1ReportConsultationActivityReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['PotentialClientNumber', 'PotentialClientName', 'ConsultAttorneyId', 'ConsultAttorneyName',
              'PracticeArea', 'MatterType', 'consultOfficeName', 'eventDateTime',
              'ActionType', 'performedByID', 'PerformedByName', 'actionDateTime'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.formatData(this.rows)
        this.ExportToCSV('ConsultationActivity', this.rows, this.columnList);

      },(err)=>{
        this.loading = false;
      });
  }
  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == "eventDateTime") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Event Date/Time'
        });
      }else if (keys[i] == "actionDateTime") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Action Date/Time'
        });
      }else if (keys[i] == "performedByID") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Performed By ID'
        });
      }else if (keys[i] == "consultOfficeName") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Consult Office'
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

  private formatData(rows: Array<any>) {
    rows.forEach((a) => {
      if (a.actionDateTime) {
        a.actionDateTime = moment(
          a.actionDateTime + 'Z'
        ).format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.actionDateTime = '';
      }

      if (a.eventDateTime) {
        a.eventDateTime = moment(
          a.eventDateTime + 'Z'
        ).format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.eventDateTime = '';
      }

    });
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
