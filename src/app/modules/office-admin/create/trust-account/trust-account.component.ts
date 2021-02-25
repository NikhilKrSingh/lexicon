import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IEmployeeCreateStepEvent, Page } from 'src/app/modules/models';
import { SetOfficeTrustAccountSettings } from 'src/app/modules/models/set-office-trust-account-settings.model';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwIdName, vwUsioBankAccountsBasicInfo } from 'src/common/swagger-providers/models';
import { OfficeService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-trust-account',
  templateUrl: './trust-account.component.html',
  styleUrls: ['./trust-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustAccountComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<IEmployeeCreateStepEvent>();
  @Output() readonly prevStep = new EventEmitter<IEmployeeCreateStepEvent>();
  @Input() public officeId = 0;
  @Input() public bankAccountName: string =null;
  public officeNotes = '';
  public officeTrustBankAccounts: Array<vwIdName>;
  public selectedOfficeTrustBankAccount: number;
  public selectedOfficeCreditCardTrustBankAccount: number;
  public officeCreditBankAccounts: Array<vwIdName>;
  public selectedOfficeCreditBankAccount: number;
  public isSubmitted = false;
  public isEnabledCreditCardAccount = false;
  public trustAccountingFlag: boolean = false;
  public errorFlagOfficeAccount: boolean = false;
  public errorFlagCreditCardOfficeAccount: boolean = false;
  public trustAccountLengthOneFlag: boolean = false;
  public trustCCreditCardAccountLengthOneFlag: boolean = false;
  public trustAccountFLag: boolean = false;
  public selectedCheckBox: boolean = false;
  trustPaymentGracePeriodForm: FormGroup;
  public officeSetTrustAccountLocal: any;
  public errorData: any = (errorData as any).default;
  public selectedTrustAccountList: Array<any> = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public pageSelected = 1;
  public selectPageSize = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectedOfficeCreditCardTrustBank: Array<any> = [];
  public selectedCreditRow: any = null;
  public slectedRowIndex: number = null;
  public errorCreditListBank: boolean = false;
  public creditCardBankId: number = null;
  public loading: boolean = false;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  trustAccountError: boolean = false;

  constructor(
    private officeService: OfficeService,
    private router: Router,
    private trustAccountService: TrustAccountService,
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private toastr: ToastDisplay,
    private usioService: UsioService,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
   }

  ngOnInit() {
    this.trustPaymentGrace();
    this.loadLocalData();
  }

  loadLocalData() {
    const officeSetTrustAccount = UtilsHelper.getObject('officeSetTrustAccount');
    this.officeSetTrustAccountLocal = officeSetTrustAccount;
    if (officeSetTrustAccount && officeSetTrustAccount.basicSettings) {
      const basicSettings = officeSetTrustAccount.basicSettings;
      this.selectedCheckBox = basicSettings['isPaperCheckRequired'];
      this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(basicSettings['officeTrustPaymentGracePeriod']);
    }

    if (officeSetTrustAccount && officeSetTrustAccount.bankAccountData) {
      const bankAccountData = officeSetTrustAccount.bankAccountData;
      this.selectedOfficeTrustBankAccount = bankAccountData['firmTrustBankAccountId'];
      this.trustAccountingFlag = officeSetTrustAccount.trustAccountingFlag;
      if (this.trustAccountingFlag) {
        this.isEnabledCreditCardAccount = true;
        this.selectedOfficeCreditCardTrustBankAccount = bankAccountData['firmTrustCreditCardAccountId'];
      }
    }

  }

  changeCreditAccountStatus(event) {
    this.errorFlagCreditCardOfficeAccount = false;
    if (event.target.checked) {
      this.isEnabledCreditCardAccount = true;
    } else {
      this.isEnabledCreditCardAccount = false;
      this.selectedOfficeCreditCardTrustBankAccount = null;
      this.officeCreditBankAccounts = [];
    }
  }

  prev() {
    this.prevStep.emit({
      currentStep: 'trustaccount',
      prevStep: 'settings',
    });
  }
  officeTrustAccountChange() {
    this.errorFlagOfficeAccount = false;
  }
  officeCreditCardAccountChange() {
    this.errorFlagCreditCardOfficeAccount = false
  }
  checkBoxCheckEvent(event) {
    if (event.target.checked) {
      this.selectedCheckBox = true;
    } else {
      this.selectedCheckBox = false;
    }
  }
  trustPaymentGrace() {
    this.trustPaymentGracePeriodForm = this.formBuilder.group({
      trustPaymentGracePeriod: new FormControl('')
    });
    this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(0);
  }
  next() {
    this.isSubmitted = true;
    this.checkCreditBankError();
    if((this.selectedTrustAccountList.length <= 0) || (this.trustAccountingFlag && (this.selectedTrustAccountList.length <= 0)) || this.errorCreditListBank) {
      this.trustAccountError = true;
      window.scroll(0, 0);
      return;
    }

    let isError = false;
    let data: any = new SetOfficeTrustAccountSettings()
    data.isPaperCheckRequired = this.selectedCheckBox;
    data.officeId = 0;
    data.officeTrustPaymentGracePeriod = this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];

    let bankAccountData: any = {};
    bankAccountData.officeId = 0;
    bankAccountData.firmTrustBankAccountId = this.selectedOfficeTrustBankAccount;
    bankAccountData.isCreditCardTrustAccountEnabled = this.trustAccountingFlag;
    bankAccountData.firmTrustCreditCardAccountId = this.trustAccountingFlag ? this.selectedOfficeCreditCardTrustBankAccount : 0;

    const tmp: any = UtilsHelper.getObject('officeSetTrustAccount') ? UtilsHelper.getObject('officeSetTrustAccount') : {};
    tmp.basicSettings = data;
    tmp.bankAccountData = bankAccountData;
    tmp.selectedTrustAccountList = this.selectedTrustAccountList;
    tmp.trustAccountingFlag = this.trustAccountingFlag;
    UtilsHelper.setObject('officeSetTrustAccount', tmp);

    this.nextStep.emit({
      nextStep: 'lawofficenotes',
      currentStep: 'trustaccount',
    });
    this.trustAccountError = false;
  }

  public selectedTrustAccount(rows: Array<any>) {
    this.selectedTrustAccountList= [...rows];
    this.calculateTotalPage();
  }

  public calculateTotalPage() {
    this.page.totalPages = Math.ceil(
      this.selectedTrustAccountList.length / this.page.size
    );
  }

   /** Data Table Items per page */
   public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.calculateTotalPage();
  }

  /*** Triggers hen page changes */
  public changePage() {
    this.page.pageNumber = this.pageSelected-1;
  }

  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  /****** Change Page Drop Down */
  public changePageDropDown(e) {
    this.pageSelected = e.page;
  }

  public openCreditCardBankListModal(row?, rowIndex?, template?, creditCardBankId?) {
    this.slectedRowIndex = rowIndex;
    this.selectedCreditRow = row;
    this.bankAccountName = row && row.name ? row.name : null;
    this.creditCardBankId = null;
    if(creditCardBankId) {
      this.creditCardBankId = +creditCardBankId;
    }
    this.modalService.open(template, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-xlg'
    }).result.then((res) => {
      if (res) {
        this.creditCardBankId = null;
      } else {
        
      }
    });
  }

  public saveCreditCard() {
    if(this.selectedOfficeCreditCardTrustBank.length <= 0) {
      return;
    }
    this.selectedTrustAccountList[this.slectedRowIndex]['creditCardTrustBank'] = this.selectedOfficeCreditCardTrustBank[0].name ? this.selectedOfficeCreditCardTrustBank[0].name : null;
    this.selectedTrustAccountList[this.slectedRowIndex]['creditCardTrustBankId'] = this.selectedOfficeCreditCardTrustBank[0].usioBankAccountId ? this.selectedOfficeCreditCardTrustBank[0].usioBankAccountId : 0;
    this.checkCreditBankError();
    this.toastr.showSuccess('Credit card trust bank account selected.');
    this.selectedTrustAccountList = [...this.selectedTrustAccountList];
    this.selectedCreditRow = null;
    this.selectedOfficeCreditCardTrustBank = [];
    this.slectedRowIndex = null;
    this.creditCardBankId = null;
    this.modalService.dismissAll();
  }

  public selectedCreditTrustAccount(event) {
    if(event) {
      this.selectedOfficeCreditCardTrustBank.push(event[0])
    }
  }

  public checkCreditBankError() {
    if(this.trustAccountingFlag) {
      let i = 0;
      while(i < this.selectedTrustAccountList.length) {
        if((this.selectedTrustAccountList[i].creditCardTrustBank == null) || (this.selectedTrustAccountList[i].creditCardTrustBank == '')) {
          this.errorCreditListBank = true;
          i = 0;
          break;
        } else {
          this.errorCreditListBank = false;
        }
        i++;
      }
      i = 0;
    }
  }

  /********* Links Credit Card Bank To Trust Account Bank *****/
  public async creditCardBankToTrustBank() {
    let body: vwUsioBankAccountsBasicInfo[] = [];
    if(this.selectedTrustAccountList.length) {
      this.selectedTrustAccountList.forEach(item => {
        body.push({
          id: 0,
          trustBankAccountId: item && item.usioBankAccountId ? item.usioBankAccountId : 0,
          isCreditCardAccountSelected: this.trustAccountingFlag,
          usioCreditCardAccountId: item && item.creditCardTrustBankId ? item.creditCardTrustBankId : 0
        });
      });
    }
    this.loading = true;
    try {
      const resp = await this.usioService
        .v1UsioAddEditUsioOfficeBankAccountsPost$Json({ officeId: this.officeId, body })
        .toPromise();
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}