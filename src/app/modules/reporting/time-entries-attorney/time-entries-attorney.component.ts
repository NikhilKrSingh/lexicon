import { DecimalPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { TimeEntriesAttorneyModels } from '../../models/time-entry-attorney.model';

@Component({
  selector: 'app-time-entries-attorney',
  templateUrl: './time-entries-attorney.component.html',
  styleUrls: ['./time-entries-attorney.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TimeEntriesAttorneyComponent implements OnInit {
  timeEntriesByAttorneyForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  public timeKeeperList: any = [];
  public isBillingOrResponsibleAttorney: boolean = false;
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string
  startDates: any;
  endDates: any;
  public loading: boolean = false;
  public newTimeKeeperList : any = [];
  public newFirstElement : any = [];

  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private auth: AuthGuard,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Time Entries by Attorney Report");
    this.checkPowerUser();
    this.timeEntriesAttorneyReport();
  }

  async checkPowerUser() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.TIMEKEEPING_OTHERSisAdmin) {
      this.isBillingOrResponsibleAttorney = false;
      this.GetTimekeepers();
    } else {
      this.isBillingOrResponsibleAttorney = true;
      this.GetTimekeepers();
    }
  }
  timeEntriesAttorneyReport() {
    this.timeEntriesByAttorneyForm = this.formBuilder.group({
      dateOfServiceStartDateInput: ['', Validators.required],
      dateOfServiceEndDateInput: ['', Validators.required],
      timeKeeper: []
    });

    this.timeEntriesByAttorneyForm.controls['dateOfServiceEndDateInput'].setValue(this.currentDate());
  }
  submitTimeEntriesByAttorneyReport() {

    let data: any = new TimeEntriesAttorneyModels();
    data.DateOfServiceStartDate = this.startDates
    data.DateOfServiceEndDate = this.endDates;
    data.TimeKeeperId = this.timeEntriesByAttorneyForm.value['timeKeeper'] == null ? null : +this.timeEntriesByAttorneyForm.value['timeKeeper'];
    this.loading = true;

    this.reportService.v1ReportTimeEntryByAttorneyReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loading = false;
        const res: any = suc;
        if (res && res.body) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          this.formatData(this.rows);
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            var columnListHeader = ['TimekeeperId', 'TimekeeperName', 'DateOfService', 'DateEntered',
              'ClientNumber', 'ClientName', 'MatterNumber', 'MatterName', 'ChargeCode', 'Description', 'HoursLogged',
              'BillingNarrative', 'NoteToFile', 'NoteVisibleToClient'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('TimeEntriesAttorney', this.rows, this.columnList);

      }, (err) => {
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
  GetTimekeepers() {
    return this.reportService.v1ReportGetAllTimeKeepersGet$Response({ isRAorBa: this.isBillingOrResponsibleAttorney }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.timeKeeperList = parsedRes.results;
          this.newTimeKeeperList = this.timeKeeperList;
          if (this.newTimeKeeperList.length == 1) {
            this.timeEntriesByAttorneyForm.patchValue({
              timeKeeper: this.newTimeKeeperList[0].timeKeeperID
            })
          }
          if(!this.isBillingOrResponsibleAttorney)
          {
            this.newFirstElement = ({timeKeeperID:null,name:'All'});
            this.newTimeKeeperList=[this.newFirstElement].concat(this.timeKeeperList);
          }
        }
      }
    })
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
  private formatData(rows: Array<any>) {
    let np = new DecimalPipe('en-US');

    rows.forEach(a => {          
      if (a.hoursLogged) {
        a.hoursLogged = `"${np.transform(a.hoursLogged, '1.2-2')}"`;
      }      
    });
  }
}
