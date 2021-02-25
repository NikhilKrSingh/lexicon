import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IBillPeriod, IOffice, IvwFixedFee, Page } from 'src/app/modules/models';
import { IBillingSettings } from 'src/app/modules/models/billing-setting.model';
import { FixedFeeMatterComponent } from 'src/app/modules/shared/fixed-fee-matter/fixed-fee-matter.component';
import { RateTableModalComponent } from 'src/app/modules/shared/rate-table-modal/rate-table-modal.component';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillingSettings, vwCreditCard, vwDisbursement, vwECheck, vwIdCodeName, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, EmployeeService, MiscService, PlacesService } from 'src/common/swagger-providers/services';
import * as Constant from '../../../shared/const';
import * as errorData from 'src/app/modules/shared/error.json';

interface IList {
  id?: number;
  code?: string;
  name?: string;
  email?: string;
  primaryPhone?: string;
}

@Component({
  selector: 'app-client-billing-info',
  templateUrl: './billing-info.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientBillingInfoComponent implements OnInit, OnDestroy {
  @ViewChild('jobFamilyTable', {static: false}) jobFamilyTable: DatatableComponent;

  @Input() formSubmitted: boolean;
  @Input() matterOpenDate: string = null;
  @Input() primaryAddress: any;
  clientEmailAddress: string;

  @Output() readonly changesMade = new EventEmitter<any>();

  public invoicedeliveryList: Array<IList>;
  public errorData: any = (errorData as any).default;
  public billingForm: FormGroup;
  public contingentCase = false;
  public isFixedFee = false;
  public stateList: Array<any> = [];
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
  public zip: string;
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
  public recurringName: Array<string> = [
    'First',
    'Second',
    'Third',
    'Fourth',
    'Last',
  ];
  public paymentList: {
    creditCardList: Array<vwCreditCard>;
    echeckList: Array<vwECheck>;
  };
  public rateList: Array<vwRate>;
  public customList: Array<vwRate> = [];
  public allRateList: Array<vwRate>;
  public ColumnMode = ColumnMode;
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
  public displayCrossIcn = false;
  public enteredRateAmount = 0;
  public deferDate: string;
  public paymentMode = 1;
  public minDate = new Date();
  officeId: number;
  public clientId: number;

  MatterLawOfficeChangeSub: Subscription;
  clientEmailChangeSub: Subscription;
  IsBillingSettingsLoading = false;
  isCustomBillingRate = false;

  public createRateTableForm: FormGroup;
  public tableRateForm: FormGroup;
  showJobFamilyList: boolean;
  public jobFamilyList = [];
  public originalJobFamilyList = [];

  page = new Page();
  pageSelector = new FormControl('10');
  pageSelected = 1;
  limitArray: Array<number> = [10, 30, 50, 100];
  counter = Array;
  messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  selectedJobFamilies: any = [];
  selectedJobFamilyDisplayList: any[] = [];
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  SelectionType = SelectionType;
  public rateTables = [];
  rateTableFormSubmitted: boolean;
  createRateTableFormSubmitted: boolean;
  public selDisbursementTypes: Array<vwDisbursement> = [];
  stateCitySubscription: any;
  cityList: any[];
  singleState: any;
  validZipErr: boolean = false;
  public billFrequencyList: Array<vwIdCodeName> = [];

  constructor(
    private toastDisplay: ToastDisplay,
    private billingService: BillingService,
    private miscService: MiscService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private sharedService: SharedService,
    private employeeService: EmployeeService,
    private placeService: PlacesService
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate.setHours(0, 0, 0, 0);
  }

  ngOnInit() {
    this.getList();
    this.getJobFamilies();
    this.getFrequencyListItem();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          console.log(this.permissionList);
        }
      }
    });

    this.MatterLawOfficeChangeSub = this.sharedService.MatterLawOfficeChange$.subscribe(
      (office) => {
        this.officeId = office;

        if (this.officeId) {
          this.IsBillingSettingsLoading = true;
          this.loadRateListAndBillingSettings();
          this.markChange();
        } else {
          this.IsBillingSettingsLoading = false;
          this.allRateList = [];
          this.rateList = [];
          this.customList = [];

          this.billingSettingDetails = {};
          this.billingSettings = {};

          this.displayStartDate = null;
          this.displayEndDate = null;

          this.markChange();
        }
      }
    );

    this.clientEmailChangeSub = this.sharedService.ClientEmailChange$.subscribe(res => {
      this.clientEmailAddress = res;
      if (!this.clientEmailAddress && this.selectedInvoicePref) {
        if (this.selectedInvoicePref.code == 'PAPER_AND_ELECTRONIC' || this.selectedInvoicePref.code == 'ELECTRONIC') {
          this.selectedInvoicePref = null;
          this.invoiceDelivery = null;
          this.invoiceAddress = true;
          this.changesMade.emit();
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.MatterLawOfficeChangeSub) {
      this.MatterLawOfficeChangeSub.unsubscribe();
    }

    if (this.clientEmailChangeSub) {
      this.clientEmailChangeSub.unsubscribe();
    }
  }

  private getList() {
    this.isLoadingb = true;
    forkJoin([
      this.billingService.v1BillingInvoicedeliveryListGet({}),
      this.miscService.v1MiscStatesGet({}),
    ])
      .pipe(
        map((res: Array<any>) => {
          return {
            invoicedelivery: JSON.parse(res[0] as any).results,
            stateList: JSON.parse(res[1] as any).results,
          };
        }),
        finalize(() => {
          this.isLoadingb = false;
        })
      )
      .subscribe((res) => {
        const inv = res.invoicedelivery.find(
          (item) => item.code === 'ELECTRONIC'
        );
        const inv1 = res.invoicedelivery.find((item) => item.code === 'PAPER');
        const inv2 = res.invoicedelivery.find(
          (item) => item.code === 'PAPER_AND_ELECTRONIC'
        );
        this.invoicedeliveryList = [inv, inv1, inv2];
        // this.stateList = res.stateList;
        this.isLoadingb = false;
      }, () => {
        this.isLoadingb = false;
      });
  }

  private loadRateListAndBillingSettings() {
    forkJoin(
      this.billingService.v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.officeId,
      }),
      this.billingService.v1BillingRateOfficeOfficeIdGet({
        officeId: this.officeId,
      })
    )
      .pipe(
        map((res: Array<any>) => {
          return {
            rateList: JSON.parse(res[1] as any).results,
            billingSettingDetails: JSON.parse(res[0] as any).results,
          };
        }),
        finalize(() => {
          this.isLoadingb = false;
          this.IsBillingSettingsLoading = false;
        })
      )
      .subscribe((res) => {
        const rateList = res.rateList || [];
        rateList.map((item) => {
          item.rateAmount = item.rateAmount
            ? item.rateAmount.toFixed(2)
            : (0).toFixed(2);
        });
        this.allRateList = clone(rateList);
        this.rateList = rateList.filter(
          (a) =>
            (a.billingTo.code === 'BOTH' || a.billingTo.code === 'CLIENT') &&
            a.status === 'Active'
        );

        this.billingSettingDetails = res.billingSettingDetails[0];
        this.billingSettings = res.billingSettingDetails[0];

        const daysList = UtilsHelper.getDayslistn();
        this.billFrequencyDayObj = daysList.find(
          (item) => item.value === this.billingSettings.billFrequencyDay
        );

        this.displayCurrentPrd(
          this.billingSettings.billFrequencyStartingDate,
          this.billingSettings.billFrequencyDay,
          this.billingSettings.billFrequencyDuration,
          this.billingSettings.billFrequencyQuantity
        );

        this.markChange();
        this.isLoadingb = false;
      }, () => {
        this.isLoadingb = false;
      });
  }

  public selectInvoicePref(selectedValue) {
    this.selectedInvoicePref = this.invoicedeliveryList.find(
      (item) => item.id === selectedValue
    );

    this.markChange();
  }

  markChange() {
    this.changesMade.emit();
  }

  public getValue(data: IBillPeriod) {
    this.oriSettingsDetails = data;
    if (data) {
      const effectivePeriod = UtilsHelper.getFinalEffectiveDate(
        data.effectiveDate,
        data
      );
      if (data.billFrequencyStartingDate) {
        this.getSettingsDetails.billFrequencyStartingDate = moment(
          effectivePeriod.previosEffectiveDate
        ).format('YYYY-MM-DD');
      }
      if (data.billFrequencyNextDate) {
        this.getSettingsDetails.billFrequencyNextDate = moment(
          effectivePeriod.newEffectiveDate
        ).format('YYYY-MM-DD');
      }
      if (data.effectiveDate) {
        this.getSettingsDetails.effectiveDate = moment(
          data.effectiveDate
        ).format('YYYY-MM-DD');
      }
      this.getSettingsDetails.billFrequencyDay = data.billFrequencyDay;
      this.getSettingsDetails.billFrequencyRecursOn = data.billFrequencyRecursOn
        ? data.billFrequencyRecursOn
        : null;
      if (data.billFrequencyQuantity) {
        this.getSettingsDetails.billFrequencyQuantity =
          data.billFrequencyQuantity;
      }
      if (data.billFrequencyDuration) {
        this.getSettingsDetails.billFrequencyDuration = {
          id: data.billFrequencyDuration,
          code: data.billFrequencyDurationType,
          name: data.billFrequencyDurationType.toLocaleLowerCase(),
        };
      }
      if (data.isInherited === false || data.isInherited) {
        this.getSettingsDetails.isInherited = data.isInherited;
      }
      this.getSettingsDetails.repeatType = data.repeatType;
    }

    this.markChange();
  }

  /**
   * allow only number
   * @param event
   */
  public checkNumber(event) {
    this.zipcodeFlag = this.zip ? true : false;
    this.zipcodeFlagInvalid =
      this.zip && (this.zip.length === 5 || this.zip.length === 6)
        ? true
        : false;
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  private displayCurrentPrd(
    selectedDate,
    days,
    billFrequencyDuration,
    billFrequencyQuantity
  ) {
    const data = {
      billFrequencyDurationType: billFrequencyDuration.code,
      billFrequencyDay: days,
      billFrequencyQuantity,
      billFrequencyRecursOn: +this.billingSettings.billFrequencyRecursOn,
      repeatType: +this.billingSettings.repeatType
    };
    const effectivePeriod = UtilsHelper.getFinalEffectiveDate(
      moment(selectedDate).format('MM/DD/YYYY'),
      data
    );
    this.displayStartDate = moment(
      effectivePeriod.previosEffectiveDate
    ).isAfter(moment())
      ? moment(effectivePeriod.previosEffectiveDate).format('MM/DD/YYYY')
      : moment().format('MM/DD/YYYY');
    this.displayEndDate = moment(effectivePeriod.newEffectiveDate).format(
      'MM/DD/YYYY'
    );
  }

  public getPaymentMethodList(event) {
    this.paymentList = event;
    if (
      this.paymentList &&
      this.paymentList.creditCardList &&
      this.paymentList.creditCardList.length > 0
    ) {
      this.paymentList.creditCardList.map((obj) => {
        obj.cvv = obj.cvv ? obj.cvv : '123';
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
      size: 'lg',
    });
    modelRef.componentInstance.modalType = this.modalType;
    modelRef.componentInstance.parentList = this.sendList;

    modelRef.result.then((res) => {
      if (res) {
        this.markChange();
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
        this.markChange();
        this.addOnList.splice(index, 1);
        break;

      case 'fixedFeeservice':
        this.markChange();
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
      amount: ['', Validators.required],
    });

    switch (this.modalType) {
      case 'addOn': {
        if (this.addOnList[row].isCustomAddOn ? true : false) {
          this.custom = true;
        } else {
          this.custom = false;
        }
        this.editDetails = { ...this.addOnList[row] };
        this.addOnList[row].amount = (+this.addOnList[row].amount).toFixed(2);
        this.FixedFeeEditForm.patchValue(this.addOnList[row]);
        break;
      }

      case 'fixedFeeservice': {
        if (this.fixedFeeList[row].isCustomAddOn ? true : false) {
          this.custom = true;
        } else {
          this.custom = false;
        }
        this.editDetails = { ...this.fixedFeeList[row] };
        this.fixedFeeList[row].amount = (+this.fixedFeeList[row]
          .amount).toFixed(2);
        this.FixedFeeEditForm.patchValue(this.fixedFeeList[row]);
        break;
      }
    }
    if (
      this.editDetails &&
      !this.editDetails.isCustomAddOn &&
      this.editDetails.amount !== this.editDetails.oriAmount
    ) {
      this.displayCrossIcn = true;
    } else {
      this.displayCrossIcn = false;
    }

    this.modalService.open(template, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'md',
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
      case 'addOn':
        {
          if (!this.custom) {
            if (this.f.amount.value === '') {
              return;
            }
            this.addOnList[this.index].amount = +this.f.amount.value;
            this.addOnList[this.index].isCustom =
              this.addOnList[this.index].amount !==
              this.addOnList[this.index].oriAmount
                ? true
                : false;
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

      case 'fixedFeeservice': {
        if (!this.custom) {
          if (this.f.amount.value === '') {
            return;
          }
          this.origFixedFeeList[this.index].amount = +this.f.amount.value;
          this.origFixedFeeList[this.index].isCustom =
            this.origFixedFeeList[this.index].amount !==
            this.origFixedFeeList[this.index].oriAmount
              ? true
              : false;
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
      .map((item) => +item.amount)
      .reduce((prev, curr) => +prev + +curr, 0);

    amount += this.addOnList
      .map((item) => +item.amount)
      .reduce((prev, curr) => +prev + +curr, 0);

    return amount;
  }

  validateEnteredAmount() {
    if (+this.enteredRateAmount > +this.rateAmount) {
      this.toastDisplay.showError(
        'Please enter less than or equal to total amount.'
      );
      this.enteredRateAmount = 0;
    }
  }

  deferModeChange() {
    if (this.paymentMode != 2) {
      this.deferDate = null;
    }

    this.markChange();
  }

  public rateFormat() {
    this.FixedFeeEditForm.patchValue({
      amount: this.FixedFeeEditForm.value.amount
        ? (+this.FixedFeeEditForm.value.amount).toFixed(2)
        : (0).toFixed(2),
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
    if (
      this.editDetails &&
      !this.editDetails.isCustomAddOn &&
      this.editDetails.amount !== this.editDetails.oriAmount
    ) {
      this.displayCrossIcn = true;
    } else {
      this.displayCrossIcn = false;
    }
  }

  public isNotValidBillingInformation() {
    if (!this.officeId) {
      return false;
    }

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
        if (
          this.oriSettingsDetails &&
          this.oriSettingsDetails.billFrequencyDurationType === 'MONTHS'
        ) {
          if (!this.oriSettingsDetails.billFrequencyRecursOn) {
            return true;
          }
        }
      }
      if (this.isCustomBillingRate && !this.rateTables.length) {
        return true;
      }
    }

    if (!this.selectedInvoicePref) {
      return true;
    }

    if (
      this.selectedInvoicePref &&
      this.selectedInvoicePref.code !== 'ELECTRONIC' &&
      !this.invoiceAddress
    ) {
      if (
        !this.address ||
        !this.state ||
        !this.city //||
        // !this.zipcodeFlag ||
        // !this.zipcodeFlagInvalid
      ) {
        return true;
      }
    }
    return false;
  }

  openRateTableModal(template?: any){
    const modalRef = this.modalService.open(RateTableModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
      windowClass: 'modal-xlg'
    });
    modalRef.componentInstance.rateTables = this.rateTables;
    modalRef.componentInstance.isClient = true;
    modalRef.result.then((result) => {
      this.rateTables = result;
    }, () => {});
  }

  showJobFamilyRate() {
    this.showJobFamilyList = true;
    this.tableRateForm = this.formBuilder.group({
      tableRate: [null]
    });
  }

  getJobFamilies() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.employeeService.v1EmployeeJobFamilyGet().subscribe((result: any) => {
      this.jobFamilyList = JSON.parse(result).results;
      this.jobFamilyList.forEach(jobFamily => {
        jobFamily.tableRate = jobFamily.baseRate;
      });
      this.originalJobFamilyList = [...this.jobFamilyList];
      this.updateDatatableFooterPage();
    });
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.jobFamilyList.length;
    this.page.totalPages = Math.ceil(
      this.jobFamilyList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    if (this.jobFamilyTable) {
      this.jobFamilyTable.offset = 0;
    }
  }

  saveRateTable(modalComponent) {
    this.createRateTableFormSubmitted = true;
    if (this.createRateTableForm.invalid || (this.tableRateForm && this.tableRateForm.invalid)) {
      return;
    }
    const formData = this.createRateTableForm.value;
    const jobFamily = [];
    this.originalJobFamilyList.forEach(jobFamilyDetail => {
      const item: any = {};
      item.id = jobFamilyDetail.id;
      item.name = jobFamilyDetail.name;
      item.baseRate = jobFamilyDetail.baseRate;
      item.tableRate = jobFamilyDetail.tableRate;
      item.isCustom = jobFamilyDetail.baseRate !== jobFamilyDetail.tableRate;
      jobFamily.push(item);
    });
    this.rateTables.push({
      id: 0,
      name: formData.name,
      description: formData.description,
      jobFamily
    });
    this.cancelRateTableModal(modalComponent);
  }

  cancelRateTableModal(modalComponent) {
    if (this.tableRateForm) {
      this.tableRateForm.reset();
    }
    this.createRateTableForm.reset();
    this.selectJobFamily({selected: []});
    modalComponent.dismiss('Cross click');
    this.createRateTableFormSubmitted = false;
    this.rateTableFormSubmitted = false;
    this.showJobFamilyList = false;
  }

  selectJobFamily(event) {
    this.selectedJobFamilies = event.selected;
    if (this.selectedJobFamilies.length) {
      this.tableRateForm.controls.tableRate.setValidators(Validators.required);
      this.tableRateForm.controls.tableRate.enable();
      this.tableRateForm.updateValueAndValidity();
    } else {
      if (this.tableRateForm) {
        this.tableRateForm.controls.tableRate.clearValidators();
        this.tableRateForm.controls.tableRate.disable();
        this.tableRateForm.updateValueAndValidity();
      }
    }
    this.getDisplayList();
    this.jobFamilyList.forEach(jobFamily => {
      const selectedJobFamily = this.selectedJobFamilies.filter(selected => selected.id === jobFamily.id);
      if (selectedJobFamily.length > 0) {
        jobFamily.selected = true;
      }
    });
  }

  getDisplayList() {
    this.selectedJobFamilyDisplayList = [];
    const displayList = [...this.selectedJobFamilies];
    // This is to show minimum of 4 entries in each column
    const chunkSize = Math.ceil(displayList.length / 3) > 4 ? Math.ceil(displayList.length / 3) : 4;
    displayList.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 0);
    while (displayList.length) {
      this.selectedJobFamilyDisplayList.push(displayList.splice(0, chunkSize));
    }
  }

  deleteRateTable(index) {
    this.rateTables.splice(index, 1);
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
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription){
      this.stateCitySubscription.unsubscribe();
    }
      if(input.length >= 3) {
        this.validZipErr = false;
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
            this.city = this.cityList.length ? this.cityList[0] : null;
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
    this.validZipErr = false;
    this.singleState = null;
    this.state = null;
    this.city = null;
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
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

  setInheritedFlag() {

  }

  setCustomBillingFrequency(event) {
    this.isWorkComplete = false;
  }
}
