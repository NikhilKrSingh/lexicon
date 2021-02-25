import { Component, EventEmitter, Input, OnDestroy, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vwMatterResponse } from 'src/app/modules/models';
import { AddPaymentMethodModels } from 'src/app/modules/models/add-payment-method';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddress, vwAddressDetails, vwApplyAutoPayForMatter, vwBillingSettings, vwClient, vwCreditCard, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, MatterService, MiscService, PersonService } from 'src/common/swagger-providers/services';
import { DialogService } from '../../dialog.service';
import * as errors from '../../error.json';
import { UnsavedChangedClientDialogComponent } from "../../unsaved-changed-client-dialog/unsaved-changed-client-dialog.component";
import { UtilsHelper } from '../../utils.helper';
import { AddCreditCardComponent } from './add-credit-card/add-credit-card.component';
import { AddEcheckComponent } from './add-echeck/add-echeck.component';
import { EditCreditCardComponent } from './edit-credit-card/edit-credit-card.component';
import { EditEcheckComponent } from './edit-echeck/edit-echeck.component';

@Component({
  selector: 'app-billing-payment-method',
  templateUrl: './payment-method.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingPaymentMethodComponent
  implements OnInit, OnChanges, OnDestroy {
  @Input() matterDetails: vwMatterResponse;
  @Input() paymentMethodeText = false;
  @Input() hideEcheck = false;
  @Input() type = 'client';
  @Input() paymentPlanList: Array<PaymentPlanModel>;
  @Input() hasPermissionToAdd: boolean;

  @Input() isEditRateTable: boolean;
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() isCustomBillingRate: boolean;
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() rateTables = [];
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  public pageECheck = new Page();
  public pageECheckSelector = new FormControl('10');
  public pageECheckSelected = 1;

  @ViewChild('tableECheck', { static: false }) tableECheck: DatatableComponent;

  creditCardList: Array<vwCreditCard>;
  echeckList: Array<vwECheck>;
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  clientDetails: vwClient;
  primaryAddress: vwAddress;
  states: Array<vwIdCodeName>;

  private billingSettings: vwBillingSettings;
  public ccLoading = true;
  public eCheckLoading = true;
  public autoPayMatters: any = [];

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private clientService: ClientService,
    private toastr: ToastDisplay,
    private miscService: MiscService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private personService: PersonService,
    private matterService: MatterService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
    this.pageECheck.pageNumber = 0;
    this.pageECheck.size = 10;
  }

  ngOnInit() {
    if (this.matterDetails) {
      if (this.matterDetails.clientName) {
        this.getClientInfo();
        this.getPaymentMethods();
        this.getStateList();
      }
    }
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('paymentPlanList')) {
      this.paymentPlanList = changes.paymentPlanList.currentValue;
      this.getPaymentMethods();
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getClientInfo() {
    this.clientService
      .v1ClientClientIdGet({
        clientId: this.matterDetails.clientName.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.clientDetails = res;

        if (
          this.clientDetails.addresses &&
          this.clientDetails.addresses.length > 0
        ) {
          this.primaryAddress = this.clientDetails.addresses.find(
            obj => obj.addressTypeName && obj.addressTypeName.toLowerCase() === 'primary'
          );

          if (!this.primaryAddress) {
            this.primaryAddress = {};
          }
        }
      });
  }

  private getPaymentMethods() {
    if (this.type == 'matter') {
      this.matterService
        .v1MatterPaymentMethodsbymatterMatterIdGet({
          matterId: this.matterDetails.id
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.ccLoading = false;
            this.eCheckLoading = false;
          })
        )
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
          }
        });
    } else {
      this.getCreditCards();
      this.getEcheckList();
    }
  }

  private getCreditCards() {
    this.billingService
      .v1BillingPaymentMethodPersonIdGet({
        personId: this.matterDetails.clientName.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.creditCardList = res;
          for(const data of this.creditCardList) {
            data['expiryDate'] = this.getExpiryDate(data.expirationDate);
          }
          this.calcTotalPages();
        }
        this.ccLoading = false;
      },
      () => {
        this.ccLoading = false;
      });
  }

  private getEcheckList() {
    this.billingService
      .v1BillingEcheckPersonPersonIdGet$Response({
        personId: this.matterDetails.clientName.id
      })
      .subscribe(
        response => {
          if (response) {
            let res = JSON.parse(response.body as any).results;
            this.echeckList = res;
            this.calcECheckTotalPages();
          }
          this.eCheckLoading = false;
        },
        () => {
          this.eCheckLoading = false;
        }
      );
  }

  private getStateList() {
    this.miscService
      .v1MiscStatesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.states = res;
        }
      });
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
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    }
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
    this.calcECheckTotalPages();
  }

  /**
   * Change page number
   */
  public changeECheckPage() {
    this.pageECheck.pageNumber = this.pageECheckSelected - 1;
    if (this.pageECheckSelected == 1) {
      this.calcECheckTotalPages();
    }
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
        this.isEditRateTableChange.emit(false);
        if (type == 1) {
          this.addCreditCard();
        } else {
          this.addECheck();
        }
      });
    } else {
      if (type == 1) {
        this.addCreditCard();
      } else {
        this.addECheck();
      }
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

    component.validateAutoPay = this.validateAutoPay;
    component.paymentComponent = this;
    component.paymentPlanList = this.paymentPlanList;

    modalRef.result.then(
      (res: AddPaymentMethodModels.AddPaymentMethodEvent) => {
        if (res) {
          let creditCard = res.creditCardInfo;
          let address = res.address;
          this.autoPayMatters = res.selectedMatters;
          creditCard.person = {
            id: this.clientDetails.id,
            name: this.clientDetails.lastName
              ? this.clientDetails.firstName + ' ' + this.clientDetails.lastName
              : this.clientDetails.firstName
          };
          creditCard.id = this.clientDetails.id;

          if (creditCard.autoPay && this.type == 'matter') {
            this.checkMultipleAutoPay();
          }

          if (creditCard.isSameAsPrimary) {
            this.saveCreditCard(creditCard);
          } else {
            this.createAddress(address, addressId => {
              creditCard.addressId = addressId;
              this.saveCreditCard(creditCard);
            });
          }
        }
      }
    );
  }

  private saveCreditCard(creditCard: vwCreditCard) {
    creditCard.id = 0;

    const request = {
      ...creditCard
    };

    if (this.type == 'matter') {
      request.autoPay = false;
      request.suspendAutoPay = false;
    }
    this.ccLoading = true;
    this.billingService
      .v1BillingPaymentMethodPost$Json({
        body: request
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            if (this.type == 'matter') {
              this.addMatterPaymentMethod(
                res,
                creditCard.autoPay,
                creditCard.suspendAutoPay,
                () => {
                  this.toastr.showSuccess(
                    this.error_data.add_credit_card_success
                  );
                  this.getPaymentMethods();
                }
              );
            } else if (this.autoPayMatters.length > 0) {
              const request: vwApplyAutoPayForMatter = {
                matters: [...this.autoPayMatters],
                paymentMethodId: res
              };
              this.matterService
                .v1MatterApplyAutoPayForMattersPost$Json({
                  body: request
                })
                .subscribe(
                  () => {
                    this.toastr.showSuccess(
                      this.error_data.add_credit_card_success
                    );
                    this.getPaymentMethods();
                  },
                  () => {
                    this.toastr.showError(this.error_data.error_occured);
                  }
                );
            } else {
              this.toastr.showSuccess(this.error_data.add_credit_card_success);
              this.getPaymentMethods();
            }
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {this.ccLoading = false;}
      );
  }

  private createAddress(
    res: vwAddressDetails,
    onSuccess: (id: number) => void
  ) {
    const address = {
      address1: res.address1,
      address2: res.address2,
      addressTypeId: 2,
      addressTypeName: 'billing',
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.matterDetails.clientName.id
    } as vwAddressDetails;

    this.ccLoading = true;
    this.personService
      .v1PersonAddressPost$Json({
        body: address
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(
        response => {
          if (response > 0) {
            address.id = response;
            this.getClientInfo();
            onSuccess(response);
          } else {
            this.toastr.showError(this.error_data.address_update_error);
          }
        },
        () => {this.ccLoading = false;}
      );
  }

  private updateAddress(
    res: vwAddressDetails,
    addressTypeId: number,
    addressTypeName: string
  ) {
    const address = {
      id: res.id,
      address1: res.address1,
      address2: res.address2,
      addressTypeId: addressTypeId,
      addressTypeName: addressTypeName,
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.matterDetails.clientName.id
    } as vwAddressDetails;

    this.ccLoading = true;
    this.personService
      .v1PersonAddressPut$Json({
        body: address
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.getClientInfo();
          }
        },
        () => {this.ccLoading = false;}
      );
  }

  private addECheck() {
    let modalRef = this.modalService.open(AddEcheckComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'add-echeck-dialog modal-lmd'
    });

    modalRef.componentInstance.primaryAddress = this.primaryAddress;
    modalRef.componentInstance.validateAutoPay = this.validateAutoPay;
    modalRef.componentInstance.paymentComponent = this;
    modalRef.componentInstance.paymentPlanList = this.paymentPlanList;

    modalRef.result.then(res => {
      this.modalService.dismissAll();
      if (res) {
        if (res) {
          let echeck = res.echeckInfo;
          let address = res.address;
          this.autoPayMatters = res.selectedMatters;
          echeck.person = {
            id: this.clientDetails.id,
            name: this.clientDetails.lastName
              ? this.clientDetails.firstName + ' ' + this.clientDetails.lastName
              : this.clientDetails.firstName
          };
          echeck.id = this.clientDetails.id;

          if (echeck.autoPay && this.type == 'matter') {
            this.checkMultipleAutoPay('echeck', echeck.id);
          }

          if (echeck.isSameAsPrimary) {
            this.saveECheck(echeck);
          } else {
            this.createAddress(address, addressId => {
              echeck.addressId = addressId;
              this.saveECheck(echeck);
            });
          }
        }
      }
    });
  }

  private saveECheck(echeck: vwECheck) {
    this.eCheckLoading = true;
    const request: vwECheck = {
      ...echeck
    };

    if (this.type == 'matter') {
      request.autoPay = false;
      request.suspendAutoPay = false;
    }
    this.eCheckLoading = true;
    this.billingService
      .v1BillingEcheckPost$Json({
        body: request
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            if (this.type == 'matter') {
              this.addMatterPaymentMethod(
                res,
                echeck.autoPay,
                echeck.suspendAutoPay,
                () => {
                  this.toastr.showSuccess(this.error_data.add_echeck_success);
                  this.getPaymentMethods();
                }
              );
            } else if (this.autoPayMatters.length > 0) {
              const request: vwApplyAutoPayForMatter = {
                matters: [...this.autoPayMatters],
                paymentMethodId: res
              };
              this.matterService
                .v1MatterApplyAutoPayForMattersPost$Json({
                  body: request
                })
                .subscribe(
                  () => {
                    this.toastr.showSuccess(
                      this.error_data.add_echeck_success
                    );
                    this.getPaymentMethods();
                  },
                  () => {
                    this.toastr.showError(this.error_data.error_occured);
                  }
              );
            } else {
              this.toastr.showSuccess(this.error_data.add_echeck_success);
              this.getPaymentMethods();
            }
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.eCheckLoading = false;
        }
      );
  }

  editCreditCard(row: vwCreditCard, $event = null ) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
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
        this.openCreditCardModal(row);
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openCreditCardModal(row);
    }
  }

  openCreditCardModal(row) {
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
    component.validateAutoPay = this.validateAutoPay;
    component.paymentComponent = this;
    component.paymentPlanList = this.paymentPlanList;

    modalRef.result.then(res => {
      if (res) {
        let creditCard = res.cc;
        let address = res.address;
        this.autoPayMatters = res.selectedMatters;

        creditCard.person = {
          id: this.clientDetails.id
        };

        if (address) {
          creditCard.updateToUSIO = false;
          creditCard.cvv = '000';

          if (address.isSameAsPrimary) {
            this.updateCreditCard(creditCard, row);
          } else {
            if (address.id) {
              this.updateCreditCard(creditCard, row);
              this.updateAddress(address, 2, 'billing');
            } else {
              this.createAddress(address, addressId => {
                creditCard.addressId = addressId;
                this.updateCreditCard(creditCard, row);
              });
            }
          }
        }

        if (creditCard.autoPay && this.type == 'matter') {
          this.checkMultipleAutoPay('cc', creditCard.id);
        }

        creditCard.updateToUSIO = false;
        creditCard.cvv = '000';
      }
    });
  }

  private validateAutoPay(
    payment: vwCreditCard | vwECheck,
    paymentComponent: BillingPaymentMethodComponent
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

  updateCreditCard(creditCard: vwCreditCard, originalCard: vwCreditCard) {
    const request: vwCreditCard = {
      ...creditCard
    };

    if (this.type == 'matter') {
      request.autoPay = originalCard.autoPay;
      request.suspendAutoPay = originalCard.suspendAutoPay;
    }

    this.ccLoading = true;
    this.billingService
      .v1BillingPaymentMethodPut$Json({
        body: request
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            if (this.type == 'matter') {
              this.updateMatterPaymentMethod(
                res,
                creditCard.autoPay,
                creditCard.suspendAutoPay,
                () => {
                  this.toastr.showSuccess(
                    this.error_data.edit_credit_card_success
                  );
                  this.getPaymentMethods();
                }
              );
            } else if (this.autoPayMatters.length > 0) {
              let matterList = [];
              this.autoPayMatters.forEach(matter => {
                matterList.push(matter.id)
              })
            const request: vwApplyAutoPayForMatter = {
              matters: [...matterList],
              suspendAutoPay: creditCard.suspendAutoPay,
              paymentMethodId: creditCard.id
            };
            this.matterService
              .v1MatterApplyAutoPayForMattersPost$Json({
                body: request
              })
              .subscribe(
                () => {
                  this.toastr.showSuccess(
                    this.error_data.edit_credit_card_success
                  );
                  this.getPaymentMethods();
                },
                () => {
                  this.toastr.showError(this.error_data.error_occured);
                }
              );
            } else {
              this.toastr.showSuccess(this.error_data.edit_credit_card_success);
              this.getPaymentMethods();
            }
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {this.ccLoading = false;}
      );
  }

  editECheck(row: vwECheck, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
    }
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
        this._editECheck(row, $event);
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this._editECheck(row, $event);
    }
  }

  _editECheck(row: vwECheck, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }

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
    component.validateAutoPay = this.validateAutoPay;
    component.paymentComponent = this;
    component.paymentPlanList = this.paymentPlanList;

    modalRef.result.then(res => {
      if (res) {
        let echeck = res.echeck;
        let address = res.address;
        this.autoPayMatters = res.selectedMatters;

        echeck.person = {
          id: this.clientDetails.id
        };

        if (echeck.autoPay && this.type == 'matter') {
          this.checkMultipleAutoPay('echeck', echeck.id);
        }

        if (address) {
          if (echeck.isSameAsPrimary) {
            this.updateEcheck(echeck, row);
          } else {
            if (address.id) {
              this.updateEcheck(echeck, row);
              this.updateAddress(address, 2, 'billing');
            } else {
              this.createAddress(address, addressId => {
                echeck.addressId = addressId;
                this.updateEcheck(echeck, row);
              });
            }
          }
        }
      }
    });
  }

  private updateEcheck(echeck: vwECheck, originalEcheck: vwECheck) {
    const request: vwECheck = {
      ...echeck
    };

    if (this.type == 'matter') {
      request.autoPay = originalEcheck.autoPay;
      request.suspendAutoPay = originalEcheck.suspendAutoPay;
    }

    this.eCheckLoading = true;
    this.billingService
      .v1BillingEcheckPut$Json({
        body: request
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            if (this.type == 'matter') {
              this.updateMatterPaymentMethod(
                echeck.id,
                echeck.autoPay,
                echeck.suspendAutoPay,
                () => {
                  this.toastr.showSuccess(this.error_data.edit_echeck_success);
                  this.getPaymentMethods();
                }
              );
            } else if (this.autoPayMatters.length > 0) {
              let matterList = [];
              this.autoPayMatters.forEach(matter => {
                matterList.push(matter.id);
              });
              const request: vwApplyAutoPayForMatter = {
                matters: [...matterList],
                suspendAutoPay: echeck.suspendAutoPay,
                paymentMethodId: echeck.id
              };
              this.matterService
                .v1MatterApplyAutoPayForMattersPost$Json({
                  body: request
                })
                .subscribe(
                  () => {
                    this.toastr.showSuccess(
                      this.error_data.edit_echeck_success
                    );
                    this.getPaymentMethods();
                  },
                  () => {
                    this.toastr.showError(this.error_data.error_occured);
                  }
                );
            } else {
              this.toastr.showSuccess(this.error_data.edit_echeck_success);
              this.getPaymentMethods();
            }
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {this.eCheckLoading = false;}
      );
  }

  deleteCreditCard(row: vwCreditCard, $event = null ) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }

    this.dialogService
      .confirm(
        this.error_data.delete_credit_card_confirm,
        'Delete',
        'Cancel',
        'Delete Credit Card'
      )
      .then(res => {
        if (res) {
          this.ccLoading = true;
          if (this.type == 'matter') {
            this.deleteMatterPaymentMethod(row.id, () => {
              this.toastr.showSuccess(
                this.error_data.delete_credit_card_success
              );
              this.getPaymentMethods();
            });
          } else {
            this.checkAndDeletePaymentMethod(row.id, () => {
              this.billingService
              .v1BillingPaymentMethodIdDelete({
                id: row.id
              })
              .pipe(map(UtilsHelper.mapData))
              .subscribe(
                res => {
                  if (res > 0) {
                    this.toastr.showSuccess(
                      this.error_data.delete_credit_card_success
                    );
                    this.getPaymentMethods();
                  } else {
                    this.toastr.showError(this.error_data.error_occured);
                    this.ccLoading = false;
                  }
                },
                () => {this.ccLoading = false;}
              );
            });
          }
        }
      });
  }

  private checkAndDeletePaymentMethod(methodId: number, onSuccess = () => {}, cc = true) {
    this.billingService.v1BillingCanDeletePaymentMethodIdGet({
      id: methodId
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      if (res) {
        onSuccess();
      } else {
        if (cc) {
          this.toastr.showError(this.error_data.cc_used_in_payment_plan);
        } else {
          this.toastr.showError(this.error_data.echeck_used_in_payment_plan);
        }

        this.ccLoading = false;
        this.eCheckLoading = false;
      }
    },
    () => {
      this.ccLoading = false;
      this.eCheckLoading = false;
    });
  }

  deleteECheck(row: vwECheck, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }

    this.dialogService
      .confirm(
        this.error_data.delete_echeck_confirm,
        'Delete',
        'Cancel',
        'Delete E-Check'
      )
      .then(res => {
        if (res) {
          this.eCheckLoading = true;
          if (this.type == 'matter') {
            this.deleteMatterPaymentMethod(row.id, () => {
              this.toastr.showSuccess(
                this.error_data.delete_echeck_success
              );
              this.getPaymentMethods();
            }, false);
          } else {
            this.checkAndDeletePaymentMethod(row.id, () => {
              this.billingService
              .v1BillingEcheckIdDelete({
                id: row.id
              })
              .pipe(map(UtilsHelper.mapData))
              .subscribe(
                res => {
                  if (res > 0) {
                    this.toastr.showSuccess(
                      this.error_data.delete_echeck_success
                    );
                    this.getPaymentMethods();
                  } else {
                    this.toastr.showError(this.error_data.error_occured);
                    this.eCheckLoading = false;
                  }
                },
                () => {this.eCheckLoading = false;}
              );
            }, false);
          }
        }
      });
  }

  private deleteAddress(row: vwCreditCard) {
    if (!row.isSameAsPrimary) {
      this.personService
        .v1PersonAddressAddressIdDelete({
          addressId: row.addressId
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if (res > 0) {
            this.getClientInfo();
          }
        });
    }
  }

  public getExpiryDate(expirationDate: string) {
    let month = expirationDate.slice(0, 2);
    let year = expirationDate.slice(3);

    return `${month}/${year}`;
  }

  private checkMultipleAutoPay(type = 'cc', id = 0) {
    let autoPay: boolean = false;
    if (this.echeckList && this.echeckList.length) {
      let echeck = this.echeckList.find(
        list => list.autoPay == true && list.id != id
      );

      if (echeck) {
        if (this.type == 'matter') {
          this.updateMatterPaymentMethod(echeck.id, false, false, () => {
            if (type == 'cc') {
              this.getPaymentMethods();
            }
          });
        } else {
          echeck.autoPay = false;
          echeck.suspendAutoPay = false;

          this.billingService
            .v1BillingEcheckPut$Json({
              body: echeck
            })
            .subscribe(res => {
              if (type == 'cc') {
                this.getPaymentMethods();
              }
            });
        }
      }
    }

    if (this.creditCardList && this.creditCardList.length) {
      let cc = this.creditCardList.find(
        list => list.autoPay == true && list.id != id
      );

      if (cc) {
        if (this.type == 'matter') {
          this.updateMatterPaymentMethod(cc.id, false, false, () => {
            if (type == 'echeck') {
              this.getPaymentMethods();
            }
          });
        } else {
          cc.autoPay = false;
          cc.suspendAutoPay = false;
          cc.updateToUSIO = false;
          cc.cvv = '000';

          this.billingService
            .v1BillingPaymentMethodPut$Json({
              body: cc
            })
            .subscribe(res => {
              if (type == 'echeck') {
                this.getPaymentMethods();
              }
            });
        }
      }
    }
    return autoPay;
  }

  private addMatterPaymentMethod(
    paymentMethodId: number,
    isAutopay: boolean,
    suspendAutoPay: boolean,
    onSuccess = () => {}
  ) {
    this.matterService
      .v1MatterPaymentMethodsPost$Json({
        body: [
          {
            matterId: this.matterDetails.id,
            paymentMethodId: paymentMethodId,
            isAutopay: isAutopay,
            isSuspend: suspendAutoPay
          }
        ]
      })
      .subscribe(
        () => {
          onSuccess();
        },
        () => {}
      );
  }

  private updateMatterPaymentMethod(
    paymentMethodId: number,
    isAutopay: boolean,
    suspendAutoPay: boolean,
    onSuccess = () => {}
  ) {
    this.matterService
      .v1MatterPaymentMethodsPut$Json({
        body: [
          {
            matterId: this.matterDetails.id,
            paymentMethodId: paymentMethodId,
            isAutopay: isAutopay,
            isSuspend: suspendAutoPay
          }
        ]
      })
      .subscribe(
        () => {
          onSuccess();
        },
        () => {}
      );
  }

  private deleteMatterPaymentMethod(
    paymentMethodId: number,
    onSuccess = () => {},
    cc = true
  ) {
    if (this.paymentPlanList && this.paymentPlanList.length > 0) {
      let isInPaymentPlan = this.paymentPlanList.some(a => (a.creditCard && a.creditCard.id == paymentMethodId ) || (a.echeckDetail && a.echeckDetail.id == paymentMethodId));
      if (isInPaymentPlan) {
        if (cc) {
          this.toastr.showError(this.error_data.cc_used_in_payment_plan_matter);
        } else {
          this.toastr.showError(this.error_data.echeck_used_in_payment_plan_matter);
        }

        this.ccLoading = false;
        this.eCheckLoading = false;
      } else {
        this.matterService
        .v1MatterPaymentMethodsbyIdMatterIdPaymentMethodIdDelete({
          matterId: this.matterDetails.id,
          paymentMethodId: paymentMethodId
        })
        .subscribe(
          () => {
            onSuccess();
          },
          () => {}
        );
      }
    } else {
      this.matterService
      .v1MatterPaymentMethodsbyIdMatterIdPaymentMethodIdDelete({
        matterId: this.matterDetails.id,
        paymentMethodId: paymentMethodId
      })
      .subscribe(
        () => {
          onSuccess();
        },
        () => {}
      );
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  getRowClass = row => {
    return {
      'row-green': row.autoPay == true
    };
  };

  get footerHeight() {
    if (this.creditCardList) {
      return this.creditCardList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  get eCheckFooterHeight() {
    if (this.echeckList) {
      return this.echeckList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

}
