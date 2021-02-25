import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';

@Component({
  selector: 'app-trust-ar-report',
  templateUrl: './trust-ar-report.component.html',
  styleUrls: ['./trust-ar-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class TrustArReportComponent implements OnInit, OnDestroy {
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isAdmin: boolean;
  public dateReset: boolean = false;
  public exportCsvFlag = false;
  public loading = true;
  public trustarReportFormSubmitted = false;
  public asOfDate = new FormControl(new Date(), [Validators.required]);
  public trustarReportForm: FormGroup = this.builder.group({
    asOfDate: this.asOfDate,
  });
  public rows: Array<any> = [];
  public columnList: any = [];
  public columnHeaderObj = [
    { name: 'asOfDate', displayName: 'As of Date' },
    { name: 'clientNumber', displayName: 'Client Number' },
    { name: 'clientName', displayName: 'Client Name' },
    { name: 'matterNumber', displayName: 'Matter Number' },
    { name: 'matterName', displayName: 'Matter Name' },
    { name: 'reponsibleAttorneyId', displayName: 'Responsible Attorney ID' },
    {
      name: 'reponsibleAttorneyName',
      displayName: 'Responsible Attorney Name',
    },
    { name: 'billingAttorneyId', displayName: 'Billing Attorney ID' },
    { name: 'billingAttorneyName', displayName: 'Billing Attorney Name' },
    { name: 'arBalance', displayName: 'AR Balance' },
    {
      name: 'primaryRetainerTrustBalance',
      displayName: 'Primary Retainer Trust Balance',
    },
    { name: 'balanceToTransfer', displayName: 'Balance To Transfer' },
    { name: 'balanceToCollect', displayName: 'Balance To Collect' },
  ];

  constructor(
    private reportService: ReportService,
    private builder: FormBuilder,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.loading = false;
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (
            this.permissionList.ACCOUNTINGisAdmin ||
            this.permissionList.ACCOUNTINGisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin ||
            this.permissionList.BILLING_MANAGEMENTisEdit
          ) {
            this.isAdmin = true;
          }
        }
      }
    });
  }

  submitTrustarReport() {
    let data: any = {};
    data.asOfDate = this.asOfDate.value;
    data.isAdmin = this.isAdmin;
    this.loading = true;
    this.reportService
      .v1ReportTrustvsArReportPost$Json$Response({ body: data })
      .subscribe(
        (suc: {}) => {
          const res: any = suc;
          this.loading = false;
          if (res && res.body && JSON.parse(res.body).results) {
            var records = JSON.parse(res.body);
            this.rows = [...records.results];
            this.formatData(this.rows);
            this.addkeysIncolumnlist();
          }
          this.ExportToCSV('Trust vs. AR ', this.rows, this.columnList);
        },
        () => {
          this.loading = false;
        }
      );
  }
  addkeysIncolumnlist() {
    this.columnList = [];
    for (let i = 0; i < this.columnHeaderObj.length; i++) {
      this.columnList.push({
        Name: this.columnHeaderObj[i].name,
        displayName: this.columnHeaderObj[i].displayName,
      });
    }
  }

  private formatData(rows: Array<any>) {
    rows.forEach((a) => {
      a.asOfDate = moment(a.asOfDate).format('MM/DD/YYYY');
      a.billingAttorneyId = a.billingAttorneyId || '';
      a.reponsibleAttorneyId = a.reponsibleAttorneyId || '';
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
  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }
}
