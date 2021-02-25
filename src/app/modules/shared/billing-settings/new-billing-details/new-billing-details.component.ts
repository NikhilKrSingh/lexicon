import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalDismissReasons,
  NgbDropdownConfig,
  NgbModal,
  NgbModalOptions,
  NgbModalRef
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { TimeWriteDownComponent } from 'src/app/modules/billing/pre-bill/view/time/write-down/write-down.component';
import {
  IFixedFreeGetResponse,
  IMatterFixedFeeService,
  IvwFixedFee,
  Page,
  vmWriteOffs,
  vwCheckMatterHasUnBilledItems,
  vwMatterResponse
} from 'src/app/modules/models';
import {
  vwBillNowClientEmailInfo,
  vwBillToClientEmailAndPrintResponse,
  vwDefaultInvoice,
  vwSuccessBillToClient
} from 'src/app/modules/models/bill-to-client.model';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { vwPaymentHierarchy } from 'src/app/modules/models/payment-hierarchy.model';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import { vwPaymentPlanDetails } from 'src/app/modules/models/vm-payment-paln-details.model';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { FixedFeeMatterComponent } from 'src/app/modules/shared/fixed-fee-matter/fixed-fee-matter.component';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import {
  vwAddOnService,
  vwAddressDetails,
  vwBillingSettings,
  vwBillToClientPrintAndEmail,
  vwIdCodeName,
  vwSendInvoice
} from 'src/common/swagger-providers/models';
import {
  BillingService,
  ClientService,
  ClockService,
  FixedFeeServiceService,
  MatterService,
  MiscService,
  PersonService,
  TenantService,
  TrustAccountService
} from 'src/common/swagger-providers/services';
import {
  EditBillIssuanceFrequnecyComponent,
  EditFixedFeeSettingsComponent,

  EditInvoicePreferencesComponent
} from '..';
import * as errors from '../../../shared/error.json';
import { BillingSettingsHelper, IBillGeneratetionPeriod } from '../../billing-settings-helper';
import { CreateNewTimeEntryComponent } from '../../create-new-time-entry/create-new-time-entry.component';
import { DateRangePickerComponent } from '../../date-range-picker/date-range-picker.component';
import { DialogService } from '../../dialog.service';
import { SharedService } from "../../sharedService";
import { UnsavedChangedClientDialogComponent } from "../../unsaved-changed-client-dialog/unsaved-changed-client-dialog.component";
import { padNumber, removeAllBorders, UtilsHelper } from '../../utils.helper';
import { EditInvoicePreferencesAndAddressComponent } from '../edit-invoice-preferences-and-address/edit-invoice-preferences-and-address.component';
import { NewChargesBreakdownComponent } from "../new-charges-breakdown/new-charges-breakdown.component";
import { NewTotalHoursComponent } from "../new-total-hours/new-total-hours.component";


@Component({
  selector: 'app-new-billing-details',
  templateUrl: './new-billing-details.component.html',
  styleUrls: ['./new-billing-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewBillingDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('feesTable1', { static: false }) feesTable: DatatableComponent;
  @ViewChild(DateRangePickerComponent, { static: false }) pickerDirective: DateRangePickerComponent;
  @ViewChild('chargesBreakdownComponent', { static: false }) chargesBreakdownComponent: NewChargesBreakdownComponent
  @ViewChild('totalHoursComponent', { static: false }) totalHoursComponent: NewTotalHoursComponent

  @Input() matterDetails: vwMatterResponse;
  @Input() type: string;
  @Input() balanceDue: number = null;
  @Input() invoiceId: number;
  @Input() clientId: number;
  @Input() prebillId: number;


  @Input() isCustomBillingRate: boolean;
  @Input() isEditRateTable: boolean;
  @Input() rateTables: any = [];
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly refreshMatterDetails: EventEmitter<any> = new EventEmitter<any>();
  @Input() paymentPlanEnabled: boolean


  billingSettings: any;
  officeBillingSettings: vwBillingSettings;
  billFrequencyList: Array<vwIdCodeName>;
  invoiceDeliveryList: Array<vwIdCodeName> = [];
  stateList: Array<vwIdCodeName>;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};
  error_data = (errors as any).default;
  private modalOptions: NgbModalOptions = {
    centered: true,
    backdrop: 'static',
    keyboard: false
  };
  firmDetails: Tenant;
  addressList: Array<vwAddressDetails>;
  billingAddress: vwAddressDetails;
  primaryAddress: vwAddressDetails;
  public fixedFreebillingSettings: vwBillingSettings;
  public fixedFreepaymentPlan: vwPaymentPlanDetails;
  public isBillingAddressSameAsPrimary = false;
  public isAutoPay = false;
  public cardImageIcon = UtilsHelper.cardImageIcon;
  public dispBillNowButton = false;
  public fixedFeeService: IMatterFixedFeeService[];
  public addonServices: Array<vwAddOnService> = [];
  public paymentPlanList: Array<PaymentPlanModel>;
  public currentActive: number;
  public matterUnbilledItems: vwCheckMatterHasUnBilledItems;
  public billFrequencyDurationName = '';
  public effectiveBillFrequencyDurationName = '';
  public billFrequencyDayObj: { value?: number; name?: string };
  public effectiveBillFrequencyDayObj: { value?: number; name?: string };
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  public loading = false;
  public showUpcoming = false;
  public afterLoadstateList = true;
  public afterLoadBilling = true;
  public isBillingOrResponsibleAttorney = false;
  public permissionList$: Observable<fromPermissions.PermissionDataState>;
  public lifeOfMatterFees = true;
  public lifeOfMatterDisbursement = true;
  public fixedFeeLoading = true;
  public addOnLoading = true;
  public closeResult: string;
  public billNowloading = false;
  public updateDisbursMent: Date;
  public page = new Page();
  public ColumnMode = ColumnMode;

  @Output() readonly markAsWorkComplete = new EventEmitter();

  billGenerationPeriod: IBillGeneratetionPeriod;
  billNowMessage = '';
  chargesBillNow = false;
  invoicePrefList: Array<vwIdCodeName>;
  electronicInvoice: vwIdCodeName;
  paperInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;
  sendEmail = true;
  print = true;
  billToClientResponse: vwSuccessBillToClient;
  clientEmailInfo: vwBillNowClientEmailInfo;
  invoiceTemplateDetails: vwDefaultInvoice;
  @Output() readonly goToInvoicesTab = new EventEmitter();
  @Output() readonly goToLedgerHistoryTab = new EventEmitter();
  tenantDetails: any;
  loginUser: any;
  default_logo_url = '';

  showGrid = false;
  disableBillNow = false;
  public isRaOrBa = false;
  public showAddOn = false;
  public addOnList: Array<IvwFixedFee> = [];

  writeOffs: Array<vmWriteOffs>;
  pageSelected: number;
  billingAddressLoading: boolean = true;
  paymentPlanAccordian: boolean;
  writeOffAccordian: boolean;
  unbilledCharges: any;
  unbilledChargesLoading: boolean = true;
  billedBalanceLoading: boolean = true;
  billingSettingsLoading: boolean = true;
  billedBalance: any;
  showInvoiceAddress: boolean;


  feesList: any = [];
  orgFeesList: any = [];
  feesStatusList: any = [];
  selectedFeeStatus: any = 'unbilled_only';
  feesTotal: number = 0;
  public titletype = 'All';
  public titlestatus = 'All';
  public filterName = 'Apply Filter';
  public feeSearchString: string = '';
  writeDownDetailList: any;
  feesLoading: boolean = false;
  feesToggle: boolean = false;
  public pangeSelected: number = 1;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public errorData = (errors as any).default;
  public currentActiveDetls: number;
  private modalRef: NgbModalRef;
  feeDetails: any;
  feeDateRangselected: any;
  selectedDisbursementFilter: number = 3;
  disbursementSectionAccordion = false;
  public autoPayDetails: any = {};
  isAdmin: boolean = false;
  private refreshTimekeepingSub: Subscription;
  paymentMethodAccordian: boolean;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  selectedRow: any;
  constructor(
    private billingService: BillingService,
    private modalService: NgbModal,
    private toastr: ToastDisplay,
    private tenantService: TenantService,
    private fixedFeeServiceService: FixedFeeServiceService,
    private miscService: MiscService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private personService: PersonService,
    private router: Router,
    private matterService: MatterService,
    private billingSettingsHelper: BillingSettingsHelper,
    private trustAccountService: TrustAccountService,
    config: NgbDropdownConfig,
    private clientService: ClientService,
    private invoiceService: InvoiceService,
    private appConfigService: AppConfigService,
    private clockService: ClockService,
    private sharedService: SharedService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.billingSettings = {};
    this.permissionList$ = this.store.select('permissions');
    this.invoiceService.loadImage(this.appConfigService.appConfig.default_logo).subscribe(blob => {
      const a = new FileReader();
      a.onload = (e) => {
        this.default_logo_url = (e.target as any).result;
      };
      a.readAsDataURL(blob);
    });
  }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          this.showAddOn = this.isRaOrBa = this.dispBillNowButton = UtilsHelper.checkPermissionOfRepBingAtn(
            this.matterDetails
          );

          if (this.permissionList.BILLING_MANAGEMENTisAdmin) {
            this.dispBillNowButton = true;
          }
          if (this.permissionList.BILLING_MANAGEMENTisAdmin || this.permissionList.BILLING_MANAGEMENTisEdit) {
            this.showAddOn = true;
          }
          let loginUserAttorny = UtilsHelper.checkPermissionOfRepBingAtn(
            this.matterDetails
          );
          if (loginUserAttorny || this.permissionList.BILLING_MANAGEMENTisEdit || this.permissionList.BILLING_MANAGEMENTisAdmin || this.permissionList.MATTER_MANAGEMENTisAdmin || this.permissionList.TIMEKEEPING_OTHERSisAdmin || this.permissionList.TIMEKEEPING_OTHERSisEdit || this.permissionList.TIMEKEEPING_OTHERSisViewOnly) {
            this.isAdmin = true;
          }
        }
      }
    });
    this.refreshTimekeepingSub = this.sharedService.refreshTimekeeping$.subscribe(
      (matterIds: Array<number>) => {
        matterIds = matterIds || [];

        if (matterIds.some(a => a == this.matterDetails.id)) {
          this.getFeesList();
          this.chargesBreakdownComponent.getChargesBreakdown();
          this.totalHoursComponent.getTotalHours();
        }
      }
    );

    if (this.matterDetails) {
      this.getClientAddress();
      this.getInvoiceAddress();
      this.getBillingSettings(true, true);
      this.getOfficeBillingSettings();
      this.getTenantData();
      this.getPaymentPlanList();
      this.getPaymentMethods();
      this.getUnbilledItems();
      this.getUnbilledCharges();
      this.getBilledBalance();
      this.getBalanceDue();
      this.getInvoicePreferences();
      this.getClientEmailInfo();
      this.getDefaultInvoiceTemplate();
      this.getTenantProfile();
      this.getFeesList();
    }

    this.feesStatusList = [
      {
        id: 'unbilled_only',
        name: 'Unbilled Only',
        checked: false
      },
      {
        id: 'Billed',
        name: 'Billed Only',
        checked: false
      },
      {
        id: 'all_charges',
        name: 'All Charges',
        checked: false
      }
    ]

  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
    if (this.refreshTimekeepingSub) {
      this.refreshTimekeepingSub.unsubscribe();
    }
  }
  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }

  private getUnbilledItems() {
    this.matterService.v1MatterCheckMatterHasUnBilledItemsMatteridGet({
      matterid: this.matterDetails.id
    })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          if (this.matterDetails.isFixedFee) {
            this.getFixedFreeDetails();
          }
        })
      )
      .subscribe(res => {
        this.matterUnbilledItems = res;
      });
  }

  public getUnbilledCharges() {
    this.unbilledChargesLoading = true;
    this.clockService.v1ClockMatterDashboardUnbilledChargesMatterIdGet({ matterId: this.matterDetails.id })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(unbilledCharges => {
        this.unbilledCharges = unbilledCharges[0]
        this.unbilledCharges.total = this.unbilledCharges.timeAmount + this.unbilledCharges.disbursementAmount
        this.unbilledChargesLoading = false;
      }, () => {
        this.unbilledChargesLoading = false;
      })
  }

  public getBilledBalance() {
    this.matterService.v1MatterBilledwidgetMatterIdGet({ matterId: this.matterDetails.id })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((billedBalance) => {
        this.billedBalance = billedBalance[0];
        this.billedBalance.outstandingBalance = this.billedBalance.lastInvoiceAmount - this.billedBalance.latestPayments - this.billedBalance.latestWriteOffs + this.billedBalance.latestRefunds
        this.billedBalanceLoading = false;
      }, () => {
        this.billedBalanceLoading = false;
      })
  }

  public getPaymentPlanList() {
    this.loading = true;

    this.fixedFeeServiceService
      .v1FixedFeeServicePaymentPlanMatteridGet({
        matterid: this.matterDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.paymentPlanList = res;
        }

        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  public getPaymentMethods() {
    this.matterService
      .v1MatterPaymentMethodsbymatterMatterIdGet({
        matterId: this.matterDetails.id
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(res => {
        if (res) {
          this.getAutoPayDetails(res);
        }
      });
  }

  getAutoPayDetails(paymentMethodData) {
    this.autoPayDetails = null;
    paymentMethodData.creditCards.forEach(creditCard => {
      if (creditCard.autoPay) {
        this.autoPayDetails = creditCard;
      }
    })
    paymentMethodData.eChecks.forEach(eCheck => {
      if (eCheck.autoPay) {
        this.autoPayDetails = eCheck;
      }
    })
  }

  private getFixedFreeDetails() {
    this.fixedFeeServiceService.v1FixedFeeServiceAddonserviceMatteridGet({
      matterid: this.matterDetails.id
    })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(addOnServices => {
        this.fixedFeeServiceService
          .v1FixedFeeServiceBillingMatteridGet({
            matterid: this.matterDetails.id
          })
          .pipe(
            map(UtilsHelper.mapData),
            finalize(() => {
              this.fixedFeeLoading = false;
              this.addOnLoading = false;
            })
          )
          .subscribe((res: IFixedFreeGetResponse) => {
            if (res) {
              this.fixedFreebillingSettings = res.billingSettings;
              this.fixedFeeService = res.fixedFeeService;
              this.fixedFreepaymentPlan = res.paymentPlan;
              this.addonServices = addOnServices || [];

              const invoices = res.invoices || [];

              if (this.fixedFreepaymentPlan) {
                this.isAutoPay = this.fixedFreepaymentPlan.isAutoPay;
              }

              if (this.matterDetails.isFixedFee && this.fixedFreebillingSettings.fixedFeeDueDate) {
                this.dispBillNowButton = true;
              }

              let unBilled = 0;
              let billed = 0;

              if (this.matterUnbilledItems && this.matterUnbilledItems.hasUnbilledItems) {
                const unBilledAddOns = this.matterUnbilledItems.unbilledItems.addOnIds;
                const unbilledFixedFee = this.matterUnbilledItems.unbilledItems.fixedFeeMappingIds;

                if (unBilledAddOns && unBilledAddOns.length > 0) {
                  this.addonServices.forEach(addon => {
                    if (unBilledAddOns.includes(addon.id)) {
                      unBilled += addon.serviceAmount;
                    } else {
                      billed += addon.serviceAmount;
                    }
                  });
                } else {
                  this.addonServices.forEach(addon => {
                    billed += addon.serviceAmount;
                  });
                }

                if (unbilledFixedFee && unbilledFixedFee.length > 0 && this.fixedFeeService && this.fixedFeeService.length > 0) {
                  this.fixedFeeService.forEach(ff => {
                    if (unbilledFixedFee.includes(ff.id)) {
                      unBilled += ff.rateAmount;
                    } else {
                      billed += ff.rateAmount;
                    }
                  });
                } else {
                  if (this.fixedFeeService && this.fixedFeeService.length > 0) {
                    this.fixedFeeService.forEach(ff => {
                      billed += ff.rateAmount;
                    });
                  }
                }
              } else {
                this.addonServices.forEach(addon => {
                  billed += addon.serviceAmount;
                });

                if (this.fixedFeeService && this.fixedFeeService.length > 0) {
                  this.fixedFeeService.forEach(ff => {
                    billed += ff.rateAmount;
                  });
                }
              }

              let totalAmount = _.sumBy(
                this.fixedFeeService,
                a => a.rateAmount || 0
              );

              this.addonServices.forEach(addon => {
                totalAmount += addon.serviceAmount;
              });

              const totalPaid = _.sumBy(invoices, i => i.totalPaid);

              this.fixedFreebillingSettings.fixedAmount = totalAmount;

              if (totalPaid > 0) {
                const remainingPaid = billed - totalPaid;
                if (remainingPaid > 0) {
                  this.fixedFreebillingSettings.fixedFeeAmountToPay = totalPaid;
                  this.fixedFreebillingSettings.fixedFeeRemainingAmount =
                    totalAmount - totalPaid;
                } else {
                  this.fixedFreebillingSettings.fixedFeeAmountToPay = billed;
                  this.fixedFreebillingSettings.fixedFeeRemainingAmount =
                    totalAmount - billed;
                }
              } else {
                this.fixedFreebillingSettings.fixedFeeRemainingAmount = totalAmount;
                this.fixedFreebillingSettings.fixedFeeAmountToPay = 0;
              }
              this.addOnLoading = false;
            } else {
              this.addOnLoading = false;
            }
          }, err => {
            this.addOnLoading = false;
          });
      });
  }

  private getBalanceDue() {
    forkJoin([
      this.matterService
        .v1MatterInvoicesMatterIdGet({
          matterId: this.matterDetails.id
        })
        .pipe(map(UtilsHelper.mapData)),
      this.billingService
        .v1BillingPaymentHierachiesMatterIdGet({
          matterId: this.matterDetails.id
        })
        .pipe(map(UtilsHelper.mapData))
    ]).subscribe(res => {
      const invoices = res[0];
      const paymentHierarchies: Array<vwPaymentHierarchy> = res[1] || [];

      const invoicedAmount = _.sumBy(paymentHierarchies, a => a.totalAmount);
      const totalPaid = _.sumBy(paymentHierarchies, a => a.totalPaid);

      this.balanceDue = invoicedAmount - totalPaid;
      if (invoices && invoices.length > 0) {
        const invoiceList: Array<vwInvoice> = invoices;
        const invoiceLst = invoiceList.filter(
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
      }
    });
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
      });
  }

  private getBillingSettings(loadListItems = false, isInit = false) {
    let getObserval;
    if (this.type === 'client') {
      getObserval = this.billingService.v1BillingSettingsPersonPersonIdGet({
        personId: this.matterDetails.clientName.id
      });
    } else {
      getObserval = this.billingService.v1BillingSettingsMatterMatterIdGet({
        matterId: this.matterDetails.id
      });
    }
    this.loading = true;
    this.disableBillNow = true;
    getObserval
      .pipe(
        map(res => {
          return JSON.parse(res as any).results[0] || {};
        }),
        finalize(() => {
          this.disableBillNow = false;
          if (!isInit) {
            this.billingSettingsLoading = false;
          }
        })
      )
      .subscribe(
        res => {
          if (res) {
            res.timeformat = UtilsHelper.ordinal_suffix_of_number(res.billFrequencyRecursOn);
            this.billingSettings = res;
            if (this.matterDetails && !this.matterDetails.isFixedFee) {
              const daysList = UtilsHelper.getDayslistn();
              this.billFrequencyDurationName = (
                this.billingSettings.billFrequencyQuantity == 1 &&
                this.billingSettings.billFrequencyDuration)
                ? this.billingSettings.billFrequencyDuration.name.slice(0, -1)
                : (this.billingSettings.billFrequencyDuration) ?
                  this.billingSettings.billFrequencyDuration.name : '';
              this.billFrequencyDurationName = (this.billFrequencyDurationName) ? this.billFrequencyDurationName.toLocaleLowerCase() : this.billFrequencyDurationName;
              this.billFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.billFrequencyDay);
              if (this.billingSettings.effectiveBillFrequencyQuantity) {
                this.effectiveBillFrequencyDurationName = (
                  this.billingSettings.effectiveBillFrequencyQuantity == 1 &&
                  this.billingSettings.effectiveBillFrequencyDuration
                ) ? this.billingSettings.effectiveBillFrequencyDuration.name.slice(0, -1) : (this.billingSettings.effectiveBillFrequencyDuration) ? this.billingSettings.effectiveBillFrequencyDuration.name : '';
                this.effectiveBillFrequencyDurationName = (this.effectiveBillFrequencyDurationName) ? this.effectiveBillFrequencyDurationName.toLocaleLowerCase() : this.effectiveBillFrequencyDurationName;
                this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.effectiveBillFrequencyDay);
              }
            }
          } else {
            this.billingSettings = {};
          }
          if (loadListItems) {
            this.getListItems();
          }
          this.billingSettingsLoading = false;
        },
        () => {
          this.loading = false;
          this.billingSettingsLoading = false;
        }
      );
  }

  private getOfficeBillingSettings() {
    this.billingService
      .v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.matterDetails.matterPrimaryOffice.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwBillingSettings>;
        })
      )
      .subscribe(res => {
        if (res && res.length > 0) {
          this.officeBillingSettings = res[0];
        } else {
          this.officeBillingSettings = {};
        }

        this.billGenerationPeriod = this.billingSettingsHelper.getBillGenerationPeriod(
          this.officeBillingSettings
        );
      });
  }

  private getInvoiceAddress() {
    if (this.matterDetails.clientName) {
      this.billingAddressLoading = true;
      this.billingService.v1BillingMatterInvoiceaddressMatterIdGet({
        matterId: this.matterDetails.id
      })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          this.showInvoiceAddress = res.invoicePreference !== 'ELECTRONIC';
          this.billingAddress = res;
          this.isBillingAddressSameAsPrimary = res.isSameAsPrimary == 1;
          this.billingAddressLoading = false;
          this.afterLoadBilling = false;
          this.loading = false;

          if (res.invoicePreference == 'ELECTRONIC') {
            this.billingAddress = null;
            this.isBillingAddressSameAsPrimary = false;
          }
        },
          () => {
            this.billingAddressLoading = false;
            this.loading = false;
          });
    } else {
      this.toastr.showError('Error while getting client data');
      this.loading = false;
    }
  }

  private getClientAddress() {
    this.personService
      .v1PersonAddressPersonIdGet({
        personId: this.matterDetails.clientName.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: Array<vwAddressDetails>) => {
        if (res) {
          this.addressList = res;
          if (this.addressList && this.addressList.length > 0) {
            this.primaryAddress = this.addressList.find(
              a => a.addressTypeName && a.addressTypeName.toLowerCase() === 'primary'
            );
          }
        }
      });
  }

  private getListItems() {
    forkJoin([
      this.billingService
        .v1BillingBillfrequencyListGet()
        .pipe(map(UtilsHelper.mapData)),
      this.billingService
        .v1BillingInvoicedeliveryListGet()
        .pipe(map(UtilsHelper.mapData)),
      this.miscService
        .v1MiscStatesGet()
        .pipe(map(UtilsHelper.mapData)),
    ]).subscribe(res => {
      if (res) {
        this.billFrequencyList = res[0];
        this.invoiceDeliveryList = res[1];
        this.stateList = res[2];
        this.afterLoadstateList = false;
        const weeks = this.billFrequencyList.find(a => a.code === 'WEEKS');
        if (!this.billingSettings.id && weeks) {
          this.billingSettings.billFrequencyQuantity = 2;
          this.billingSettings.billFrequencyDuration = weeks;

          this.createBillingSettings();
        }
      }
    });
  }

  private createBillingSettings() {
    const settings = {
      ...this.billingSettings
    };

    settings.matter = {
      id: this.matterDetails.id
    };

    this.billingService
      .v1BillingSettingsPost$Json({
        body: settings
      })
      .subscribe(res => {
      });
  }

  addAddOn() {
    const modelRef = this.modalService.open(FixedFeeMatterComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modelRef.componentInstance.modalType = 'addOn';
    modelRef.componentInstance.isExistingMatter = true;

    modelRef.result.then(res => {
      if (res) {
        this.addOnLoading = true;
        this.addAddOnForExistingMatter(res);
      }
    });
  }

  public addAddOnForExistingMatter(obj) {
    const body = obj.map((v) => {
      const addOnService = {
        fixedFeeAddOnId: v.id ? v.id : null,
        code: v.code,
        serviceAmount: v.amount,
        serviceName: v.description,
        isCustom: v.isCustomAddOn ? true : false,
        matterId: this.matterDetails.id,

      };
      return addOnService;
    });
    this.fixedFeeServiceService.v1FixedFeeServiceAddonserviceBulkPost$Json({
      body
    })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        if (res) {
          this.toastr.showSuccess(this.error_data.add_add_on_service_success);
          this.getFixedFreeDetails();
        } else {
          this.addOnLoading = false;
          this.toastr.showError(this.error_data.create_add_on_service_error);
        }
      },
        () => {
          this.addOnLoading = false;
        });
  }

  editFixedFeeSettings() {
    const modalRef = this.modalService.open(
      EditFixedFeeSettingsComponent,
      this.modalOptions
    );

    modalRef.componentInstance.billingSettings = { ...this.billingSettings };

    modalRef.result.then((res: vwBillingSettings) => {
      if (res) {
        const requestBody = {
          ...res
        };

        if (requestBody.isFixedAmount) {
          requestBody.fixedAmount = +requestBody.fixedAmount;
        }
        this.updateBillingSettings(requestBody);
      }
    });
  }

  editIssuanceFrequency() {
    if (this.isEditRateTable) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static',
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
        this.rateTablesChange.emit(this.rateTables);
      }, () => {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openIssuanceFrequencyModal();
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openIssuanceFrequencyModal();
    }
  }

  openIssuanceFrequencyModal() {
    const modalRef = this.modalService.open(EditBillIssuanceFrequnecyComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.billingSettings = { ...this.billingSettings };
    modalRef.componentInstance.officeId = this.matterDetails.matterPrimaryOffice.id;
    modalRef.result.then((res: vwBillingSettings) => {
      if (res) {
        this.updateBillingSettings(res);
      } else {
        this.getBillingSettings();
      }
    });
  }

  editInvoicePreferences() {
    if (this.isEditRateTable) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static',
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
        this.rateTablesChange.emit(this.rateTables);
      }, () => {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openInvoicePreferenceModal();
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openInvoicePreferenceModal();
    }
  }

  openInvoicePreferenceModal() {
    const modalRef = this.modalService.open(
      EditInvoicePreferencesComponent,
      this.modalOptions
    );

    modalRef.componentInstance.billingSettings = { ...this.billingSettings };
    modalRef.componentInstance.invoiceDeliveryList = this.invoiceDeliveryList;
    modalRef.componentInstance.pageType = 'matter';
    modalRef.componentInstance.clientId = this.clientId;

    modalRef.result.then((res: vwBillingSettings) => {
      if (res) {
        this.updateBillingSettings(res);
      }
    });
  }

  private updateBillingSettings(
    billingSettings: vwBillingSettings,
    displayMsg: boolean = true
  ) {
    this.loading = true;
    this.billingSettingsLoading = true;
    this.billingAddressLoading = true;
    this.billingService
      .v1BillingSettingsPut$Json({
        body: billingSettings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        response => {
          if (response) {
            this.billingSettings = billingSettings;
            this.getBillingSettings();
            this.getInvoiceAddress();
            this.toastr.showSuccess(
              this.error_data.preferences_updated
            );
          }
        },
        () => {
          this.loading = false;
          this.billingSettingsLoading = false;
        }
      );
  }

  private showError() {
    this.toastr.showError(this.error_data.error_occured);
  }

  editInvoiceAddress() {
    if (this.isEditRateTable) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: true
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
        this.rateTablesChange.emit(this.rateTables);
      }, () => {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openInvoiceAddressModal();
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openInvoiceAddressModal();
    }
  }

  openInvoiceAddressModal() {
    const modalRef = this.modalService.open(
      EditInvoicePreferencesAndAddressComponent,
      this.modalOptions
    );
    modalRef.componentInstance.billingSettings = { ...this.billingSettings };
    modalRef.componentInstance.invoiceDeliveryList = this.invoiceDeliveryList;
    modalRef.componentInstance.address = { ...this.billingAddress };
    modalRef.componentInstance.primaryAddress = { ...this.primaryAddress };
    // modalRef.componentInstance.stateList = this.stateList;
    modalRef.componentInstance.isSameAsPrimaryAddress = this.isBillingAddressSameAsPrimary;
    modalRef.componentInstance.pageType = 'matter';
    modalRef.componentInstance.clientId = this.clientId;

    modalRef.result.then(res => {
      if (res) {
        this.afterLoadBilling = true;
        if (res.billing) {
          this.billingSettings = res.billing;
        }

        if (this.billingSettings && this.electronicInvoice && this.billingSettings.invoiceDelivery && this.billingSettings.invoiceDelivery.id == this.electronicInvoice.id) {
          this.showInvoiceAddress = false;
        }

        if (res.address) {
          if (res.address.id) {
            if (res.address.isSameAsPrimaryAddress && this.primaryAddress) {
              this.billingSettings.invoiceAddressId = this.primaryAddress.id;
              this.updateBillingSettings(this.billingSettings, false);
            } else {
              this.updateAddress(res.address, 4, 'invoice', res.address.isSameAsPrimaryAddress);
            }
          } else {
            if (res.address.isSameAsPrimaryAddress && this.primaryAddress) {
              this.billingSettings.invoiceAddressId = this.primaryAddress.id;
              this.updateBillingSettings(this.billingSettings, false);
            } else {
              this.createAddress(res.address, res.address.isSameAsPrimaryAddress);
            }
          }
        }
      }
    });
  }

  private updateAddress(
    res: any,
    addressTypeId: number,
    addressTypeName: string,
    isSameAsPrimaryAddress: boolean
  ) {
    const address = {
      id: res.id,
      address1: res.address1,
      address2: res.address2,
      addressTypeId,
      addressTypeName,
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.matterDetails.clientName.id
    } as vwAddressDetails;

    this.personService
      .v1PersonAddressPut$Json({
        body: address
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.billingSettings.invoiceAddressId = res.isSameAsPrimaryAddress
              ? this.primaryAddress ? this.primaryAddress.id : response
              : response;
            this.updateBillingSettings(this.billingSettings, false);
            this.billingAddress = res;
          } else {
            this.toastr.showError(this.error_data.preferences_update_error);
          }
        },
        () => {
        }
      );
  }

  private createAddress(
    res: any,
    isSameAsPrimaryAddress: boolean
  ) {
    const address = {
      address1: res.address1,
      address2: res.address2,
      addressTypeId: 4,
      addressTypeName: 'invoice',
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.matterDetails.clientName.id
    } as vwAddressDetails;

    this.personService
      .v1PersonAddressPost$Json({
        body: address
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.billingSettings.invoiceAddressId = res.isSameAsPrimaryAddress
              ? this.primaryAddress ? this.primaryAddress.id : response
              : response;
            this.updateBillingSettings(this.billingSettings, false);
            this.billingAddress = res;
            this.billingAddress.id = response;
          } else {
            this.toastr.showError(this.error_data.address_update_error);
          }
        },
        () => {
        }
      );
  }

  workComplete() {
    this.markAsWorkComplete.emit();
  }

  public billNow(billNowPopup, isWorkComplete?) {
    if (this.isEditRateTable) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static',
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
        this.rateTablesChange.emit(this.rateTables);
      }, () => {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openBillNowPopup(billNowPopup, isWorkComplete);
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openBillNowPopup(billNowPopup, isWorkComplete);
    }
  }

  openBillNowPopup(billNowPopup, isWorkComplete?) {
    this.disableBillNow = true;
    this.billNowMessage = '';
    this.chargesBillNow = false;
    let dateDisplay = moment(new Date()).format('MM/DD/YY');
    if (!isWorkComplete) {
      this.billNowMessage = `There are currently no pending or deferred ${this.matterDetails && this.matterDetails.isFixedFee ? 'fixed fee, add-ons,' : 'time entries,'} disbursements, or write-offs on this matter to send to pre-bill. Do you want to generate an invoice for this matter based on its current balance?`;
    } else {
      this.billNowMessage = "There are currently no pending or deferred "
      this.billNowMessage += this.matterDetails && this.matterDetails.isFixedFee ? 'fixed fee, add-ons,' : 'time entries, '
      this.billNowMessage +=  "disbursements, or write-offs on this matter to send to pre-bill. Do you want to generate an invoice for this matter based on its current balance and mark it as work complete? <br><br>  This action <strong>cannot be reversed</strong>."
    }

    this.billNowloading = true;
    this.matterService
      .v1MatterUnbilleditemsMatteridGet({ matterid: this.matterDetails.id, isWorkComplete })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.billNowloading = false;
          if (res) {
            if (this.matterDetails && !this.matterDetails.isFixedFee) {
              if (
                res.timeEntries.length > 0 ||
                res.disbursements.length > 0 ||
                res.matterWriteOffs.length > 0
              ) {
                this.chargesBillNow = true;
                if (res.nextPrebillDate) {
                  dateDisplay = moment(res.nextPrebillDate).format('MM/DD/YY');
                }
                this.billNowMessage = 'This will begin the pre-bill review for any pending charges on this matter. These charges are currently scheduled for pre-bill on ' + dateDisplay + '. Are you sure you want to continue?';
              }
            } else {
              if (
                res.addOns.length > 0 ||
                res.fixedFeeServices.length > 0 ||
                res.disbursements.length > 0 ||
                res.matterWriteOffs.length > 0
              ) {
                this.chargesBillNow = true;
                if (
                  this.fixedFreebillingSettings &&
                  this.fixedFreebillingSettings.fixedFeeDueDate
                ) {
                  dateDisplay = moment(
                    this.fixedFreebillingSettings.fixedFeeDueDate
                  ).format('MM/DD/YY');
                  this.billNowMessage = 'This will begin the pre-bill review for any pending charges on this matter. These charges are currently scheduled for pre-bill on ' + dateDisplay + '. Are you sure you want to continue?';
                }

                if (
                  this.fixedFreebillingSettings &&
                  this.fixedFreebillingSettings.fixedFeeIsFullAmount
                ) {
                  this.billNowMessage = 'This will begin the pre-bill review for any pending charges on this matter. Are you sure you want to continue?';
                }

                if (
                  this.fixedFreebillingSettings &&
                  this.fixedFreebillingSettings.fixedFeeBillOnWorkComplete
                ) {
                  this.billNowMessage = 'This will begin the pre-bill review for any pending charges on this matter. Are you sure you want to continue?';
                }
              }
            }
          }

          this.modalService.open(billNowPopup, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
          }).result.then(resp => {
            this.loading = false;
            this.disableBillNow = false;
            if (resp) {
              switch (resp) {
                case true:
                  this.router.navigate(['/matter/bill-now'], {
                    queryParams: { matterId: this.matterDetails.id, isWorkCompleteFlow: isWorkComplete }
                  });
                  break;

                case 'zeroInvoice':
                  this.submitBillNow(isWorkComplete);
                  break;
              }
            }
          });
        },
        err => {
          this.loading = false;
          this.disableBillNow = false;
          this.billNowloading = false;
        }
      );
  }


  onClickedOutside() {
    this.currentActive = null;
  }

  private getInvoicePreferences() {
    this.billingService.v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.invoicePrefList = res;
          this.paperInvoice = this.invoicePrefList.find(
            a => a.code === 'PAPER'
          );
          this.electronicInvoice = this.invoicePrefList.find(
            a => a.code === 'ELECTRONIC'
          );
          this.paperAndElectronicInvoice = this.invoicePrefList.find(
            a => a.code === 'PAPER_AND_ELECTRONIC'
          );
        } else {
          this.invoicePrefList = [];
        }
      });
  }

  private getDefaultInvoiceTemplate() {
    this.billingService.v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.tenantDetails = res;
        },
        () => {
        }
      );
  }

  public submitBillNow(isWorkComplete) {
    const body: any = {
      matterId: +this.matterDetails.id,
      totalBillAmount: 0,
      isWorkComplete: isWorkComplete
    };
    this.loading = true;
    this.matterService.v1MatterUnbilleditemsBillToClientPost$Json({
      body
    })
      .pipe(
        map(UtilsHelper.mapData)
      )
      .subscribe(res => {
        if (res) {
          this.loading = true;
          this.billToClientResponse = res;
        } else {
          this.loading = false;
          this.toastr.showError(this.error_data.server_error);
        }
        if (isWorkComplete) {
          this.refreshMatterDetails.emit()
        }
      }, () => {
        this.loading = false;
      });
  }

  private getClientEmailInfo() {
    this.clientService.v1ClientClientEmailInfoClientIdGet({
      clientId: this.matterDetails.clientName.id
    }).pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.clientEmailInfo = res;
      });
  }

  sendEmailAndPrint(invoiceHTML: vwSendInvoice) {
    const body: vwBillToClientPrintAndEmail = {
      invoices: [
        {
          invoiceInfo: invoiceHTML,
          emailInfo: {
            billingContact: this.clientEmailInfo.billingContact,
            primaryContact: this.clientEmailInfo.primaryContact,
            updatePrimaryContactEmail: false,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            email: this.clientEmailInfo.email
          },
          print: this.print,
          sendEmail: this.sendEmail
        }
      ],
      print: this.print,
      sendEmail: this.sendEmail
    };

    this._sendEmailAndPrint(body);
    this.goToInvoicesTab.emit();
  }

  private _sendEmailAndPrint(body) {
    this.loading = true;
    this.billingService.v1BillingBillToClientEmailAndPrintPost$Json({
      body
    }).pipe(map(UtilsHelper.mapData))
      .subscribe((res: vwBillToClientEmailAndPrintResponse) => {
        if (res) {
          if (this.print && this.billingSettings.invoiceDelivery.id != this.electronicInvoice.id) {
            const file = UtilsHelper.base64toFile(
              res.invoicesToPrint[0].bytes,
              `invoice_${this.billToClientResponse.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);

            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
          }
        }
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  public getDisburs(data) {
    this.updateDisbursMent = new Date();
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }


  get isPaymentPlanEnabled() {
    return this.type == 'matter'
      && this.matterDetails.matterStatus && this.matterDetails.matterStatus.name
      && (this.paymentPlanEnabled && this.matterDetails
        && (this.matterDetails.matterStatus.name.toLowerCase() == 'closed' || (this.matterDetails.matterStatus.name.toLowerCase() == 'open' && this.paymentPlanList && this.paymentPlanList.length))
        || (!this.paymentPlanEnabled && this.matterDetails
          && (this.matterDetails.matterStatus.name.toLowerCase() == 'open'
            || this.matterDetails.matterStatus.name.toLowerCase() == 'closed')));
  }

  getFeesList() {
    this.feesLoading = true;
    this.clockService.v1ClockMatterDashboardFeeListMatterIdGet$Response({ matterId: this.matterDetails.id, isAdmin: this.isAdmin }).subscribe(res => {
      let list = JSON.parse(res.body as any).results;
      list.forEach((obj: any) => {
        let timeEntered = obj.feeDetail.timeEntered;
        obj.feeDetail.timeEntered = moment.utc(timeEntered).local().format('YYYY-MM-DD[T]HH:mm:ss');
      });
      this.feesList = list;
      this.orgFeesList = list;
      this.feesTotal = 0;
      this.feesLoading = false;
      this.updateDatatableFooterPage();
      this.applyFilterForList();
    })
  }


  public applyFilterForList() {
    var temp = [...this.orgFeesList];
    if (this.selectedFeeStatus) {
      if (this.selectedFeeStatus == 'unbilled_only') {
        temp = temp.filter(item => {
          if (
            item.feeDetail.status &&
            item.feeDetail.status != 'Billed') {
            return item;
          }
        });
      } else if (this.selectedFeeStatus == 'Billed') {
        temp = temp.filter(item => {
          if (
            item.feeDetail.status &&
            item.feeDetail.status == 'Billed') {
            return item;
          }
        });
      } else {
        temp = this.orgFeesList;
      }
    }

    if (this.feeDateRangselected && !this.lifeOfMatterFees) {
      temp = temp.filter((a) => moment(this.formatDate(a.feeDetail.dateOfService)).isBetween(this.feeDateRangselected.startDate, this.feeDateRangselected.endDate) ||
        moment(this.formatDate(a.feeDetail.dateOfService)).isSame(this.feeDateRangselected.startDate) ||
        moment(this.formatDate(a.feeDetail.dateOfService)).isSame(this.feeDateRangselected.endDate));
    }
    if (this.feeSearchString !== '') {
      temp = temp.filter(
        item =>
          this.matchClientSearch(item, this.feeSearchString, 'code') ||
          this.matchClientSearch(item, this.feeSearchString, 'name') ||
          this.matchClientSearch(item, this.feeSearchString, 'chargeType') ||
          this.matchClientSearch(item, this.feeSearchString, 'timeKeeper') ||
          this.matchClientSearch(item, this.feeSearchString, 'enterBy') ||
          this.matchClientSearch(item, this.feeSearchString, 'description')
      );
    }
    // update the rows
    this.feesList = [...temp];
    this.feesTotal = 0;
    this.feesList.filter(item => {
      this.feesTotal = this.feesTotal + item.feeDetail.displayAmount
    });
    this.updateDatatableFooterPage();
  }

  formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
  }

  /** update table footer page count */
  public updateDatatableFooterPage() {
    this.page.totalElements = this.feesList.length;
    this.page.totalPages = Math.ceil(this.feesList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    if (this.feesTable) {
      this.feesTable.offset = 0;
    }
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  private matchClientSearch(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName = item['feeDetail'][fieldName]
      ? item['feeDetail'][fieldName].toString().toLowerCase()
      : '';
    return searchName.search(searchValue.toString().trim().toLowerCase()) > -1;
  }


  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.feeDetail.id != row.feeDetail.id){
      this.feesTable.rowDetail.collapseAllRows();
      removeAllBorders('app-new-billing-details');
    }
    this.feesTable.rowDetail.toggleExpandRow(row);
    row['isExpended'] = !row['isExpended'];
    this.writeDownDetailList = false;
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpended) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  onDetailToggle(event) {
     this.selectedRow = event.value;
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  public selecttype(event) {
    this.titletype = '';
    if (event.length > 0) {
      this.titletype = event.length;
    } else {
      this.titletype = 'All';
    }
  }


  public timeWriteDown(row, action, detsils) {
    let originalAmount = row.feeDetail.originalAmount;
    row = {
      id: row.feeDetail.id,
      amount: row.feeDetail.displayAmount,
      oriAmount: row.feeDetail.displayAmount,
      date: (action == 'add') ? row.feeDetail.dateOfService : row.writeDownDetailList.length > 0 ? row.writeDownDetailList[0].writeDownDateTime : null,
      person: { name: row.feeDetail.timeKeeper },
      disbursementType: {
        code: row.feeDetail.code,
        description: row.feeDetail.description,
        isBillable: null,
        billableTo: { name: row.feeDetail.billableTo }
      },
      hours: { value: { hours: row.feeDetail.totalHours, minutes: row.feeDetail.totalMins } },
      writeDown: row.writeDownDetailList.length > 0 ? [{
        writeDownAmount: row.writeDownDetailList[0].writeDownAmount,
        writeDownCode: { code: row.writeDownDetailList[0].code, name: row.writeDownDetailList[0].name }
      }] : null
    }
    detsils = {
      id: detsils ? detsils.id : null,
      writeDownAmount: detsils ? detsils.writeDownAmount : null,
      writeDownCode: detsils ? {
        code: detsils.code,
        name: detsils.name,
        id: detsils.writeDownCodeId,
        WriteDownCodeId: detsils.writeDownCodeId
      } : null,
      writeDownNarrative: detsils && detsils.writeDownNarrative ? detsils.writeDownNarrative : null
    }
    let modalRef = this.modalService.open(TimeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });
    this.onClickedOutside();
    modalRef.componentInstance.rowDetails = { ...row };
    modalRef.componentInstance.writeDownDetails = { ...detsils };

    modalRef.componentInstance.type = 'timeentry';

    if (action == 'add') {
      modalRef.componentInstance.billedAmount = Math.round(row.amount).toString();
    }

    if (action === 'edit') {
      modalRef.componentInstance.isEdit = true;
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.title = "Edit Time Write-Down";
      modalRef.componentInstance.rowDetails.amount += detsils.writeDownAmount || 0;
    }

    if (action === 'view') {
      modalRef.componentInstance.rowDetails.oriAmount = originalAmount;
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = "View Time Write-Down";
      modalRef.componentInstance.writeDownDetails = detsils;
    }

    modalRef.result.then((res) => {
      if (res && res.action) {
        this.getFeesList();
        this.chargesBreakdownComponent.getChargesBreakdown();
        this.getUnbilledCharges();
        this.totalHoursComponent.getTotalHours();
      }
    });
  }

  async removeWriteDown(row) {
    const resp: any = await this.dialogService.confirm(
      this.errorData.time_write_down_delete_warning_message,
      'Yes, delete',
      'Cancel',
      'Delete Write-Down',
      true,
      ''
    );
    if (resp) {
      try {
        await this.billingService.v1BillingWriteDownIdDelete({ id: row.id }).toPromise();
        this.toastr.showSuccess('Time entry write-down deleted');
        this.getFeesList();
        this.getUnbilledCharges();
      } catch (err) {
      }
    }
  }

  openMenudetls(index: number, event): void {
    setTimeout(() => {
      if (this.currentActiveDetls !== index) {
        this.currentActiveDetls = index;
      } else {
        this.currentActiveDetls = null;
      }
    }, 50);
  }

  onClickedOutsidedetls(event: any, index: number) {
    if (index === this.currentActiveDetls) {
      this.currentActiveDetls = null;
    }
  }

  public ViewTime(content, data) {
    this.clockService.v1ClockMatterDashboardFeeDetailIdGet$Response({ id: data.feeDetail.id })
      .subscribe(res => {
        res = JSON.parse(res.body as any).results;
        let details: any;
        details = res;

        let timeDisplay = localStorage.getItem('timeformat');
        let min = details.totalmins;
        let hour = details.totalHours;
        if (min >= 60) {
          hour = +hour + 1;
          min = +min - 60;
        }

        let isNegative = hour == 0 && +min < 0;

        if (timeDisplay === 'jira') {
          if (isNegative) {
            details.timeWorked = '-0h' + ' ' + Math.abs(+min) + 'm';
          } else {
            details.timeWorked = hour + 'h' + ' ' + Math.abs(+min) + 'm';
          }
        } else if (timeDisplay === 'standard') {
          if (isNegative) {
            details.timeWorked = '-0' + ':' + padNumber(Math.abs(+min));
          } else {
            details.timeWorked = hour + ':' + padNumber(Math.abs(+min));
          }
        } else if (timeDisplay === 'decimal') {
          const hoursMinutes = (hour + ':' + min).split(/[.:]/);
          const hours = parseInt(hoursMinutes[0], 10);
          const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
          details.timeWorked = (hours + minutes / 60).toFixed(2);
        } else {
          if (isNegative) {
            details.timeWorked = '-0h' + ' ' + Math.abs(+min) + 'm';
          } else {
            details.timeWorked = hour + 'h' + ' ' + Math.abs(+min) + 'm';
          }
        }

        this.feeDetails = details;
      })
    this.onClickedOutside();
    this.openPersonalinfo(content, '', 'modal-xlg');
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      windowClass: winClass,
      backdrop: 'static'
    });
    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openMenu(index, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }


  scrollToPaymentPlan($element) {
    $element.scrollIntoView({ behavior: "smooth", block: "center" });
    this.paymentPlanAccordian = true;
  }

  scrollToPaymentMethod($element) {
    $element.scrollIntoView({ behavior: "smooth", block: "center" });
    this.paymentMethodAccordian = true;
  }


  addTimeEntry(action, row, size?) {
    this.clockService.v1ClockMatterDashboardFeeDetailIdGet$Response({ id: row.feeDetail.id })
      .subscribe(res => {
        this.onClickedOutside();
        let responce = JSON.parse(res.body as any).results;
        row = {
          id: row.feeDetail.id,
          date: row.feeDetail.dateOfService,
          hours: { value: { hours: row.feeDetail.totalHours, minutes: row.feeDetail.totalMins } },
          description: responce.billingNarrative,
          disbursementType: { id: responce.disbursementTypeId, rate: responce.rate },
          note: { content: responce.note, isVisibleToClient: null },
          rate: responce.rate,
          timeKeeper: responce.timeKeeper
        }

        let modalRef = this.modalService.open(CreateNewTimeEntryComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          size,
          windowClass: 'modal-xlg'
        });
        let component = modalRef.componentInstance;
        if (this.matterDetails.clientName.isCompany) {
          component.searchclient = this.matterDetails.clientName.company;
        } else {
          component.searchclient = this.matterDetails.clientName.lastName + ', ' +
            this.matterDetails.clientName.firstName
        }
        component.searchMatter = this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
        component.clientDetail = this.matterDetails.clientName;
        component.matterDetail = this.matterDetails;
        if (action === 'edit') {
          component.isEdit = true;
        }
        component.timeEntryDetails = row;
        modalRef.result.then((res) => {
          if (res) {
            this.chargesBreakdownComponent.getChargesBreakdown();
            this.totalHoursComponent.getTotalHours();
            this.getFeesList();
            this.getUnbilledCharges();
          }
        });

      })
  }

  public async deleteTime(row) {
    this.onClickedOutside();
    const resp: any = await this.dialogService.confirm(
      this.errorData.time_entry_delete_confirm,
      'Delete',
      'Cancel',
      'Delete Time Entry',
    );
    if (resp) {
      this.loading = true;
      const item = { id: row.feeDetail.id, description: row.feeDetail.description };
      this.clockService.v1ClockDelete$Json({ body: item }).subscribe(
        suc => {
          this.toastr.showSuccess(
            this.errorData.time_entry_deleted_successfully
          );

          this.getFeesList();
          this.getUnbilledCharges();
          this.chargesBreakdownComponent.getChargesBreakdown();
          this.totalHoursComponent.getTotalHours();
        },
        err => {
          this.loading = false;
          console.log(err);
        }
      );
    }
  }

  choosedDate(event) {
    this.feeDateRangselected = event;
    let check = moment(this.feeDateRangselected.startDate).isSame(this.feeDateRangselected.endDate);
    if (!check) {
      this.onClickedOutsideDatePicker();
    }
    if (this.orgFeesList && this.orgFeesList.length > 0) {
      this.applyFilterForList();
    }
  }

  lifeOfMatterChange(event: boolean) {
    if (event) {
      this.onClickedOutsideDatePicker();
      if (this.orgFeesList && this.orgFeesList.length > 0) {
        this.applyFilterForList();
      }
    }
  }

  onClickedOutsideDatePicker() {
    setTimeout(() => {
      this.pickerDirective.closeDateRange();
    }, 200);
  }
  toggleFees() {
    this.feesToggle = !this.feesToggle;
    if (this.feesToggle) {
      window.onresize = () => {
        this.initScrollDetector([this.feesTable]);
        window.onresize = () => {
          UtilsHelper.checkDataTableScroller(this.tables);
        };
      };
    }
  }

  scrollToFees($element) {
    setTimeout(() => {
      const heightDiv = +document.getElementById('timeSection').offsetTop + 220;
      document.querySelector('html, body').scrollTo({ top: heightDiv, behavior: 'smooth' });
    });
    // $element.scrollIntoView({ behavior: "smooth", block: "center" });
    this.lifeOfMatterFees = true;
    this.selectedFeeStatus = 'unbilled_only';
    this.feesToggle = true;
    this.applyFilterForList();
  }

  scrollToDisbursement($element) {
    setTimeout(() => {
      const heightDiv = +document.getElementById('disbursementSection').offsetTop + 220;
      document.querySelector('html, body').scrollTo({ top: heightDiv, behavior: 'smooth' });
    });
    // $element.scrollIntoView({ behavior: "smooth", block: "center" });
    this.lifeOfMatterDisbursement = true;
    this.selectedDisbursementFilter = 3;
    this.disbursementSectionAccordion = true;
  }

  scrollToWriteOff($element) {
    setTimeout(() => {
      // $element.scrollIntoView({ block: 'start', behavior: 'smooth', inline: 'start' });
      const heightDiv = +document.getElementById('writeOffSection').offsetTop + 220;
      document.querySelector('html, body').scrollTo({ top: heightDiv, behavior: 'smooth' });
    });
    this.writeOffAccordian = true;
  }

  get BillIssueFrequencyMessage() {
    let mess = '';
    if (this.billingSettings && this.billingSettings.isWorkComplete) {
      mess = 'Work Complete';
    } else {
      if (this.billingSettings && this.billingSettings.billFrequencyQuantity && this.billFrequencyDurationName) {
        mess += `Every ${this.billingSettings.billFrequencyQuantity} ${this.billFrequencyDurationName}, `;
      }
      if (this.billingSettings && this.billingSettings.billFrequencyDuration && this.billingSettings.billFrequencyDuration.code) {
        switch (this.billingSettings.billFrequencyDuration.code) {
          case 'MONTHS':
            if (this.billingSettings && this.billingSettings.repeatType === 2) {
              mess += `repeats on the ${this.billingSettings.timeformat}`;
            } else {
              mess += `repeats on the ${this.recurringName[this.billingSettings.billFrequencyRecursOn - 1]} ${this.billFrequencyDayObj.name} of the month`;
            }
            break;
          case 'WEEKS':
            if (this.billFrequencyDayObj) {
              mess += `repeats on ${this.billFrequencyDayObj.name}`;
            } else {
              mess += ''
            }
            break;
        }
      }

    }
    return mess;
  }
}

