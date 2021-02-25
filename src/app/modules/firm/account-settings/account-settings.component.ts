import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SharedDataService } from 'src/app/service/shared-data.service';
import { TenantService, UsioService } from 'src/common/swagger-providers/services';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import { IndexDbService } from '../../../index-db.service';
import { AddEditFirmTrustAccountComponent } from '../../../modules/trust-account/setting/add-edit-firm-trust-account/add-edit-firm-trust-account.component';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import { FirmTrustAccountSetting } from '../../models/vwFirmTrustAccountSetting.model';
import { REGEX_DATA } from '../../shared/const';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  alltabs = [
    'Accounts',
    'ACH Processing',
    'Trust Accounting'
  ];
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) tableCreditCard: DatatableComponent;

  public errorData: any = (errorData as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public alltabs1: string[] = ['Firm Trust Bank Accounts', 'Firm Credit Card Trust Bank Accounts'];
  public modalOptions: NgbModalOptions;
  public trustAccountingFlag: boolean;
  public isPresentTransferQueueItems: boolean = true;
  public isAllowTrustAccountingFlagChange: boolean = true;
  public isShowTrustAccountingFlagSection: boolean = true;
  public isShowTrustAccountingSection: boolean = true;
  public firmAccountList: any = [];
  public firmCreditCardAccountList: any = [];
  public currentActive: number;
  public pageSelector = new FormControl('10');
  public pageSelectorc = new FormControl('10');
  public messages = { emptyMessage: 'No Firm Trust Bank Accounts' };
  public messagesc = { emptyMessage: 'No Firm Credit Card Trust Bank Accounts' };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelected: number = 1;
  public pagec = new Page();
  public pageSelectedc = 1;
  public counter = Array;
  public limitArray: Array<number> = [10, 30, 50, 100];
  overPaymentOption = true;
  trustPaymentGracePeriodForm: FormGroup;
  queueTimeForm: FormGroup;
  isEdit = false;
  isAM = false;
  originalGracePeriod = 0;
  originalOverPaymentOption = true;
  originalIsAM = false;
  originalHour = "00";
  originalSecond = "00";
  isAccess = false;
  public isValidTenantTier = false;
  public profile = null;
  public loading: boolean;
  public listOffice: any;
  public selectedAccount: any;
  public arcProcessingStatus = false;

  public statusFilterName: string = null;
  public merchantAccountFilterId: number = null;
  public accounTypeFilterId: number = null;
  public transactionTypeFilterId: number = null;
  public usioAccountList: Array<any> = [];
  public originalUsioAccountList: Array<any> = [];
  public selectPageSize = new FormControl('10');
  public searchText: string = '';
  public statusFilterList: any[] = ['All', 'Active', 'Disabled', 'Error', 'Pending Signatory', 'Underwriting'];
  public merchantAccountFilterList: any[] = [
    { id: 0, name: 'All' },
    { id: 1, name: 'Yes' },
    { id: 2, name: 'No' }];
  public accounTypeFilterList: any[] = [
    { id: 0, name: 'All' },
    { id: 1, name: 'Operating' },
    { id: 2, name: 'Trust' },
    { id: 3, name: 'Credit Card Trust ' }];
  public transactionTypeFilterList: Array<any> = [
    { id: 0, name: 'All' },
    { id: 1, name: 'ACH' },
    { id: 2, name: 'Credit Card' }];
  public accountLoader = false;
  public enableTrustAccounting: boolean = false;
  origTrustAccountingData: any = {};
  selecttabs1: any;
  ownerEmail: string;
  accountId: number;
  ownerEmailRequired: boolean;
  public resendOwnerEmailForm: FormGroup;
  constructor(
    private modalService: NgbModal,
    private trustAccountService: TrustAccountService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private toastDisplay: ToastDisplay,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private tenantService: TenantService,
    private sharedDataService: SharedDataService,
    private pagetitle: Title,
    private router: Router,
    private usioService: UsioService,
    private indexDbService: IndexDbService,
    private toastService: ToastDisplay,
    private builder: FormBuilder,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.selecttabs1 = this.alltabs[0];
    this.ownerEmailRequired = false;
  }
  ngOnInit() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pagetitle.setTitle("Accounting Settings");
    this.checkTrustAccountStatus();
    this.getUsioAccounts();
    this.getArchProcessingStatus();
    this.trustPaymentGrace();
    this.queueTime();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.permissionList.TENANT_CONFIGURATIONisAdmin) {
            this.isShowTrustAccountingFlagSection = true;
          } else {
            this.isShowTrustAccountingFlagSection = false;
          }

          if (this.permissionList.ACCOUNTINGisAdmin) {
            this.isShowTrustAccountingSection = true;
            this.addAccountingQueTab();
            if (this.permissionList.TENANT_CONFIGURATIONisAdmin) {
              this.isShowTrustAccountingFlagSection = true;
            } else {
              this.isShowTrustAccountingFlagSection = false;
            }
          } else {
          }

          if (this.permissionList.ACCOUNTINGisAdmin || this.permissionList.TENANT_CONFIGURATIONisAdmin) {
            this.isAccess = true;
          }
        }
      }
    });
    this.getTrustAccountSettingDetails();
    this.getTenantTierDetails();
    this.initilizeForm();
  }
  getUsioAccounts() {
    this.accountLoader = true;
    this.usioService.v1UsioGetAllUsioBankAccountsGet$Response().subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.originalUsioAccountList = resp;
        this.originalUsioAccountList.forEach((value, index) => {
          this.originalUsioAccountList[index].internalAccountStatus = _.startCase(value.internalAccountStatus)
        })
        this.usioAccountList = [...this.originalUsioAccountList];
        this.getTotalPages();
        this.accountLoader = false;
      }, err => {
        console.log(err);
        this.accountLoader = false
      }
    );
  }
  changeStatus(row, content, type, $event?) {
    if ($event && $event.target) {
      $event.target.closest('datatable-body-cell').blur();
    }
    this.selectedAccount = row;
    switch (type) {
      case 'disable':
        this.usioService.v1UsioGetUsioBankAccountSetupByOfficeGet$Response({ usioBankAccountId: row.id })
          .subscribe(suc => {
            let res: any = suc;
            let resp = JSON.parse(res.body).results;
            this.listOffice = resp;
            this.openPersonalinfo(content, '', '');
          }, err => {
            console.log(err);
          });
        break;

      case 'enable':
        this.openPersonalinfo(content, '', 'modal-slg');
        break;

      case 'retry':
        this.retryAccountRegisteraton(row);
        break;
    }
  }

  disabledAccount() {
    this.usioService.v1UsioEnableDisableUsioBankAccountDelete$Response({ usioBankAccountId: this.selectedAccount.id, isDisable: true }).subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.searchText = null;
        this.getUsioAccounts();
      }, err => {
        console.log(err);
      }
    );
  }
  enabledAccount() {
    this.usioService.v1UsioEnableDisableUsioBankAccountDelete$Response({ usioBankAccountId: this.selectedAccount.id, isDisable: false }).subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.searchText = null;
        this.getUsioAccounts();
      }, err => {
        console.log(err);
      }
    );
  }

  getArchProcessingStatus() {
    this.loading = true;
    this.usioService.v1UsioGetTenantAchSettingsGet$Response().subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.loading = false;
        this.arcProcessingStatus = resp;
      }, err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  changeArcProcessingStaus(event) {
    this.loading = true;
    this.usioService.v1UsioSetTenantAchSettingsPost$Response({ isEnabled: event.target.checked }).subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.loading = false;
        if (event.target.checked == true) {
          this.toastDisplay.showSuccess('Same-Day ACH Processing enabled.');
        }
        if (event.target.checked == false) {
          this.toastDisplay.showSuccess('Same-Day ACH Processing disabled.');
        }
        this.getArchProcessingStatus();
        this.arcProcessingStatus = resp;
      }, err => {
        this.loading = false;
        console.log(err);
      }
    );

  }

  async checkTrustAccountStatus(): Promise<any> {
    this.loading = true;
    let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      this.trustAccountingFlag = true;
      this.origTrustAccountingData['trustAccountingFlag'] = this.trustAccountingFlag;
    } else {
      this.trustAccountingFlag = false;
      this.origTrustAccountingData = {};
      this.origTrustAccountingData['trustAccountingFlag'] = this.trustAccountingFlag;
    }
    this.enableTrustAccounting = this.trustAccountingFlag;
    this.loading = false;
  }
  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  public async changeAccountStatusCheck(status, event?) {
    // event.preventDefault();
    if (status) {
      this.loading = true;
      let resp: any = await this.trustAccountService.v1TrustAccountGetIsPendingTransfersInQueueGet$Response().toPromise();
      resp = JSON.parse(resp.body as any).results;
      this.loading = false;
      if (resp) {
        this.isPresentTransferQueueItems = true;
      } else {
        this.isPresentTransferQueueItems = false;
      }
      if (this.isPresentTransferQueueItems) {
        this.cdr.detectChanges();

        let buttonlbl = 'Disable';
        let message = 'You cannot disable Trust Accounting, as there are items in the Transfer Queue.';
        this.dialogService
          .confirm(
            message,
            'Ok',
            'Okay',
            buttonlbl + ' Trust Accounting',
            false,
            'modal-lmd',
            false
          )
          .then(res => {
            this.trustAccountingFlag = status;
          });
      } else {
        this.changeAccountStatus(status);
      }
    } else {
      this.changeAccountStatus(status);
    }
  }

  /**
   * Handle enable/disabled account toggle
   * @param event
   */
  public changeAccountStatus(status) {
    this.cdr.detectChanges();
    let buttonlbl = 'Disable';
    let message = 'Are you sure you want to disable trust accounting? No money will be moved, but in 24 hours, all trust account balances in Lexicon will be adjusted to $0. You will still have access to trust accounting reports. Are you sure you want to proceed?'
    if (status.target.checked) {
      message = "Are you sure you want to enable trust accounting? If it had been previously enabled, no previous balances will be restored, and no money will be moved. Are you sure you want to proceed?";
      buttonlbl = 'Enable';
    }
    this.dialogService
      .confirm(
        message,
        'Yes, ' + buttonlbl + ' Trust Accounting',
        'Cancel',
        buttonlbl + ' Trust Accounting',
        false,
        'modal-lmd'
      )
      .then(res => {
        if (res) {
          this.trustAccountingFlag = status.target.checked;
          this.updateTrustAccountingStatus();
        } else {
          this.trustAccountingFlag = status;
        }
      });
  }

  async updateTrustAccountingStatus() {
    try {
      this.loading = true;
      let resp = await this.trustAccountService.v1TrustAccountChangeCurrentTrustAccountStatusPost$Response({}).toPromise();
      if (resp) {
        this.sharedDataService.changeTrustAccountStatus(this.trustAccountingFlag);
        let success = 'Trust accounting disabled.';
        if (this.trustAccountingFlag) {
          success = "Trust accounting enabled.";
          this.getTrustAccountSettingDetails()
        }
        this.checkTrustAccountStatus();
        this.toastDisplay.showSuccess(success);
      }
      this.loading = false;
    } catch (ex) {
      this.loading = false;
      this.trustAccountingFlag = !this.trustAccountingFlag;
      this.toastDisplay.showError(ex.message);
    }
  }

  openModel(type: string, action: string, row?: any) {
    let modalRef = this.modalService.open(AddEditFirmTrustAccountComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'modal-lmd',
    });
    modalRef.componentInstance.type = type;
    modalRef.componentInstance.action = action;
    if (action === 'edit') {
      if (row) {
        modalRef.componentInstance.trustAccountDetails = row;
      }
      modalRef.componentInstance.title = (type === 'firmbank') ? 'Edit Trust Bank Account' : 'Edit Credit Card Trust Bank Account';
      modalRef.componentInstance.btnName = 'Save Changes';
    } else if (action === 'add') {
      modalRef.componentInstance.title = (type === 'firmbank') ? 'Create Trust Bank Account' : 'Create Credit Card Trust Bank Account';;
      modalRef.componentInstance.btnName = (type === 'firmbank') ? 'Create Trust Account' : 'Create Credit Card Trust Bank Account';;
    }

    modalRef.result.then(res => {
      if (type === 'firmbank' && action === 'add' && res && res.data) {
        res.data['status'] = 'Active';
        this.firmAccountList.push(res.data);
        this.getTotalPages();
        this.firmAccountList = [...this.firmAccountList];
      } else if (type === 'firmcreditcardbank' && action === 'add' && res && res.data) {
        res.data['status'] = 'Active';
        this.firmCreditCardAccountList.push(res.data);
        this.getTotalPagesc();
        this.firmCreditCardAccountList = [...this.firmCreditCardAccountList];
      }
    });
  }

  /*** closed menu on body click */
  onClickedOutside(index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }


  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.getTotalPages();
  }


  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.getTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public getTotalPages() {
    this.page.totalElements = this.usioAccountList.length;
    this.page.totalPages = Math.ceil(this.usioAccountList.length / this.page.size);
    if (this.table) {
      this.table.offset = 0;
    }
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  public changePageSizec() {
    this.pagec.size = +this.pageSelectorc.value;
    this.getTotalPages();
  }


  public changePagec() {
    this.pagec.pageNumber = this.pageSelectedc - 1;
    if (this.pageSelectedc == 1) {
      this.getTotalPagesc();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChangec(e) {
    this.pageSelectedc = e.page;
    UtilsHelper.aftertableInit();
  }

  public getTotalPagesc() {
    this.pagec.totalElements = this.firmCreditCardAccountList.length;
    this.pagec.totalPages = Math.ceil(this.firmCreditCardAccountList.length / this.pagec.size);
    this.tableCreditCard.offset = 0;
    this.pagec.pageNumber = 0;
    this.pageSelectedc = 1;
    UtilsHelper.aftertableInit();
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
        },
        reason => {
        }
      );
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  overPaymentCheck() {
    this.overPaymentOption = !this.overPaymentOption;
  }
  trustPaymentGrace() {
    this.trustPaymentGracePeriodForm = this.formBuilder.group({
      trustPaymentGracePeriod: new FormControl('')
    });
    this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(0);
  }

  queueTime() {
    this.queueTimeForm = this.formBuilder.group({
      queueTimeHour: new FormControl(''),
      queueTimeSecond: new FormControl('')
    });
    this.queueTimeForm.controls['queueTimeHour'].setValue('06');
    this.queueTimeForm.controls['queueTimeSecond'].setValue('00');
  }

  onHourChange(value) {
    let hour = "0";
    if (value > 12) {
      hour = (value % 12).toString();
    } else if (value) {
      hour = value.toString();
    }

    if (hour.length < 2) {
      hour = '0' + hour;
    }

    this.queueTimeForm.controls['queueTimeHour'].setValue(hour);
  }

  onSecondChange(value) {
    let second = "0";
    if (value > 60) {
      second = (value % 60).toString();
    } else if (value) {
      second = value.toString();
    }

    if (second.length < 2) {
      second = '0' + second;
    }

    this.queueTimeForm.controls['queueTimeSecond'].setValue(second);
  }

  setAmPm(value) {
    this.isAM = value;
  }

  isCheckValidForms() {
    if (this.trustPaymentGracePeriodForm.valid && this.queueTimeForm.valid) {
      return true;
    } else {
      return false;
    }
  }

  editBtn() {
    this.isEdit = true;
    this.originalGracePeriod = this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];
    this.originalOverPaymentOption = this.overPaymentOption;
    this.originalIsAM = this.isAM;
    this.originalHour = this.queueTimeForm.value['queueTimeHour'];
    this.originalSecond = this.queueTimeForm.value['queueTimeSecond'];
  }

  cancelBtn() {
    this.isEdit = false;
    this.overPaymentOption = this.originalOverPaymentOption;
    this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(this.originalGracePeriod);
    this.queueTimeForm.controls['queueTimeHour'].setValue(this.originalHour);
    this.queueTimeForm.controls['queueTimeSecond'].setValue(this.originalSecond);
  }

  saveBtn(action) {
    if (!((action == 'accountingQueue' && !this.queueTimeForm.valid) || (action == 'accountingQueue' && !this.trustPaymentGracePeriodForm.valid))) {
      switch(action) {
        case 'trustAccounting' :
          this.setTrustAccountingRequestData(action);
          break;
        case 'accountingQueue':
          this.setAccountingQueueRequestData(action);
      }
    }
  }
  async getTrustAccountSettingDetails() {
    this.loading = true;
    this.trustAccountService.v1TrustAccountGetFirmTrustAccountSettingsGet$Response().subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null && parsedRes.results) {
          var result = parsedRes.results;
          this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(result.trustPaymentGracePeriod);
          setTimeout(() => {
            this.origTrustAccountingData['trustPaymentGracePeriod'] = this.trustPaymentGracePeriodForm.value.trustPaymentGracePeriod;
            this.origTrustAccountingData['overPaymentOption'] = this.overPaymentOption;
          }, 60);
          if (result.processingQueueTime.value.hours > 12) {
            this.isAM = false;
            let Hour;
            Hour = result.processingQueueTime.value.hours - 12;
            if (Hour < 10) {
              Hour = '0' + Hour;
              this.queueTimeForm.controls['queueTimeHour'].setValue(Hour);
            } else {
              this.queueTimeForm.controls['queueTimeHour'].setValue(result.processingQueueTime.value.hours - 12);
            }
          } else if (result.processingQueueTime.value.hours == 12) {
            this.isAM = false;
            this.queueTimeForm.controls['queueTimeHour'].setValue(result.processingQueueTime.value.hours);
          } else if (result.processingQueueTime.value.hours == 0) {
            this.isAM = true;
            this.queueTimeForm.controls['queueTimeHour'].setValue(12)
          }
          else {
            this.isAM = true;
            let Hour = result.processingQueueTime.value.hours
            if (Hour < 10) {
              Hour = '0' + Hour;
              this.queueTimeForm.controls['queueTimeHour'].setValue(Hour);
            } else {
              this.queueTimeForm.controls['queueTimeHour'].setValue(result.processingQueueTime.value.hours);
            }
          }
          if (result.processingQueueTime.value.minutes < 10) {
            let mins = '0' + result.processingQueueTime.value.minutes;
            this.queueTimeForm.controls['queueTimeSecond'].setValue(mins);
          } else {
            this.queueTimeForm.controls['queueTimeSecond'].setValue(result.processingQueueTime.value.minutes);
          }
          if (result.targetAccountsForOverPayments == 0) {
            this.overPaymentOption = true;
          } else {
            this.overPaymentOption = false;
          }
        }
      }
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }

  getTenantTierDetails() {
    this.profile = UtilsHelper.getObject('profile');
    if (this.profile) {
      if (this.profile.tenantTier && this.profile.tenantTier.tierName &&
        (this.profile.tenantTier.tierName === 'Ascending' || this.profile.tenantTier.tierName === 'Iconic')) {
        this.isValidTenantTier = true;
        this.addAccountingQueTab();
      }
    }
  }

  /******* Navigates Route *****/
  public navigate(route: string) {
    switch (route) {
      case 'add-bank-account':
        this.router.navigate(['/firm/account-settings/add-bank-account']);
        break;

      default:
        this.router.navigate(['/firm/account-settings']);
    }
  }

  /******* Triggers When Filter Applied *********/
  public applyFilter() {
    let rows = [...this.originalUsioAccountList];
    if (this.searchText) {
      rows = this.originalUsioAccountList.filter(f => {
        return (
          (f.name || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
          (this.isShowTrustAccountingFlagSection ? f.nonMerchantAccountNumber || '' : (f.nonMerchantAccountNumber ? f.nonMerchantAccountNumber.substr(f.nonMerchantAccountNumber.length - 4) : '')).toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    }

    if (this.accounTypeFilterId) {
      rows = rows.filter(f => {
        return +f.usioAccountTypeId == +this.accounTypeFilterId;
      });
    }

    if (this.transactionTypeFilterId) {
      if (this.transactionTypeFilterId === 1) {
        rows = rows.filter(f => {
          return f.isAchAccount || false;
        });
      }

      if (this.transactionTypeFilterId === 2) {
        rows = rows.filter(f => {
          return f.isCreditCardAccount || false;
        });
      }
    }

    if (this.statusFilterName && this.statusFilterName !== 'All') {
      rows = rows.filter(f => {
        return (f.internalAccountStatus || '').toLowerCase().includes(this.statusFilterName.toLowerCase())
      });
    }
    if (this.merchantAccountFilterId) {
      if (this.merchantAccountFilterId === 1) {
        rows = rows.filter(f => {
          return f.isMerchantAccount || false;
        });
      }

      if (this.merchantAccountFilterId === 2) {
        rows = rows.filter(f => {
          return !f.isMerchantAccount || false;
        });
      }
    }

    this.usioAccountList = [...rows];
    this.getTotalPages();
  }

  /****** Calculate total pages ********/
  public calculateTotalPage() {
    this.page.totalPages = Math.ceil(
      this.usioAccountList.length / this.page.size
    );
  }

  /********** Change Data Table Page ******/
  public changePageAccount() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.getTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /********** Change Data Table Page ******/
  public changePageAccountDropDown(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public counterAccount(): Array<any> {
    return new Array(this.page.totalPages);
  }

  /** Data Table Items per page */
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.getTotalPages();
  }

  /***** Updates Error Status ****/
  public async retryAccountRegisteraton(row?: any) {
    if (row) {
      try {
        this.loading = true;
        await this.usioService.v1UsioRetryAddUsioBankAccountGet({ usioBankAccountId: +row.id })
          .toPromise();
        this.getUsioAccounts();
        this.loading = false;
      } catch (error) {
        this.loading = false;
      }
    } else {
      this.toastDisplay.showError('Something went wrong');
    }
  }

  /*********** Resend Info Email **********/
  public async resendInfoEmail(row, content, type, $event?) {
    this.resendOwnerEmailForm.controls.email.setValue(row.ownerEmail1);

    this.ownerEmail = this.resendOwnerEmailForm.value.email;
    this.accountId = row.id;
    this.openPersonalinfo(content, '', 'modal-slg');
  }

  /***** Redirect to account details page ***/
  public viewAccountDetails(row) {
    if (row && row.id) {
      this.router.navigate(['usio/bank-account-details'], { queryParams: { bankAccountId: row.id } });
    }
  }
  /**
   *
   */
  addAccountingQueTab() {
    if (!this.alltabs.some(item => item == 'Accounting Queue') && this.isValidTenantTier && this.isShowTrustAccountingSection) {
      this.alltabs.push('Accounting Queue');
    }
  }

  redirectTo() {
    this.router.navigate(['/dashboard']);
  }

  /**** function to trigger when tab change */
  tabChange(tab) {
    let data: any = {}
    if(this.selecttabs1 == this.alltabs[2] && tab != this.alltabs[2]) {
      if(this.enableTrustAccounting) {
        data = {
          overPaymentOption: this.overPaymentOption,
          trustAccountingFlag: this.trustAccountingFlag,
          trustPaymentGracePeriod: this.trustPaymentGracePeriodForm.value.trustPaymentGracePeriod
        }
      } else {
        data = {
          trustAccountingFlag: this.trustAccountingFlag
        }
      }
    }
    if(!_.isEqual(this.origTrustAccountingData, data) && (this.selecttabs1 == this.alltabs[2]) && tab != this.alltabs[2]) {
      this.dialogService
      .confirm(
        'Are you sure you want to continue without saving these changes? This will remove any edits you’ve made.',
        'Yes, continue without saving',
        'Cancel',
        'Unsaved Changes'
      )
      .then(res => {
        if (res) {
          this.selecttabs1 = tab;
          if(this.enableTrustAccounting) {
            this.trustAccountingFlag = this.enableTrustAccounting;
            this.overPaymentOption = this.origTrustAccountingData.overPaymentOption;
            this.trustPaymentGracePeriodForm.get('trustPaymentGracePeriod').setValue(+this.origTrustAccountingData.trustPaymentGracePeriod);
          } else {
            this.trustAccountingFlag = this.enableTrustAccounting;
          }
        } else {
          this.selecttabs1 = null;
          this.selecttabs1 = this.alltabs[2];
        }
      });
    } else {
      this.selecttabs1 = tab;
        if (tab === 'Accounts') {
          setTimeout(() => {
            this.getTotalPages();
          }, 200)
        }
      }
  }

  public change(action) {
    switch (action) {
      case 'up':
        this.trustPaymentGracePeriodForm
          .get('trustPaymentGracePeriod')
          .setValue(+this.trustPaymentGracePeriodForm
            .get('trustPaymentGracePeriod').value + 1);
        break;
      case 'down':
        this.trustPaymentGracePeriodForm
          .get('trustPaymentGracePeriod')
          .setValue(+this.trustPaymentGracePeriodForm
            .get('trustPaymentGracePeriod').value - 1);
        break;
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  /***** Sets request payload for trust accounting ****/
  public setTrustAccountingRequestData(tab) {
    if(this.enableTrustAccounting && this.trustAccountingFlag) {
      const data = new FirmTrustAccountSetting();
      data.trustPaymentGracePeriod = +this.trustPaymentGracePeriodForm.get('trustPaymentGracePeriod').value;
      data.targetAccountsForOverPayments = this.overPaymentOption ? 0 : 1;
      this.callCommonApiTrustQueAccounting(data, tab);
      return;
    } else {
      this.changeAccountStatusCheck(this.enableTrustAccounting);
    }
  }

  /****** Sets payload for accounting queue *****/
  public setAccountingQueueRequestData(tab) {
    const data: any = new FirmTrustAccountSetting();
    if (this.isAM == false) {
      let Hour = parseInt(this.queueTimeForm.value['queueTimeHour']) != 12 ? parseInt(this.queueTimeForm.value['queueTimeHour']) + 12 : 12
      data.hours = Hour;
    } else {
      let Hour = parseInt(this.queueTimeForm.value['queueTimeHour']) != 12 ? parseInt(this.queueTimeForm.value['queueTimeHour']) : 0
      data.hours = Hour;
    }
    data.minutes = parseInt(this.queueTimeForm.value['queueTimeSecond']) + 0;
    this.callCommonApiTrustQueAccounting(data, tab);
  }

  /** Common API for trust accounting and accounting queue for save changes **/
  public async callCommonApiTrustQueAccounting(data, tab) {
    try {
      this.loading = true;
      const resp = await this.trustAccountService
        .v1TrustAccountSetFirmTrustAccountSettingsPost$Json$Response({ body: data })
        .toPromise()
      if(JSON.parse(resp.body as any).results) {
        await this.getTrustAccountSettingDetails();
        this.toastDisplay.showSuccess(tab == 'trustAccounting'
        ? this.errorData.trust_accounting_settings_success
        : this.errorData.accounting_queue_settings_success);
      }
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }
    /******* Resends email to owners ****/
    public async resendEmailToOwners() {
      if(!this.resendOwnerEmailForm.valid){
        return;
      }
      this.modalService.dismissAll();
      this.loading = true;
      this.ownerEmailRequired = false;
      try {
        const resp: any = await this.usioService
          .v1UsioSendEmailForESignPost$Response({
            bankAccountId: this.accountId,
            tenantId: 0,
            email: this.resendOwnerEmailForm.value.email })
          .toPromise()
          const res: any = resp;
        if(res && res.status == 200) {
          this.toastService.showSuccess('Owner information email sent.');
          this.loading = false;
          await this.indexDbService.removeObject('PendingSignatoryInfo');
          this.router.navigate(['/firm/account-settings']);
        }
      } catch (error) {
        this.loading = false;
      }
    }
  initilizeForm() {
    this.resendOwnerEmailForm = this.builder.group({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(50),
        Validators.pattern(REGEX_DATA.Email)
      ])
    });
  }
  get f() {
    return this.resendOwnerEmailForm.controls;
  }

  get footerHeight() {
    if (this.usioAccountList) {
      return this.usioAccountList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  public changeQueueTimeHour(action) {
    const value = +this.queueTimeForm.get('queueTimeHour').value;
    switch (action) {
      case 'up':
        this.queueTimeForm
          .get('queueTimeHour')
          .setValue( value < 12 ? ('0' + (value + 1)).slice(-2) : value);
        break;
      case 'down':
        this.queueTimeForm
          .get('queueTimeHour')
          .setValue(value > 0 ? ('0' + (value - 1)).slice(-2) : ('0' + value).slice(-2));
        break;
    }
  }

  public changeQueueTimeSecond(action) {
    const value = +this.queueTimeForm.get('queueTimeSecond').value;
    switch (action) {
      case 'up':
        this.queueTimeForm
          .get('queueTimeSecond')
          .setValue(value > 0 || value < 10 ? ('0' + (value + 1)).slice(-2) : value);
        break;
      case 'down':
        this.queueTimeForm
          .get('queueTimeSecond')
          .setValue(value > 0 || value < 10 ? ('0' + (value - 1)).slice(-2) : value);
        break;
    }
    this.validateInputqueueTimeSecond();
  }

  /***** Validates zip code ****/
  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return ((k >= 48 && k <= 57) || k === 8 || k === 9);
  }

  validateInputqueueTimeHour() {
    const value = +this.queueTimeForm.get('queueTimeHour').value;
    if(value > 12 || value < 0) {
      this.queueTimeForm.controls.queueTimeHour.setValue('');
      return;
    }
  }

  validateInputqueueTimeSecond() {
    const value = +this.queueTimeForm.get('queueTimeSecond').value;
    if(value > 59 || value < 0) {
      this.queueTimeForm.controls.queueTimeSecond.setValue('');
      return;
    }
  }
}
