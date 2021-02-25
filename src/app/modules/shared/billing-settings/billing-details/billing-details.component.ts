import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgbDropdownConfig, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IAddOnAndFixedFeeResponse, IFixedFreeGetResponse, IMatterFixedFeeService, IvwFixedFee, vwCheckMatterHasUnBilledItems, vwMatterResponse } from 'src/app/modules/models';
import { vwBillNowClientEmailInfo, vwBillToClientEmailAndPrintResponse, vwDefaultInvoice, vwSuccessBillToClient } from 'src/app/modules/models/bill-to-client.model';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { vwPaymentHierarchy } from 'src/app/modules/models/payment-hierarchy.model';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import { vwPaymentPlanDetails } from 'src/app/modules/models/vm-payment-paln-details.model';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { FixedFeeMatterComponent } from 'src/app/modules/shared/fixed-fee-matter/fixed-fee-matter.component';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddOnService, vwAddressDetails, vwBillingSettings, vwBillToClientPrintAndEmail, vwIdCodeName, vwPaymentPlan, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, FixedFeeServiceService, MatterService, MiscService, PersonService, TenantService, TrustAccountService } from 'src/common/swagger-providers/services';
import { EditBillIssuanceFrequnecyComponent, EditFixedFeeSettingsComponent, EditInvoiceAddressComponent, EditInvoicePreferencesComponent } from '..';
import * as errors from '../../../shared/error.json';
import { BillingSettingsHelper, IBillGeneratetionPeriod } from '../../billing-settings-helper';
import { DialogService } from '../../dialog.service';
import { UnsavedChangedClientDialogComponent } from "../../unsaved-changed-client-dialog/unsaved-changed-client-dialog.component";
import { UtilsHelper } from '../../utils.helper';
import { PaymentPlanComponent } from '../billing-info/payment-plan/payment-plan.component';

@Component({
  selector: 'app-billing-details',
  templateUrl: './billing-details.component.html',
  styleUrls: ['./billing-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingDetailComponent implements OnInit, OnDestroy {
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
  @Input() paymentPlanEnabled: boolean

  billingSettings: vwBillingSettings;
  officeBillingSettings: vwBillingSettings;
  billFrequencyList: Array<vwIdCodeName>;
  invoiceDeliveryList: Array<vwIdCodeName>;
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
  public isBillingOrResponsibleAttorneyFlag = false;
  public permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionFlag = false;
  public fixedFeeLoading = true;
  public addOnLoading = true;
  closeResult: string;
  public billNowloading = false;
  public updateDisbursMent: Date;

  showPaymentMenu = false;
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
  tenantDetails: any;
  loginUser: any;
  default_logo_url = '';

  public repeatsOn: Array<{ name: string; selected: boolean }> = [
    { name: 'Sunday', selected: false },
    { name: 'Monday', selected: false },
    { name: 'Tuesday', selected: false },
    { name: 'Wednesday', selected: false },
    { name: 'Thursday', selected: false },
    { name: 'Friday', selected: false },
    { name: 'Saturday', selected: false }
  ];

  public recursOnList: Array<{ id?: number; name?: string }> = [];
  public selectedDuration: vwIdCodeName = { code: '', name: '' };
  public selectedRecursDay: { id?: number; name?: string };
  public selectedDay = '';

  showGrid = false;
  disableBillNow = false;
  public isRaOrBa = false;
  public showAddOn = false;
  public addOnList: Array<IvwFixedFee> = [];

  //#endregion [Payment Plan]

  paymentPlanLoader = false;

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
    private appConfigService: AppConfigService
  ) {
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
        }
      }
    });

    if (this.matterDetails) {
      if (this.matterDetails.isFixedFee) {
        this.getFixedFreeDetails();
      } else {
        this.getUnbilledItems();
        this.getPaymentPlanList();
      }
      this.getBillingSettings(true);
      this.getOfficeBillingSettings();
      this.getTenantData();
      this.getBalanceDue();
      this.getInvoicePreferences();
      this.getClientEmailInfo();
      this.getDefaultInvoiceTemplate();
      this.getTenantProfile();
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getUnbilledItems() {
    this.matterService.v1MatterCheckMatterHasUnBilledItemsMatteridGet({
      matterid: this.matterDetails.id
    })
    .pipe(
      map(UtilsHelper.mapData)
    )
    .subscribe(res => {
      this.matterUnbilledItems = res;
    });
  }

  private getFixedFreeDetails() {
    forkJoin([
      this.matterService.v1MatterCheckMatterHasUnBilledItemsMatteridGet({
        matterid: this.matterDetails.id
      }).pipe(map(UtilsHelper.mapData)),
      this.fixedFeeServiceService.v1FixedFeeServiceAddonserviceMatteridGet({
        matterid: this.matterDetails.id
      }).pipe(map(UtilsHelper.mapData)),
      this.fixedFeeServiceService.v1FixedFeeServiceBillingMatteridGet({
        matterid: this.matterDetails.id
      }).pipe(map(UtilsHelper.mapData))
    ])
    .pipe(
      map(res => {
        return {
          matterUnbilledItems: res[0],
          raddOnServices: res[1],
          fixedFeeRes: res[2]
        }
      }),
      finalize(() => {
        this.fixedFeeLoading = false;
        this.addOnLoading = false;
      })
    ).subscribe((response: IAddOnAndFixedFeeResponse) => {
      if (response) {
        this.matterUnbilledItems = response.matterUnbilledItems;
        let res = response.fixedFeeRes;

        this.fixedFreebillingSettings = res.billingSettings;
        this.fixedFeeService = res.fixedFeeService;
        this.fixedFreepaymentPlan = res.paymentPlan;
        if (this.fixedFreepaymentPlan) {
          this.paymentPlanList = [res.paymentPlan];
        } else {
          this.paymentPlanList = [];
        }
        this.addonServices = response.raddOnServices || [];

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

  private getBillingSettings(loadListItems = false) {
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
        })
      )
      .subscribe(
        res => {
          if (res) {
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
          this.getInvoiceAddress();
        },
        () => {
          this.loading = false;
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
      this.personService
        .v1PersonAddressPersonIdGet({
          personId: this.matterDetails.clientName.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((res: Array<vwAddressDetails>) => {
          if (res) {
            this.addressList = res;
            this.assignBillingAddress();
          } else {
            this.loading = false;
          }
        });
    } else {
      this.toastr.showError('Error while getting client data');
      this.loading = false;
    }
  }

  private assignBillingAddress() {
    if (this.addressList && this.addressList.length > 0) {
      this.billingAddress = this.addressList.find(
        obj =>
          obj.addressTypeName &&
          obj.addressTypeName.toLowerCase() === 'invoice' &&
          obj.id === this.billingSettings.invoiceAddressId
      );

      this.primaryAddress = this.addressList.find(
        a => a.addressTypeName && a.addressTypeName.toLowerCase() === 'primary'
      );
      if (
        this.type === 'matter' &&
        this.billingSettings &&
        this.primaryAddress &&
        this.primaryAddress.id === this.billingSettings.invoiceAddressId
      ) {
        this.billingAddress = this.addressList.find(
          obj => obj.id === this.billingSettings.invoiceAddressId
        );
        this.isBillingAddressSameAsPrimary = true;
      } else if (!this.billingAddress && this.primaryAddress) {
        this.billingAddress = this.primaryAddress;
        this.isBillingAddressSameAsPrimary = true;
      } else if (!this.billingAddress && !this.primaryAddress) {
        this.isBillingAddressSameAsPrimary = false;
        this.billingAddress = {};
      } else {
        this.isBillingAddressSameAsPrimary = false;
      }
      this.afterLoadBilling = false;
    }
    this.loading = false;
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

  private setPaymentPlanDetails() {
    if (this.paymentPlanList && this.paymentPlanList.length > 0) {
      const paymentPlan = this.paymentPlanList[0];
      const index = paymentPlan.billFrequencyDay;
      this.repeatsOn.map(item => (item.selected = false));
      this.repeatsOn[index].selected = true;
      this.selectedDay = this.repeatsOn[index].name;
      this.recursOnList = [];

      this.recurringName.map((item, index1) => {
        this.recursOnList.push({
          id: index1 + 1,
          name: item + ' ' + this.repeatsOn[index].name + ' of the month'
        });
      });

      this.selectedRecursDay = this.recursOnList.find(
        a => a.id == paymentPlan.billFrequencyRecursOn
      );
    }
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
      .subscribe(res => { });
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
            if (displayMsg) {
              this.toastr.showSuccess(
                this.error_data.billing_settings_updated_success
              );
            }
          }
        },
        () => {
          this.loading = false;
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
      EditInvoiceAddressComponent,
      this.modalOptions
    );

    modalRef.componentInstance.address = { ...this.billingAddress };
    modalRef.componentInstance.primaryAddress = this.primaryAddress;
    modalRef.componentInstance.stateList = this.stateList;
    modalRef.componentInstance.isSameAsPrimaryAddress = this.isBillingAddressSameAsPrimary;

    modalRef.result.then(res => {
      if (res) {
        this.afterLoadBilling = true;
        if (res.id) {
          this.updateAddress(res, 4, 'invoice', res.isSameAsPrimaryAddress);
        } else {
          this.createAddress(res, res.isSameAsPrimaryAddress);
        }
      }
    });  }

  private updateAddress(
    res: vwAddressDetails,
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
        finalize(() => { })
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.billingSettings.invoiceAddressId = isSameAsPrimaryAddress
              ? this.primaryAddress.id
              : response;
            this.updateBillingSettings(this.billingSettings, false);
            this.billingAddress = res;
            this.toastr.showSuccess(this.error_data.address_updated_success);
          } else {
            this.toastr.showError(this.error_data.address_update_error);
          }
        },
        () => { }
      );
  }

  private createAddress(
    res: vwAddressDetails,
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
        finalize(() => { })
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.billingSettings.invoiceAddressId = isSameAsPrimaryAddress
              ? this.primaryAddress.id
              : response;
            this.updateBillingSettings(this.billingSettings, false);
            this.billingAddress = res;
            this.billingAddress.id = response;
            this.toastr.showSuccess(this.error_data.address_updated_success);
          } else {
            this.toastr.showError(this.error_data.address_update_error);
          }
        },
        () => { }
      );
  }

  workComplete() {
    this.markAsWorkComplete.emit();
  }

  public billNow(billNowPopup) {
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
        this.openBillNowPopup(billNowPopup);
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openBillNowPopup(billNowPopup);
    }
  }

  openBillNowPopup(billNowPopup) {
    this.disableBillNow = true;
    this.billNowMessage = '';
    this.chargesBillNow = false;
    let dateDisplay = moment(new Date()).format('MM/DD/YY');
    this.billNowMessage = `There are currently no pending or deferred ${this.matterDetails && this.matterDetails.isFixedFee ? 'fixed fee, add-ons,' : 'time entries,'} disbursements, or write-offs on this matter to send to pre-bill. Do you want to generate an invoice for this matter based on its current balance?`;

    this.billNowloading = true;
    this.matterService
      .v1MatterUnbilleditemsMatteridGet({ matterid: this.matterDetails.id })
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
                    queryParams: { matterId: this.matterDetails.id }
                  });
                  break;

                case 'zeroInvoice':
                  this.submitBillNow();
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

  addPaymentPlan() {
    const modelRef = this.modalService.open(PaymentPlanComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modelRef.componentInstance.matterId = this.matterDetails.id;
    modelRef.componentInstance.balanceDue = this.balanceDue;
    modelRef.componentInstance.matterBillingDetails = this.billingSettings;
    modelRef.componentInstance.matterDetails = this.matterDetails;

    modelRef.result.then((res: vwPaymentPlan) => {
      if (res) {
        res.matterId = this.matterDetails.id;
        this.paymentPlanLoader = true;
        this.fixedFeeServiceService
          .v1FixedFeeServicePaymentPlanPost$Json({
            body: res
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            resp => {
              if (resp > 0) {
                this.toastr.showSuccess(
                  this.error_data.create_payment_plan_success
                );
                this.getPaymentPlanList();
              } else {
                this.toastr.showError(
                  this.error_data.create_payment_plan_error
                );
                this.paymentPlanLoader = false;
              }
            },
            () => {
              this.paymentPlanLoader = false;
            }
          );
      }
    });
  }

  private getPaymentPlanList() {
    this.paymentPlanLoader = true;

    this.fixedFeeServiceService
      .v1FixedFeeServicePaymentPlanMatteridGet({
        matterid: this.matterDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.paymentPlanList = res;
          this.setPaymentPlanDetails();
        }

        this.paymentPlanLoader = false;
      }, () => {
        this.paymentPlanLoader = false;
      });
  }

  editPaymentPlan(plan: vwPaymentPlan) {
    const modelRef = this.modalService.open(PaymentPlanComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modelRef.componentInstance.matterId = this.matterDetails.id;
    modelRef.componentInstance.paymentPlan = plan;
    modelRef.componentInstance.balanceDue = this.balanceDue;
    modelRef.componentInstance.matterBillingDetails = this.billingSettings;
    modelRef.componentInstance.matterDetails = this.matterDetails;

    modelRef.result.then(res => {
      if (res) {
        res.matterId = this.matterDetails.id;
        res.id = plan.id;

        this.paymentPlanLoader = true;
        this.fixedFeeServiceService
          .v1FixedFeeServicePaymentPlanPut$Json({
            body: res
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            resp => {
              if (resp > 0) {
                this.toastr.showSuccess(
                  this.error_data.edit_payment_plan_success
                );
                this.getPaymentPlanList();
              } else {
                this.toastr.showError(this.error_data.edit_payment_plan_error);
                this.paymentPlanLoader = false;
              }
            },
            () => {
              this.paymentPlanLoader = false;
            }
          );
      } else {
        this.getPaymentPlanList();
      }
    });
  }

  deletePaymentPlan(plan: vwPaymentPlan) {
    this.dialogService
      .confirm(this.error_data.delete_payment_plan_confirm, 'Delete', 'Cancel', 'Delete Payment Plan')
      .then(res => {
        if (res) {
          this.paymentPlanLoader = true;
          this.fixedFeeServiceService
            .v1FixedFeeServicePaymentPlanIdDelete({
              id: plan.id
            })
            .pipe(map(UtilsHelper.mapData))
            .subscribe(
              resp => {
                if (resp > 0) {
                  this.toastr.showSuccess(
                    this.error_data.delete_payment_plan_success
                  );
                  this.getPaymentPlanList();
                } else {
                  this.toastr.showError(
                    this.error_data.delete_payment_plan_error
                  );
                  this.paymentPlanLoader = false;
                }
              },
              () => {
                this.paymentPlanLoader = false;
              }
            );
        }
      });
  }

  /*** open menu on action click */
  openMenu(index: number): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
      } else {
        this.currentActive = null;
      }
    }, 50);
  }

  /*** closed menu on body click */
  onClickedOutside(index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
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

  public submitBillNow() {
    const body: any = {
      matterId: +this.matterDetails.id,
      totalBillAmount: 0,
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
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }


  get isPaymentPlanEnabled() {
    return this.type == 'matter' && (this.balanceDue > 0)
      && this.matterDetails.matterStatus && this.matterDetails.matterStatus.name
      && ((this.paymentPlanEnabled && this.matterDetails
        && (this.matterDetails.matterStatus.name.toLowerCase() == 'closed'))
          || (!this.paymentPlanEnabled && this.matterDetails
            && (this.matterDetails.matterStatus.name.toLowerCase() == 'open'
              || this.matterDetails.matterStatus.name.toLowerCase() == 'closed')));
  }
}
