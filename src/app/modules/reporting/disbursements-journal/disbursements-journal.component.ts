import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';

@Component({
  selector: 'app-disbursements-journal',
  templateUrl: './disbursements-journal.component.html',
  styleUrls: ['./disbursements-journal.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DisbursementsJournalComponent implements OnInit {
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  
  public rangeTypeList: Array<any> = [];
  private columnList: Array<any> = [];
  private rows: Array<any> = [];

  public selectedRangeType: number;

  public loading: boolean = false;
  public exportCsvFlag: boolean = false;
  public removeStartDate: boolean = false;
  public permissionFlag: boolean = false;
  public startDates: any;
  public endDates: any;



  constructor(
    private pagetitle: Title,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>,
  ) { 
    this.rangeTypeList = [
      {id: 1, name: 'Date of Service Range'},
      {id: 2, name: 'Posting Date Range'}
    ]
    this.selectedRangeType = 1;
    this.permissionList$ = this.store.select('permissions');
  }

  async ngOnInit() {
    this.pagetitle.setTitle("Disbursements Journal Report");
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {

      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.permissionList.ACCOUNTINGisAdmin || this.permissionList.ACCOUNTINGisEdit
            || this.permissionList.BILLING_MANAGEMENTisAdmin
            || this.permissionList.BILLING_MANAGEMENTisEdit) {
            this.permissionFlag = true;
            console.log(this.permissionFlag);
          }
        }
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

  generateDisbursementJournalReport(){
    let data = {
      serviceEndDate: this.selectedRangeType == 1 ? this.endDates : null,
      serviceStartDate: this.selectedRangeType == 1 ? this.startDates : null,
      postEndDate: this.selectedRangeType == 2 ? this.endDates : null,
      postStartDate: this.selectedRangeType == 2 ? this.startDates : null,
      powerFlag : this.permissionFlag ? 'True' : 'False'
    }
    this.loading = true
    this.reportService.v1ReportDisbursementJournalReportPost$Json({body: data}).subscribe((suc: any) => {
      const res = JSON.parse(suc)
        if(res.results){

          this.rows = [...res.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            const columnListHeader = ["clientNumber", "clientName", "matterNumber", "matterName", 
              "responsibleAttorney", "billingAttorney", "dateOfService", "postingDate", "chargeCode", 
              "description", "quantity", "vendorPaid", "noteToFile", "totalDisbursed", "enteredBy", "enteredDateTime", "lastUpdatedBy", "lastUpdatedDateTime"]
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.loading = false;
        this.ExportToCSV('Disbursements Journal Report');
    }, (err) => {
      console.log(err);
      this.loading = false;
    })
  }

  rangeTypeChange(event){
    console.log(event);
    this.removeStartDate = true;
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if(keys[i] == 'enteredDateTime'){
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] ='Entered Date/Time'
        });
      } else if(keys[i] == 'lastUpdatedDateTime'){
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] = 'Last Updated Date/Time'
        });
      } else {
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] = _.startCase(keys[i])
        });
      }
      
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
}
