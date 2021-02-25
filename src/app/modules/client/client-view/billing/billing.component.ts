import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { cloneDeep } from "lodash";
import { forkJoin, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { EditBillIssuanceFrequnecyComponent, EditInvoiceAddressComponent, EditInvoicePreferencesComponent } from 'src/app/modules/shared/billing-settings';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwAddressDetails, vwBillingSettings, vwIdCodeName, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, MiscService, PersonService, RateTableService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { RateTableModalComponent } from '../../../shared/rate-table-modal/rate-table-modal.component';
import { UnsavedChangedClientDialogComponent } from '../../../shared/unsaved-changed-client-dialog/unsaved-changed-client-dialog.component';

@Component({
  selector: 'app-client-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BillingComponent implements OnInit, OnChanges {
  @Input() clientId: number;
  @Input() officeId: number;
  @Input() isCustomBillingRate: boolean;
  @Input() isEditRateTable: boolean;
  @Input() rateTables: any = [];
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();

  error_data = (errors as any).default;
  addressList: Array<vwAddressDetails>;
  invoiceAddress: vwAddressDetails;
  primaryAddress: vwAddressDetails;
  isBillingAddressSameAsPrimary: boolean;
  private modalOptions: NgbModalOptions = {
    centered: true,
    backdrop: 'static',
    keyboard: false,
  };
  showUpcoming = false;
  public effectiveBillFrequencyDurationName = '';
  public effectiveBillFrequencyDayObj: { value?: number; name?: string };


  stateList: Array<vwIdCodeName>;
  billFrequencyList: Array<vwIdCodeName>;
  invoiceDeliveryList: Array<vwIdCodeName>;
  public billFrequencyDayObj: { value?: number; name?: string };
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  billingSettings: vwBillingSettings;
  public billFrequencyDurationName = '';
  matterDetails: any;
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  isRateTableEdit: boolean;
  selectedRate: vwRate;
  public loading = false;
  public billingLoading = true;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public afterLoadstateList = true;
  public afterUpdate = false;
  rateTableFormSubmitted: boolean;

  constructor(
    private personService: PersonService,
    private billingService: BillingService,
    private rateTableService: RateTableService,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private miscService: MiscService,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.getBillingSettings(true);
    this.getRateTable();

    this.matterDetails = {
      clientName: {
        id: this.clientId
      }
    };

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isEditRateTable) {
      this.isRateTableEdit = this.isEditRateTable;
      if (!this.isRateTableEdit) {
        this.getRateTable();
      }
    }
  }

  private getListItems() {
    forkJoin([
      this.billingService
        .v1BillingBillfrequencyListGet()
        .pipe(map(UtilsHelper.mapData)),
      this.billingService
        .v1BillingInvoicedeliveryListGet()
        .pipe(map(UtilsHelper.mapData)),
      this.miscService.v1MiscStatesGet().pipe(map(UtilsHelper.mapData)),
    ]).subscribe((res) => {
      this.billFrequencyList = res[0];
      this.invoiceDeliveryList = res[1];
      this.stateList = res[2];
      this.afterLoadstateList = false;
    });
  }

  private getInvoiceAddress() {
    if (this.clientId) {
      this.personService
        .v1PersonAddressPersonIdGet({
          personId: this.clientId,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((res: Array<vwAddressDetails>) => {
          if (res) {
            this.addressList = res;
            this.assignBillingAddress();
          }
        });
    } else {
      this.toastr.showError('Error while getting client data');
    }
  }

  private assignBillingAddress() {
    if (this.addressList && this.addressList.length > 0) {
      this.invoiceAddress = this.addressList.find(
        (obj) => obj.addressTypeName && obj.addressTypeName.toLowerCase() === 'invoice'
      );

      this.primaryAddress = this.addressList.find(
        (a) => a.addressTypeName && a.addressTypeName.toLowerCase() == 'primary'
      );
      if (this.primaryAddress && this.billingSettings && this.primaryAddress.id === this.billingSettings.invoiceAddressId) {
        this.isBillingAddressSameAsPrimary = true;
      } else if (!this.invoiceAddress && this.primaryAddress) {
        this.invoiceAddress = this.primaryAddress;
        this.isBillingAddressSameAsPrimary = true;
      } else if (!this.invoiceAddress && !this.primaryAddress) {
        this.isBillingAddressSameAsPrimary = false;
        this.invoiceAddress = {};
      } else {
        this.isBillingAddressSameAsPrimary = false;
      }
      this.afterUpdate = false;
    }
  }

  editIssuanceFrequency() {
    if (this.isRateTableEdit) {
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
      }, () => {
        this.getRateTable();
        this.openIssuanceFrequencyChangeModal();
      });
    } else {
      this.openIssuanceFrequencyChangeModal();
    }
  }

  openIssuanceFrequencyChangeModal() {
    const modalRef = this.modalService.open(
      EditBillIssuanceFrequnecyComponent,
      {
        windowClass: 'modal-lmd',
        centered: true,
        backdrop: 'static',
      }
    );

    modalRef.componentInstance.billingSettings = {...this.billingSettings};
    modalRef.componentInstance.pageType = 'editclient';
    modalRef.componentInstance.officeId = this.officeId;
    modalRef.componentInstance.clientId = this.clientId;

    modalRef.result.then((res: vwBillingSettings) => {
      if (res) {
        this.updateBillingSettings(res);
      } else {
        this.getBillingSettings();
      }
    });
  }

  editInvoiceAddress() {
    if (this.isRateTableEdit) {
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
      }, () => {
        this.getRateTable();
        this.openInvoiceAddressChangeModal();
      });
    } else {
     this.openInvoiceAddressChangeModal();
    }
  }

  openInvoiceAddressChangeModal() {
    const modalRef = this.modalService.open(
      EditInvoiceAddressComponent,
      this.modalOptions
    );

    modalRef.componentInstance.address = {...this.invoiceAddress};
    modalRef.componentInstance.primaryAddress = this.primaryAddress;
    modalRef.componentInstance.stateList = this.stateList;
    modalRef.componentInstance.isSameAsPrimaryAddress = this.isBillingAddressSameAsPrimary;

    modalRef.result.then((res) => {
      if (res) {
        this.afterUpdate = true;
        if (res.id) {
          this.updateAddress(res, 4, 'invoice', res.isSameAsPrimaryAddress);
        } else {
          this.createAddress(res, res.isSameAsPrimaryAddress);
        }
      }
    });
  }

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
      personId: this.clientId,
    } as vwAddressDetails;
    this.billingLoading = true;
    this.personService
      .v1PersonAddressPut$Json({
        body: address,
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        (response) => {
          if (response > 0) {
            this.billingSettings.invoiceAddressId = (isSameAsPrimaryAddress) ? this.primaryAddress.id : null;
            this.updateBillingSettings(this.billingSettings, false);
            this.invoiceAddress = res;
            this.toastr.showSuccess(this.error_data.address_updated_success);
          } else {
            this.toastr.showError(this.error_data.address_update_error);
          }
        },
        () => {
        }
      );
  }

  private createAddress(res: vwAddressDetails, isSameAsPrimaryAddress: boolean) {
    const address = {
      address1: res.address1,
      address2: res.address2,
      addressTypeId: 2,
      addressTypeName: 'billing',
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.clientId,
    } as vwAddressDetails;
    this.billingLoading = true;
    this.personService
      .v1PersonAddressPost$Json({
        body: address,
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        (response) => {
          if (response > 0) {
            this.billingSettings.invoiceAddressId = (isSameAsPrimaryAddress) ? this.primaryAddress.id : null;
            this.updateBillingSettings(this.billingSettings, false);
            this.invoiceAddress = res;
            this.invoiceAddress.id = response;
            this.toastr.showSuccess(this.error_data.address_updated_success);
          } else {
            this.toastr.showError(this.error_data.address_update_error);
          }
        },
        () => {
        }
      );
  }

  editInvoicePreferences() {
    if (this.isRateTableEdit) {
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
      }, () => {
        this.getRateTable();
        this.openInvoicePreferencesChangeModal();
      });
    } else {
      this.openInvoicePreferencesChangeModal();
    }
  }

  openInvoicePreferencesChangeModal() {
    const modalRef = this.modalService.open(
      EditInvoicePreferencesComponent,
      this.modalOptions
    );

    modalRef.componentInstance.billingSettings = {...this.billingSettings};
    modalRef.componentInstance.invoiceDeliveryList = this.invoiceDeliveryList;

    modalRef.result.then((res: vwBillingSettings) => {
      if (res) {
        this.updateBillingSettings(res);
      }
    });
  }

  private updateBillingSettings(billingSettings: vwBillingSettings, displayMsg: boolean = true) {
    this.billingService
      .v1BillingSettingsPut$Json({
        body: billingSettings,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        (response) => {
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
        }
      );
  }

  private getBillingSettings(loadListItems = false) {
    this.billingService
      .v1BillingSettingsPersonPersonIdGet({
        personId: this.clientId,
      })
      .pipe(map(UtilsHelper.mapData), finalize(() => {
        this.billingLoading = false;
      }))
      .subscribe((res) => {
        if (res) {
          this.billingSettings = res[0];
          const daysList = UtilsHelper.getDayslistn();
          this.billFrequencyDurationName = (this.billingSettings.billFrequencyQuantity == 1) ?
            this.billingSettings.billFrequencyDuration.name.slice(0, -1) :
            this.billingSettings.billFrequencyDuration ?
              this.billingSettings.billFrequencyDuration.name : '';
          this.billFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.billFrequencyDay);
          if (this.billingSettings.effectiveBillFrequencyQuantity) {
            this.effectiveBillFrequencyDurationName = (
              this.billingSettings.effectiveBillFrequencyQuantity == 1 &&
              this.billingSettings.effectiveBillFrequencyDuration
            ) ? this.billingSettings.effectiveBillFrequencyDuration.name.slice(0, -1) :
              (this.billingSettings.effectiveBillFrequencyDuration) ?
                this.billingSettings.effectiveBillFrequencyDuration.name : '';
            this.effectiveBillFrequencyDurationName = (this.effectiveBillFrequencyDurationName) ? this.effectiveBillFrequencyDurationName.toLocaleLowerCase() : this.effectiveBillFrequencyDurationName;
            this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.effectiveBillFrequencyDay);
          }
        } else {
          this.billingSettings = {};
        }

        if (loadListItems) {
          this.getListItems();
        }
        this.getInvoiceAddress();
        this.billingLoading = false;
      });
  }

  getRateTable() {
    this.loading = true;
    this.rateTableService.v1RateTableViewGet({clientId: this.clientId}).subscribe((result: any) => {
      const rateTable = JSON.parse(result).results;
      this.loading = false;
      if (rateTable.name) {
        if (rateTable.jobFamily && rateTable.jobFamily.length) {
          rateTable.jobFamily.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 0);
        }
        this.rateTables = [rateTable];
      } else {
        this.rateTables = [];
      }
      this.isCustomBillingRate = this.rateTables.length > 0;
      this.rateTablesChange.emit(this.rateTables);
      this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
      this.isEditRateTableChange.emit(false);
    }, () => {
      this.loading = false;
    });
  }

  public getDisburs(data) {
  }

  editRateTable() {
    this.isRateTableEdit = true;
    this.isEditRateTableChange.emit(true);
  }

  openRateTableModal() {
    const modalRef = this.modalService.open(RateTableModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
      windowClass: 'modal-xlg'
    });
    modalRef.componentInstance.rateTables = cloneDeep(this.rateTables);
    modalRef.componentInstance.isClient = true;
    modalRef.result.then((result) => {
      this.rateTables = result;
      this.rateTablesChange.emit(this.rateTables);
    }, () => {});
  }

  deleteRateTable() {
    if (this.isEditRateTable) {
      this.loading = true;
      this.rateTableService.v1RateTableDeleteDelete({clientId: this.clientId}).subscribe((result) => {
        this.getRateTable();
      }, () => {
        this.loading = false;
      });
    }
  }

  saveRateTable() {
    this.rateTableFormSubmitted = true;
    if (!this.isCustomBillingRate) {
      this.deleteRateTable();
      this.rateTableFormSubmitted = false;
      this.isEditRateTableChange.emit(false);
    } else if (this.isCustomBillingRate && this.rateTables.length) {
      this.loading = true;
      this.rateTables.forEach(rateTable => {
        rateTable.clientId = this.clientId;
        rateTable.id = rateTable.isNewRateTable || !rateTable.id ? 0 : rateTable.id;
      });
      this.rateTableService.v1RateTableEditPut$Json({body: this.rateTables[0]}).subscribe(() => {
        this.isEditRateTableChange.emit(false);
        this.rateTableFormSubmitted = false;
        this.getRateTable();
      }, () => {
        this.loading = false;
        this.rateTableFormSubmitted = false;
      });
    } else {
      return;
    }
  }

  customBillingChange($event) {
    this.isCustomBillingRateChange.emit($event);
    this.rateTables = [];
    this.rateTablesChange.emit(this.rateTables);
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
