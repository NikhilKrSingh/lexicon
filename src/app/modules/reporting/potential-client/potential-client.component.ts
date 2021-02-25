import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { PotentialClientModels } from '../../models/potential-client.model';

@Component({
  selector: 'app-potential-client',
  templateUrl: './potential-client.component.html',
  styleUrls: ['./potential-client.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PotentialClientComponent implements OnInit {
  potentialClientForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  isBillingOrResponsibleAttorney: boolean = true;
  isConsultAttorney: boolean = true;
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string
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
    this.pagetitle.setTitle("Potential Client Status/Retention Report");
    this.potentialClientReport();
  }

  potentialClientReport() {
    this.potentialClientForm = this.formBuilder.group({
      startDateInput: ['', Validators.required],
      endDateInput: ['', Validators.required]
    });

    this.potentialClientForm.controls['endDateInput'].setValue(this.currentDate());
  }
  submitPotentialClientReport() {
    let data: any = new PotentialClientModels();
    data.IntakeStartDate = this.startDates;
    data.IntakeEndDate = this.endDates;
    this.loading = true;

    this.reportService.v1ReportPotentialClientStatusRetentionReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['PotentialClientNumber', 'PotentialClientName', 'PracticeArea', 'MatterType',
              'consultOfficeName', 'ConsultAttoneyID', 'ConsultAttoneyName', 'intakeDateTime', 'IntakeEmployeeID'
              , 'IntakeEmployeeName', 'Status', 'convertCloseDateTime'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.formatData(this.rows)

        this.ExportToCSV('Potential client', this.rows, this.columnList);

      },(err)=>{
        this.loading = false;
      });
  }
  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == "consultOfficeName") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Consult Office'
        });
      } else if (keys[i] == "intakeDateTime") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Intake Date/Time'
        });
      }else if (keys[i] == "convertCloseDateTime") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Convert/Close Date/Time'
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

  private formatData(rows: Array<any>) {
    rows.forEach((a) => {
      if (a.intakeDateTime) {
        a.intakeDateTime = moment(
          a.intakeDateTime + 'Z'
        ).format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.intakeDateTime = '';
      }

      if (a.convertCloseDateTime) {
        a.convertCloseDateTime = moment(
          a.convertCloseDateTime + 'Z'
        ).format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.convertCloseDateTime = '';
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
