import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IFixedFreeServices, IOffice, IStep, Page, vwMatterResponse } from 'src/app/modules/models';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { vwAddOnService, vwAddressDetails, vwBillingSettings, vwClient, vwMatterBillNow, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, FixedFeeServiceService, MatterService, MiscService, PersonService } from 'src/common/swagger-providers/services';
import { ToastDisplay } from '../../../../guards/toast-service';
import * as errors from '../../../shared/error.json';
import { DialogService } from '../../dialog.service';
import { UtilsHelper } from '../../utils.helper';
import { AddOnServiceComponent } from './add-on-service/add-on-service.component';

interface IAdrs {
  id: number;
  address: string;
  address2: string;
  city: string;
  state: number;
  zip: string;
  addressTypeId: number;
  addressTypeName: string;
}

interface Idata {
  person?: {id?: number, name?: string};
  matter?: {id?: number, name?: string};
  fixedAmount?: number;
  invoiceDelivery?:{ id?: number; code?: string; name?: string; email?:string;primaryPhone?: string;};
  minimumTrustBalance?: number;
  billFrequencyQuantity?: number;
  billFrequencyDuration?: { id?: number; code?: string; name?: string; email?:string;primaryPhone?: string; };
}
interface IList {
  id?: number;
  code?: string;
  name?: string;
  email?:string;
  primaryPhone?: string;
};

@Component({
  selector: 'app-billing-info',
  templateUrl: './billing-info.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingInfoComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<IStep>();
  @Output() readonly prevStep = new EventEmitter<String>();
  @Input() pageType: string;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @Input() matterDetails: vwMatterResponse;
  @Input() clientId: number;
  @Input() isClientConversion = false;
  @Input() isTrustAccountEnabled: boolean;

  private matterFullDetails: vwMatterResponse;

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
  public billFrequencyQuantity: number;
  public billFrequencyDuration: number;
  public daysArr = [{ val: 1 }, { val: 2 }, { val: 3 }, { val: 4 }, { val: 5 }, { val: 6 }, { val: 7 }, { val: 8 }, { val: 9 }, { val: 10 }];
  public frequencyList: Array<IList>;
  public invoicedeliveryList: Array<IList>;
  public selectedInvoicePref: IList;
  public stateList: Array<IOffice> = [];
  public invoiceAddress: boolean = true;
  public city: string;
  public state: string;
  public zip: string;
  public address: string;
  public address2: string;
  public error_data = (errors as any).default;
  public invoiceDelivery: number;
  public clientDetail: vwClient;
  public fixedFreeServices: Array<IFixedFreeServices>;
  public selectedFixedFree: IFixedFreeServices;
  public billingSettingDetails: vwBillingSettings;
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

  public enteredRateAmount: number = 0;
  public deferDate: string;

  paymentMode = 1;

  public selectedFixedFreeId: number;

  addOnServicesList: Array<vwAddOnService> = [];
  paymentPlanList: Array<PaymentPlanModel> = [];
  persionAddress: Array<vwAddressDetails> = [];
  public clientBillingSettings: vwBillingSettings;
  public minDate = new Date();
  currentActive: number;

  constructor(
    private modalService: NgbModal,
    private toastDisplay: ToastDisplay,
    private billingService: BillingService,
    private miscService: MiscService,
    private fixedFeeServiceService: FixedFeeServiceService,
    private dialogService: DialogService,
    private personService: PersonService,
    private matterService: MatterService,
    private clientService: ClientService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.minDate.setDate(this.minDate.getDate() + 1);
    this.minDate.setHours(0, 0, 0, 0);
  }

  ngOnInit() {
    this.getList();
  }

  private getList() {
    forkJoin([
      this.billingService.v1BillingBillfrequencyListGet$Response({}),
      this.billingService.v1BillingInvoicedeliveryListGet$Response({}),
      this.miscService.v1MiscStatesGet$Response({}),
      this.personService.v1PersonAddressPersonIdGet$Response({personId: this.clientId}),
      this.fixedFeeServiceService.v1FixedFeeServiceMappingMatteridGet$Response({ matterid: this.matterDetails.id }),
      this.fixedFeeServiceService.v1FixedFeeServiceAddonserviceMatteridGet$Response({ matterid: this.matterDetails.id }),
      this.fixedFeeServiceService.v1FixedFeeServicePaymentPlanMatteridGet$Response({ matterid: this.matterDetails.id }),
      this.billingService.v1BillingSettingsPersonPersonIdGet$Response({ personId: +this.clientId }),
      this.matterService.v1MatterMatterIdGet$Response({ matterId: this.matterDetails.id }),
      this.clientService.v1ClientClientIdGet$Response({ clientId: this.clientId })
    ]).pipe(
      map((res: Array<any>) => {
        return {
          frequencyList: JSON.parse(res[0].body as any).results,
          invoicedelivery: JSON.parse(res[1].body as any).results,
          stateList: JSON.parse(res[2].body as any).results,
          persionAddress: JSON.parse(res[3].body as any).results,
          fixedFreeServices: JSON.parse(res[4].body as any).results,
          addOnServicesList: JSON.parse(res[5].body as any).results,
          paymentPlans: JSON.parse(res[6].body as any).results,
          clientBillingSettings: JSON.parse(res[7].body as any).results,
          matterFullDetails: JSON.parse(res[8].body as any).results,
          clientDetails: JSON.parse(res[9].body as any).results,
        }
      }),
      finalize(() => {
      })
    ).subscribe(res => {
      this.frequencyList = res.frequencyList;
      this.invoicedeliveryList = res.invoicedelivery;
      this.stateList = res.stateList;
      this.persionAddress = res.persionAddress;
      this.fixedFreeServices = res.fixedFreeServices.allFixedFee;
      this.addOnServicesList = res.addOnServicesList;
      this.paymentPlanList = res.paymentPlans;
      this.matterFullDetails = res.matterFullDetails;
      this.clientDetail = res.clientDetails;

      this.invoicedeliveryList.forEach(item => {
        if (item.code == 'PAPER_AND_ELECTRONIC') {
          this.invoiceDelivery= item.id;
        }
      })

      if (res.clientBillingSettings && res.clientBillingSettings.length > 0) {
        this.clientBillingSettings = res.clientBillingSettings[res.clientBillingSettings.length -1];
        if (this.clientBillingSettings) {
          this.paymentMode = this.clientBillingSettings.fixedFeeIsFullAmount == false ? 2 : 1;
          if (!this.clientBillingSettings.fixedFeeIsFullAmount) {
            this.enteredRateAmount = this.clientBillingSettings.fixedFeeAmountToPay;
          }
          if (this.clientBillingSettings.fixedFeeBillOnWorkComplete) {
            this.paymentMode = 3;
          } else {
            this.deferDate = this.clientBillingSettings.fixedFeeDueDate;
          }
          if (this.clientBillingSettings.invoiceDelivery) {
            this.invoiceDelivery = this.clientBillingSettings.invoiceDelivery.id;
            this.selectedInvoicePref = this.clientBillingSettings.invoiceDelivery;
          }
          this.minimumTrustBalance = this.clientBillingSettings.minimumTrustBalance;
        }
      }

      this.selectedFixedFreeId = (res.fixedFreeServices && res.fixedFreeServices.selectedFixedFee) ? res.fixedFreeServices.selectedFixedFee.fixedFeeId : null;
      if (this.fixedFreeServices && this.fixedFreeServices.length > 0) {
        this.fixedFreeServices.map(obj => {
          if (this.selectedFixedFreeId === obj.id) {
            obj.selected = true;
            this.selectedFixedFree = obj;
          } else {
            obj.selected = false;
          }

          obj.originalAmount = obj.amount;
        });
      }

      this.billingSettingDetails = res.clientBillingSettings[0];
      if (this.billingSettingDetails) {
        if (this.billingSettingDetails.billFrequencyQuantity) {
          this.billFrequencyQuantity = this.billingSettingDetails.billFrequencyQuantity;
        }
        if (this.billingSettingDetails.billFrequencyDuration) {
          this.billFrequencyDuration = this.billingSettingDetails.billFrequencyDuration.id;
        }
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

  get rateAmount() {
    let amount = 0;
    if (this.selectedFixedFree) {
      amount = this.selectedFixedFree.amount;
    }

    if (this.addOnServicesList) {
      this.addOnServicesList.forEach(a => {
        amount += a.serviceAmount;
      });
    }

    return amount;
  }

  createAddOnService() {
    let modelRef = this.modalService.open(AddOnServiceComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modelRef.result.then(res => {
      if(res) {
        const body = <vwAddOnService>{
          matterId: this.matterDetails.id,
          serviceName: res.serviceName,
          serviceAmount: +res.serviceAmount
        };

        this.fixedFeeServiceService.v1FixedFeeServiceAddonservicePost$Json({
          body: body
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if(res > 0) {
            this.toastDisplay.showSuccess(this.error_data.create_add_on_service_success);
            this.getAddonServicesList();
          } else {
            this.toastDisplay.showError(this.error_data.create_add_on_service_error);
          }
        },
        () => {
        });
      }
    });
  }

  private getAddonServicesList() {
    this.fixedFeeServiceService.v1FixedFeeServiceAddonserviceMatteridGet({
      matterid: this.matterDetails.id
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      if(res) {
        this.addOnServicesList = res;
      }
    });
  }

  editAddOnService(service: vwAddOnService) {
    let modelRef = this.modalService.open(AddOnServiceComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modelRef.componentInstance.addOnService = service;

    modelRef.result.then(res => {
      if(res) {
        const body = <vwAddOnService>{
          id: service.id,
          tenantId: service.tenantId,
          matterId: this.matterDetails.id,
          serviceName: res.serviceName,
          serviceAmount: +res.serviceAmount
        };

        this.fixedFeeServiceService.v1FixedFeeServiceAddonservicePut$Json({
          body: body
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if(res > 0) {
            this.toastDisplay.showSuccess(this.error_data.update_add_on_service_success);
            this.getAddonServicesList();
          } else {
            this.toastDisplay.showError(this.error_data.update_add_on_service_error);
          }
        },
        () => {
        });
      }
    });
  }

  deleteAddOnService(service: vwAddOnService) {
    this.dialogService.confirm(this.error_data.delete_add_on_service_confirm, 'Delete').then(res => {
      if(res) {
        this.fixedFeeServiceService.v1FixedFeeServiceAddonserviceIdDelete({
          id: service.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if(res > 0) {
            this.toastDisplay.showSuccess(this.error_data.delete_add_on_service_success);
            this.getAddonServicesList();
          } else {
            this.toastDisplay.showError(this.error_data.delete_add_on_service_error);
          }
        },
        () => {
        });
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

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57 || +k == 8 || +k == 9);
  }

  /**
   * update billing info
   */
  public saveNext() {
    let data = this.clientBillingSettings;

    data["fixedAmount"] = this.fixedAmount;
    if (this.invoiceDelivery) {
      let inc = this.invoicedeliveryList.find((obj) => obj.id === this.invoiceDelivery);
      data["invoiceDelivery"] = inc;
    }
    if (this.minimumTrustBalance) {
      data["minimumTrustBalance"] = +this.minimumTrustBalance;
    }

    if(!this.matterDetails.isFixedFee && !this.billFrequencyQuantity) {
      this.toastDisplay.showError('Please enter Bill Issuance Frequency Quantity.');
      return;
    }

    if(!this.matterDetails.isFixedFee && !this.billFrequencyDuration) {
      this.toastDisplay.showError('Please enter Bill Issuance Frequency Duration.');
      return;
    }

    if (this.billFrequencyQuantity) {
      data["billFrequencyQuantity"] = +this.billFrequencyQuantity;
    }
    if (this.billFrequencyDuration) {
      let bfd = this.frequencyList.find((obj) => obj.id === this.billFrequencyDuration);
      data["billFrequencyDuration"] = bfd;
    }
    if (this.selectedInvoicePref && this.selectedInvoicePref.code !== 'ELECTRONIC' && !this.invoiceAddress) {
      if (!this.address || !this.address2 || !this.state || !this.city || !this.zip) {
        this.toastDisplay.showError(this.error_data.invoice_address_required);
        return false;
      }
    }

    if (this.selectedInvoicePref && (this.selectedInvoicePref.code == 'ELECTRONIC' || this.selectedInvoicePref.code == 'PAPER_AND_ELECTRONIC')) {
      if (!this.hasEmail) {
        this.toastDisplay.showError('Please select valid Invoice Preference.');
        return;
      }
    }

    data['fixedFeeIsFullAmount'] = this.paymentMode == 1;
    data['fixedFeeAmountToPay'] = this.paymentMode == 1 ? this.rateAmount : 0;
    data['fixedFeeRemainingAmount'] = this.paymentMode == 1 ? 0 : this.rateAmount;
    data['fixedFeeDueDate'] = this.paymentMode == 2 ? this.deferDate : null;
    data['fixedFeeBillOnWorkComplete'] = this.paymentMode == 3 ? true : false;

    if (this.matterDetails.isFixedFee) {
      if (this.paymentMode == 2 && this.deferDate == null) {
        this.toastDisplay.showError('Please select Defer Date');
        return;
      }

      if (!this.selectedFixedFree) {
        this.toastDisplay.showError('Please select atleat 1 fixed fee service.');
        return;
      }

      let now = moment();
      let dueDate = moment(moment(data['fixedFeeDueDate']).format('YYYY-MM-DD'));

      if (this.paymentMode == 2 && !dueDate.isSameOrAfter(now, 'date')){
        this.toastDisplay.showError('Please select valid defer date.');
        return;
      }
    }

    if (this.invoiceAddress) {
      let primaryAdrs = this.persionAddress.find(obj => obj.addressTypeName.toLowerCase() === 'primary');
      if (primaryAdrs) {
        data['invoiceAddressId'] = primaryAdrs.id;
      }
      this.update(data);
    } else {
      let body = {
        "id": 0,
        "personId": +this.clientId,
        "addressTypeId": 4,
        "addressTypeName": "invoice",
        "address1": this.address,
        "address2": this.address2,
        "city": this.city,
        "state": this.state,
        "zipCode": this.zip
      }
      this.personService.v1PersonAddressPost$Json$Response({ body: body }).subscribe(res => {
        if (res) {
          data['invoiceAddressId'] = JSON.parse(res.body as any).results as number;
          this.update(data);
        }
      }, (err) => {
      });
    }
  }

  private update(data) {
    const forkjoinObject = [
      this.billingService.v1BillingSettingsPut$Json$Response({ body: data })
    ];

    if (this.matterDetails.isFixedFee) {
      if (this.selectedFixedFree) {
        const body = {
          "fixedFeeId": this.selectedFixedFree.id,
          "matterId": this.matterDetails.id,
          "rateAmount": +this.selectedFixedFree.amount,
          "isCustom": this.selectedFixedFree.isCustom
        };
        forkjoinObject.push(this.fixedFeeServiceService.v1FixedFeeServiceMappingPost$Json$Response({ body: body }));
      }
    }

    forkJoin(forkjoinObject)
      .pipe(map(res => {
        if (forkjoinObject.length === 2) {
          return {
            updateBilling: JSON.parse(res[0].body as any).results as number,
            updateFixedFree: JSON.parse(res[1].body as any).results as number,
          };
        } else {
          return {
            updateBilling: JSON.parse(res[0].body as any).results as number,
          };
        }
      }),
      finalize(() => {
      })).subscribe(res => {
        if (res.updateBilling > 0) {
          if (this.matterDetails.isFixedFee && res.updateFixedFree > 0) {
            this.billNow(res.updateFixedFree);
          }

          this.billingService.v1BillingSettingsMatterMatterIdGet$Response({ matterId: +this.matterDetails.id }).subscribe(() => {});
          if(this.isTrustAccountEnabled){
            this.nextStep.emit({ next: 'trustaccount', current: 'billing' });
          }else{
            this.nextStep.emit({ next: 'calendar', current: 'billing' });
          }
        } else {
          this.toastDisplay.showError(this.error_data.server_error);
        }
      }, () => {
      });
  }

  private billNow(fixedFeeMappingId: number) {
    if (this.paymentMode == 1) {
      let bilingAttorneyId = 0;

      if (this.matterFullDetails.billingAttorney && this.matterFullDetails.billingAttorney.length > 0) {
        bilingAttorneyId = this.matterFullDetails.billingAttorney[0].id;
      }

      if (bilingAttorneyId == 0) {
        if (this.matterFullDetails.responsibleAttorney && this.matterFullDetails.responsibleAttorney.length > 0) {
          bilingAttorneyId = this.matterFullDetails.responsibleAttorney[0].id;
        }
      }

      const body: vwMatterBillNow = {
        addOnServiceIds: this.addOnServicesList ? this.addOnServicesList.map(a => a.id) : [],
        attorneyId: bilingAttorneyId,
        billAmount: +this.rateAmount,
        clientId: +this.clientId,
        matterId: this.matterDetails.id,
        officeId: this.matterDetails['officeId'],
        fixedFeeMappingId: [fixedFeeMappingId]
      };

      this.billingService.v1BillingMatterBillnowPost$Json({
        body: body
      }).subscribe(res => {

      });
    }
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

  get hasEmail() {
    if (this.clientDetail) {
      if (this.clientDetail.isCompany) {
        return this.clientDetail.primaryContactPerson ? !!this.clientDetail.primaryContactPerson.email : false;
      } else {
        return this.clientDetail.email;
      }
    } else {
      return false;
    }
  }


  prev() {
    this.prevStep.emit('matter');
  }

  validateEnteredAmount() {
    if(+this.enteredRateAmount > +this.rateAmount) {
      this.toastDisplay.showError('Please enter less than or equal to total amount.');
      this.enteredRateAmount = 0;
    }
  }

  deferModeChange() {
    if (this.paymentMode != 2) {
      this.deferDate = null;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
