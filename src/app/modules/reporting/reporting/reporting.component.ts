import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { IReportItem } from '../../models/reporting-list.model';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReportingComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;

  noDataToDisplay = false;
  message = 'No Records found.';

  MatterStatusReportForm: FormGroup;

  ExportToCSVFlag = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public permissionFlag: boolean = false;
  public isBillingOrResponsibleAttorney: boolean = false;
  public isBillingOrResponsibleAttorneyFlag: boolean = false;
  public isBillingOrResponsibleOrOriginatingAttorney: boolean = false;
  public isBillingOrResponsibleOrOriginatingAttorneyClient: boolean = false;
  public isBillingOrResponsibleOrOriginatingAttorneyFlag: boolean = false;
  public isConsultAttorney: boolean = false;
  public consultAttorneyFlag: boolean = false;
  public timeKeepingFlag: boolean = false;
  public transactionReportCount = 0;
  public summaryReportCount = 0;
  public userReportCount = 0;
  public isOpenTransactionReport: boolean = false;
  public isOpenSummaryReport: boolean = false;
  public isOpenUserReport: boolean = false;
  public isAccountingFlag: boolean = false;
  public isTrustVsArFlag: boolean = false;
  public writeOffDownPermission: boolean = false;
  public isWipDetailFlag: boolean = false;
  public isUserAccountDetailFlag: boolean = false;
  public isClientDetailFlag: boolean = false;
  public outstandingARwCC: boolean = false;
  public rows: Array<any> = [];
  public columnList: any = [];

  public loading: boolean = true;

  transactionReports: Array<IReportItem> = [];
  summaryReports: Array<IReportItem> = [];
  userReports: Array<IReportItem> = [];
  isAdmin = 0;
  constructor(
    private modalService: NgbModal,
    private router: Router,
    private fb: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private reportService: ReportService,
    private pagetitle: Title,
    private exporttocsvService: ExporttocsvService,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.MatterStatusReportForm = this.fb.group({
      openDateRange: null,
      closeDateRange: null,
    });
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.permissionList.ACCOUNTINGisAdmin || this.permissionList.ACCOUNTINGisEdit
            || this.permissionList.BILLING_MANAGEMENTisAdmin
            || this.permissionList.BILLING_MANAGEMENTisEdit) {
            this.isAdmin = 1;
          }
        }
      }
    });
  }

  async ngOnInit() {
    this.pagetitle.setTitle("Reporting");
    const res: any = await this.reportService.v1ReportGetBillingOrReposponsibleAttorneyGet$Response().toPromise();
    if (res != null) {
      this.isBillingOrResponsibleAttorney = JSON.parse(res.body as any).results;
    }
    const res1: any = await this.reportService.v1ReportGetConsultAttorneyForPcGet$Response().toPromise();
    if (res1 != null) {
      this.isConsultAttorney = JSON.parse(res1.body as any).results;
    }
    const res2: any = await this.reportService.v1ReportGetBillingOrReposponsibleOrOriginatingAttorneyGet$Response().toPromise();
    if (res2 != null) {
      this.isBillingOrResponsibleOrOriginatingAttorney = JSON.parse(res2.body as any).results;
    }
    const res3: any = await this.reportService.v1ReportGetBillingOrReposponsibleOrOriginatingAttorneyClientGet$Response().toPromise();
    if (res3 != null) {
      this.isBillingOrResponsibleOrOriginatingAttorneyClient = JSON.parse(res3.body as any).results;
    }
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.permissionList.ACCOUNTINGisAdmin || this.permissionList.ACCOUNTINGisEdit
            || this.permissionList.BILLING_MANAGEMENTisAdmin
            || this.permissionList.BILLING_MANAGEMENTisEdit) {
            this.permissionFlag = true;
          }
          if (this.permissionFlag || this.isBillingOrResponsibleAttorney) {
            this.isBillingOrResponsibleAttorneyFlag = true;
            this.isTrustVsArFlag = true;
            this.writeOffDownPermission = true;
            this.outstandingARwCC = true;
            this.isWipDetailFlag = true;
          }
          if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin || this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
            || this.isBillingOrResponsibleAttorney || this.isConsultAttorney) {
            this.consultAttorneyFlag = true;
          }
          if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin || this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
            || this.isBillingOrResponsibleOrOriginatingAttorney || this.isConsultAttorney) {
            this.isBillingOrResponsibleOrOriginatingAttorneyFlag = true;
            this.isClientDetailFlag = true;
          }
          if(this.isBillingOrResponsibleOrOriginatingAttorneyClient) {
            this.isClientDetailFlag = true;
          }
          if (this.permissionList.EMPLOYEE_MANAGEMENTisAdmin || !this.permissionList.TENANT_CONFIGURATIONisNoVisibility) {
            this.isUserAccountDetailFlag = true;
          }
          if (this.permissionList.TIMEKEEPING_OTHERSisAdmin || this.isBillingOrResponsibleAttorney) {
            this.timeKeepingFlag = true
          }
          if (!this.permissionFlag && !this.isBillingOrResponsibleAttorneyFlag
            && !this.consultAttorneyFlag && !this.timeKeepingFlag) {
            this.permissionFlag = false;
            this.timeKeepingFlag = false;
            this.consultAttorneyFlag = false;
            this.isBillingOrResponsibleAttorneyFlag = false;
          }

          if ((this.permissionList.ACCOUNTINGisAdmin || this.permissionList.ACCOUNTINGisEdit)) {
            this.isAccountingFlag = true;
          }
        }

        if (this.permissionFlag) {
          this.transactionReportCount = 3;
          this.summaryReportCount = 6;
        }

        if (this.isBillingOrResponsibleAttorneyFlag) {
          this.transactionReportCount += 3;
          this.summaryReportCount += 6;
        }

        if (this.consultAttorneyFlag) {
          this.transactionReportCount++;
          this.summaryReportCount++;
        }

        if (this.timeKeepingFlag) {
          this.transactionReportCount++;
          this.summaryReportCount++;
        }

        // for transaction (cash and check Request) report and summary (Cash Requirement Rollup) report
        if (this.isAccountingFlag) {
          this.transactionReportCount += 2;
          this.summaryReportCount += 2;
        }

        // trust vs ar, trust replenishment, no recent trust transactions
        if (this.isTrustVsArFlag) {
          this.summaryReportCount += 3;
        }
        if (this.writeOffDownPermission && this.outstandingARwCC) {
          this.transactionReportCount += 2;
          this.summaryReportCount++;
        }
        if (this.isWipDetailFlag) {
          this.transactionReportCount++;
        }
        if (this.isClientDetailFlag) {
          this.summaryReportCount++;
        }
        if (this.isUserAccountDetailFlag) {
          this.userReportCount++;
        }
        this.loading = false;
      } else {
        this.loading = false;
      }
    });
  }

  /**
   *
   * To open create folder popup
   * @param content
   * @param className
   * @param winClass
   */
  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.modalService.dismissAll();
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }
  /**
   *
   * @param reason
   *
   */
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  collapseTransactionClick() {
    this.isOpenTransactionReport = !this.isOpenTransactionReport;
  }
  collapseSummaryClick() {
    this.isOpenSummaryReport = !this.isOpenSummaryReport;
  }
  collapseUserClick() {
    this.isOpenUserReport = !this.isOpenUserReport;
  }


  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      this.columnList.push({
        Name: keys[i],
        displayName: keys[i] = _.startCase(keys[i])
      });
    }

    this.columnList.map(data => {
      if(data.Name === "arBalance") { data.displayName = 'AR Balance' };
      if(data.Name === "nameOnPrimaryCard") { data.displayName = 'Name on Auto-Pay Card' };
      if(data.Name === "primaryCardType") { data.displayName = 'Auto-Pay Card Type' };
      if(data.Name === "primaryCardNumber") { data.displayName = 'Auto-Pay Card Number' };
      if(data.Name === "primaryCardExpirationDate") { data.displayName = 'Auto-Pay Card Expiration Date' };
      return data;
    });
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

  generateOutstandingARwCC() {
    this.loading = true;
    const data: any = {};
    data.isAdmin = this.isAdmin;
    this.reportService.v1ReportCreditCardOutStandingArPost({ isAdmin: this.isAdmin })
      .subscribe((suc: any) => {
        const res = JSON.parse(suc)
        if (res.results) {
          this.rows = [...res.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            console.log(keys)
            this.addkeysIncolumnlist(keys);
          } else {
            const columnListHeader = ["clientNumber", "clientName", "matterNumber", "matterName",
              "reponsibleAttorneyID", "reponsibleAttorneyName", "billingAttorneyID", "billingAttorneyName",
              "arBalance", "nameOnPrimaryCard", "primaryCardType", "primaryCardNumber", "primaryCardExpirationDate"]
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('Outstanding AR with Credit Card Report');
        this.loading = false
      }, error => {
        console.log(error)
        this.loading = false
      }
      )
  }
}
