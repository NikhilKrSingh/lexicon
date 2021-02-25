import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { NgbModal, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Chart, ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { vmWriteOffs, vwAttorneyViewModel } from 'src/app/modules/models';
import { vwMatterAlertModel } from 'src/app/modules/models/matter-alert';
import { PAYMENT_HIERARCHY_CODE, vwPaymentHierarchy } from 'src/app/modules/models/payment-hierarchy.model';
import { IautoPay, vwFixedFeeSettingsResponse } from 'src/app/modules/models/payment-model';
import { vwTimeOverviewResponse, vwTimeSummary } from 'src/app/modules/models/time-overview';
import { vwTotalTimesheet } from 'src/app/modules/models/timesheet.model';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { IBillGeneratetionPeriod } from 'src/app/modules/shared/billing-settings-helper';
import { MatterRecordWriteOffComponent } from 'src/app/modules/shared/billing-settings/write-offs/record-write-off/record-write-off.component';
import { CreateNewTimeEntryComponent } from 'src/app/modules/shared/create-new-time-entry/create-new-time-entry.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { TimeSummaryPipe } from 'src/app/modules/shared/pipes/time-summary.pipe';
import { RecordDisbursementComponent } from 'src/app/modules/shared/record-disbursement/record-disbursement.component';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { padNumber, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillingSettings, vwCreditCard, vwDisbursementType, vwECheck, vwIdName, vwMatterAlert, vwMatterEvents, vwMatterTimeOverviewRequest, vwNote, vwRecordDisbursement } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, DmsService, MatterService, MiscService, NoteService, TenantService, TrustAccountService } from 'src/common/swagger-providers/services';
import { FixedFeeServiceService } from 'src/common/swagger-providers/services/fixed-fee-service.service';
import { ClientAssociationService } from '../../../../../../common/swagger-providers/services/client-association.service';
import { CreateMatterAlertComponent } from '../../alert/create-alert/create-alert.component';
import { AddMatterNoteComponent } from '../add-note/add-note.component';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
@Component({
  selector: 'app-matter-dashboard-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [NgbDropdownConfig]
})
export class MatterDashboardOverviewComponent implements OnInit, OnDestroy {
  matterAlertList: Array<vwMatterAlertModel>;
  notes: Array<vwNote>;
  events: Array<vwMatterEvents>;
  billingSettings: vwBillingSettings;
  public scrollbarOptions = { axis: 'y', theme: 'dark-3' };
  matterId: number;
  ChartObj: any = Chart;
  @Input() matterDetails: any;
  @Input() isTrustAccountEnabled: boolean = true;
  @Output() readonly gotoDocs = new EventEmitter<boolean>();
  @Output() readonly gotoTrustAccountDashboard = new EventEmitter<boolean>();
  @Output() readonly matterDueBalance = new EventEmitter<{
    balanceDue?: number;
    invoiceId?: number;
    prebillId?: number;
  }>();
  practiceAreaList: Array<vwIdName> = [];
  timesheetType = 'AllTime';

  timesheet: vwTotalTimesheet;
  loggedInUser: any;
  creditCardIcon = UtilsHelper.cardImageIcon;
  balanceDue: number;
  selectedtrustBalance: string = 'N/A';
  selectedAccount = null;
  balancePastDue: number;
  nextBillDate: string;
  secondaryBillingDetails: vwFixedFeeSettingsResponse;
  matterFolderPath: string;
  matterFolderId = null;
  public currentBalance: number;
  public minimumRetainerTrustBalance: number;
  public trustMatterDetailsList = [];

  @ViewChild('timeoverviewChart', { static: false })  _chart: any;

  //Bar Graph
  public barChartOptions: ChartOptions = {
    responsive: true,
    // We use these empty structures as placeholders for dynamic theming.
    scales: {
      xAxes: [
        {
          gridLines: {
            drawOnChartArea: false,
            drawTicks: false
          },
          ticks: {
            padding: 10
          }
        }
      ],
      yAxes: [
        {
          gridLines: {
            display: false
          },
          display: false
        }
      ]
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end'
      }
    },
    tooltips: {
      enabled: false,
      custom: tooltipModel => {
        let tooltipEl = document.getElementById('chartjs-tooltip');
        // Create element on first render
        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.id = 'chartjs-tooltip';
          tooltipEl.innerHTML = `<div class='tooltip timeover-view'>
                                    <div class='info-hover'>
                                      <div class='arrow'></div>
                                      <div class='tooltip-inner'>
                                        <p></p>
                                      </div>
                                    </div>
                                  </div>`;

          document.body.appendChild(tooltipEl);
        } else {
          let tooltipInner = tooltipEl.querySelector(
            '.tooltip-inner'
          ) as HTMLDivElement;
          if (tooltipInner) {
            tooltipInner.style.left = '0px';
          }
        }

        tooltipEl.style.display = 'block';

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
          tooltipEl.style.opacity = '0';
          tooltipEl.style.display = 'none';
          return;
        }

        // Set caret Position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
          tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
          tooltipEl.classList.add('no-transform');
        }

        function getBody(bodyItem) {
          return bodyItem.lines;
        }

        // Set Text
        if (tooltipModel.body) {
          var titleLines = tooltipModel.title || [];
          var bodyLines = tooltipModel.body.map(getBody);

          var innerHtml = '';

          bodyLines.forEach(function(body, i) {
            innerHtml += body;
          });

          var tableRoot = tooltipEl.querySelector('p');
          tableRoot.innerHTML = innerHtml;
        }

        // `this` will be the overall tooltip
        var position = this._chart.nativeElement.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left =
          position.left + window.pageXOffset + tooltipModel.caretX - 23 + 'px';
        tooltipEl.style.top =
          position.top + window.pageYOffset + position.height - 23 + 'px';
        tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
        tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
        tooltipEl.style.pointerEvents = 'none';

        let tooltipInner = tooltipEl.querySelector(
          '.tooltip-inner'
        ) as HTMLDivElement;
        let pos = tooltipInner.getBoundingClientRect();

        if (pos.left + pos.width > window.innerWidth) {
          tooltipInner.style.position = 'relative';
          let leftPos = pos.left + pos.width - window.innerWidth + 50;

          tooltipInner.style.left = -leftPos + 'px';
        } else {
          tooltipInner.style.left = '0px';
        }
      },
      callbacks: {
        label: (tooltipItem, data) => {
          let ts = new TimeSummaryPipe();

          let dataset = data.datasets[tooltipItem.datasetIndex];
          let index = tooltipItem.index;
          let header;

          let label: string;

          if (this.timeoverObj.pastWeekView) {
            label = dataset.label;
            header = `<span class='font-weight-medium'>${dataset.label}`;
          } else {
            label = data.labels[index].toString();
            header = `<span class='font-weight-medium'>${data.labels[index]}`;
          }

          if (this.timeoverObj.timeoverviewId == 1) {
            header += ` My Time on Matter `;
          } else {
            header += ` Total Time on Matter `;
          }

          if (this.timeoverObj.allTimeView) {
            header += `All Time`;
          } else if (this.timeoverObj.todayView) {
            header += moment().format('MM/DD/YYYY') + '';
          } else if (this.timeoverObj.pastWeekView) {
            let startDate = moment().subtract(6, 'days');
            header +=
              startDate.add(tooltipItem.index, 'days').format('MM/DD/YYYY') +
              '';
          } else {
            let endDate = moment();
            let startDate = moment().subtract(1, 'month');

            header +=
              startDate.format('MM/DD/YYYY') +
              ' - ' +
              endDate.format('MM/DD/YYYY') +
              '';
          }

          header += '</span> ';
          header += '<span class="time-avg">';

          if (this.timeoverObj.pastWeekView) {
            if (dataset.label == 'Recorded') {
              header += ts.transform(
                this.timeoverviewdata.daySummary[tooltipItem.index]
                  .recordedSummary,
                this.timeformat,
                true
              );
            } else if (dataset.label == 'Approved') {
              header += ts.transform(
                this.timeoverviewdata.daySummary[tooltipItem.index]
                  .approvedSummary,
                this.timeformat,
                true
              );
            } else {
              header += ts.transform(
                this.timeoverviewdata.daySummary[tooltipItem.index]
                  .billedSummary,
                this.timeformat,
                true
              );
            }
          } else {
            if (label == 'Recorded') {
              header += ts.transform(
                this.timeoverviewdata.totalDaySummary.recordedSummary,
                this.timeformat,
                true
              );
            } else if (label == 'Approved') {
              header += ts.transform(
                this.timeoverviewdata.totalDaySummary.approvedSummary,
                this.timeformat,
                true
              );
            } else {
              header += ts.transform(
                this.timeoverviewdata.totalDaySummary.billedSummary,
                this.timeformat,
                true
              );
            }
          }

          header += '</span>';

          return header;
        }
      }
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartLabels = [];
  public barChartData: ChartDataSets[] = [];

  private permissionSubscribe: Subscription;
  private refreshTimekeepingSub: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public documentFiles: Array<any> = [];
  error_data = (errors as any).default;
  public matterStatusArr: Array<vwIdName> = [];
  public matterPriorityArr: Array<any> = [];
  public jurisdictionStateList: Array<any> = [];
  public displayWriteOffButton: boolean = false;
  disbursementTypes: Array<vwDisbursementType>;
  disbusementStatusList: any;
  firmDetails: any;
  public creditCardList: Array<vwCreditCard>;
  public autoPayDetails: IautoPay;
  public echeckList: Array<vwECheck>;
  matterStatusList: Array<vwIdName>;
  closeMatterStatus: vwIdName;
  public invoiceId: number;
  public prebillId: number;
  public writeOffs: Array<vmWriteOffs>;
  billGenerationPeriod: IBillGeneratetionPeriod;
  public postPaymentBtn: boolean = false;
  public selectedNote: any;
  public tempArray = [
    {
      balance: 2000,
      minBalance: 300,
      arrayOfAccount: [
        {
          id: 2,
          name: 'TrustAccount 1',
          identity: 'Trust',
          trustBalanceValue: 200
        },
        {
          id: 3,
          name: 'PropertyAccount 2',
          identity: 'Property',
          trustValue: 200,
          totalItems: 3
        },
        {
          id: 4,
          name: 'TrustAccount 3',
          identity: 'Trust',
          trustBalanceValue: 200
        },
        {
          id: 5,
          name: 'PropertyAccount 4',
          identity: 'Property',
          trustValue: 200,
          totalItems: 3
        },
        {
          id: 6,
          name: 'TrustAccount 5',
          identity: 'Trust',
          trustBalanceValue: 200
        }
      ]
    }
  ];
  public eventLoading: boolean;
  public docLoading: boolean;
  public notesLoading: boolean;
  public alertsLoading: boolean;
  public timesheetLoading: boolean;
  public billingLoading: boolean;
  public isTuckerallenAccount: boolean;
  public primaryContact: any;
  public billingContact: any;
  public infoLoading: boolean = true;
  public matterInfoLoading: boolean = true;
  public fixedFeeCode: string;
  public fixedFeeDescription: string;
  public totalTrustAmount: number = 0;
  public totalHeldInTrustAmount: number = 0;

  isRaOrBa = false;

  timeoverviewOptions = [
    {
      id: 1,
      name: 'My Time on Matter'
    },
    {
      id: 2,
      name: 'Total Time on Matter'
    }
  ];

  timeoverObj = {
    timeoverviewId: 0,
    todayView: true,
    pastWeekView: false,
    pastMonthView: false,
    allTimeView: false,
    disabled: false
  };

  timeoverviewdata: vwTimeOverviewResponse = null;
  timeformat: string;
  public timeLoggedText: string;
  public totalTimeHours: number = 0;
  public totalTimeMinutes: number = 0;
  public totalAmount: number = 0;
  public totalTime: any = {};
  public avgTime: string;

  constructor(
    private modalService: NgbModal,
    private matterService: MatterService,
    private noteService: NoteService,
    private toastr: ToastDisplay,
    private clockService: ClockService,
    private billingService: BillingService,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private dmsService: DmsService,
    private fixedFeeService: FixedFeeServiceService,
    private router: Router,
    private tenantService: TenantService,
    private trustAccountService: TrustAccountService,
    public sharedService: SharedService,
    private clientAssociationService: ClientAssociationService,
    private miscService: MiscService,
    ngbDropdownConfig: NgbDropdownConfig,
    config: NgbTooltipConfig
  ) {
    ngbDropdownConfig.placement = 'bottom-right';
    this.notes = [];
    this.matterAlertList = [];
    this.events = [];
    this.timesheet = new vwTotalTimesheet();
    this.billingLoading = true;
    this.timeformat = localStorage.getItem('timeformat');

    let user = localStorage.getItem('profile');
    if (user) {
      this.loggedInUser = JSON.parse(user);
    } else {
      this.loggedInUser = {};
    }
    this.permissionList$ = this.store.select('permissions');
    this.sharedService.isTuckerAllenAccount$.subscribe(res => {
      this.isTuckerallenAccount = res ? true : false;
    });
  }

  ngOnInit() {
    this.autoPayDetails = {
      autoPay: false,
      cardNumber: null,
      accountNumber: null,
      cardType: null
    };

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          this.checkPostPaymentButtonPermissions();
          this.setDefaultTimeOverview();
        }
      }
    });

    this.refreshTimekeepingSub = this.sharedService.refreshTimekeeping$.subscribe(
      (matterIds: Array<number>) => {
        matterIds = matterIds || [];

        if (matterIds.some(a => a == this.matterId)) {
          this.timesheetLoading = true;
          this.viewTimeOverView();
        }
      }
    );

    if (this.matterDetails) {
      this.matterId = this.matterDetails.id;
      this.GetMatterTrustDetails();
      this.GetPrimaryRetainerTrustDetails();
      this.getTenantData();
      this.getMatterAlertStatuses();
      this.getMatterPriorities();
      this.getMatterPracticesList();
      this.getMatterFolderPath();
      this.getNotes();
      this.viewTimeOverView();
      this.getEventList();
      this.getOfficeBillingSettings();
      this.getMatterStatusList();
      this.getList();
      this.getRecentDocuments();
      this.getState();
      if (this.matterDetails.clientName.company) {
        this.getCorporateContact();
      } else {
        this.infoLoading = false;
      }
    } else {
      this.matterInfoLoading = false;
      this.alertsLoading = false;
      this.billingLoading = false;
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.refreshTimekeepingSub) {
      this.refreshTimekeepingSub.unsubscribe();
    }
  }

  private getList() {
    forkJoin([
      this.matterService
        .v1MatterPaymentMethodsbymatterMatterIdGet({
          matterId: this.matterDetails.id
        })
        .pipe(map(UtilsHelper.mapData)),
      this.matterService
        .v1MatterInvoicesMatterIdGet({
          matterId: this.matterId
        })
        .pipe(map(UtilsHelper.mapData)),
      this.fixedFeeService
        .v1FixedFeeServiceBillingMatteridGet({
          matterid: this.matterId
        })
        .pipe(map(UtilsHelper.mapData)),
      this.billingService
        .v1BillingPaymentHierachiesMatterIdGet({
          matterId: this.matterDetails.id
        })
        .pipe(map(UtilsHelper.mapData))
    ]).subscribe(
      res => {
        if (res) {
          this.creditCardList = res[0].creditCards;
          this.echeckList = res[0].eChecks;

          let paymentHierarchies: Array<vwPaymentHierarchy> = res[3] || [];

          let invoicedAmount = _.sumBy(paymentHierarchies, a => a.totalAmount);
          let totalPaid = _.sumBy(paymentHierarchies, a => a.totalPaid);

          this.secondaryBillingDetails = res[2];
          if (
            this.secondaryBillingDetails &&
            this.secondaryBillingDetails.fixedFeeService
          ) {
            let codes = this.secondaryBillingDetails.fixedFeeService.map(
              obj => obj.code
            );
            this.fixedFeeCode = codes.join(', ');

            if (codes.length == 1) {
              this.fixedFeeDescription = this.secondaryBillingDetails.fixedFeeService[0].description;
            } else {
              this.fixedFeeDescription = 'Fixed fee services';
            }
          }
          if (this.echeckList && this.echeckList.length > 0) {
            this.echeckList.map(item => {
              if (item.autoPay) {
                this.autoPayDetails.autoPay = item.autoPay;
                this.autoPayDetails.accountNumber = item.accountNumber;
              }
            });
          }
          if (this.creditCardList && this.creditCardList.length > 0) {
            this.creditCardList.map(item => {
              if (item.autoPay) {
                this.autoPayDetails.autoPay = item.autoPay;
                this.autoPayDetails.cardNumber = item.cardNumber;
                this.autoPayDetails.cardType = item.cardType;
              }
            });
          }

          if (this.secondaryBillingDetails.paymentPlan) {
            let plan = this.secondaryBillingDetails.paymentPlan;
            if (plan.isAutoPay) {
              this.autoPayDetails.autoPay = true;

              if (plan.echeckDetail) {
                this.autoPayDetails.accountNumber =
                  plan.echeckDetail.accountNumber;
              }

              if (plan.creditCard) {
                this.autoPayDetails.cardNumber = plan.creditCard.cardNumber;
                this.autoPayDetails.cardType = plan.creditCard.cardType;
              }
            }
          }

          this.balanceDue = invoicedAmount - totalPaid;

          let ARandWriteOffs = paymentHierarchies.filter(
            a =>
              a.code == PAYMENT_HIERARCHY_CODE.AR_BALANCE ||
              a.code == PAYMENT_HIERARCHY_CODE.WRITE_OFF
          );

          let totalARandWriteOffs = _.sumBy(ARandWriteOffs, a => a.totalPaid);
          let now = moment();

          let pastInvoices = paymentHierarchies.filter(a => {
            let dueDate = moment(moment(a.dueDate).format('YYYY-MM-DD'));
            return (
              dueDate.isBefore(now, 'date') &&
              a.code != PAYMENT_HIERARCHY_CODE.AR_BALANCE &&
              a.code != PAYMENT_HIERARCHY_CODE.WRITE_OFF
            );
          });

          let pastInoicedAmount = _.sumBy(pastInvoices, i => i.totalAmount);
          let pastPaid = _.sumBy(pastInvoices, i => i.totalPaid);

          this.balancePastDue =
            pastInoicedAmount - pastPaid - totalARandWriteOffs;

          if (this.secondaryBillingDetails.paymentPlan) {
            if (this.secondaryBillingDetails.paymentPlan.balanceDue > 0) {
              this.balancePastDue = this.secondaryBillingDetails.paymentPlan.balanceDue;
            }
          }

          if (res[1] && res[1].length > 0) {
            let invoiceList: Array<vwInvoice> = res[1] || [];

            if (invoiceList && invoiceList.length > 0) {
              let invoiceLst = invoiceList.filter(
                item => item.totalInvoiced > item.totalPaid
              );
              if (invoiceLst && invoiceLst.length > 0) {
                invoiceLst.sort((a, b) => {
                  if (a.id > b.id) {
                    return -1;
                  }
                  if (a.id < b.id) {
                    return 1;
                  }
                  return 0;
                });
                this.invoiceId = invoiceLst[0].id;
                this.prebillId = invoiceList[0].preBillId;
              }

              let loginUserAttorny = UtilsHelper.checkPermissionOfRepBingAtn(
                this.matterDetails
              );
              if (
                this.balanceDue > 0 &&
                (this.permissionList.BILLING_MANAGEMENTisEdit ||
                  this.permissionList.BILLING_MANAGEMENTisAdmin ||
                  loginUserAttorny)
              ) {
                this.displayWriteOffButton = true;
              }
            }

            this.matterDueBalance.emit({
              balanceDue: this.balanceDue,
              invoiceId: this.invoiceId,
              prebillId: this.prebillId
            });
          }
        }
        this.billingLoading = false;
      },
      () => {
        this.billingLoading = false;
      }
    );
  }

  private getMatterStatusList() {
    this.matterService
      .v1MatterStatusesGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdName>;
        })
      )
      .subscribe(res => {
        this.matterStatusList = res;
        this.closeMatterStatus = this.matterStatusList.find(
          a => a.name == 'Closed'
        );
      });
  }

  /**
   * function to get matter statuses
   */
  async getMatterAlertStatuses(): Promise<any> {
    let resp: any = await this.matterService
      .v1MatterAlertStatusesGet$Response()
      .toPromise();
    this.matterStatusArr = JSON.parse(resp.body as any).results;
  }

  /**
   * function to get matter priorities
   */
  async getMatterPriorities(): Promise<any> {
    this.alertsLoading = true;
    try {
      let resp: any = await this.matterService
        .v1MatterAlertPrioritisGet$Response()
        .toPromise();
      this.matterPriorityArr = JSON.parse(resp.body as any).results;
      this.getMatterAlerts();
    } catch (err) {
      this.alertsLoading = false;
      this.getMatterAlerts();
    }
  }

  private getEventList() {
    this.eventLoading = true;
    this.matterService
      .v1MatterEventsListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterEvents[];
        })
      )
      .subscribe(
        res => {
          this.events = res;
          this.eventLoading = false;
        },
        () => {
          this.eventLoading = false;
        }
      );
  }

  copyText(val: string) {
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  get responsibleAttorney() {
    if (this.matterDetails && this.matterDetails.responsibleAttorney) {
      return this.matterDetails.responsibleAttorney[0];
    } else {
      return <vwAttorneyViewModel>{};
    }
  }

  get billingAttorney() {
    if (this.matterDetails && this.matterDetails.billingAttorney) {
      return this.matterDetails.billingAttorney[0];
    } else {
      return <vwAttorneyViewModel>{};
    }
  }

  get practiceAreaNames() {
    if (this.practiceAreaList && this.practiceAreaList.length > 0) {
      return this.practiceAreaList.map(a => a.name);
    } else {
      return [];
    }
  }

  private getMatterAlerts() {
    this.alertsLoading = true;
    this.matterService
      .v1MatterAlertListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(
        res => {
          this.matterAlertList = res;
          this.matterAlertList = this.matterAlertList.sort((alert1, alert2) =>
            alert1.id > alert2.id ? -1 : 1
          );
          this.matterAlertList.map(obj => {
            obj['className'] = 'Informational';
            obj['priority'] = 'INFORMATIONAL';
            if (obj.priorityId) {
              const data: any = this.matterPriorityArr.find(
                matter => matter.id === obj.priorityId
              );
              if (data) {
                obj['className'] = data.name;
                obj['priority'] = data.code;
              }
            }
          });
          let matterAlertSortedList = this.matterAlertList.filter(
            item => item['priority'] === 'CAUTION'
          );
          matterAlertSortedList = matterAlertSortedList.concat(
            this.matterAlertList.filter(item => item['priority'] === 'WARNING')
          );
          matterAlertSortedList = matterAlertSortedList.concat(
            this.matterAlertList.filter(
              item => item['priority'] === 'INFORMATIONAL'
            )
          );
          this.matterAlertList = matterAlertSortedList;
          this.alertsLoading = false;
        },
        err => {
          this.alertsLoading = false;
        }
      );
  }

  private getNotes() {
    this.notesLoading = true;
    this.noteService
      .v1NoteMatterListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwNote>;
        })
      )
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.notes = res;
          } else {
            this.notes = [];
          }

          this.notes = this.notes.sort((a, b) => b.id - a.id);

          this.notes.forEach(n => {
            if (n.lastUpdated) {
              n.lastUpdated = n.lastUpdated + 'Z';
            }
          });
          this.notesLoading = false;
        },
        () => {
          this.notesLoading = false;
        }
      );
  }

  editNote(row: vwNote) {
    this.modalService.dismissAll();
    let modalRef = this.modalService.open(AddMatterNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    let component: AddMatterNoteComponent = modalRef.componentInstance;
    component.note = row;
    component.isEdit = true;

    modalRef.result.then(res => {
      if (res) {
        this.updateMatterNote(res);
      }
    });
  }

  private updateMatterNote(note: vwNote) {
    this.noteService
      .v1NoteMatterUpdateMatterIdPut$Json({
        matterId: this.matterId,
        body: note
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.update_note_success);
            this.getNotes();
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {}
      );
  }

  deleteNote(row: vwNote) {
    this.dialogService
      .confirm(
        this.error_data.delete_note_confirm,
        'Delete',
        'Cancel',
        'Delete Note'
      )
      .then(res => {
        if (res) {
          this.deleteMatterNote(row);
        }
      });
  }

  private deleteMatterNote(note: vwNote) {
    this.noteService
      .v1NoteMatterRemoveMatterIdNoteIdDelete({
        matterId: this.matterId,
        noteId: note.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.delete_note_success);
            this.getNotes();
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {}
      );
  }

  private getMatterPracticesList() {
    this.matterService
      .v1MatterPracticesListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return {
            PracticesList: JSON.parse(res as any).results
          };
        })
      )
      .subscribe(
        res => {
          this.practiceAreaList = res.PracticesList;
          this.matterInfoLoading = false;
        },
        () => {
          this.matterInfoLoading = false;
        }
      );
  }

  private getOfficeBillingSettings() {
    this.billingService
      .v1BillingSettingsOfficeOfficeIdGet({
        officeId:
          this.matterDetails.matterPrimaryOffice &&
          this.matterDetails.matterPrimaryOffice.id
            ? this.matterDetails.matterPrimaryOffice.id
            : null
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwBillingSettings>;
        })
      )
      .subscribe(res => {
        if (res && res.length > 0) {
          this.billingSettings = res[0];
        } else {
          this.billingSettings = {};
        }

        this.billGenerationPeriod = {
          start: this.billingSettings.billFrequencyStartingDate,
          end: this.billingSettings.billFrequencyNextDate
        };
      });
  }

  addNote() {
    let modalRef = this.modalService.open(AddMatterNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then(res => {
      if (res) {
        this.addMatterNote(res);
      }
    });
  }

  private addMatterNote(note: vwNote) {
    this.notesLoading = true;
    this.noteService
      .v1NoteMatterAddMatterIdPost$Json({
        matterId: this.matterId,
        body: note
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess('Note added.');
            this.getNotes();
          } else {
            this.toastr.showError('Some error occured');
          }
        },
        () => {
          this.notesLoading = false;
        }
      );
  }

  createMatterAlert() {
    let modalRef = this.modalService.open(CreateMatterAlertComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.matterStatusArr = this.matterStatusArr;
    modalRef.componentInstance.matterPriorityArr = this.matterPriorityArr;
    modalRef.result.then((res: vwMatterAlert) => {
      if (res) {
        res.matterId = this.matterId;
        this.addAlert(res);
      }
    });
  }

  private addAlert(alert: vwMatterAlert) {
    this.matterService
      .v1MatterAlertAddPost$Json({
        body: alert
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        newMatterId => {
          if (newMatterId > 0) {
            this.toastr.showSuccess('Matter alert created.');
            this.getMatterAlerts();
          } else {
            this.toastr.showError('Some Error Occured');
          }
        },
        () => {}
      );
  }

  recordWriteOff() {
    let modalRef = this.modalService.open(MatterRecordWriteOffComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
    modalRef.componentInstance.balanceDue = this.balanceDue;
    modalRef.componentInstance.matterId = this.matterId;
    modalRef.componentInstance.invoiceId = this.invoiceId;
    modalRef.componentInstance.prebillId = this.prebillId;
    modalRef.componentInstance.isFixedFee = this.matterDetails.isFixedFee;

    modalRef.result.then(res => {
      if (res.type === 'added' || res.type === 'edit') {
        this.billingLoading = true;
        this.getList();
      }
    });
  }

  public getRecentDocuments() {
    this.docLoading = true;
    this.dmsService
      .v1DmsFileRecentMattterMatterIdGet$Response({ matterId: this.matterId })
      .subscribe(
        res => {
          const files = JSON.parse(res.body as any).results;
          this.documentFiles = files;
          this.docLoading = false;
        },
        err => {
          this.docLoading = false;
        }
      );
  }

  public redirectToDMS(isMatter?: boolean, row?: any) {
    const navigationExtras: NavigationExtras = {
      state: {
        docPath: isMatter ? this.matterFolderId : row.folderId
      }
    };

    if (row) {
      navigationExtras.state.fileName = row.fileName;
    }
    this.router.navigate(['/manage-folders'], navigationExtras);
  }

  public openDocumentsTab() {
    this.gotoDocs.emit(true);
  }
  public openTrustAccountTab() {
    this.gotoTrustAccountDashboard.emit(true);
  }

  getMatterFolderPath() {
    this.dmsService
      .v1DmsFolderMatterMatterIdGet$Response({ matterId: this.matterId })
      .subscribe(
        res => {
          this.matterFolderPath = JSON.parse(
            res.body as any
          ).results.folderPath;
          this.matterFolderId = JSON.parse(res.body as any).results.id;
        },
        err => {}
      );
  }

  private getTenantData() {
    this.tenantService
      .v1TenantGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        this.firmDetails = res;
        this.getDisbursementTypesandStatusList();
      });
  }

  getDisbursementTypesandStatusList() {
    this.billingService
      .v1BillingDisbursementTypeMatterMatterIdGet({ matterId: this.matterId })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        this.disbursementTypes = res;
      });

    this.billingService
      .v1BillingDisbursementstatusListGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        this.disbusementStatusList = res;
      });
  }

  recordDisbursement() {
    if (this.disbursementTypes) {
      this._recordDisbursement();
    } else {
      this.billingService
        .v1BillingDisbursementTypeMatterMatterIdGet({ matterId: this.matterId })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results;
          })
        )
        .subscribe(res => {
          this.disbursementTypes = res;
          this._recordDisbursement();
        });
    }
  }

  _recordDisbursement() {
    let modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'record-disbursement-dialog'
    });

    modalRef.componentInstance._disbursementTypes = this.disbursementTypes;
    modalRef.componentInstance.recordDisbursement = {
      disbursementType: {},
      note: {
        isVisibleToClient: false,
        applicableDate: new Date() as any,
        name: ''
      },
      dateOfService: new Date() as any,
      applicableDate: new Date() as any
    };

    modalRef.componentInstance.officeBillingSettings = this.billingSettings;
    modalRef.componentInstance.matterDetails = this.matterDetails;

    modalRef.result.then((res: vwRecordDisbursement) => {
      if (res) {
        if (res && res.note && !res.note.name) {
          res.note = null;
        }

        res.matter = {
          id: this.matterDetails.id
        };

        if (!this.matterDetails.matterPrimaryOffice) {
          this.toastr.showError('Please assign Matter Law office');
          return;
        }

        res.office = {
          id: this.matterDetails.matterPrimaryOffice.id
        };

        res.tenant = {
          id: this.firmDetails.id
        };

        res.person = {
          id: this.matterDetails.clientName.id
        };

        let recordedStatus = this.disbusementStatusList.find(
          a => a.code == 'RECORDED'
        );

        res.status = recordedStatus;
        this.addDisbursement(res);
      }
    });
  }

  private addDisbursement(record: vwRecordDisbursement) {
    this.billingService
      .v1BillingRecordPost$Json({
        body: record
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess(
              this.error_data.record_disbursement_success,
            );
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {}
      );
  }

  logTime() {
    let modalRef = this.modalService.open(CreateNewTimeEntryComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });

    let component = modalRef.componentInstance;
    if (this.matterDetails.clientName.isCompany) {
      component.searchclient = this.matterDetails.clientName.company;
    } else {
      component.searchclient =
        this.matterDetails.clientName.lastName +
        ', ' +
        this.matterDetails.clientName.firstName;
    }
    component.searchMatter =
      this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
    component.clientDetail = this.matterDetails.clientName;
    component.matterDetail = this.matterDetails;
    component.billGenerationPeriod = this.billGenerationPeriod;

    modalRef.result.then(() => {
      this.viewTimeOverView();
      this.getNotes();
    });
  }

  /****
   * function to check post payment button permission
   */
  checkPostPaymentButtonPermissions() {
    this.isRaOrBa = UtilsHelper.checkPermissionOfRepBingAtn(this.matterDetails);

    if (this.isTrustAccountEnabled) {
      if (this.permissionList) {
        this.postPaymentBtn = !!(
          this.permissionList.BILLING_MANAGEMENTisAdmin ||
          this.permissionList.BILLING_MANAGEMENTisEdit
        );
      }

      if (!this.postPaymentBtn) {
        this.postPaymentBtn = this.isRaOrBa;
      }
    }
  }
  private GetPrimaryRetainerTrustDetails() {
    this.trustAccountService
      .v1TrustAccountGetPrimaryRetainerTrustDetailsGet$Response({
        matterId: +this.matterId
      })
      .subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.currentBalance = parsedRes.results.currnetBalance
              ? parsedRes.results.currnetBalance
              : 0;
            this.minimumRetainerTrustBalance = parsedRes.results
              .minimumRetainerTrustBalance
              ? parsedRes.results.minimumRetainerTrustBalance
              : 0;
          }
        }
      });
  }
  private GetMatterTrustDetails() {
    this.trustAccountService
      .v1TrustAccountGetMatterTrustDetailsGet$Response({
        matterId: +this.matterId
      })
      .subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null) {
            this.trustMatterDetailsList = parsedRes.results;
            this.trustMatterDetailsList.forEach(item => {
              if (item.isTrustOnlyAccount) {
                if (item.trustBalance) {
                  this.totalTrustAmount += +item.trustBalance;
                }
              } else {
                if (item.trustValue) {
                  this.totalHeldInTrustAmount += +item.trustValue;
                }
              }
            });
          }
        }
      });
  }

  viewNote(content: any, note) {
    this.selectedNote = note;
    let modalRef = this.modalService.open(content, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
  }

  public getCorporateContact() {
    this.primaryContact = [];
    this.billingContact = [];
    this.clientAssociationService
      .v1ClientAssociationClientIdGet({
        clientId: this.matterDetails.clientName.id
      })
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          list.forEach(contact => {
            if (contact.isPrimary) {
              this.primaryContact = contact;
            }
            if (contact.associationType == 'Billing Contact') {
              this.billingContact = contact;
            }
          });
          this.infoLoading = false;
        },
        err => {
          this.infoLoading = false;
          console.log(err);
        }
      );
  }

  /******** Getting State List ******/
  public getState() {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(resp => {
      const res: any = resp;
      this.jurisdictionStateList = JSON.parse(res.body).results;
    });
  }

  private setDefaultTimeOverview() {
    this.timeoverObj.disabled = false;

    if (
      this.permissionList.TIMEKEEPING_SELFisEdit ||
      this.permissionList.TIMEKEEPING_OTHERSisAdmin ||
      this.permissionList.TIMEKEEPING_OTHERSisViewOnly
    ) {
      this.timeoverObj.todayView = true;
      if (this.permissionList.TIMEKEEPING_SELFisEdit) {
        if (
          this.permissionList.TIMEKEEPING_OTHERSisAdmin ||
          this.permissionList.TIMEKEEPING_OTHERSisViewOnly
        ) {
          this.timeoverObj.timeoverviewId = 1;
        } else {
          this.timeoverObj.timeoverviewId = 1;
          this.timeoverObj.disabled = true;
        }
      } else {
        this.timeoverObj.timeoverviewId = 2;
        this.timeoverObj.disabled = true;
      }
    }

    if (this.timeoverObj.timeoverviewId == 1) {
      this.timeLoggedText = 'Time Logged Today';
    } else {
      this.timeLoggedText = 'Total Time Logged Today';
    }
  }

  public changeTimeOverViewType(type: string) {
    if (type == 'todayView' && !this.timeoverObj.todayView) {
      this.timeoverObj.todayView = true;
      this.timeoverObj.pastWeekView = false;
      this.timeoverObj.pastMonthView = false;
      this.timeoverObj.allTimeView = false;
      this.viewTimeOverView();
    }

    if (type == 'pastWeekView' && !this.timeoverObj.pastWeekView) {
      this.timeoverObj.todayView = false;
      this.timeoverObj.pastWeekView = true;
      this.timeoverObj.pastMonthView = false;
      this.timeoverObj.allTimeView = false;
      this.viewTimeOverView();
    }

    if (type == 'pastMonthView' && !this.timeoverObj.pastMonthView) {
      this.timeoverObj.todayView = false;
      this.timeoverObj.pastWeekView = false;
      this.timeoverObj.pastMonthView = true;
      this.timeoverObj.allTimeView = false;
      this.viewTimeOverView();
    }

    if (type == 'allTimeView' && !this.timeoverObj.allTimeView) {
      this.timeoverObj.todayView = false;
      this.timeoverObj.pastWeekView = false;
      this.timeoverObj.pastMonthView = false;
      this.timeoverObj.allTimeView = true;
      this.viewTimeOverView();
    }
  }

  public viewTimeOverView() {
    const overviewObj: vwMatterTimeOverviewRequest = {
      endDate: moment().format('YYYY-MM-DD'),
      isAllTimeView: this.timeoverObj.allTimeView,
      isMonthView: this.timeoverObj.pastMonthView
    };

    if (this.timeoverObj.timeoverviewId == 1) {
      overviewObj.isMyTime = true;
    } else {
      overviewObj.isMyTime = false;
    }

    if (this.timeoverObj.todayView) {
      overviewObj.startDate = moment().format('YYYY-MM-DD');
      if (this.timeoverObj.timeoverviewId == 1) {
        this.timeLoggedText = 'Time Logged Today';
      } else {
        this.timeLoggedText = 'Total Time Logged Today';
      }
    } else if (this.timeoverObj.pastWeekView) {
      overviewObj.startDate = moment()
        .subtract(6, 'days')
        .format('YYYY-MM-DD');
      if (this.timeoverObj.timeoverviewId == 1) {
        this.timeLoggedText = 'Time Logged this Week';
      } else {
        this.timeLoggedText = 'Total Time Logged this Week';
      }
    } else if (this.timeoverObj.pastMonthView) {
      overviewObj.startDate = moment()
        .subtract(1, 'month')
        .format('YYYY-MM-DD');
      if (this.timeoverObj.timeoverviewId == 1) {
        this.timeLoggedText = 'Time Logged this Month';
      } else {
        this.timeLoggedText = 'Total Time Logged this Month';
      }
    } else {
      overviewObj.startDate = '1900-01-01';
      if (this.timeoverObj.timeoverviewId == 1) {
        this.timeLoggedText = 'Time Logged All-Time';
      } else {
        this.timeLoggedText = 'Total Time Logged All-Time';
      }
    }

    this.timesheetLoading = true;

    this.clockService
      .v1ClockMatterTimeoverviewMatterIdPost$Json({
        matterId: this.matterId,
        body: overviewObj
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.timesheetLoading = false;
        })
      )
      .subscribe(res => {
        this.timeoverviewdata = res;

        if (this.timeoverviewdata) {
          this.createBarChartData();
        }
      });
  }

  private createBarChartData() {
    this.totalTimeHours = 0;
    this.totalTimeMinutes = 0;
    this.totalAmount = 0;
    this.barChartData = [];

    this.barChartLabels = [];

    let dp = new DatePipe('en-US');

    if (
      this.timeoverObj.allTimeView ||
      this.timeoverObj.pastMonthView ||
      this.timeoverObj.todayView
    ) {
      this.barChartLabels = ['Recorded', 'Approved', 'Billed'];
    } else {
      this.timeoverviewdata.daySummary.forEach(a => {
        this.barChartLabels.push(dp.transform(a.date, 'EEE'));
      });
    }

    let recorded: vwTimeSummary[] = [];
    let approved: vwTimeSummary[] = [];
    let billed: vwTimeSummary[] = [];

    if (
      this.timeoverObj.allTimeView ||
      this.timeoverObj.pastMonthView ||
      this.timeoverObj.todayView
    ) {
      let a = this.timeoverviewdata.daySummary[0];

      recorded.push(a.recordedSummary);
      approved.push(a.approvedSummary);
      billed.push(a.billedSummary);
    } else {
      this.timeoverviewdata.daySummary.forEach(a => {
        recorded.push(a.recordedSummary);
        approved.push(a.approvedSummary);
        billed.push(a.billedSummary);
      });
    }

    this.timeoverviewdata.daySummary.forEach(a => {
      this.totalTimeHours += a.approvedSummary.hours;
      this.totalTimeHours += a.billedSummary.hours;
      this.totalTimeHours += a.recordedSummary.hours;
      this.totalTimeMinutes += a.approvedSummary.minutes;
      this.totalTimeMinutes += a.billedSummary.minutes;
      this.totalTimeMinutes += a.recordedSummary.minutes;
      this.totalAmount += a.approvedSummary.amount;
      this.totalAmount += a.billedSummary.amount;
      this.totalAmount += a.recordedSummary.amount;
    });

    this.totalTimeHours += Math.floor(this.totalTimeMinutes / 60);
    this.totalTimeMinutes = this.totalTimeMinutes % 60;

    this.totalTime = {
      amount: this.totalAmount,
      hours: this.totalTimeHours,
      minutes: this.totalTimeMinutes
    };

    let averageTimeMinutes;
    let totalTimeMinutes;

    totalTimeMinutes = this.totalTimeHours * 60 + this.totalTimeMinutes;

    if (this.timeoverObj.pastWeekView) {
      averageTimeMinutes = Math.round(totalTimeMinutes / 7);
    } else {
      averageTimeMinutes = Math.round(totalTimeMinutes / 30);
    }

    if (averageTimeMinutes < 60) {
      this.avgTime = this.getTimeString(0, averageTimeMinutes);
    } else {
      let hours = Math.floor(averageTimeMinutes / 60);
      let minutes = averageTimeMinutes % 60;
      this.avgTime = this.getTimeString(hours, minutes);
    }

    if (
      this.timeoverObj.allTimeView ||
      this.timeoverObj.pastMonthView ||
      this.timeoverObj.todayView
    ) {
      this.barChartData = [
        {
          label: '',
          data: [
            this.getTotalHours(recorded[0]),
            this.getTotalHours(approved[0]),
            this.getTotalHours(billed[0])
          ],
          backgroundColor: ['#4752D6', '#37C2CF', '#FA7959'],
          hoverBackgroundColor: ['#4752D6', '#37C2CF', '#FA7959'],
          borderColor: ['#4752D6', '#37C2CF', '#FA7959'],
          hoverBorderColor: ['#4752D6', '#37C2CF', '#FA7959'],
          hideInLegendAndTooltip: true,
          fill: '#4752D6',
          barPercentage: 0.6
        }
      ];
    } else {
      this.barChartData = [
        {
          data: recorded.map(a => this.getTotalHours(a)),
          label: 'Recorded',
          backgroundColor: '#4752D6',
          hoverBackgroundColor: '#4752D6',
          borderColor: '#4752D6',
          hoverBorderColor: '#4752D6',
          hideInLegendAndTooltip: true,
          fill: '#4752D6'
        },
        {
          data:
            approved.length > 0
              ? approved.map(a => this.getTotalHours(a))
              : [0.0001],
          label: 'Approved',
          backgroundColor: '#37C2CF',
          hoverBackgroundColor: '#37C2CF',
          borderColor: '#4752D6',
          hoverBorderColor: '#4752D6',
          hideInLegendAndTooltip: true,
          fill: '#4752D6'
        },
        {
          data:
            billed.length > 0
              ? billed.map(a => this.getTotalHours(a))
              : [0.0001],
          label: 'Billed',
          backgroundColor: '#FA7959',
          hoverBackgroundColor: '#FA7959',
          borderColor: '#FA7959',
          hoverBorderColor: '#FA7959',
          hideInLegendAndTooltip: true,
          fill: '#FA7959'
        }
      ];
    }
  }

  private getTotalHours(a: vwTimeSummary) {
    return ((a.hours | 0) * 60 + (a.minutes || 0)) / 60;
  }

  getTimeString(hour: string | number, min: string | number) {
    const timeDisplay = localStorage.getItem('timeformat');
    if (min >= 60) {
      hour = +hour + 1;
      min = +min - 60;
    }

    let isNegative = hour == 0 && +min < 0;

    if (timeDisplay === 'jira') {
      if (isNegative) {
        return '-0h' + ' ' + Math.abs(+min) + 'm';
      } else {
        return hour + 'h' + ' ' + Math.abs(+min) + 'm';
      }
    } else if (timeDisplay === 'standard') {
      if (isNegative) {
        return '-0' + ':' + padNumber(Math.abs(+min));
      } else {
        return hour + ':' + padNumber(Math.abs(+min));
      }
    } else if (timeDisplay === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return (hours + minutes / 60).toFixed(2);
    } else {
      if (isNegative) {
        return '-0h' + ' ' + Math.abs(+min) + 'm';
      } else {
        return hour + 'h' + ' ' + Math.abs(+min) + 'm';
      }
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }
}
