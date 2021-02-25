import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { Page } from 'src/app/modules/models';
import { AddPaymentMethodModels } from 'src/app/modules/models/add-payment-method';
import { ICreditCards, IECheck } from 'src/app/modules/models/vm-credit-card.model';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddress, vwBillingSettings, vwClient, vwCreditCard, vwECheck } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, MatterService, MiscService } from 'src/common/swagger-providers/services';
import { DialogService } from '../../dialog.service';
import * as errors from '../../error.json';
import { UtilsHelper } from '../../utils.helper';
import { AddCreditCardComponent } from '../payment-method/add-credit-card/add-credit-card.component';
import { AddEcheckComponent } from '../payment-method/add-echeck/add-echeck.component';
import { EditCreditCardComponent } from '../payment-method/edit-credit-card/edit-credit-card.component';
import { EditEcheckComponent } from '../payment-method/edit-echeck/edit-echeck.component';

@Component({
  selector: 'app-payment-method-create-matter',
  templateUrl: './payment-method-create-matter.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class PaymentMethodCreateMatterComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('tableECheck', { static: false }) tableECheck: DatatableComponent;
  @Input() paymentMethodeText = false;
  @Input() hideEcheck = false;
  @Input() pageType = 'client';
  @Input() clientId: number;
  @Input() officeId: number;
  @Input() matterId: number;
  @Input() states: any;
  @Output() readonly getPaymentMethodList = new EventEmitter<{
    ccDeleted: Array<vwCreditCard>;
    echeckDeleted: Array<vwECheck>;
    creditCardList: Array<vwCreditCard>;
    echeckList: Array<vwECheck>;
  }>();

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public pageECheck = new Page();
  public pageECheckSelector = new FormControl('10');
  public pageECheckSelected = 1;
  creditCardList: Array<vwCreditCard> = [];
  echeckList: Array<vwECheck> = [];
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  clientDetails: vwClient;
  primaryAddress: vwAddress;
  private billingSettings: vwBillingSettings;
  private ccDeleted: Array<vwCreditCard> = [];
  private echeckDeleted: Array<vwECheck> = [];
  public ccLoading = true;
  public ecLoading = true;
  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private clientService: ClientService,
    private miscService: MiscService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private matterService: MatterService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
    this.pageECheck.pageNumber = 0;
    this.pageECheck.size = 10;
  }

  ngOnInit() {
    if (this.clientId) {
      this.getClientInfo();
      this.getPaymentMethods();
    }
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getClientInfo() {
    this.clientService
      .v1ClientClientIdGet({
        clientId: this.clientId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.clientDetails = res;
        if (
          this.clientDetails.addresses &&
          this.clientDetails.addresses.length > 0
        ) {
          this.primaryAddress = this.clientDetails.addresses.find(
            obj =>
              obj.addressTypeName &&
              obj.addressTypeName.toLowerCase() === 'primary'
          );
          if (!this.primaryAddress) {
            this.primaryAddress = {};
          }
        }
      });
  }

  private getBillingSettings(onSuccess: () => void) {
    let getObserval;
    if (this.pageType === 'client') {
      getObserval = this.billingService.v1BillingSettingsPersonPersonIdGet({
        personId: this.clientId
      });
    } else {
      getObserval = this.billingService.v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.officeId
      });
    }
    getObserval
      .pipe(
        map(res => {
          return JSON.parse(res as any).results[0] || {};
        }),
        finalize(() => {})
      )
      .subscribe(res => {
        if (res) {
          this.billingSettings = res;
        } else {
          this.billingSettings = {};
        }
        onSuccess();
      });
  }

  private getPaymentMethods() {
    this.ccLoading = true;
    this.ecLoading = true;
    if (this.matterId) {
      this.matterService
        .v1MatterPaymentMethodsbymatterMatterIdGet({
          matterId: this.matterId
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if (res) {
            this.creditCardList = res.creditCards;
            for(const data of this.creditCardList) {
              data['expiryDate'] = this.getExpiryDate(data.expirationDate);
            }
            this.calcTotalPages();
            if (!this.hideEcheck) {
              this.echeckList = res.eChecks;
              this.calcECheckTotalPages();
            }
            this.sendData();
            this.ccLoading = false;
            this.ecLoading = false;
          }
        }, () => {
            this.ccLoading = false;
            this.ecLoading = false;
        });
    } else {
      this.getCreditCards();
      this.getEcheckList();
    }
  }

  private getCreditCards() {
    this.billingService
      .v1BillingPaymentMethodPersonIdGet({
        personId: this.clientId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.creditCardList = res ? res : [];
          for(const data of this.creditCardList) {
            data['expiryDate'] = this.getExpiryDate(data.expirationDate);
          }
          this.calcTotalPages();
          this.sendData();
        }
        this.ccLoading = false;
      }, () => {
        this.ccLoading = false;
      });
  }

  private getEcheckList() {
    this.billingService
      .v1BillingEcheckPersonPersonIdGet$Response({
        personId: this.clientId
      })
      .subscribe(
        response => {
          if (response) {
            let res = JSON.parse(response.body as any).results;
            this.echeckList = res ? res : [];
            this.calcECheckTotalPages();
            this.sendData();
          }
          this.ecLoading = false;
        },
        () => {
          this.ecLoading = false;
        }
      );
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
   * Change Page size from Paginator
   */
  changeECheckPageSize() {
    this.pageECheck.size = this.pageECheckSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changeECheckPage() {
    this.pageECheck.pageNumber = this.pageECheckSelected - 1;
  }

  /**
   * Handle change page number
   */
  public echeckPageChange(e) {
    this.pageECheckSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.creditCardList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  /**
   * Calculates ECheck Page Count besed on Page Size
   */
  public calcECheckTotalPages() {
    this.pageECheck.totalElements = this.echeckList.length;
    this.pageECheck.totalPages = calculateTotalPages(
      this.pageECheck.totalElements,
      this.pageECheck.size
    );
    this.pageECheck.pageNumber = 0;
    this.pageECheckSelected = 1;
    this.tableECheck.offset = 0;
  }

  addPaymentMethod(type = 1) {
    if (type == 1) {
      this.addCreditCard();
    } else {
      this.getBillingSettings(() => {
        this.addECheck();
      });
    }
  }

  private addCreditCard() {
    let modalRef = this.modalService.open(AddCreditCardComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-lmd add-payment-method-dialog'
    });

    let component = modalRef.componentInstance;
    component.primaryAddress = this.primaryAddress || {};
    component.states = this.states;
    component.creditCard = {
      firstName: '',
      lastName: '',
      cardNumber: '',
      cvv: '',
      expirationDate: ''
    };
    component.validateMatterAutoPay = this.validateAutoPay;
    component.paymentMatterComponent = this;
    component.paymentPlanList = [];
    component.createFrom = 'creatematter';

    modalRef.result.then(
      (res: AddPaymentMethodModels.AddPaymentMethodEvent) => {
        if (res) {
          let cardData: ICreditCards = { ...res.creditCardInfo };
          cardData.address = res.address;
          cardData.oriCardNumber = res.creditCardInfo.cardNumber;
          cardData.person = {
            id: +this.clientId,
            name: null
          };
          cardData.new = true;
          this.creditCardList.push(cardData);
          this.creditCardList = [...this.creditCardList];
          for(const data of this.creditCardList) {
            data['expiryDate'] = this.getExpiryDate(data.expirationDate);
          }
          this.updateAutoPay('credit', this.creditCardList.length - 1);
        }
      }
    );
  }

  private addECheck() {
    let modalRef = this.modalService.open(AddEcheckComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd'
    });

    modalRef.componentInstance.billingSettings = this.billingSettings;
    modalRef.componentInstance.primaryAddress = this.primaryAddress;
    modalRef.componentInstance.validateMatterAutoPay = this.validateAutoPay;
    modalRef.componentInstance.paymentMatterComponent = this;
    modalRef.componentInstance.paymentPlanList = [];
    modalRef.componentInstance.createFrom = 'creatematter';
    modalRef.result.then(res => {
      if (res) {
        if (res) {
          let cardData: IECheck = { ...res.echeckInfo };
          cardData.address = res.address;
          cardData.person = {
            id: +this.clientId,
            name: null
          };
          cardData.new = true;
          this.echeckList.push(cardData);
          this.echeckList = [...this.echeckList];
          this.updateAutoPay('echeck', this.echeckList.length - 1);
        }
      }
    });
  }

  editCreditCard(row: vwCreditCard, $event, index) {
    $event.target.closest('datatable-body-cell').blur();
    let modalRef = this.modalService.open(EditCreditCardComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd'
    });

    let component = modalRef.componentInstance;
    component.primaryAddress = this.primaryAddress || {};
    component.states = this.states;
    component.creditCard = { ...row };
    component.address =
      this.clientDetails.addresses.find(a => a.id == row.addressId) || {};
    modalRef.result.then(res => {
      if (res) {
        this.updateArr(
          this.creditCardList,
          res.type === 'address' ? res.data.address : res.data.cc,
          res.type,
          index,
          'credit'
        );
      }
    });
  }

  editECheck(row: vwECheck, $event, index) {
    this.getBillingSettings(() => {
      this._editECheck(row, $event, index);
    });
  }

  _editECheck(row: vwECheck, $event, index) {
    $event.target.closest('datatable-body-cell').blur();

    let modalRef = this.modalService.open(EditEcheckComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd'
    });

    const component = modalRef.componentInstance;

    component.echeck = row;
    component.billingSettings = this.billingSettings;
    component.primaryAddress = this.primaryAddress;
    component.address =
      this.clientDetails.addresses.find(a => a.id == row.addressId) || {};
    modalRef.result.then(res => {
      if (res) {
        this.updateArr(
          this.echeckList,
          res.type === 'address' ? res.data.address : res.data.echeck,
          res.type,
          index,
          'echeck'
        );
      }
    });
  }

  deleteCreditCard(row: vwCreditCard, $event, index) {
    $event.target.closest('datatable-body-cell').blur();
    this.dialogService
      .confirm(
        this.error_data.delete_credit_card_confirm,
        'Delete',
        'Cancel',
        'Delete Credit Card'
      )
      .then(res => {
        if (res) {
          if (row.id) {
            let data = { ...row };
            data['isDelete'] = true;
            this.ccDeleted.push(data);
          }
          this.creditCardList.splice(index, 1);
          this.creditCardList = [...this.creditCardList];
          for(const data of this.creditCardList) {
            data['expiryDate'] = this.getExpiryDate(data.expirationDate);
          }
          this.sendData();
        }
      });
  }

  deleteECheck(row: vwECheck, $event, index) {
    $event.target.closest('datatable-body-cell').blur();
    this.dialogService
      .confirm(
        this.error_data.delete_echeck_confirm,
        'Delete',
        'Cancel',
        'Delete E-Check'
      )
      .then(res => {
        if (res) {
          if (row.id) {
            let data = { ...row };
            data['isDelete'] = true;
            this.echeckDeleted.push(data);
          }
          this.echeckList.splice(index, 1);
          this.echeckList = [...this.echeckList];
          this.sendData();
        }
      });
  }

  public getExpiryDate(expirationDate: string) {
    let month = expirationDate.slice(0, 2);
    let year = expirationDate.slice(3);
    return `${month}/${year}`;
  }

  public updateArr(arr, data, type, index, ptype) {
    switch (type) {
      case 'cc':
        arr[index].firstName = data.firstName;
        arr[index].lastName = data.lastName;
        arr[index].companyName = data.companyName;
        arr[index].cardNumber = data.cardNumber;
        arr[index].expirationDate = data.expirationDate;
        arr[index].cvv = data.cvv;
        break;
      case 'address':
        arr.address = data;
        break;
      case 'autopay':
        arr[index].autoPay = data.autoPay;
        break;
      case 'echeck':
        arr[index].accountNumber = data.accountNumber;
        arr[index].routingNumber = data.routingNumber;
        arr[index].firstName = data.firstName;
        arr[index].lastName = data.lastName;
        break;
    }
    arr[index]['needUpdate'] = true;
    this.updateAutoPay(ptype, index);
  }

  public updateAutoPay(type, i) {
    this.creditCardList.map((item, index) => {
      if (type === 'credit') {
        if (i !== index) {
          item.autoPay = false;
        }
      } else {
        item.autoPay = false;
      }
    });
    this.echeckList.map((item, index) => {
      if (type === 'echeck') {
        if (i !== index) {
          item.autoPay = false;
        }
      } else {
        item.autoPay = false;
      }
    });
    this.creditCardList = [...this.creditCardList];
    for(const data of this.creditCardList) {
      data['expiryDate'] = this.getExpiryDate(data.expirationDate);
    }
    this.echeckList = [...this.echeckList];
    this.sendData();
  }

  private validateAutoPay(
    payment: vwCreditCard | vwECheck,
    paymentComponent: PaymentMethodCreateMatterComponent
  ) {
    if (payment.autoPay) {
      let allCreditCards = paymentComponent.creditCardList || [];
      let allEcheckList = paymentComponent.echeckList || [];
      if (allCreditCards.length == 0 && allEcheckList.length == 0) {
        return true;
      }
      let paymentMethods = [...allCreditCards, ...allEcheckList];
      let isInValid = paymentMethods.some(a => a.id != payment.id && a.autoPay);
      return !isInValid;
    } else {
      return true;
    }
  }

  private sendData() {
    this.getPaymentMethodList.emit({
      creditCardList: [...this.creditCardList],
      echeckList: [...this.echeckList],
      ccDeleted: [...this.ccDeleted],
      echeckDeleted: [...this.echeckDeleted]
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}

