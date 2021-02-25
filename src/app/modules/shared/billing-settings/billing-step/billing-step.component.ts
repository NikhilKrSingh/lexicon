import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IndexDbService } from 'src/app/index-db.service';
import { IBillPeriod, IFixedFreeServices, IOffice, IStep, Page } from 'src/app/modules/models';
import { IBillingSettings } from 'src/app/modules/models/billing-setting.model';
import { AddressFormError } from 'src/app/modules/models/fillable-form.model';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddOnService, vwAddressDetails, vwBillingSettings, vwClient, vwCreditCard, vwECheck, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, ContactsService, FixedFeeServiceService, MiscService, PersonService, WorkFlowService } from 'src/common/swagger-providers/services';
import { ToastDisplay } from '../../../../guards/toast-service';
import * as errors from '../../../shared/error.json';
import { DialogService } from '../../dialog.service';
import { FixedFeeMatterComponent } from '../../fixed-fee-matter/fixed-fee-matter.component';
import { UtilsHelper } from '../../utils.helper';

interface IAdrs {
  id: number;
  address?: string;
  address2: string;
  city?: string;
  state?: string;
  zip?: string;
  zipCode?: string;
  addressTypeId: number;
  addressTypeName: string;
  personId?: number;
  address1?: string;
}

interface Idata {
  id?: number;
  person?: { id?: number, name?: string };
  matter?: { id?: number, name?: string };
  fixedAmount?: number;
  invoiceDelivery?: { id?: number; code?: string; name?: string; email?: string; primaryPhone?: string; };
  minimumTrustBalance?: number;
  billFrequencyQuantity?: number;
  billFrequencyDuration?: { id?: number; code?: string; name?: string; email?: string; primaryPhone?: string; };
  billFrequencyStartingDate?: string;
  daysToPayInvoices?: number;
  timeEntryGracePeriod?: number;
  timeRoundingInterval?: number;
  timeDisplayFormat?: number;
  isFixedAmount?: boolean;
  paymentPlans?: boolean;
  fixedFeeIsFullAmount?: boolean;
  fixedFeeAmountToPay?: number;
  fixedFeeRemainingAmount?: number;
  fixedFeeDueDate?: string;
  fixedFeeBillOnWorkComplete?: boolean;
  invoiceAddressId?: number;
  billingAddressId?: number;
  isWorkComplete?: boolean;
  invoiceTemplateId?: number;
  receiptTemplateId?: number;
  operatingRoutingNumber?: string;
  operatingAccountNumber?: string;
  changeNotes?: string;
  isInherited?: boolean;
}
interface IList {
  id?: number;
  code?: string;
  name?: string;
  email?: string;
  primaryPhone?: string;
};
@Component({
  selector: 'app-billing-step',
  templateUrl: './billing-step.component.html',
  styleUrls: ['./billing-step.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingStepComponent implements OnInit, OnDestroy {
  @Output() readonly nextStep = new EventEmitter<IStep>();
  @Output() readonly prevStep = new EventEmitter<IStep>();
  @Input() pageType: string;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @Input() clientId: number;
  @Input() clientType: string;
  @Input() clientDetail: vwClient;
  @Input() isClientConversion = true;
  @Input() isTrustAccountEnabled: boolean;

  public rateList: Array<vwRate> = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public SelectionType = SelectionType;
  public fixedAmount: number;
  public minimumTrustBalance: number;
  public invoicedeliveryList: Array<IList>;
  public selectedInvoicePref: IList;
  public stateList: Array<IOffice> = [];
  public invoiceAddress: boolean = true;
  public billingAddress: boolean = true;
  public city: string;
  public state: string;
  public zip: string;
  public address: string;
  public address2: string;
  public bcity: string;
  public bstate: string;
  public bzip: string;
  public baddress: string;
  public baddress2: string;
  public error_data = (errors as any).default;
  public invoiceDelivery: number;
  public fixedFreeServices: Array<IFixedFreeServices>;
  public selectedFixedFree: IFixedFreeServices;
  public billingSettingDetails: vwBillingSettings;
  public billingSettingOffice: vwBillingSettings;
  public billingSettings: IBillingSettings;
  public addressIndex: number;
  public invoiceAddrs: IAdrs = {
    id: 0,
    address: null,
    address2: null,
    city: null,
    state: null,
    zip: null,
    addressTypeId: null,
    addressTypeName: null
  };

  public addOnList: Array<any> = [];
  public fixedFeeList: Array<any> = [];
  public deletedAddOnList: Array<any> = [];
  public deletedFixedFeeList: Array<any> = [];
  public origFixedFeeList: Array<any> = [];
  public sendList: Array<any> = [];


  public enteredRateAmount: number = 0;
  public deferDate: string;
  public paymentMode = 1;
  public selectedFixedFreeId: number;
  public paymentPlanList: Array<PaymentPlanModel> = [];
  public persionAddress: Array<vwAddressDetails> = [];
  public matterBillingSettings: vwBillingSettings;
  public minDate = new Date();
  public currentActive: number;
  public officeId: number;
  public matterDetails;
  public addtoDb: boolean = false;
  private paymentList: { ccDeleted: Array<vwCreditCard>, echeckDeleted: Array<vwECheck>, creditCardList: Array<vwCreditCard>; echeckList: Array<vwECheck>; }
  public localMatterDetails: any = {};
  public invoiceAddressId: number;
  public billingAddressId: number;
  public matterId: number;
  public getSettingsDetails: IBillingSettings = {};
  public currentDetails: IBillPeriod = {};
  public userDetils: any = {};
  public ipLoading = false;
  public loading: boolean;
  public fixedFeeLoading = true;
  public hasEmailExist: boolean = true;
  public modalType: string;
  public FixedFeeEditForm: FormGroup
  public formSubmitted: boolean = false;
  public custom: boolean = false;
  public index: number = -1;
  showFixedFeeError: boolean;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public editDetails: any;
  public displayCrossIcn: boolean = false;
  addressFormError: AddressFormError;

  constructor(
    private modalService: NgbModal,
    private toastDisplay: ToastDisplay,
    private billingService: BillingService,
    private miscService: MiscService,
    private fixedFeeServiceService: FixedFeeServiceService,
    private dialogService: DialogService,
    private personService: PersonService,
    private contactsService: ContactsService,
    private indexDbService: IndexDbService,
    private workflowService: WorkFlowService,
    private invoiceService: InvoiceService,
    private formBuilder: FormBuilder,
    private store: Store<fromRoot.AppState>,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.userDetils = UtilsHelper.getLoginUser();
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate.setHours(0, 0, 0, 0);
    this.permissionList$ = this.store.select('permissions');
    this.addressFormError = new AddressFormError();

  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
            this.permissionList = obj.datas;
        }
      }
    });
    if (UtilsHelper.getObject('createdMatterId')) {
      this.matterId = UtilsHelper.getObject('createdMatterId');
      if (this.matterDetails) {
        this.matterDetails['id'] = this.matterId;
      } else {
        this.matterDetails = {};
        this.matterDetails['id'] = this.matterId;
      }
    }
    this.indexDbService.getObject('localMatterDetails', (res) => {
      if (res && res.value) {
        this.matterDetails = res.value.matter;
        this.matterDetails.id = this.matterId;
        this.matterDetails.matterId = this.matterId;
        this.localMatterDetails = res.value;
        this.officeId = res.value.matter.officeId;
      }
      this.getList();
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
        this.permissionSubscribe.unsubscribe();
    }
  }

  private getList() {
    this.ipLoading = true;
    forkJoin([
      this.billingService.v1BillingInvoicedeliveryListGet$Response({}),
      this.miscService.v1MiscStatesGet$Response({}),
      this.personService.v1PersonAddressPersonIdGet$Response({ personId: this.clientId }),
      this.billingService.v1BillingSettingsPersonPersonIdGet$Response({ personId: this.clientId }),
      this.fixedFeeServiceService.v1FixedFeeServiceGet$Response({}),
      this.billingService.v1BillingSettingsOfficeOfficeIdGet$Response({ officeId: this.officeId }),
    ]).pipe(
      map((res: Array<any>) => {
        return {
          invoicedelivery: JSON.parse(res[0].body as any).results,
          stateList: JSON.parse(res[1].body as any).results,
          persionAddress: JSON.parse(res[2].body as any).results,
          billingSettingDetails: JSON.parse(res[3].body as any).results,
          allFixedFee: JSON.parse(res[4].body as any).results,
          officeBillSettings: JSON.parse(res[5].body as any).results,
        }
      }),
      finalize(() => {
        this.fixedFeeLoading = false;
      })
    ).subscribe(res => {
      this.billingSettingOffice = res.officeBillSettings[0];
      this.invoicedeliveryList = res.invoicedelivery;
      this.stateList = res.stateList;
      this.persionAddress = res.persionAddress;
      this.fixedFreeServices = res.allFixedFee;

      this.billingSettingDetails = res.billingSettingDetails[0];
      if (this.billingSettingDetails) {
        if (this.billingSettingDetails.invoiceDelivery) {
          if (this.pageType !== 'client') {
            this.invoiceDelivery = this.billingSettingDetails.invoiceDelivery.id;
          } else {
            this.hasEmailExist = this.hasEmail();
            if (!this.hasEmailExist) {
              let paperonly = this.invoicedeliveryList.find(item => item.code === 'PAPER');
              this.invoiceDelivery = (paperonly) ? paperonly.id : null;
            }
          }
          this.selectInvoicePref(this.billingSettingDetails.invoiceDelivery.id);
        }
        if (this.billingSettingDetails.fixedAmount) {
          this.fixedAmount = this.billingSettingDetails.fixedAmount;
        }
      }
      if (this.localMatterDetails && this.localMatterDetails.billingDetails) {
        this.invoiceDelivery =
          (this.localMatterDetails.billingDetails && this.localMatterDetails.billingDetails.settings && this.localMatterDetails.billingDetails.settings.invoiceDelivery) ?
            this.localMatterDetails.billingDetails.settings.invoiceDelivery.id : 0;
        this.selectInvoicePref(this.invoiceDelivery);
        if (this.localMatterDetails.billingDetails.settings.minimumTrustBalance) {
          this.minimumTrustBalance = this.localMatterDetails.billingDetails.settings.minimumTrustBalance;
        }
        if (this.localMatterDetails.billingDetails.settings) {
          this.setBillingDetails(this.localMatterDetails.billingDetails.settings);
        }
        if (this.localMatterDetails.billingDetails.invoiceAddress) {
          this.invoiceAddress = (this.localMatterDetails.billingDetails.invoiceAddressSameAsPrimary) ? true : false;
          this.address = this.localMatterDetails.billingDetails.invoiceAddress.address1;
          this.address2 = this.localMatterDetails.billingDetails.invoiceAddress.address2;
          this.city = this.localMatterDetails.billingDetails.invoiceAddress.city;
          this.state = this.localMatterDetails.billingDetails.invoiceAddress.state;
          this.zip = this.localMatterDetails.billingDetails.invoiceAddress.zipCode;
          this.invoiceAddressId = this.localMatterDetails.billingDetails.invoiceAddress.id;
        }
        if (this.localMatterDetails.billingDetails.billingAddress) {
          this.billingAddress = (this.localMatterDetails.billingDetails.billingAddressSameAsPrimary) ? true : false;;
          this.baddress = this.localMatterDetails.billingDetails.billingAddress.address1;
          this.baddress2 = this.localMatterDetails.billingDetails.billingAddress.address2;
          this.bcity = this.localMatterDetails.billingDetails.billingAddress.city;
          this.bstate = this.localMatterDetails.billingDetails.billingAddress.state;
          this.bzip = this.localMatterDetails.billingDetails.billingAddress.zipCode;
          this.billingAddressId = this.localMatterDetails.billingDetails.billingAddress.id;
        }
        if (this.matterDetails.isFixedFee) {
          this.selectedFixedFreeId = (this.localMatterDetails.billingDetails && this.localMatterDetails.billingDetails.fixedFeeServiceMapping) ? this.localMatterDetails.billingDetails.fixedFeeServiceMapping.fixedFeeId : null;
          if (this.fixedFreeServices && this.fixedFreeServices.length > 0) {
            this.fixedFreeServices.map(obj => {
              if (this.selectedFixedFreeId === obj.id) {
                obj.selected = true;
                obj.amount = this.localMatterDetails.billingDetails.fixedFeeServiceMapping.rateAmount;
                obj.isCustom = this.localMatterDetails.billingDetails.fixedFeeServiceMapping.isCustom;
                this.selectedFixedFree = obj;
              } else {
                obj.selected = false;
              }
              obj.originalAmount = obj.amount;
            });
          }

          if (this.localMatterDetails.billingDetails.vwFixedFeeAddOns) {
            this.addOnList = this.localMatterDetails.billingDetails.vwFixedFeeAddOns;
          }
          if (this.localMatterDetails.billingDetails.fixedFeeServices) {
            this.fixedFeeList = this.localMatterDetails.billingDetails.fixedFeeServices;
          }
          if (this.localMatterDetails.billingDetails.settings.fixedFeeBillOnWorkComplete) {
            this.paymentMode = 3;
          } else if (this.localMatterDetails.billingDetails.settings.fixedFeeIsFullAmount) {
            this.paymentMode = 1;
          } else {
            this.paymentMode = 2;
            this.deferDate = this.localMatterDetails.billingDetails.settings.fixedFeeDueDate;
          }
        }
      } else if (this.billingSettingOffice) {
        this.setBillingDetails(this.billingSettingOffice);
      }
      this.ipLoading = false;
    }, () => {
      this.ipLoading = false;
    });
  }

  get rateAmount() {
    let amount = 0;
    amount += this.fixedFeeList
      .map(item => +item.amount)
      .reduce((prev, curr) => +prev + +curr, 0);

    amount += this.addOnList
      .map(item => +item.amount)
      .reduce((prev, curr) => +prev + +curr, 0);

    return amount;
  }

  /**
   * Create add on services
   */
  createService(type?: string) {
    this.modalType = type;
    this.sendList = [];
    if (type === 'addOn') {
      this.sendList = [...this.addOnList];
    } else {
      this.sendList = [...this.fixedFeeList];
    }
    let modelRef = this.modalService.open(FixedFeeMatterComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
    modelRef.componentInstance.modalType = this.modalType;
    modelRef.componentInstance.parentList = this.sendList;

    modelRef.result.then(res => {
      if (res) {
        this.addToList(res);
      }
    });
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
      } else {
        this.currentActive = null
      }
    }, 50)
  }

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) this.currentActive = null;
  }

  public getValue(data: IBillPeriod) {
    this.currentDetails = {...data};
    if (data) {
      let effectivePeriod = UtilsHelper.getFinalEffectiveDate(data.effectiveDate, data);
      if (data.billFrequencyStartingDate)
        this.getSettingsDetails.billFrequencyStartingDate = moment(effectivePeriod.previosEffectiveDate).format('YYYY-MM-DD');
      if (data.billFrequencyNextDate)
        this.getSettingsDetails.billFrequencyNextDate = moment(effectivePeriod.newEffectiveDate).format('YYYY-MM-DD');
      if (data.effectiveDate)
        this.getSettingsDetails.effectiveDate = moment(data.effectiveDate).format('YYYY-MM-DD');
      this.getSettingsDetails.billFrequencyDay = data.billFrequencyDay;
      this.getSettingsDetails.billFrequencyRecursOn = (data.billFrequencyRecursOn) ? data.billFrequencyRecursOn : null;
      if (data.billFrequencyQuantity)
        this.getSettingsDetails.billFrequencyQuantity = data.billFrequencyQuantity;
      if (data.billFrequencyDuration) {
        this.getSettingsDetails.billFrequencyDuration = {
          id: data.billFrequencyDuration,
          code: data.billFrequencyDurationType,
          name: data.billFrequencyDurationType.toLocaleLowerCase()
        };
      }
      if (data.isInherited === false || data.isInherited) {
        this.getSettingsDetails.isInherited = data.isInherited;
      }
    }
  }

  /**
   * update billing info
   */
  public saveNext() {
    this.formSubmitted = true;
    let settings: Idata = {};
    settings["fixedAmount"] = this.fixedAmount;
    if (this.invoiceDelivery) {
      let inc = this.invoicedeliveryList.find((obj) => obj.id === this.invoiceDelivery);
      settings["invoiceDelivery"] = inc;
    } else {
      this.toastDisplay.showError(this.error_data.required_invoicepreferences);
      return;
    }
    if (this.minimumTrustBalance) {
      settings["minimumTrustBalance"] = +this.minimumTrustBalance;
    }
    if (this.selectedInvoicePref && this.selectedInvoicePref.code !== 'ELECTRONIC' && !this.invoiceAddress) {
      const pattern = '[a-zA-Z0-9_]'
      if (!this.address) {
        this.addressFormError.address = true;
        this.addressFormError.addressMessage = this.error_data.address_error;
      } else if (this.address && !this.address.charAt(0).match(pattern)) {
        this.addressFormError.address = true;
        this.addressFormError.addressMessage = this.error_data.insecure_input;
      } else {
        this.addressFormError.address = false;
      }

      if (this.address2 && !this.address2.charAt(0).match(pattern)) {
        this.addressFormError.address2 = true;
        this.addressFormError.address2Message = this.error_data.insecure_input;
      } else {
        this.addressFormError.address2 = false;
      }

      if (!this.city) {
        this.addressFormError.city = true;
        this.addressFormError.cityMessage = this.error_data.city_error;
      } else if (this.city && !this.city.charAt(0).match(pattern)) {
        this.addressFormError.city = true;
        this.addressFormError.cityMessage = this.error_data.insecure_input;
      } else {
        this.addressFormError.city = false;
      }

      if (!this.zip) {
        this.addressFormError.zipCode = true;
        this.addressFormError.zipCodeMessage = this.error_data.zip_code_error;
      } else {
        this.addressFormError.zipCode = false;
      }

      if (!this.state) {
        this.addressFormError.state = true;
        this.addressFormError.stateMessage = this.error_data.state_error;
      } else {
        this.addressFormError.state = false;
      }

      if (this.addressFormError.hasError()) {
        window.scrollTo(0, 0);
        return;
      }
    }
    if (!this.matterDetails.isFixedFee) {
      if (this.currentDetails && (
        !this.currentDetails.billFrequencyQuantity ||
        !this.currentDetails.billFrequencyDuration
      )) {
        return;
      }
    }

    if (!this.billingAddress) {
      if (!this.baddress || !this.baddress2 || !this.bstate || !this.bcity || !this.bzip) {
        this.toastDisplay.showError(this.error_data.billing_address_required);
        this.loading = false;
        return false;
      }

      if (String(this.bzip).length < 5 || String(this.bzip).length > 6) {
        this.toastDisplay.showError('Please ener valid zip code.');
        return;
      }
    }

    if (!this.selectedInvoicePref) {
      this.toastDisplay.showError('Please select valid Invoice Preference.');
      this.loading = false;
      return;
    }

    settings['fixedFeeIsFullAmount'] = this.paymentMode == 1;
    settings['fixedFeeAmountToPay'] = this.paymentMode == 1 ? this.rateAmount : 0;
    settings['fixedFeeRemainingAmount'] = this.paymentMode == 1 ? 0 : this.rateAmount;
    settings['fixedFeeDueDate'] = this.paymentMode == 2 ? this.deferDate : null;
    settings['fixedFeeBillOnWorkComplete'] = this.paymentMode == 3 ? true : false;
    if (this.matterDetails.isFixedFee) {
      if (this.paymentMode == 2 && this.deferDate == null) {
        this.toastDisplay.showError('Please select Defer Date');
        return;
      }
      if (this.fixedFeeList.length === 0) {
        this.showFixedFeeError = true;
        return;
      }
      let now = moment();
      let dueDate = moment(moment(settings['fixedFeeDueDate']).format('YYYY-MM-DD'));
      if (this.paymentMode == 2 && !dueDate.isSameOrAfter(now, 'date')) {
        this.toastDisplay.showError('Please select valid defer date.');
        return;
      }
    }
    let matterAssociations: Array<any> = [];
    let clientAssociations: Array<any> = (this.localMatterDetails && this.localMatterDetails.client && this.localMatterDetails.client.clientAssociations) ? this.localMatterDetails.client.clientAssociations : [];
    let blockEmployees: Array<any> = [];
    let basicDetails: any;
    let billingDetails: {
      settings?: Idata,
      fixedFeeServiceMapping?: any,
      addOns?: Array<vwAddOnService>,
      echecks?: Array<vwECheck>,
      creditCards?: Array<vwCreditCard>,
      rates?: Array<vwRate>,
      invoiceAddress?: IAdrs,
      billingAddress?: IAdrs,
    } = {};
    if (this.matterDetails.deletedOpposingPartyList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.deletedOpposingPartyList);
    }
    if (this.matterDetails.deletedOpposingCounselList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.deletedOpposingCounselList);
    }
    if (this.matterDetails.deletedExpertWitnessList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.deletedExpertWitnessList);
    }
    if (this.matterDetails.opposingPartyList) {
      matterAssociations = [...this.matterDetails.opposingPartyList];
    }
    if (this.matterDetails.opposingCounselList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.opposingCounselList);
    }
    if (this.matterDetails.expertWitnessList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.expertWitnessList);
    }
    if (this.matterDetails.deletedVendorList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.deletedVendorList);
    }
    if (this.matterDetails.vendorList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.vendorList);
    }
    if (this.matterDetails.deletedSubsidiaryListt) {
      matterAssociations = matterAssociations.concat(this.matterDetails.deletedSubsidiaryListt);
    }
    if (this.matterDetails.subsidiaryList) {
      matterAssociations = matterAssociations.concat(this.matterDetails.subsidiaryList);
    }
    if (this.matterDetails.responsobleAttornyId) {
      matterAssociations.push({
        associationId: this.matterDetails.associateResponsibleAttorney,
        id: this.matterDetails.responsobleAttornyId
      });
    }
    if (this.matterDetails.billingAttornyId) {
      matterAssociations.push({
        associationId: this.matterDetails.associateBillingAttorney,
        id: this.matterDetails.billingAttornyId
      });
    }
    if (this.matterDetails.employeesRows && this.matterDetails.employeesRows.length > 0) {
      this.matterDetails.employeesRows.map((item) => {
        blockEmployees.push({ personId: item.id });
      });
    }
    let mtId = 0;
    if (this.pageType === 'client') {
      mtId = this.clientDetail.matterId;
    } else {
      mtId = (this.matterId) ? (this.matterId) : 0
    }
    if (matterAssociations && matterAssociations.length > 0) {
      matterAssociations.map((obj) => {
        if (!obj.associationId) {
          obj.associationId = obj.associationTypeId;
        }
      })
    }

    let materBasics = {
      clientId: +this.clientId,
      matterId: +mtId,
      matterOpenDate: this.matterDetails.openDate,
      matterName: this.matterDetails.name,
      trustName: this.matterDetails.trustName,
      trustExecutionDate: this.matterDetails.trustExecutionDate,
      contingentCase: this.matterDetails.isContingentCase,
      isFixedFee: this.matterDetails.isFixedFee,
      caseNumbers: this.matterDetails.caseNumbers,
      initialConsultLawOffice: this.matterDetails.officeId,
      practiceId: this.matterDetails.practiceId,
      matterTypeId: this.matterDetails.matterTypeId,
      juridictionState: this.matterDetails.jurisdictionStateId,
      juridictionCounty: this.matterDetails.jurisdictionCounty,
      matterAssociations,
      clientAssociations,
      blockEmployees
    }
    billingDetails.creditCards = this.paymentList.ccDeleted.concat(this.paymentList.creditCardList);
    billingDetails.echecks = this.paymentList.echeckDeleted.concat(this.paymentList.echeckList);
    if (this.matterDetails.isFixedFee) {
      let newArr = [], newArr1 = [];
      if (this.deletedAddOnList && this.deletedAddOnList.length > 0) {
        newArr = this.deletedAddOnList;
      }
      if (this.deletedFixedFeeList && this.deletedFixedFeeList.length > 0) {
        newArr1 = this.deletedFixedFeeList;
      }
      if (this.fixedFeeList && this.fixedFeeList.length > 0) {
        newArr1 = newArr1.concat(this.fixedFeeList);
      }
      if (this.addOnList && this.addOnList.length > 0) {
        newArr = newArr.concat(this.addOnList);
      }
      billingDetails['vwFixedFeeAddOns'] = newArr;
      billingDetails['fixedFeeServices'] = newArr1;
    } else {
      billingDetails['rates'] = this.rateList;
      if (this.getSettingsDetails.billFrequencyQuantity) {
        settings["billFrequencyQuantity"] = this.getSettingsDetails.billFrequencyQuantity;
      }
      if (this.getSettingsDetails.billFrequencyDuration) {
        settings["billFrequencyDuration"] = this.getSettingsDetails.billFrequencyDuration;
      }
      if (this.getSettingsDetails.billFrequencyRecursOn) {
        settings["billFrequencyRecursOn"] = this.getSettingsDetails.billFrequencyRecursOn;
      }
      settings["billFrequencyDay"] = this.getSettingsDetails.billFrequencyDay;
      if (this.getSettingsDetails.effectiveDate) {
        settings["effectiveDate"] = this.getSettingsDetails.effectiveDate;
      }
      if (this.getSettingsDetails.billFrequencyStartingDate) {
        settings["billFrequencyStartingDate"] = this.getSettingsDetails.billFrequencyStartingDate;
      }
      if (this.getSettingsDetails.billFrequencyNextDate) {
        settings["billFrequencyNextDate"] = this.getSettingsDetails.billFrequencyNextDate;
      }
      settings.isInherited = this.getSettingsDetails.isInherited;
    }
    billingDetails.settings = settings;
    let primaryAdrs = this.persionAddress.find(obj => obj.addressTypeName && obj.addressTypeName.toLowerCase() === 'primary');
    if (this.invoiceAddress) {
      if (primaryAdrs) {
        billingDetails['invoiceAddress'] = {
          "id": (this.invoiceAddressId) ? this.invoiceAddressId : 0,
          "personId": +this.clientId,
          "addressTypeId": 4,
          "addressTypeName": "invoice",
          "address1": primaryAdrs.address1,
          "address2": primaryAdrs.address2,
          "city": primaryAdrs.city,
          "state": primaryAdrs.state,
          "zipCode": primaryAdrs.zipCode
        }
      }
    } else {
      billingDetails['invoiceAddress'] = {
        "id": (this.invoiceAddressId) ? this.invoiceAddressId : 0,
        "personId": +this.clientId,
        "addressTypeId": 4,
        "addressTypeName": "invoice",
        "address1": this.address,
        "address2": this.address2,
        "city": this.city,
        "state": this.state,
        "zipCode": this.zip
      }
    }
    if (this.billingAddress) {
      if (primaryAdrs) {
        billingDetails['billingAddress'] = {
          "id": (this.billingAddressId) ? this.billingAddressId : 0,
          "personId": +this.clientId,
          "addressTypeId": 2,
          "addressTypeName": "billing",
          "address1": primaryAdrs.address1,
          "address2": primaryAdrs.address2,
          "city": primaryAdrs.city,
          "state": primaryAdrs.state,
          "zipCode": primaryAdrs.zipCode
        }
      }
    } else {
      billingDetails['billingAddress'] = {
        "id": (this.billingAddressId) ? this.billingAddressId : 0,
        "personId": +this.clientId,
        "addressTypeId": 2,
        "addressTypeName": "billing",
        "address1": this.baddress,
        "address2": this.baddress2,
        "city": this.bcity,
        "state": this.bstate,
        "zipCode": this.bzip
      }
    }
    if (this.pageType === 'client') {
      basicDetails = this.getClientDetails(this.localMatterDetails.client);
    }
    let observable;
    if (this.pageType === 'client') {
      billingDetails.settings.id = this.billingSettingDetails.id;
      observable = this.contactsService.v1ContactsFullConversionPut$Json({ body: { basicDetails, matterDetails: { materBasics, billingDetails }, uniqueNumber: +basicDetails.uniqueNumber } });
    } else {
      if (this.matterId) {
        billingDetails.settings.id = (this.localMatterDetails && this.localMatterDetails.billingDetails && this.localMatterDetails.billingDetails.settings && this.localMatterDetails.billingDetails.settings.id) ? this.localMatterDetails.billingDetails.settings.id : 0;
        observable = this.contactsService.v1ContactsFullMatterPut$Json({ body: { materBasics, billingDetails } });
      } else {
        observable = this.contactsService.v1ContactsFullMatterPost$Json({ body: { materBasics, billingDetails } });
      }
    }
    this.loading = true;
    observable.pipe(map(UtilsHelper.mapData))
      .subscribe(async res => {
        if (res) {
          let resDetails = (this.pageType === 'client') ? res.matterDetails : res;
          let invoiceRespose = (this.pageType === 'client') ? res.invoiceDetails : resDetails.invoiceDetails;
          if (invoiceRespose) {
            this.invoiceService.saveInvoice.emit(invoiceRespose);
          }
          this.localMatterDetails.matter.matterId = resDetails.materBasics.matterId;
          this.localMatterDetails.matter.id = resDetails.materBasics.matterId;
          billingDetails.settings.id = resDetails.billingDetails.settings.id;
          if (billingDetails.invoiceAddress && resDetails.billingDetails && resDetails.billingDetails.invoiceAddress) {
            billingDetails.invoiceAddress.id = resDetails.billingDetails.invoiceAddress.id;
          }
          if (billingDetails.billingAddress && resDetails.billingDetails && resDetails.billingDetails.billingAddress) {
            billingDetails.billingAddress.id = resDetails.billingDetails.billingAddress.id;
          }
          if (this.matterDetails.isFixedFee) {
            let newArr = [], newArrF = [];
            if (resDetails.billingDetails.vwFixedFeeAddOns && resDetails.billingDetails.vwFixedFeeAddOns.length > 0) {
              newArr = resDetails.billingDetails.vwFixedFeeAddOns.filter(item => !item.isDelet);
            }
            if (resDetails.billingDetails.fixedFeeServices && resDetails.billingDetails.fixedFeeServices.length > 0) {
              newArrF = resDetails.billingDetails.fixedFeeServices.filter(item => !item.isDelet);
            }
            billingDetails['vwFixedFeeAddOns'] = newArr;
            billingDetails['fixedFeeServices'] = newArrF;
          }
          billingDetails['invoiceAddressSameAsPrimary'] = (this.invoiceAddress) ? true : false;
          billingDetails['billingAddressSameAsPrimary'] = (this.billingAddress) ? true : false;
          if (this.matterDetails.generatTaskBuilderTasks) {
            let data = {
              practiceAreaId: this.matterDetails.practiceArea,
              matterTypeId: this.matterDetails.matterTypeId,
              matterId: resDetails.materBasics.matterId
            }
            await this.checkIfMatterWorkFlowCreated(resDetails.materBasics.matterId, data);
          }
          this.localMatterDetails['billingDetails'] = billingDetails;
          UtilsHelper.setObject('createdMatterId', resDetails.materBasics.matterId);
          this.setMatterAssociation(resDetails);
          this.loading = false;
          this.nextStep.emit({ next: this.isTrustAccountEnabled ? 'trustaccount' : 'calendar', current: 'billing' });
        }
      }, (err) => {
        this.loading = false;
      });
  }

  public setMatterAssociation(res) {
    this.localMatterDetails.matter.expertWitnessList = [];
    this.localMatterDetails.matter.opposingCounselList = [];
    this.localMatterDetails.matter.opposingPartyList = [];
    this.localMatterDetails.matter.deletedOpposingPartyList = [];
    this.localMatterDetails.matter.deletedOpposingCounselList = [];
    this.localMatterDetails.matter.deletedExpertWitnessList = [];
    if (this.localMatterDetails.client) {
      this.localMatterDetails.client.vendorList = [];
      this.localMatterDetails.client.subsidiaryList = [];
      this.localMatterDetails.client.deletedSubsidiaryList = [];
      this.localMatterDetails.client.deletedVendorList = [];
    }
    if (res && res.materBasics && res.materBasics.matterAssociations && res.materBasics.matterAssociations.length > 0) {
      res.materBasics.matterAssociations.map((obj) => {
        if (obj.associationType === 'Opposing Party') {
          this.localMatterDetails.matter.opposingPartyList.push(obj);
        }
        if (obj.associationType === 'Opposing Counsel') {
          this.localMatterDetails.matter.opposingCounselList.push(obj);
        }
        if (obj.associationType === 'Expert Witness') {
          this.localMatterDetails.matter.expertWitnessList.push(obj);
        }
        if (obj.associationType === 'Vendor') {
          this.localMatterDetails.client.vendorList.push(obj);
        }
        if (obj.associationType === 'Subsidiary') {
          this.localMatterDetails.client.subsidiaryList.push(obj);
        }
      });
    }
    this.indexDbService.addObject("localMatterDetails", this.localMatterDetails);
  }

  public editFixedFreeService(obj: IFixedFreeServices, $event) {
    $event.target.closest('datatable-body-cell').blur();
    obj.rateAmount = obj.amount;
    obj.isEditing = true;
  }

  public cancelEditFixedFreeService(obj: IFixedFreeServices, $event) {
    $event.target.closest('datatable-body-cell').blur();
    obj.isEditing = false;
  }

  public updateFixedFreeService(obj: IFixedFreeServices, $event) {
    $event.target.closest('datatable-body-cell').blur();
    obj.amount = +obj.rateAmount;
    if (obj.amount != obj.originalAmount) {
      obj.isCustom = true;
      obj['needUpdate'] = true;
    } else {
      obj.isCustom = false;
    }
    obj.isEditing = false;
  }

  public clearFixedFreeService(obj: IFixedFreeServices) {
    obj.rateAmount = obj.originalAmount;
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect(row: IFixedFreeServices) {
    this.selectedFixedFree = row;
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.rateList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  public selectInvoicePref(selectedValue) {
    this.selectedInvoicePref = this.invoicedeliveryList.find(item => item.id === selectedValue);
  }

  prev() {
    if (this.isClientConversion) {
      this.prevStep.emit({
        current: 'billing',
        next: 'matter'
      });
    } else {
      this.prevStep.emit({
        current: 'billing',
        next: 'basic'
      });
    }
  }

  validateEnteredAmount() {
    if (+this.enteredRateAmount > +this.rateAmount) {
      this.toastDisplay.showError('Please enter less than or equal to total amount.');
      this.enteredRateAmount = 0;
    }
  }

  deferModeChange() {
    if (this.paymentMode != 2) {
      this.deferDate = null;
    }
  }

  public sendRateList(event) {
    this.rateList = event.rateList;
  }
  public getPaymentMethodList(event) {
    this.paymentList = event;
    if (this.paymentList && this.paymentList.ccDeleted && this.paymentList.ccDeleted.length > 0) {
      this.paymentList.ccDeleted.map((obj) => {
        obj.cvv = (obj.cvv) ? obj.cvv : '123';
      })
    }
    if (this.paymentList && this.paymentList.creditCardList && this.paymentList.creditCardList.length > 0) {
      this.paymentList.creditCardList.map((obj) => {
        obj.cvv = (obj.cvv) ? obj.cvv : '123';
      })
    }
  }

  async createNewWorkflowForMatter(data) {
    try {
      let res = await this.workflowService.v1WorkFlowGeneratenewPost$Json({ body: data }).toPromise();
    } catch (err) {
    }
  }

  async checkIfMatterWorkFlowCreated(matterId, data: any) {
    try {
      let res = await this.workflowService.v1WorkFlowVerifyMatterMatterIdGet({ matterId: +matterId }).toPromise();
      let isMatterFlowCreated = JSON.parse(res as any).results.isMatterWorkflowCreated;
      if (!isMatterFlowCreated) {
        await this.createNewWorkflowForMatter(data);
      } else {
      }
    } catch (err) {
    }
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57 || k == 8 || k == 9);
  }

  private setBillingDetails(data) {
    let qty, durs;
    if (data.billFrequencyQuantity) {
      qty = data.billFrequencyQuantity;
    }
    if (data.billFrequencyDuration) {
      durs = data.billFrequencyDuration;
    }
    this.billingSettings = {
      billFrequencyQuantity: qty,
      billFrequencyDuration: durs,
      billFrequencyDay: data.billFrequencyDay,
      billFrequencyRecursOn: data.billFrequencyRecursOn,
      billFrequencyStartingDate: data.billFrequencyStartingDate,
      billFrequencyNextDate: data.billFrequencyNextDate,
      effectiveDate: data.effectiveDate,
    }
  }

  private getClientDetails(data) {
    let primaryAddrs;
    if (data && data.addresses) {
      primaryAddrs = data.addresses.find(item => item.addressTypeName === "primary");
    }
    let corporateContacts = [];
    if (data.deletedCorporateContactList && data.deletedCorporateContactList.length > 0) {
      corporateContacts = data.deletedCorporateContactList;
    }
    if (data.corporateContactList) {
      corporateContacts = corporateContacts.concat(data.corporateContactList);
    }

    corporateContacts = [...corporateContacts];

    corporateContacts.forEach(c => {
      c.status = c.status == 'Active';
    });

    return {
      id: data.id,
      uniqueNumber: +data.uniqueNumber,
      initialConsultLawOffice: (data.consultationLawOffice) ? data.consultationLawOffice.id : 0,
      initialConsultAttoney: (data.consultAttorney) ? data.consultAttorney.id : 0,
      initialConsultDate: data.initialConsultDate,
      personFormBuilder: data.personFormBuilder,
      contactType: (data.isCompany) ? 'corporate' : 'individual',
      initialContactDate: data.initialContactDate,
      salutation: data.salutation,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender,
      suffix: data.suffix,
      formerName: data.formerName,
      createdBy: data.createdBy,
      companyName: data.companyName,
      isCompany: data.isCompany,
      isVisible: data.isVisible,
      isArchived: data.isArchived,
      archiveReason: data.archiveReason,
      nextActionDate: data.nextActionDate,
      nextActionNote: data.nextActionNote,
      primaryPhoneNumber: this.mobileNumber(data.phones, "primary"),
      cellPhoneNumber: this.mobileNumber(data.phones, "cellphone"),
      email: data.email,
      primaryAddress: (primaryAddrs) ? primaryAddrs.address : null,
      primaryAddress2: (primaryAddrs) ? primaryAddrs.address2 : null,
      primaryCity: (primaryAddrs) ? primaryAddrs.city : null,
      primaryState: (primaryAddrs) ? primaryAddrs.state : null,
      primaryZipCode: (primaryAddrs) ? primaryAddrs.zip : null,
      preferredContactMethod: data.preferredContactMethod,
      doNotContactReasonOther: data.doNotContactReasonOther,
      doNotContactReason: data.doNotContactReason,
      doNotContact: data.doNotContact,
      notifyEmail: data.notifyEmail,
      notifySMS: data.notifySmS,
      marketingEmail: data.marketingEmail,
      marketingSMS: data.marketingSMS,
      corporateContacts,
      primanyLawOffice: (data.primaryOffice) ? data.primaryOffice.id : 0,
      originatingAttorney: (this.matterDetails.originatingAttorney) ? this.matterDetails.originatingAttorney : 0,
    };
  }

  public mobileNumber(arr, type) {
    if (arr && arr.length > 0) {
      let item = arr.find(item => item.type === type);
      return (item) ? item.number : '';
    }
    return null;
  }

  public hasEmail() {
    if (this.clientDetail) {
      let clientDetails = this.localMatterDetails.client;
      if (this.clientType !== 'company') {
        return (clientDetails.email) ? true : false;
      } else {
        return clientDetails.primaryContactPerson ? !!clientDetails.primaryContactPerson.email : false;
      }
    } else {
      return false;
    }
  }

  /******** Closes Modal*****/
  public close() {
    this.custom = false;
    this.modalService.dismissAll(null);
  }

  /****** add fixed fee details to list****/
  public addToList(event?: any) {

    switch (this.modalType) {
      case 'addOn':
        this.addOnList.push(...event);
        break;

      case 'fixedFeeservice':
        this.showFixedFeeError = false;
        this.origFixedFeeList.push(...event);
        this.fixedFeeList = [...this.origFixedFeeList];
        break;
    }
  }

  /**
   *  Delete AddOn List
   */
  public deleteList(row: any, fixedFee: string) {
    switch(fixedFee) {
      case 'addOn': {
        let item = {...this.addOnList[row]};
        item['isDelete'] = true;
        this.deletedAddOnList.push(item);
        this.addOnList.splice(row, 1);
        break;
      }

      case 'fixedFeeservice': {
        const rowIndex = this.origFixedFeeList.findIndex(item => item.code === row.code);
        let item = {...row};
        item['isDelete'] = true;
        this.deletedFixedFeeList.push(item);
        this.origFixedFeeList.splice(rowIndex, 1);
        this.fixedFeeList = [...this.origFixedFeeList];
        break;
      }

    }
  }

  /******** Edit AddOn List *******/
  public editList($event, row, template, fixedFee) {
    if (fixedFee === 'fixedFeeservice') {
      $event.target.closest('datatable-body-cell').blur();
    }
    this.editDetails = {...row};
    this.modalType = fixedFee;
    this.index = row;
    this.FixedFeeEditForm = this.formBuilder.group({
      code: ['', Validators.required],
      description: ['', Validators.required],
      amount: ['', Validators.required]
    });
    if (row.amount && +row.amount > 0) {
      row.amount = (row.amount).toFixed(2);
    }
    switch(this.modalType) {
      case 'addOn': {
        if(this.addOnList[row].isCustomAddOn ? true : false ) {
          this.custom = true;
        } else {
          this.custom = false;
        }
        if (this.addOnList[row].amount && +this.addOnList[row].amount > 0) {
          this.addOnList[row].amount = (+this.addOnList[row].amount).toFixed(2);
        }
        this.editDetails = {...this.addOnList[row]};
        this.FixedFeeEditForm.patchValue(this.addOnList[row]);
        break;
      }

      case 'fixedFeeservice': {
        if(row.isCustomAddOn ? true : false ) {
          this.custom = true;
        } else {
          this.custom = false;
        }
        this.FixedFeeEditForm.patchValue(row);
        this.index = this.fixedFeeList.map( item => item.amount).indexOf(row.amount);
        break;
      }
    }
    if (this.editDetails && !this.editDetails.isCustomAddOn && this.editDetails.amount !== this.editDetails.oriAmount) {
      this.displayCrossIcn = true;
    } else {
      this.displayCrossIcn = false;
    }

    this.modalService.open(template, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'md'
    });
  }

  get f() {
    return this.FixedFeeEditForm.controls;
  }

  /******** Save changes AddOnList *********/
  public saveChanges() {
    if (!this.f['amount'].value) {
      return;
    }
    this.formSubmitted = true;
    switch(this.modalType) {
      case 'addOn': {
        if (!this.custom) {
          if (this.f['amount'].value ==='') {
            return;
          }
          this.addOnList[this.index].amount = +this.f['amount'].value;
          this.addOnList[this.index].isEdited = true;
          this.addOnList[this.index].isCustom = (this.addOnList[this.index].amount !== this.addOnList[this.index].oriAmount) ? true : false;
          this.formSubmitted = false;
        } else {
          if (!this.isFormValid()) {
            return;
          }

          this.addOnList.splice(this.index , 1, {
            code: this.f['code'].value,
            description: this.f['description'].value,
            amount: +this.f['amount'].value,
            isCustomAddOn: true,
          });
        }
      }
      break;

      case 'fixedFeeservice' : {
        if (!this.custom) {
          if (this.f['amount'].value ==='') {
            return;
          }
          this.origFixedFeeList[this.index].amount = +this.f['amount'].value;
          this.origFixedFeeList[this.index].isEdited = true;
          this.origFixedFeeList[this.index].isCustom = (this.origFixedFeeList[this.index].amount !== this.origFixedFeeList[this.index].oriAmount) ? true : false;
          this.formSubmitted = false;
        } else {
          if (!this.isFormValid()) {
            return;
          }

          this.origFixedFeeList.splice(this.index , 1, {
            code: this.f['code'].value,
            description: this.f['description'].value,
            amount: +this.f['amount'].value,
            isCustomAddOn: true,
          });
        }
        this.fixedFeeList = [];
        this.fixedFeeList = [...this.origFixedFeeList];
      }
    }
    this.custom = false;
    this.modalService.dismissAll();
    this.index = -1;
  }

  /**** Validates Form ********/
  public isFormValid(): boolean {
    return this.FixedFeeEditForm.valid;
  }

  /***** function to remove amount prefix */
  removePrefix(event?: any): void {
    if (event) {
      const key = event.keyCode || event.charCode;
      if( key == 8 || key == 46 ) {
        if(+this.f['amount'].value <= 0) {
          this.f['amount'].setValue(null);
        }
      }
    }
    if(!this.f['amount'].value) {
      this.f['amount'].setValue(null);
    }
  }

  /**
   * Handle manage original rate for services
   */
  public originalRate() {
    this.editDetails.amount = this.editDetails.oriAmount;
    if (this.editDetails.amount && +this.editDetails.amount > 0) {
      this.editDetails.amount = (+this.editDetails.amount).toFixed(2);
    }
    switch(this.modalType) {
      case 'addOn':
        this.FixedFeeEditForm.patchValue(this.editDetails);
        break;

      case 'fixedFeeservice':
        this.FixedFeeEditForm.patchValue(this.editDetails);
        break;
    }
    if (this.editDetails && !this.editDetails.isCustomAddOn && this.editDetails.amount !== this.editDetails.oriAmount) {
      this.displayCrossIcn = true;
    } else {
      this.displayCrossIcn = false;
    }
  }

  addCent(): void {
    if(+this.f['amount'].value > 0) {
      this.f['amount'].setValue((+this.f['amount'].value).toFixed(2));
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
