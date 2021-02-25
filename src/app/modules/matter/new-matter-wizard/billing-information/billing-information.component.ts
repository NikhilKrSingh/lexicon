import { Component, Input, OnChanges, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as clone from 'clone';
import * as _ from 'lodash';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IBillPeriod, IvwFixedFee, Page } from 'src/app/modules/models';
import { IBillingSettings } from 'src/app/modules/models/billing-setting.model';
import { FixedFeeMatterComponent } from 'src/app/modules/shared/fixed-fee-matter/fixed-fee-matter.component';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import {
  vwAddressDetails,
  vwBillingSettings,
  vwCreditCard,
  vwDisbursement,
  vwECheck,
  vwIdCodeName,
  vwRate
} from 'src/common/swagger-providers/models';
import {
  BillingService,
  EmployeeService,
  MiscService,
  PersonService,
  PlacesService,
  RateTableService
} from 'src/common/swagger-providers/services';
import * as Constant from '../../../shared/const';
import { RateTableModalComponent } from '../../../shared/rate-table-modal/rate-table-modal.component';
import * as errorData from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
interface IList {
  id?: number;
  code?: string;
  name?: string;
  email?: string;
  primaryPhone?: string;
}

@Component({
  selector: 'app-billing-information',
  templateUrl: './billing-information.component.html',
  styleUrls: ['./billing-information.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingInformationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() clientId: number;
  @Input() officeId: number;
  @Input() formSubmitted: boolean;
  @Input() pageType: string;
  @Input() matterOpenDate: string = null;

  public errorData: any = (errorData as any).default;
  public invoicedeliveryList: Array<IList>;
  public billingForm: FormGroup;
  public contingentCase = false;
  public isFixedFee = false;
  public stateList: any[] = [];
  public persionAddress: Array<vwAddressDetails> = [];
  public invoiceDelivery: number;
  public billingSettingDetails: vwBillingSettings;
  public selectedInvoicePref: IList;
  public fixedAmount: number;
  public invoiceAddress = true;
  public isLoadingb = false;
  public address: string;
  public address2: string;
  public city: string;
  public state: string;
  public zip: string = null;
  public getSettingsDetails: IBillingSettings = {};
  public oriSettingsDetails: IBillPeriod = {};
  public billingSettings: IBillingSettings;
  public zipcodeFlag = false;
  public zipcodeFlagInvalid = false;
  public isInherited = true;
  public isWorkComplete = false;
  public billFrequencyDayObj: { value?: number; name?: string };
  public displayStartDate: string;
  public displayEndDate: string;
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  public paymentList: { ccDeleted: Array<vwCreditCard>, echeckDeleted: Array<vwECheck>, creditCardList: Array<vwCreditCard>; echeckList: Array<vwECheck>; };
  public rateList: Array<vwRate>;
  public allRateList: Array<vwRate>;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public modalType: string;
  public addOnList: Array<IvwFixedFee> = [];
  public fixedFeeList: Array<IvwFixedFee> = [];
  public origFixedFeeList: Array<IvwFixedFee> = [];
  public sendList: Array<IvwFixedFee> = [];
  public showFixedFeeError = false;
  public invalidDeferDate = false;
  public editDetails: IvwFixedFee;
  public index = -1;
  public FixedFeeEditForm: FormGroup;
  public custom = false;
  public isCustomBillingRate = false;
  public displayCrossIcn = false;
  public enteredRateAmount = 0;
  public deferDate: string;
  public paymentMode = 1;
  public minDate = new Date();
  public selDisbursementTypes: Array<vwDisbursement> = [];
  public rateTables = [];

  page = new Page();
  pageSelector = new FormControl('10');
  pageSelected = 1;
  limitArray: Array<number> = [10, 30, 50, 100];
  counter = Array;
  messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  stateCitySubscription: any;
  cityList: any[];
  singleState: any;
  validZipErr = false;

  clientEmailAddress: string;
  ClientEmailChangeSub: Subscription;
  public billFrequencyList: Array<vwIdCodeName> = [];

  constructor(
    private toastDisplay: ToastDisplay,
    private billingService: BillingService,
    private employeeService: EmployeeService,
    private rateTableService: RateTableService,
    private miscService: MiscService,
    private personService: PersonService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private placeService: PlacesService,
    private sharedService: SharedService
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate.setHours(0, 0, 0, 0);
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getFrequencyListItem();
    this.ClientEmailChangeSub = this.sharedService.ClientEmailChange$.subscribe(res => {
      this.clientEmailAddress = res;
      if (!this.clientEmailAddress && this.selectedInvoicePref) {
        if (this.selectedInvoicePref.code == 'PAPER_AND_ELECTRONIC' || this.selectedInvoicePref.code == 'ELECTRONIC') {
          this.selectedInvoicePref = null;
          this.invoiceDelivery = null;
          this.invoiceAddress = true;
        }
      }
    });
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('officeId')) {
      this.officeId = changes.officeId.currentValue;
      if (this.officeId) {
        this.getBillingSetting();
        this.getList();
      }
    }
    if (changes.clientId && changes.clientId.currentValue) {
      this.clientId = changes.clientId.currentValue;
      this.getRateTables();
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.ClientEmailChangeSub) {
      this.ClientEmailChangeSub.unsubscribe();
    }
  }

  private getBillingSettings() {
    this.billingService.v1BillingSettingsPersonPersonIdGet({personId: this.clientId})
    .pipe(map(UtilsHelper.mapData)).subscribe((res) => {
      this.billingSettingDetails = res[0];
      if (this.billingSettingDetails) {
        if (this.billingSettingDetails.invoiceDelivery) {
          this.invoiceDelivery = this.billingSettingDetails.invoiceDelivery.id;
          this.selectInvoicePref(this.billingSettingDetails.invoiceDelivery.id);
        }
        if (this.billingSettingDetails.fixedAmount) {
          this.fixedAmount = this.billingSettingDetails.fixedAmount;
        }
      }
    });
  }

  private getList() {
    this.isLoadingb = true;
    forkJoin([
      this.billingService.v1BillingInvoicedeliveryListGet({}),
      this.miscService.v1MiscStatesGet({}),
      this.personService.v1PersonAddressPersonIdGet({personId: this.clientId}),
      this.billingService.v1BillingRateOfficeOfficeIdGet({officeId: this.officeId})
    ]).pipe(
      map((res: Array<any>) => {
        return {
          invoicedelivery: JSON.parse(res[0] as any).results,
          stateList: JSON.parse(res[1] as any).results,
          persionAddress: JSON.parse(res[2] as any).results,
          rateList: JSON.parse(res[3] as any).results,
        };
      }),
      finalize(() => {
        this.isLoadingb = false;
      })
    ).subscribe(res => {
      const inv = res.invoicedelivery.find(item => item.code === 'ELECTRONIC');
      const inv1 = res.invoicedelivery.find(item => item.code === 'PAPER');
      const inv2 = res.invoicedelivery.find(item => item.code === 'PAPER_AND_ELECTRONIC');
      this.invoicedeliveryList = [inv, inv1, inv2];
      // this.stateList = res.stateList;
      this.persionAddress = res.persionAddress;
      const rateList = res.rateList || [];
      rateList.map((item) => {
        item.rateAmount = (item.rateAmount) ? (item.rateAmount).toFixed(2) : (0).toFixed(2);
      });
      this.allRateList = clone(rateList);
      this.rateList = rateList.filter(a =>
        (a.billingTo.code === 'BOTH' ||
          a.billingTo.code === 'CLIENT') && a.status === 'Active'
      );
      if (this.pageType === 'creatematter') {
        this.getBillingSettings();
      }
    });
  }

  public getRateTables() {
    this.rateTableService.v1RateTableViewGet({clientId: this.clientId}).subscribe((result: any) => {
      const rateTable = JSON.parse(result).results;
      if (rateTable.name) {
        if (rateTable.jobFamily && rateTable.jobFamily.length) {
          rateTable.jobFamily.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 0);
        }
        this.rateTables = [rateTable];
        if (this.rateTables.length) {
          this.isCustomBillingRate = true;
        }
      }
    });
  }

  public getBillingSetting() {
    this.billingService.v1BillingSettingsOfficeOfficeIdGet({officeId: this.officeId})
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      ).subscribe(res => {
      this.billingSettings = res[0];
      const daysList = UtilsHelper.getDayslistn();
      if (!this.billingSettings.billFrequencyDay) {
        this.billingSettings.billFrequencyDay = moment().day();
      }
      this.billFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.billFrequencyDay);
      this.displayCurrentPrd(this.billingSettings.billFrequencyStartingDate, this.billingSettings.billFrequencyDay, this.billingSettings.billFrequencyDuration, this.billingSettings.billFrequencyQuantity);
    });
  }

  public selectInvoicePref(selectedValue) {
    this.selectedInvoicePref = this.invoicedeliveryList.find(item => item.id === selectedValue);
  }

  public getValue(data: IBillPeriod) {
    this.oriSettingsDetails = data;
    if (data) {
      const effectivePeriod = UtilsHelper.getFinalEffectiveDate(data.effectiveDate, data);
      if (data.billFrequencyStartingDate) {
        this.getSettingsDetails.billFrequencyStartingDate = moment(effectivePeriod.previosEffectiveDate).format('YYYY-MM-DD');
      }
      if (data.billFrequencyNextDate) {
        this.getSettingsDetails.billFrequencyNextDate = moment(effectivePeriod.newEffectiveDate).format('YYYY-MM-DD');
      }
      if (data.effectiveDate) {
        this.getSettingsDetails.effectiveDate = moment(data.effectiveDate).format('YYYY-MM-DD');
      }
      this.getSettingsDetails.billFrequencyDay = data.billFrequencyDay;
      this.getSettingsDetails.repeatType = data.repeatType;
      this.getSettingsDetails.billFrequencyRecursOn = (data.billFrequencyRecursOn) ? data.billFrequencyRecursOn : null;
      if (data.billFrequencyQuantity) {
        this.getSettingsDetails.billFrequencyQuantity = data.billFrequencyQuantity;
      }
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
   * allow only number
   * @param event
   */
  public checkNumber(event) {
    // this.zipcodeFlag = !!(this.zip);
    // this.zipcodeFlagInvalid = (this.zip && (this.zip.length === 5 || this.zip.length === 6));
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  private displayCurrentPrd(selectedDate, days, billFrequencyDuration, billFrequencyQuantity) {
    const data = {
      billFrequencyDurationType: billFrequencyDuration.code,
      billFrequencyDay: days,
      billFrequencyQuantity,
      billFrequencyRecursOn: +this.billingSettings.billFrequencyRecursOn,
      repeatType: +this.billingSettings.repeatType
    };
    const effectivePeriod = UtilsHelper.getFinalEffectiveDate(moment((selectedDate) ? selectedDate : new Date()).format('MM/DD/YYYY'), data);
    this.displayStartDate = (moment(effectivePeriod.previosEffectiveDate).isAfter(moment())) ? moment(effectivePeriod.previosEffectiveDate).format('MM/DD/YYYY') : moment().format('MM/DD/YYYY');
    this.displayEndDate = moment(effectivePeriod.newEffectiveDate).format('MM/DD/YYYY');
  }

  public getPaymentMethodList(event) {
    this.paymentList = event;
    if (this.paymentList && this.paymentList.ccDeleted && this.paymentList.ccDeleted.length > 0) {
      this.paymentList.ccDeleted.map((obj) => {
        obj.cvv = (obj.cvv) ? obj.cvv : '123';
      });
    }
    if (this.paymentList && this.paymentList.creditCardList && this.paymentList.creditCardList.length > 0) {
      this.paymentList.creditCardList.map((obj) => {
        obj.cvv = (obj.cvv) ? obj.cvv : '123';
      });
    }
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
    const modelRef = this.modalService.open(FixedFeeMatterComponent, {
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

  /**
   * add fixed fee details to list
   * @param event
   */
  public addToList(event?: any) {
    switch (this.modalType) {
      case 'addOn':
        this.addOnList.push(...event);
        break;
      case 'fixedFeeservice':
        this.showFixedFeeError = false;
        this.origFixedFeeList = [];
        this.origFixedFeeList.push(...event);
        this.fixedFeeList = [...this.origFixedFeeList];
        break;
    }
  }


  /**
   *  Delete AddOn List
   */
  public deleteList(index: number, fixedFee: string) {
    switch (fixedFee) {
      case 'addOn':
        this.addOnList.splice(index, 1);
        break;

      case 'fixedFeeservice':
        this.fixedFeeList.splice(index, 1);
        break;

    }
  }

  /**
   * Edit AddOn List
   * @param $event
   * @param row
   * @param template
   * @param fixedFee
   */
  public editList($event, row, template, fixedFee) {
    this.modalType = fixedFee;
    this.index = row;
    this.FixedFeeEditForm = this.formBuilder.group({
      code: ['', Validators.required],
      description: ['', Validators.required],
      amount: ['', Validators.required]
    });

    switch (this.modalType) {
      case 'addOn': {
        this.custom = !!this.addOnList[row].isCustomAddOn;
        this.editDetails = {...this.addOnList[row]};
        this.addOnList[row].amount = (+this.addOnList[row].amount).toFixed(2);
        this.FixedFeeEditForm.patchValue(this.addOnList[row]);
        break;
      }

      case 'fixedFeeservice': {
        this.custom = !!this.fixedFeeList[row].isCustomAddOn;
        this.editDetails = {...this.fixedFeeList[row]};
        this.fixedFeeList[row].amount = (+this.fixedFeeList[row].amount).toFixed(2);
        this.FixedFeeEditForm.patchValue(this.fixedFeeList[row]);
        break;
      }
    }
    this.displayCrossIcn = this.editDetails && !this.editDetails.isCustomAddOn && this.editDetails.amount !== this.editDetails.oriAmount;

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
    if (!this.f.amount.value) {
      return;
    }
    this.formSubmitted = true;
    switch (this.modalType) {
      case 'addOn': {
        if (!this.custom) {
          if (this.f.amount.value === '') {
            return;
          }
          this.addOnList[this.index].amount = +this.f.amount.value;
          this.addOnList[this.index].isCustom = (this.addOnList[this.index].amount !== this.addOnList[this.index].oriAmount);
          this.formSubmitted = false;
        } else {
          if (!this.isFormValid()) {
            return;
          }

          this.addOnList.splice(this.index, 1, {
            code: this.f.code.value,
            description: this.f.description.value,
            amount: +this.f.amount.value,
            isCustomAddOn: true,
          });
        }
      }
        break;

      case 'fixedFeeservice' : {
        if (!this.custom) {
          if (this.f.amount.value === '') {
            return;
          }
          this.origFixedFeeList[this.index].amount = +this.f.amount.value;
          this.origFixedFeeList[this.index].isCustom = (this.origFixedFeeList[this.index].amount !== this.origFixedFeeList[this.index].oriAmount);
          this.formSubmitted = false;
        } else {
          if (!this.isFormValid()) {
            return;
          }

          this.origFixedFeeList.splice(this.index, 1, {
            code: this.f.code.value,
            description: this.f.description.value,
            amount: +this.f.amount.value,
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

  /******** Closes Modal*****/
  public close() {
    this.custom = false;
    this.modalService.dismissAll(null);
  }

  /***** function to remove amount prefix */
  removePrefix(event?: any): void {
    if (event) {
      const key = event.keyCode || event.charCode;
      if (key == 8 || key == 46) {
        if (+this.f.amount.value <= 0) {
          this.f.amount.setValue(null);
        }
      }
    }
    if (!this.f.amount.value) {
      this.f.amount.setValue(null);
    }
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

  public rateFormat() {
    this.FixedFeeEditForm.patchValue({
      amount: (this.FixedFeeEditForm.value.amount) ? (+this.FixedFeeEditForm.value.amount).toFixed(2) : (0).toFixed(2)
    });
  }

  /**
   * Handle manage original rate for services
   */
  public originalRate() {
    this.editDetails.amount = this.editDetails.oriAmount;
    switch (this.modalType) {
      case 'addOn':
        this.FixedFeeEditForm.patchValue(this.editDetails);
        break;

      case 'fixedFeeservice':
        this.FixedFeeEditForm.patchValue(this.editDetails);
        break;
    }
    this.displayCrossIcn = this.editDetails && !this.editDetails.isCustomAddOn && this.editDetails.amount !== this.editDetails.oriAmount;
  }

  public isNotValidBillingInformation() {
    if (this.isFixedFee) {
      if (this.fixedFeeList.length === 0) {
        this.showFixedFeeError = true;
        return true;
      }
      if (+this.paymentMode == 2 && this.deferDate == null) {
        return true;
      }
      if (this.fixedFeeList.length === 0) {
        this.showFixedFeeError = true;
        return true;
      }
      const now = moment();
      const dueDate = moment(moment(this.deferDate).format('YYYY-MM-DD'));
      if (+this.paymentMode == 2 && !dueDate.isSameOrAfter(now, 'date')) {
        this.invalidDeferDate = true;
        return true;
      } else {
        this.invalidDeferDate = false;
      }
    } else {
      if (!this.isInherited && !this.isWorkComplete) {
        if (
          !this.oriSettingsDetails.billFrequencyQuantity ||
          !this.oriSettingsDetails.billFrequencyDuration ||
          !this.oriSettingsDetails.effectiveDate
        ) {
          return true;
        }
        if (this.oriSettingsDetails && this.oriSettingsDetails.billFrequencyDurationType === 'MONTHS') {
          if (!this.oriSettingsDetails.billFrequencyRecursOn) {
            return true;
          }
        }
      }
      if (this.isCustomBillingRate && !this.rateTables.length) {
        return true;
      }
    }
    if (!this.invoiceDelivery) {
      return true;
    }

    if (this.selectedInvoicePref && this.selectedInvoicePref.code !== 'ELECTRONIC' && !this.invoiceAddress) {
      if (!this.address || !this.state || !this.city || (this.zip && this.zip.length < 3)) {
        return true;
      }
    }
    return false;

  }

  public getDisburs(data) {
    if (data && data.length > 0) {
      data.map((obj) => {
        obj.isCustom = (obj.isCustom) ? true : false;
        obj.customRate = (obj.customRate) ? +obj.customRate : obj.customRate;
      });
      this.selDisbursementTypes = data;
    }
  }

  openRateTableModal() {
    const modalRef = this.modalService.open(RateTableModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
      windowClass: 'modal-xlg'
    });
    modalRef.componentInstance.rateTables = cloneDeep(this.rateTables);
    modalRef.result.then((result) => {
      this.rateTables = result;
    }, () => {});
  }

  deleteRateTable(index) {
    this.rateTables.splice(index, 1);
  }

  checkRateTables($event) {
    if (!$event) {
      this.rateTables = [];
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription)
      this.stateCitySubscription.unsubscribe();
    if(input.length >= 3) {
        this.validZipErr = false
        this.stateCitySubscription =  this.placeService.v1PlacesZipcodeInputGet({input})
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if(res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if(res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) => this.stateList.push({name: state, code: res.state[index]}))
            if(res.city && res.city.length)
              this.cityList = [...res.city]
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if(this.stateList.length == 1)
              this.singleState = this.stateList[0].name;
            this.state = this.stateList.length ? this.stateList[0].code : null;
            this.city =  this.cityList.length ? this.cityList[0] : null;
            if (!this.stateList.length || !this.cityList.length) {
              setTimeout(() => {
                this.validZipErr = true;
              }, 100)
            }
          }
        });
        return;
      }
    this.stateList = [];
    this.cityList = [];
    this.singleState = null;
    this.validZipErr = false;
    this.state = null;
    this.city = null;
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  setCustomBillingFrequency(event) {
    this.isWorkComplete = false;
  }
  private getFrequencyListItem() {
    this.billingService
      .v1BillingBillfrequencyListGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.billFrequencyList = res.filter(item => item.code !== 'DAYS');
          }
        },
        err => {
        }
      );
  }
}
