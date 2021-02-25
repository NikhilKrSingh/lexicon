import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import { Page } from '../../models';
import { DialogService } from '../../shared/dialog.service';
import { UtilsHelper } from '../../shared/utils.helper';
import { AddEditFirmTrustAccountComponent } from '../../trust-account/setting/add-edit-firm-trust-account/add-edit-firm-trust-account.component';

@Component({
  selector: 'app-firm-credit-card-trust-accounts',
  templateUrl: './firm-credit-card-trust-accounts.component.html',
  styleUrls: ['./firm-credit-card-trust-accounts.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FirmCreditCardTrustAccountsComponent implements OnInit {

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) tableCreditCard: DatatableComponent;

  public alltabs1: string[] = ['Firm Trust Bank Accounts', 'Firm Credit Card Trust Bank Accounts'];
  public selecttabs1 = this.alltabs1[0];
  public modalOptions: NgbModalOptions;
  public trustAccountingFlag: boolean = true;
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
  public officeList = [];
  public isCreditCardAccount: boolean;
  constructor(
    private modalService: NgbModal,
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private cdr: ChangeDetectorRef,
    private trustAccountService: TrustAccountService,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pagec.pageNumber = 0;
    this.pagec.size = 10;
  }

  ngOnInit() {
    this.getFirmCreditCardAccountList();
  }

  getFirmCreditCardAccountList() {
    this.trustAccountService.v1TrustAccountGetFirmTrustAccountsGet$Response({ isCreditCardTrustAccount: true }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.firmCreditCardAccountList = parsedRes.results;
          this.getTotalPages();
        }
      }
    });
  }

  public checkExistOff(type: string, row, action: string) {
    this.isCreditCardAccount = true;
    this.trustAccountService.v1TrustAccountGetTrustAccountSetupByOfficeGet$Response({ trustBanAccountId: row['id'], isCreditCardTrustAccount: this.isCreditCardAccount }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.officeList = parsedRes.results;
          this.deactivateActive(type, row, action, this.officeList);
        }
      }
    });
  }

  public deactivateActive(type: string, row, action: string, officeList = null) {
    let message: string, par1: string = 'Deactivate Trust Bank Account', par2: boolean = false,
      par3: boolean = true, btnName: string, btnCancel: string = 'Cancel';
    if (type === 'firmbank') {
      if (action === 'activate') {
        message = 'Are you sure you want to reactivate this trust bank account?';
        btnName = 'Yes, Reactivate Trust Account';
        par1 = 'Reactivate Trust Bank Account';
        par3 = true;
      } else if (action === 'deactivate') {
        message = 'Are you sure you want to deactivate this trust bank account? You can always <strong>Reactivate</strong> the account at a future date if it’s not <strong>Deleted</strong>.';
        par1 = 'Deactivate Trust Bank Account';
        par3 = true;
        btnName = 'Yes, Deactivate Trust Account';
        if (officeList && officeList.length > 0) {
          message = 'You cannot deactivate this trust bank account, because the following offices and their matters are using it:';
          par3 = false;
          btnCancel = 'Okay';
        }
      } else {
        message = 'Are you sure you want to delete this trust bank account? This action cannot be undone.';
        par1 = 'Delete Trust Bank Account';
        par3 = true;
        btnName = 'Yes, Delete Trust Account';
        if (officeList && officeList.length > 0) {
          message = 'You cannot delete this trust account, because the following offices and their matters are using it:';
          par3 = false;
          btnCancel = 'Okay';
        }
      }
    } else if (type === 'firmcreditcardbank') {
      if (action === 'activate') {
        message = 'Are you sure you want to reactivate this credit card trust bank account?';
        btnName = 'Yes, Reactivate Credit Card Trust Account';
        par1 = 'Reactivate Credit Card Trust Bank Account';
        par3 = true;
      } else if (action === 'deactivate') {
        message = 'Are you sure you want to deactivate this credit card trust bank account? You can always <strong>Reactivate</strong> the account at a future date if it’s not <strong>Deleted</strong>.';
        par1 = 'Deactivate Credit Card Trust Bank Account';
        par3 = true;
        btnName = 'Yes, Deactivate Credit Card Trust Account';
        if (officeList && officeList.length > 0) {
          message = 'You cannot deactivate this credit card trust bank account, because the following offices and their matters are using it:';
          par3 = false;
          btnCancel = 'Okay';
        }
      } else {
        message = 'Are you sure you want to delete this credit card trust bank account? This action cannot be undone.';
        par1 = 'Delete Credit Card Trust Bank Account';
        par3 = true;
        btnName = 'Yes, Delete Credit Card Trust Account';
        if (officeList && officeList.length > 0) {
          message = 'You cannot delete this credit card trust bank account, because the following offices and their matters are using it:';
          par3 = false;
          btnCancel = 'Okay';
        }
      }
    }

    this.dialogService
      .confirm(
        message,
        btnName,
        btnCancel,
        par1,
        par2,
        'modal-lmd',
        par3,
        officeList
      )
      .then(res => {
        if (res) {
          if (action == "delete") {
            this.deleteFirmTrustBankAccount(row['id']);
          } else {
            this.activateDeactivateFirmTrustBankAccount(row, action);
          }
        }
      });
  }

  async deleteFirmTrustBankAccount(firmTrustBankAccountId) {
    try {
      this.isCreditCardAccount = true;
      let resp = await this.trustAccountService.v1TrustAccountDeleteFirmTrustBankAccountDelete$Response({ trustBanAccountId: firmTrustBankAccountId, isCreditCardTrustAccount: this.isCreditCardAccount }).toPromise();
      if (resp) {
        this.toastDisplay.showSuccess("Trust account deleted.");
        this.getFirmCreditCardAccountList();
      }
    } catch (err) {
      this.toastDisplay.showError(err.message);
    }
  }

  async activateDeactivateFirmTrustBankAccount(model, action) {
    try {
      this.isCreditCardAccount = true
      let resp = await this.trustAccountService.v1TrustAccountChangeFirmAccountStatusDelete$Response({ trustBanAccountId: model.id, isCreditCardTrustAccount: this.isCreditCardAccount }).toPromise();
      if (resp) {
        let msg = action == "activate" ? "Credit card trust account reactivated." : "Credit card trust account deactivated.";
        this.toastDisplay.showSuccess(msg);
        this.getFirmCreditCardAccountList();
      }
    } catch (err) {
      this.toastDisplay.showError(err.message);
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
      if (type === 'firmcreditcardbank' && action === 'add' && res && res.data) {
        res.data['status'] = true;
        this.addAccount(res.data);
      }
      else if (type == 'firmcreditcardbank' && action === 'edit' && res && res.data) {
        res.data['status'] = true;
        this.updateAccount(res.data);
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
    this.page.totalElements = this.firmCreditCardAccountList.length;
    this.page.totalPages = Math.ceil(this.firmCreditCardAccountList.length / this.page.size);
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

  async addAccount(model) {
    try {
      let resp = await this.trustAccountService.v1TrustAccountAddFirmTrustAccountPost$Json$Response({ body: model }).toPromise();
      this.modalService.dismissAll();
      if (resp) {
        this.toastDisplay.showSuccess("Credit card trust account created.");
        this.getFirmCreditCardAccountList();
      }
    } catch (err) {
      this.toastDisplay.showError(err.message);
    }
  }

  async updateAccount(model) {
    try {
      let resp = await this.trustAccountService.v1TrustAccountUpdateFirmTrustBankAccountPut$Json$Response({ body: model }).toPromise();
      this.modalService.dismissAll();
      if (resp) {
        this.toastDisplay.showSuccess("Credit card trust account updated.");
        this.getFirmCreditCardAccountList();
      }
    } catch (err) {
      this.toastDisplay.showError(err.message);
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
