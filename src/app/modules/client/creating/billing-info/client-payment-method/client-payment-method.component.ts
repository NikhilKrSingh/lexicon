import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AddPaymentMethodModels } from 'src/app/modules/models/add-payment-method';
import { ICreditCards, IECheck } from 'src/app/modules/models/vm-credit-card.model';
import { AddCreditCardComponent } from 'src/app/modules/shared/billing-settings/payment-method/add-credit-card/add-credit-card.component';
import { AddEcheckComponent } from 'src/app/modules/shared/billing-settings/payment-method/add-echeck/add-echeck.component';
import { EditCreditCardComponent } from 'src/app/modules/shared/billing-settings/payment-method/edit-credit-card/edit-credit-card.component';
import { EditEcheckComponent } from 'src/app/modules/shared/billing-settings/payment-method/edit-echeck/edit-echeck.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddress, vwCreditCard, vwECheck } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-client-payment-method',
  templateUrl: './client-payment-method.component.html',
  styleUrls: ['./client-payment-method.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientPaymentMethodComponent implements OnInit, OnDestroy {
  @Input() states: any;
  @Input() primaryAddress: vwAddress;

  @Output() readonly getPaymentMethodList = new EventEmitter<{
    creditCardList: Array<vwCreditCard>;
    echeckList: Array<vwECheck>;
  }>();

  creditCardList: Array<vwCreditCard> = [];
  echeckList: Array<vwECheck> = [];
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  constructor(
    private modalService: NgbModal,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    this.getPaymentMethodList.emit({
      creditCardList: [],
      echeckList: [],
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
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
      windowClass: 'modal-lmd add-payment-method-dialog',
    });

    let component = modalRef.componentInstance;
    component.primaryAddress = UtilsHelper.clone(this.primaryAddress) || {};
    component.states = this.states;
    component.creditCard = {
      firstName: '',
      lastName: '',
      cardNumber: '',
      cvv: '',
      expirationDate: '',
    };
    modalRef.componentInstance.validateNewClientAutoPay = this.validateAutoPay;
    modalRef.componentInstance.paymentNewClientComponent = this;
    component.paymentPlanList = [];
    component.createFrom = 'create-client';

    modalRef.result.then(
      (res: AddPaymentMethodModels.AddPaymentMethodEvent) => {
        if (res) {
          let cardData: ICreditCards = { ...res.creditCardInfo };
          cardData.address = res.address;
          cardData.oriCardNumber = res.creditCardInfo.cardNumber;
          cardData.person = {
            id: 0,
            name: null,
          };
          cardData.new = true;
          this.creditCardList.push(cardData);
          this.creditCardList = [...this.creditCardList];
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
      windowClass: 'add-echeck-dialog modal-lmd',
    });

    modalRef.componentInstance.primaryAddress =
      UtilsHelper.clone(this.primaryAddress) || {};
    modalRef.componentInstance.validateNewClientAutoPay = this.validateAutoPay;
    modalRef.componentInstance.paymentNewClientComponent = this;
    modalRef.componentInstance.paymentPlanList = [];
    modalRef.componentInstance.createFrom = 'create-client';
    modalRef.result.then((res) => {
      if (res) {
        if (res) {
          let cardData: IECheck = { ...res.echeckInfo };
          cardData.address = res.address;
          cardData.person = {
            id: 0,
            name: null,
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
      }
    });
  }

  editCreditCard(row: vwCreditCard, $event, index) {
    let modalRef = this.modalService.open(EditCreditCardComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd',
    });

    let component = modalRef.componentInstance;
    component.primaryAddress = UtilsHelper.clone(this.primaryAddress) || {};
    component.states = this.states;
    component.creditCard = { ...row };
    row['address'].address = row['address'].address1
    row['address'].zip = row['address'].zipCode;
    component.address = row['address'];
    component.createFrom = 'create-client';
    component.validateNewClientAutoPay = this.validateAutoPay;
    modalRef.result.then((res) => {
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
    let modalRef = this.modalService.open(EditEcheckComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd',
    });

    const component = modalRef.componentInstance;

    component.echeck = row;
    component.primaryAddress = UtilsHelper.clone(this.primaryAddress) || {};
    row['address'].address = row['address'].address1;
    row['address'].zip = row['address'].zipCode;
    component.address = row['address'];
    component.createFrom = 'create-client';
    component.validateNewClientAutoPay = this.validateAutoPay;
    modalRef.result.then((res) => {
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
      .then((res) => {
        if (res) {
          this.creditCardList.splice(index, 1);
          this.creditCardList = [...this.creditCardList];
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
      .then((res) => {
        if (res) {
          this.echeckList.splice(index, 1);
          this.echeckList = [...this.echeckList];
          this.sendData();
        }
      });
  }

  public updateArr(arr, data, index, ptype) {
    if (ptype == "credit") {
      arr[index].firstName = data.cc.firstName;
      arr[index].lastName = data.cc.lastName;
      arr[index].companyName = data.cc.companyName;
      arr[index].cardNumber = data.cc.cardNumber;
      arr[index].expirationDate = data.cc.expirationDate;
      arr[index].cvv = data.cc.cvv;
      arr[index].autoPay = data.cc.autoPay;
    }
    if (ptype == "echeck") {
      arr[index].accountNumber = data.echeck.accountNumber;
      arr[index].routingNumber = data.echeck.routingNumber;
      arr[index].firstName = data.echeck.firstName;
      arr[index].lastName = data.echeck.lastName;
      arr[index].autoPay = data.echeck.autoPay;
    }

    arr.address = data.address;

    arr[index]['needUpdate'] = true;

    if (data.autoPay) {
      this.updateAutoPay(ptype, index);
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
    this.echeckList = [...this.echeckList];
    this.sendData();
  }

  private validateAutoPay(
    payment: vwCreditCard | vwECheck,
    paymentComponent: ClientPaymentMethodComponent
  ) {
    if (payment.autoPay) {
      let allCreditCards = paymentComponent.creditCardList || [];
      let allEcheckList = paymentComponent.echeckList || [];
      if (allCreditCards.length == 0 && allEcheckList.length == 0) {
        return true;
      }
      let paymentMethods = [...allCreditCards, ...allEcheckList];
      let isInValid = paymentMethods.some(
        (a) => a.id != payment.id && a.autoPay
      );
      return !isInValid;
    } else {
      return true;
    }
  }

  private sendData() {
    this.getPaymentMethodList.emit({
      creditCardList: [...this.creditCardList],
      echeckList: [...this.echeckList],
    });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
