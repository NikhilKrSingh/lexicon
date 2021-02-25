import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SharedDataService } from 'src/app/service/shared-data.service';
import { TenantService } from 'src/common/swagger-providers/services';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import { FirmTrustAccountSetting } from '../../models/vwFirmTrustAccountSetting.model';
import { DialogService } from '../../shared/dialog.service';
import { UtilsHelper } from '../../shared/utils.helper';
import { AddEditFirmTrustAccountComponent } from './add-edit-firm-trust-account/add-edit-firm-trust-account.component';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SettingComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) tableCreditCard: DatatableComponent;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public alltabs1: string[] = ['Firm Trust Bank Accounts', 'Firm Credit Card Trust Bank Accounts'];
  public selecttabs1 = this.alltabs1[0];
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
  public pageSelected = 1;
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

  constructor(
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private cdr: ChangeDetectorRef,
    private trustAccountService: TrustAccountService,
    private formBuilder: FormBuilder,
    private tenantService: TenantService,
    private sharedDataService: SharedDataService,
    private pagetitle: Title
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pagec.pageNumber = 0;
    this.pagec.size = 10;
  }

  ngOnInit() {
    this.pagetitle.setTitle("Trust Accounting");
    this.checkTrustAccountStatus();
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

  }

  async checkTrustAccountStatus(): Promise<any> {
    this.loading = true;
    let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      this.trustAccountingFlag = true;
    } else {
      this.trustAccountingFlag = false;
    }
    this.loading = false;
  }
  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  public async changeAccountStatusCheck(event, status) {
    event.preventDefault();
    if (status) {
      let resp: any = await this.trustAccountService.v1TrustAccountGetIsPendingTransfersInQueueGet$Response().toPromise();
      resp = JSON.parse(resp.body as any).results;
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
    if (!status) {
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
          this.trustAccountingFlag = !status;
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
        let success = 'Trust Accounting disabled.';
        if (this.trustAccountingFlag) {
          success = "Trust Accounting enabled.";
          this.getTrustAccountSettingDetails()
        }
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
  onClickedOutside(event: any, index: number) {
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
        event.target.closest('.datatable-row-wrapper').classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target.closest('.datatable-row-wrapper').classList.remove('datatable-row-hover');
      }
    }, 50);
  }


  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.getTotalPages();
  }


  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    UtilsHelper.aftertableInit();
  }

  public pageChange(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public getTotalPages() {
    this.page.totalElements = this.firmAccountList.length;
    this.page.totalPages = Math.ceil(this.firmAccountList.length / this.page.size);
    this.table.offset = 0;
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
    UtilsHelper.aftertableInit();
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
        backdrop: 'static',
        centered: true
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

  get isCheckValidForms() {
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

  saveBtn() {
    if (!this.isCheckValidForms) {
      return;
    }
    let resp: any;
    try {
      var data: any = new FirmTrustAccountSetting();
      if (this.isAM == false) {
        let Hour = parseInt(this.queueTimeForm.value['queueTimeHour']) != 12 ? parseInt(this.queueTimeForm.value['queueTimeHour']) + 12 : 12
        data.hours = Hour;
      } else {
        let Hour = parseInt(this.queueTimeForm.value['queueTimeHour']) != 12 ? parseInt(this.queueTimeForm.value['queueTimeHour']) : 0
        data.hours = Hour;
      }
      data.minutes = parseInt(this.queueTimeForm.value['queueTimeSecond']) + 0;
      data.trustPaymentGracePeriod = this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];
      var overPayments = this.overPaymentOption ? 'Accounts Receivable Balance' : 'Primary Retainer Trust Account';
      if (overPayments == 'Accounts Receivable Balance') {
        data.targetAccountsForOverPayments = 0;
      } else {
        data.targetAccountsForOverPayments = 1;
      }
      this.trustAccountService.v1TrustAccountSetFirmTrustAccountSettingsPost$Json$Response({ body: data }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null) {
            this.isEdit = false;
            this.getTrustAccountSettingDetails();
          }
        }
      });
      if (resp) {
      }
    } catch (err) {
    }
  }
  getTrustAccountSettingDetails() {
    this.trustAccountService.v1TrustAccountGetFirmTrustAccountSettingsGet$Response().subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null && parsedRes.results) {
          var result = parsedRes.results;
          this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(result.trustPaymentGracePeriod);
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
    });
  }

  getTenantTierDetails() {
    this.profile = UtilsHelper.getObject('profile');
    if (this.profile) {
      if (this.profile.tenantTier && this.profile.tenantTier.tierName &&
        (this.profile.tenantTier.tierName === 'Ascending' || this.profile.tenantTier.tierName === 'Iconic')) {
        this.isValidTenantTier = true;
      }
    }
  }
}
