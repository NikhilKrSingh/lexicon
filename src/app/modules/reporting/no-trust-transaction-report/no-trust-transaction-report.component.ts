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
  selector: 'app-no-trust-transaction-report',
  templateUrl: './no-trust-transaction-report.component.html',
  styleUrls: ['./no-trust-transaction-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class NoTrustTransactionReportComponent implements OnInit, OnDestroy {
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isAdmin: boolean;
  public dateReset: boolean = false;
  public exportCsvFlag = false;
  public loading = true;
  public trustarReportFormSubmitted = false;
  public asOfDate: FormControl;
  public trustReportForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];

  public columnHeaderObj = [
    { name: 'clientNumber', displayName: 'Client Number' },
    { name: 'clientName', displayName: 'Client Name' },
    { name: 'matterNumber', displayName: 'Matter Number' },
    { name: 'matterName', displayName: 'Matter Name' },
    { name: 'reponsibleAttorneyId', displayName: 'Responsible Attorney ID' },
    {
      name: 'reponsibleAttorneyName',
      displayName: 'Responsible Attorney Name',
    },
    {
      name: 'primaryRetainerTrustBalance',
      displayName: 'Primary Retainer Trust Balance',
    },
    {
      name: 'primaryRetainerTrustMinimum',
      displayName: 'Primary Retainer Trust Minimum',
    },
    {
      name: 'trustOnlyBalance',
      displayName: 'Trust Only Balance',
    },
    {
      name: 'lastTransactionOnPrimaryRetainerTrust',
      displayName: 'Last Transaction on Primary Retainer Trust',
    },
    {
      name: 'lastTransactionOnTrustOnly',
      displayName: 'Last Transaction on Trust Only',
    },
  ];

  constructor(
    private reportService: ReportService,
    private builder: FormBuilder,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>
  ) {
    this.permissionList$ = this.store.select('permissions');

    let now = moment().subtract(60, 'days').toDate();
    this.asOfDate = new FormControl(now, [Validators.required]);

    this.trustReportForm = this.builder.group({
      asOfDate: this.asOfDate,
      primaryRetainerTrust: false,
      trustOnly: false,
    });
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

  submitNoRecentTrustTransactionsReport() {
    let data: any = {};

    data.asOfDate = this.asOfDate.value;
    data.isAdmin = this.isAdmin;
    data.primaryTrust = this.trustReportForm.value.primaryRetainerTrust;
    data.trustOnly = this.trustReportForm.value.trustOnly;

    this.loading = true;

    this.reportService
      .v1ReportNoRecentTrustTransactionReportPost$Json$Response({ body: data })
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
          this.ExportToCSV(
            'No Recent Trust Transactions',
            this.rows,
            this.columnList
          );
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
      if (a.lastTransactionOnPrimaryRetainerTrust) {
        a.lastTransactionOnPrimaryRetainerTrust = moment(
          a.lastTransactionOnPrimaryRetainerTrust + 'Z'
        ).format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.lastTransactionOnPrimaryRetainerTrust = '';
      }

      if (a.lastTransactionOnTrustOnly) {
        a.lastTransactionOnTrustOnly = moment(
          a.lastTransactionOnTrustOnly + 'Z'
        ).format('MM/DD/YYYY hh:mm:ss');
      } else {
        a.lastTransactionOnTrustOnly = '';
      }

      a.reponsibleAttorneyId = a.reponsibleAttorneyId || '';
      a.reponsibleAttorneyName = a.reponsibleAttorneyName || '';
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
