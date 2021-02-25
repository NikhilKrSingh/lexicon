import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AddPaymentMethodModels } from 'src/app/modules/models/add-payment-method';
import { ICreditCards, IECheck } from 'src/app/modules/models/vm-credit-card.model';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddress, vwBillingSettings, vwClient, vwCreditCard, vwECheck } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, MatterService } from 'src/common/swagger-providers/services';
import { DialogService } from '../../dialog.service';
import * as errors from '../../error.json';
import { UtilsHelper } from '../../utils.helper';
import { AddCreditCardComponent } from '../payment-method/add-credit-card/add-credit-card.component';
import { AddEcheckComponent } from '../payment-method/add-echeck/add-echeck.component';
import { EditCreditCardComponent } from '../payment-method/edit-credit-card/edit-credit-card.component';
import { EditEcheckComponent } from '../payment-method/edit-echeck/edit-echeck.component';

@Component({
  selector: 'app-payment-method-new-wizard',
  templateUrl: './payment-method-new-wizard.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class PaymentMethodNewWizardComponent implements OnInit, OnDestroy {
  @Input() hideEcheck = false;
  @Input() pageType = 'creatematter';
  @Input() clientId: number;
  @Input() officeId: number;
  @Input() matterId: number = null;
  @Input() states: any;
  @Output() readonly getPaymentMethodList = new EventEmitter<{
    ccDeleted: Array<vwCreditCard>;
    echeckDeleted: Array<vwECheck>;
    creditCardList: Array<vwCreditCard>;
    echeckList: Array<vwECheck>;
  }>();

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
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private matterService: MatterService
  ) {
    this.permissionList$ = this.store.select('permissions');
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

  addExpiryDate() {
    for(const data of this.creditCardList) {
      data['expirationDateStr'] = this.getExpiryDate(data.expirationDate);
    }
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
            this.addExpiryDate();
            if (!this.hideEcheck) {
              this.echeckList = res.eChecks;
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
          this.addExpiryDate();
          this.creditCardList.forEach(x => {
            x.autoPay = false;
            x.suspendAutoPay = false;
          });
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
            this.echeckList.forEach(x => {
              x.autoPay = false;
              x.suspendAutoPay = false;
            });
            this.sendData();
          }
          this.ecLoading = false;
        },
        () => {
          this.ecLoading = false;
        }
      );
  }




  addPaymentMethod(type = 1) {
    if (type == 1) {
      this.addCreditCard();
    } else {
      this.addECheck();
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
    component.validateNewMatterAutoPay = this.validateAutoPay;
    component.paymentNewMatterComponent = this;
    component.paymentPlanList = [];
    component.createFrom = 'newmatter';

    modalRef.result.then(
      (res: AddPaymentMethodModels.AddPaymentMethodEvent) => {
        if (res) {
          let cardData: ICreditCards = { ...res.creditCardInfo };
          cardData.address = res.address;
          cardData.addressDetails = res.address;
          if (cardData.addressDetails) {
            cardData.addressDetails.id = 0;
          }
          cardData.oriCardNumber = res.creditCardInfo.cardNumber;
          cardData.person = {
            id: +this.clientId,
            name: null
          };
          cardData.new = true;
          this.creditCardList.push(cardData);
          this.creditCardList = [...this.creditCardList];
          this.addExpiryDate();
          if (cardData.autoPay) {
            this.updateAutoPay('credit', this.creditCardList.length - 1);
          } else {
            this.sendData();
          }
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
    modalRef.componentInstance.validateNewMatterAutoPay = this.validateAutoPay;
    modalRef.componentInstance.paymentNewMatterComponent = this;
    modalRef.componentInstance.paymentPlanList = [];
    modalRef.componentInstance.createFrom = 'newmatter';
    modalRef.result.then(res => {
      if (res) {
        let cardData: IECheck = { ...res.echeckInfo };
        cardData.address = res.address;
        cardData.addressDetails = res.address;
        if (cardData.addressDetails) {
          cardData.addressDetails.id = 0;
        }
        cardData.person = {
          id: +this.clientId,
          name: null
        };
        cardData.new = true;
        this.echeckList.push(cardData);
        this.echeckList = [...this.echeckList];
        if (cardData.autoPay) {
          this.updateAutoPay('echeck', this.echeckList.length - 1);
        } else {
          this.sendData();
        }
      }
    });
  }

  editCreditCard(row: vwCreditCard, $event, index) {
    let modalRef = this.modalService.open(EditCreditCardComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd'
    });

    let component = modalRef.componentInstance;
    component.primaryAddress = this.primaryAddress || {};
    component.validateNewMatterAutoPay = this.validateAutoPay;
    component.paymentNewMatterComponent = this;
    component.states = this.states;
    component.creditCard = { ...row };
    if (row['address']) {
      row['address'].address = row['address'].address1;
      row['address'].zip = row['address'].zipCode;
      component.address = row['address'];

      if (row['addressDetails']) {
        row['addressDetails'].id = 0;
      } else {
        row['addressDetails'] = row['address'];
        row['addressDetails'].id = 0;
      }
    } else {
      component.address =
        this.clientDetails.addresses.find(a => a.id == row.addressId) || {};
    }
    component.createFrom = 'newmatter';
    modalRef.result.then(res => {
      if (res) {
        this.updateArr(
          this.creditCardList,
          res,
          index,
          'credit'
        );
      }
    });
  }

  editECheck(row: vwECheck, $event, index) {
    this._editECheck(row, $event, index);
  }

  _editECheck(row: vwECheck, $event, index) {
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
    component.createFrom = 'newmatter';
    component.validateNewMatterAutoPay = this.validateAutoPay;
    component.paymentNewMatterComponent = this;
    if (row['address']) {
      row['address'].address = row['address'].address1;
      row['address'].zip = row['address'].zipCode;
      component.address = row['address'];

      if (row['addressDetails']) {
        row['addressDetails'].id = 0;
      } else {
        row['addressDetails'] = row['address'];
        row['addressDetails'].id = 0;
      }
    } else {
      component.address =
        this.clientDetails.addresses.find(a => a.id == row.addressId) || {};
    }
    modalRef.result.then(res => {
      if (res) {
        this.updateArr(
          this.echeckList,
          res,
          index,
          'echeck'
        );
      }
    });
  }

  deleteCreditCard(row: vwCreditCard, $event, index) {
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
          this.addExpiryDate();
          this.sendData();
        }
      });
  }

  deleteECheck(row: vwECheck, $event, index) {
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

  public updateArr(arr, data, index, ptype) {
    if (ptype == 'credit') {
      arr[index].firstName = data.cc.firstName;
      arr[index].lastName = data.cc.lastName;
      arr[index].companyName = data.cc.companyName;
      arr[index].cardNumber = data.cc.cardNumber;
      arr[index].expirationDate = data.cc.expirationDate;
      arr[index].cvv = data.cc.cvv;
      arr[index].autoPay = data.cc.autoPay;
    }
    if (ptype == 'echeck') {
      arr[index].accountNumber = data.echeck.accountNumber;
      arr[index].routingNumber = data.echeck.routingNumber;
      arr[index].firstName = data.echeck.firstName;
      arr[index].lastName = data.echeck.lastName;
      arr[index].autoPay = data.echeck.autoPay;
    }

    arr.address = data.address;
    arr[index]['needUpdate'] = true;
    if (arr[index].autoPay) {
      this.updateAutoPay(ptype, index);
    } else {
      this.sendData();
    }
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
    this.addExpiryDate();
    this.echeckList = [...this.echeckList];
    this.sendData();
  }

  private validateAutoPay(
    payment: vwCreditCard | vwECheck,
    paymentComponent: PaymentMethodNewWizardComponent
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

