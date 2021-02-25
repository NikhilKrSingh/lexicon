import { Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { vwUsioBankAccountsBasicInfo } from 'src/common/swagger-providers/models';
import { TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import * as errorData from '../../shared/error.json';
import { OfficeTrustBankAccountComponent } from '../../shared/office-trust-bank-account/office-trust-bank-account.component';
@Component({
  selector: 'app-trust-account-setting',
  templateUrl: './trust-account-setting.component.html',
  styleUrls: ['./trust-account-setting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustAccountSettingComponent implements OnInit, OnChanges {
  private modalRef: NgbModalRef;
  closeResult: string;
  trustBankAccounts: any = [];
  creditCardTrustAccounts: any = [];
  @ViewChild('UnsavedChanges', { static: false }) unsavedChanges;
  @Input() officeId: any;
  @Input() trustAccountingAdmin: boolean;
  @Input() officeManagement: boolean;
  @Input() parentValue: boolean;
  @Input() errorFlagOfficeAccount: boolean;
  @Input() errorFlagCreditCardOfficeAccount: boolean;
  @Input() saveTrustAccountingData = false;
  @Input() cancelTrustAccountingData = false;
  @Output() readonly visibleSaveCancelBtns = new EventEmitter<boolean>();
  public loading = false;
  trustAccountingForm: FormGroup;
  @Output() readonly formUpdate = new EventEmitter<boolean>();
  @Output() readonly tabChanged = new EventEmitter<boolean>();
  @Output() readonly formValue = new EventEmitter<any>();
  selectedBankAccountFromDb: any;
  isPermission = true;
  public errorData: any = (errorData as any).default;
  public trustCCreditCardAccountLengthOneFlag = false;
  public selectedTrustAccountList: any[] = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public pageSelected = 1;
  public selectPageSize = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public isEdit: boolean = false;
  @ViewChild(OfficeTrustBankAccountComponent, { static: false })  officeTrustComponent: OfficeTrustBankAccountComponent;
  public originalSelectedTrustAccountList: any[] = [];
  public slectedRowIndex: number = null;
  public selectedCreditRow: any = null;
  public bankAccountName: string = null;
  public creditCardBankId: number = null;
  public selectedOfficeCreditCardTrustBank: Array<any> = [];
  public errorCreditListBank: boolean = false;
  public trustAccountError: boolean = false;
  public isSubmitted: boolean = false;
  public enableCreditCardTrustAccount = new FormControl(false);
  public enablePaperCheck = new FormControl(false);
  public isPaperCheckRequired: boolean = false;
  public creditLoading: boolean = false;
  public editCreditCard: boolean = false;
  public isEnabledCreditCard: boolean = false;
  public offsetValue;
  public topbarHeight: number;
  public gracePeriod = new FormControl();
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isEditPermission : boolean = false;
  constructor(
    private modalService: NgbModal,
    private ngxService: NgxUiLoaderService,
    private builder: FormBuilder,
    private router: Router,
    private store: Store<fromRoot.AppState>,
    private trustAccountService: TrustAccountService,
    private zone: NgZone,
    private sharedService: SharedService,
    private el: ElementRef,
    private toastDisplay: ToastDisplay,
    private usioService: UsioService
  ) {
    this.page.size = 10;
    this.page.pageNumber = 0;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.getOfficeTrustAccountSettings();
    this.isPermission = this.officeManagement;
    this.getCreditCardBankOfficeAssociatedList();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if(this.permissionList.ACCOUNTINGisAdmin)
          {
            this.isEditPermission = true;
          }
        }
      }
    });
  }
  ngAfterViewInit() {
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }
  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.has-error'
    );
    if (firstInvalidControl) {
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });
      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }
  }
  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 300;
    return (
      controlEl.getBoundingClientRect().top +
      window.scrollY -
      (this.topbarHeight + labelOffset)
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.parentValue && changes.parentValue.currentValue) {
      this.open(this.unsavedChanges, '');
    }
    if (
      changes.saveTrustAccountingData &&
      changes.saveTrustAccountingData.currentValue
    ) {
      this.creditCardBankToTrustBank(true);
    }
    if (
      changes.cancelTrustAccountingData &&
      changes.cancelTrustAccountingData.currentValue
    ) {
      this.editBankAccounts();
    }
  }

  public changeDetect(event) {
    console.log(event.target.value);
  }

  officeCreditCardAccountChange() {
    this.errorFlagCreditCardOfficeAccount = false;
  }

  changeCreditAccountStatus(event) {
    this.errorFlagCreditCardOfficeAccount = false;
    if (event.target.checked) {
      if (
        this.creditCardTrustAccounts &&
        this.creditCardTrustAccounts.length === 1
      ) {
        this.trustAccountingForm.controls.selectedCreditCard.setValue(
          this.creditCardTrustAccounts[0].id
        );
      }
    } else {
      this.trustAccountingForm.controls.selectedCreditCard.setValue(null);
    }
  }

  getOfficeTrustAccountSettings() {
    this.loading = true;
    this.trustAccountService
      .v1TrustAccountGetOfficeTrustAccountSettingsGet$Response({
        officeId: this.officeId
      })
      .subscribe(suc => {
        const res: any = suc;
        const formValue = JSON.parse(res.body).results;

        if (formValue) {
          this.gracePeriod.patchValue(formValue.trustBalanceGracePeriod);
          this.enablePaperCheck.patchValue(formValue.isPaperChaeckRequired);
        }
        this.loading = false;
      }, err => {
        this.loading = false;
      });
  }

  open(content: any, className) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  cancelBankSelection() {
    this.trustAccountingForm.patchValue({
      selectedTrustBankAccount: this.selectedBankAccountFromDb
    });
  }

  continueWithoutSaving() {
    this.formUpdate.emit(false);
    this.tabChanged.emit(false);
  }

  /***** Calculates Table page ****/

  updateDatatableFooterPage() {
    this.page.totalElements = this.selectedTrustAccountList.length;
    this.page.totalPages = Math.ceil(
      this.selectedTrustAccountList.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
  }

  /** Data Table Items per page **/
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.updateDatatableFooterPage();
  }

  /* Triggers hen page changes */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  /****** Change Page Drop Down */
  public changePageDropDown(e) {
    this.pageSelected = e.page;
  }

  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  public editBankAccounts() {
    this.officeTrustComponent.isEdit = !this.officeTrustComponent.isEdit;
    this.isEdit = this.officeTrustComponent.isEdit;
    this.visibleSaveCancelBtns.emit(this.isEdit);
    this.sharedService.changeSourceBankTrust(new Date());
    this.enableCreditCard();
    if (!this.isEdit) {
      this.getCreditCardBankOfficeAssociatedList();
    }
  }

  /********* **********/
  public async getCreditCardBankOfficeAssociatedList() {
    this.creditLoading = true;
    try {
      const resp = await this.usioService
        .v1UsioGetUsioOfficeCcAccountListGet({ officeId: this.officeId })
        .toPromise();
      this.originalSelectedTrustAccountList = JSON.parse(resp as any).results;
      this.selectedTrustAccountList = [
        ...this.originalSelectedTrustAccountList
      ];
      this.isEnabledCreditCard = this.selectedTrustAccountList.some(
        list => list.creditCardBankAccountId
      );
      this.enableCreditCardTrustAccount.setValue(
        this.isEnabledCreditCard ? true : false
      );
      this.enableCreditCard();
      this.creditLoading = false;
      this.updateDatatableFooterPage();
    } catch (error) {
      this.creditLoading = false;
    }
  }

  /***** Triggers when office trust bank component emits data ***/
  public selectedTrustAccount_(rows: Array<any>) {
    if (this.enableCreditCardTrustAccount) {
      rows.forEach((element, index) => {
        const idx: number = this.originalSelectedTrustAccountList.findIndex(
          x => +x.id === +element.id
        );
        if (idx > -1 && element.id) {
          rows[
            index
          ].creditCardAccountName = this.originalSelectedTrustAccountList[
            idx
          ].creditCardAccountName;
          rows[
            index
          ].creditCardBankAccountId = this.originalSelectedTrustAccountList[
            idx
          ].creditCardBankAccountId;
        } else {
          if (!(element.dummyIsSelected && element.matterAssigned >= 1)) {
            rows[index].creditCardAccountName = null;
            rows[index].creditCardBankAccountId = null;
          }
        }
      });
      this.zone.run(() => {
        this.originalSelectedTrustAccountList = [...rows];
        this.selectedTrustAccountList = [...rows];
      });
    }
    this.updateDatatableFooterPage();
  }

  /****** Opens Credit Card Bank Account Model ********/
  public openCreditCardBankListModal(
    row?,
    rowIndex?,
    template?,
    creditCardBankId?,
    edit?
  ) {
    this.slectedRowIndex = rowIndex;
    this.selectedCreditRow = row;
    this.bankAccountName = row && row.name ? row.name : null;
    this.creditCardBankId = null;
    console.log(row);
    console.log(creditCardBankId);
    this.creditCardBankId = creditCardBankId;
    this.editCreditCard = edit;
    this.modalService
      .open(template, {
        centered: true,
        backdrop: 'static',
        windowClass: 'modal-xlg'
      })
      .result.then(res => {});
  }

  public selectedCreditTrustAccount(event) {
    if (event) {
      this.selectedOfficeCreditCardTrustBank = event;
    }
  }

  public saveCreditCard() {
    if (this.selectedOfficeCreditCardTrustBank.length <= 0) {
      return;
    }
    this.selectedTrustAccountList[this.slectedRowIndex][
      'creditCardAccountName'
    ] = this.selectedOfficeCreditCardTrustBank[0].name
      ? this.selectedOfficeCreditCardTrustBank[0].name
      : null;
    this.selectedTrustAccountList[this.slectedRowIndex][
      'creditCardBankAccountId'
    ] = this.selectedOfficeCreditCardTrustBank[0].usioBankAccountId
      ? this.selectedOfficeCreditCardTrustBank[0].usioBankAccountId
      : 0;
    this.selectedTrustAccountList = [...this.selectedTrustAccountList];
    this.selectedCreditRow = null;
    this.selectedOfficeCreditCardTrustBank = [];
    this.slectedRowIndex = null;
    this.creditCardBankId = null;
    this.isSubmitted = false;
    this.errorCreditListBank = false;
    this.updateDatatableFooterPage();
    this.modalService.dismissAll();
  }

  /********* Links Credit Card Bank To Trust Account Bank *****/
  public async creditCardBankToTrustBank(flag = false) {
    this.isSubmitted = true;
    if (this.enableCreditCardTrustAccount.value) {
      this.checkCreditBankError();
    }
    this.trustAccountError = this.selectedTrustAccountList.length
      ? false
      : true;
    if (this.errorCreditListBank || this.trustAccountError) {
      if (this.trustAccountError) {
        setTimeout(() => {
          this.scrollToFirstInvalidControl();
        }, 1000);
      } else {
        setTimeout(() => {
          this.scrollToFirstInvalidControl();
        }, 1000);
      }
      return;
    }

    let body: vwUsioBankAccountsBasicInfo[] = [];
    if (this.selectedTrustAccountList.length) {
      this.selectedTrustAccountList.forEach(item => {
        body.push({
          id: item.id ? item.id : 0,
          trustBankAccountId:
            item && item.usioBankAccountId ? item.usioBankAccountId : 0,
          isCreditCardAccountSelected: this.enableCreditCardTrustAccount.value,
          usioCreditCardAccountId: item.creditCardBankAccountId
            ? +item.creditCardBankAccountId
            : 0
        });
      });
    }
    this.loading = true;
    try {
      await this.usioService
        .v1UsioAddEditUsioOfficeBankAccountsPost$Json({
          officeId: this.officeId,
          body
        })
        .toPromise();
      this.editBankAccounts();
      if (flag) {
        this.toastDisplay.showSuccess(
          errorData.trust_bank_account_update_success
        );
      }
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  /******** Checks Credit Card Error **********/
  public checkCreditBankError() {
    let i = 0;
    while (i < this.selectedTrustAccountList.length) {
      if (
        this.selectedTrustAccountList[i].creditCardAccountName == null ||
        this.selectedTrustAccountList[i].creditCardAccountName == ''
      ) {
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

  /******** Enable disable credit card *****/
  public enableCreditCard() {
    if (!this.isEdit) {
      this.enableCreditCardTrustAccount.disable();
      this.enablePaperCheck.disable();
      return;
    }
    this.enableCreditCardTrustAccount.enable();
    this.enablePaperCheck.enable();
    this.errorCreditListBank = false;
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.selectedTrustAccountList) {
      return this.selectedTrustAccountList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
