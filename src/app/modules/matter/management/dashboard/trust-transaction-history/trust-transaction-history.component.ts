import { Component, Input, OnInit, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vwMatterResponse } from 'src/app/modules/models';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { vwTrustTransaction } from 'src/app/modules/models/vw-trust-transaction';
import * as errors from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { removeAllBorders, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { BillingService, DmsService, TenantService, TrustAccountService, ReverseTransactionService } from 'src/common/swagger-providers/services';
import { Subscription, Observable } from 'rxjs';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import * as fromRoot from 'src/app/store';
import { Store } from '@ngrx/store';
import { WarningDynamicDialogComponent } from 'src/app/modules/shared/warning-dynamic-dialog/warning-dynamic-dialog.component';
import { ChargeBackTrustTransactionComponent } from './charge-back-trust-transaction/charge-back-trust-transaction.component';

@Component({
  selector: 'app-trust-transaction-history',
  templateUrl: './trust-transaction-history.component.html',
  styleUrls: ['./trust-transaction-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class TrustTransactionHistoryComponent implements OnInit, OnDestroy {
  @Input() matterId: number;
  @Input() matterDetails :vwMatterResponse;
  error_data = (errors as any).default;

  trustAccountList: Array<any>;
  trustAccountId = 0;

  originalTransactions: Array<vwTrustTransaction>;
  transactions: Array<vwTrustTransaction>;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public currentActive: number;
  public checkImageUrl: any;
  closeResult: string;
  public modalReference: any;
  public checkNumber: any;
  checkImageRes: any;
  checkImageExtension: any;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  isLoading = true;

  public reverseCheckNumber: string;
  public reverseCheckReason: any;
  public reverseTransactionSubmitted = false;
  firmDetails: Tenant;
  originalReversedCheckCodes: any = [];
  isBillingOrResponsibleAttorney: boolean = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  public reverseForm: FormGroup = this.builder.group({
    reverseTransactionReason:['',Validators.required],
    applicableDate: ['', Validators.required],
    noteToFile: ['', [Validators.required]],
    isVisibleToClient: false
  });
  selectedRow: any;
  public reverseTransfer: boolean = false;

  constructor(
    private trustAccountService: TrustAccountService,
    private modalService: NgbModal,
    private dmsService: DmsService,
    private toastr: ToastDisplay,
    private sharedService: SharedService,
    private billingService: BillingService,
    private tenantService: TenantService,
    private builder: FormBuilder,
    private reverseTransactionService:ReverseTransactionService,
    private store: Store<fromRoot.AppState>
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.trustAccountList = [
      {
        id: 0,
        name: '1 - Primary Retainer Trust',
        trustNumber: 1
      }
    ];

    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.isBillingOrResponsibleAttorney = UtilsHelper.checkPermissionOfRepBingAtn(this.matterDetails);
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getTenantDetail();
    this.getTrustAccounts();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  getTrustAccounts() {
    this.trustAccountService
      .v1TrustAccountGetAllTrustAccountsGet$Response({
        matterId: this.matterId
      })
      .subscribe(
        (data: {}) => {
          const res: any = data;
          if (res && res.body) {
            var parsedRes = JSON.parse(res.body);
            if (parsedRes != null) {
              if (parsedRes.results.length == 0) {
                this.trustAccountList = [];
              } else {
                this.trustAccountList = parsedRes.results;
              }

              this.trustAccountList.unshift({
                id: 0,
                name: 'Primary Retainer Trust',
                trustNumber: 1
              });

              this.trustAccountList.forEach(item => {
                if (item.trustNumber) {
                  item.name = item.trustNumber + ' - ' + item.name;
                }
              });

              this.getTransactions();
            }
          } else {
            this.isLoading = false;
          }
        },
        () => {
          this.isLoading = false;
        }
      );
  }

  getTenantDetail() {
    this.tenantService
      .v1TenantGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Tenant;
        })
      )
      .subscribe(
        res => {
          this.firmDetails = res;
          this.getReversedCheckCodes();
        },
        () => {}
      );
  }
  private getReversedCheckCodes() {
    this.billingService
      .v1BillingReversedcheckreasonListGet$Response({
        tenantId: this.firmDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res) {
            this.originalReversedCheckCodes = res || [];
            if (
              this.originalReversedCheckCodes &&
              this.originalReversedCheckCodes.length
            ) {
              this.originalReversedCheckCodes = this.originalReversedCheckCodes.filter(
                v => v.status == 'Active'
              );
              this.originalReversedCheckCodes.forEach(a => {
                a.reasonCode = a.code + ' - ' + a.description;
              });
              this.originalReversedCheckCodes = _.orderBy(
                this.originalReversedCheckCodes,
                a => a.reasonCode,
                'asc'
              );
            }
          }
        },
        () => {}
      );
  }

  getTransactions() {
    this.trustAccountService
      .v1TrustAccountTrustTransactionHistoryMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        res => {
          if (res) {
            res = res || [];
            this.originalTransactions = [...res];
            this.originalTransactions.forEach(t => {
              if (t.createdAt) {
                if (!t.createdAt.includes('Z')) {
                  t.createdAt = t.createdAt + 'Z';
                }
              }
              if (t.processingDate) {
                if (!t.processingDate.includes('Z')) {
                  t.processingDate = t.processingDate + 'Z';
                }
              }
            });
            this.applyFilter();
          }
        },
        () => {
          this.isLoading = false;
        }
      );
  }

  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-trust-transaction-history');
    }
    this.table.rowDetail.toggleExpandRow(row);
    row.isExpanded = !row.isExpanded;
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpanded) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  applyFilter() {
    if (this.originalTransactions) {
      let rows: Array<vwTrustTransaction>;
      rows = JSON.parse(JSON.stringify(this.originalTransactions));

      if (this.trustAccountId == 0) {
        rows = rows.filter(
          a => {
            if (a.targetMatterId > 0) {
              return (
                (a.sourceIsPrimaryTrust && a.matterId == this.matterId) ||
                (a.targetIsPrimaryTrust && a.targetMatterId == this.matterId)
              );
            } else {
              return a.sourceIsPrimaryTrust || a.targetIsPrimaryTrust;
            }
          }
        );
        rows.forEach(s => {
          if (s.sourceTrustOnlyAccountId > 0 || s.matterId != this.matterId) {
            s.endingBalance = s.targetEndingBalance;
          } else if (s.endingBalance == null) {
            s.endingBalance = s.targetEndingBalance;
          }
        });
      } else {
        rows = rows.filter(
          a => {
            if (a.targetMatterId > 0) {
              return (
                (a.sourceTrustOnlyAccountId == this.trustAccountId && a.matterId == this.matterId) ||
                (a.targetTrustOnlyAccountId == this.trustAccountId && a.targetMatterId == this.matterId)
              );
            } else {
              return a.sourceTrustOnlyAccountId == this.trustAccountId ||
              a.targetTrustOnlyAccountId == this.trustAccountId;
            }
          }
        );
        rows.forEach(s => {
          if (s.sourceIsPrimaryTrust || s.matterId != this.matterId) {
            s.endingBalance = s.targetEndingBalance;
          } else if (
            s.sourceTrustOnlyAccountId > 0 &&
            s.endingBalance != null
          ) {
            s.endingBalance = s.endingBalance;
          } else if (s.endingBalance == null) {
            s.endingBalance = s.targetEndingBalance;
          }
        });
      }
      rows = _.orderBy(rows, ['createdAt', 'endingBalance'], ['desc']);

      this.transactions = rows;

      this.updateDatatableFooterPage();
    }
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.transactions.length;
    this.page.totalPages = Math.ceil(this.transactions.length / this.page.size);

    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
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

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * Download Image
   */
  onDownloadImage() {
    let file = UtilsHelper.base64toFile(
      this.checkImageRes,
      `CheckImage.${this.checkImageExtension}`,
      'application/image'
    );
    saveAs(file);
  }

  /**
   * open View Check Image pop-up
   */

  open(content: any, row, className: any, winClass, isSourceAccount = false) {
    this.isLoading = true;
    let checkImageUrlValue: any;
    if (row) {
      if (isSourceAccount) {
        this.checkNumber = row.sourceAccountDetails.checkNumber;
        checkImageUrlValue = row.sourceAccountDetails.checkImageUrl;
        this.checkImageExtension = checkImageUrlValue.substring(
          checkImageUrlValue.lastIndexOf('.') + 1
        );
      } else {
        this.checkNumber = row.targetAccountDetails.checkNumber;
        checkImageUrlValue = row.targetAccountDetails.checkImageUrl;
        this.checkImageExtension = checkImageUrlValue.substring(
          checkImageUrlValue.lastIndexOf('.') + 1
        );
      }
    }
    this.dmsService
      .v1DmsCheckImageFileDownloadGet({
        checkImageUrl: checkImageUrlValue
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        res => {
          if (!!res) {
            this.checkImageRes = res;
            this.checkImageUrl =
              `data:image/${this.checkImageExtension};base64,` + res;
            this.openViewCheckImgeMethod(content, row, className, winClass);
          } else {
            this.toastr.showError(
              this.error_data.payment_view_check_image_download_error
            );
          }
        },
        () => {
          this.isLoading = false;
        }
      );
  }

  openViewCheckImgeMethod(content, row, className, winClass) {
    this.modalReference = this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
    this.isLoading = false;
  }

  /**
   *
   * for pop-up close.
   */
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  reverTransaction(content: any, row) {
    if (row) {
      this.isLoading = true;
      this.reverseForm.reset();
      this.reverseForm.patchValue({isVisibleToClient: false});
      this.reverseTransactionSubmitted = false;
      if(row.sourceAccountDetails.accountType == 'E-Check' || row.sourceAccountDetails.accountType == 'Credit Card'){
        this.checkReverseTransaction(content,row);
      } else {
        this.reverse(content,row);
      }

    }
  }

  checkReverseTransaction(content,row){
    this.reverseTransactionService.v1ReverseTransactionCheckPost$Json({
      body: {
        paymentId: 0,
        trustTransactionHistoryId: row.id,
      }
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      this.isLoading = false;
      if (!res) {
        this.showWarningForNoRefund(row);
      } else if (res < row.amount) {
        if(row.sourceAccountDetails.accountType == 'Credit Card'){
          this.askForConfirmRefund(content,row,res);
        }
      } else if (res == row.amount || res > row.amount) {
        this.reverse(content,row);
      }
    },
    () => {
      this.isLoading = false;
    });
  }

  showWarningForNoRefund(row){
    const activeModal = this.modalService
          .open(WarningDynamicDialogComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false
          });
    activeModal.componentInstance.title = row.sourceAccountDetails.accountType == 'E-Check' ?this.error_data.reverse_echeck_transaction_refund_warning_title: this.error_data.reverse_credit_transaction_refund_warning_title;
    activeModal.componentInstance.cancelBtnText = 'Cancel';
    activeModal.componentInstance.showOkButton = false;
    activeModal.componentInstance.warningMessage = row.sourceAccountDetails.accountType == 'E-Check' ? this.error_data.reverse_transaction_echeck_refund_warning_message : this.error_data.reverse_transaction_credit_card_refund_warning_message;
  }

  askForConfirmRefund(content,row,amount){
    const activeModal = this.modalService
        .open(WarningDynamicDialogComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false
        });
    activeModal.componentInstance.title = this.error_data.reverse_transaction_insufficient_refund_title;
    activeModal.componentInstance.cancelBtnText = 'Back';
    activeModal.componentInstance.showOkButton = true;
    activeModal.componentInstance.okBtnText = 'Yes, Refund';
    if(amount){
      let cp = new CurrencyPipe('en-US');
      amount = cp.transform(amount || 0, 'USD', 'symbol', '1.2-2');
    }
    activeModal.componentInstance.warningMessage = `You can only reverse <strong>${amount}</strong> of this transaction, as the rest has already been fully or partially refunded. Do you want to proceed with a refund for <strong>${amount}</strong>?`;
    activeModal.result.then(res => {
      if(res){
        this.reverse(content,row);
      }
    });
  }

  reverse(content: any, row){
    this.isLoading = false;
    let modalRef = this.modalService.open(content, {
      centered: true,
      backdrop: 'static'
    });

    modalRef.result.then(res => {
      if (res && this.reverseForm.valid) {
        this.isLoading = true;

        this.reverseTransactionService.v1ReverseTransactionPost$Json({
          body: {
            matterId: this.matterId,
            paymentId: 0,
            refundId: 0,
            trustTransactionHistoryId: row.id,
            reversedCheckReasonId: this.reverseForm.controls['reverseTransactionReason'].value,
            applicableDate:this.reverseForm.controls['applicableDate'].value,
            noteToFile:this.reverseForm.controls['noteToFile'].value,
            isVisibleToClient:this.reverseForm.controls['isVisibleToClient'].value,
          }
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if (res > 0 && res != row.id) {
            if (!this.reverseTransfer) {
              switch(row.sourceAccountDetails.accountType){
                case 'Credit Card': {
                  this.toastr.showSuccess(this.error_data.reverse_credit_card_success);
                  break;
                }
                case 'Cash': {
                  this.toastr.showSuccess(this.error_data.reverse_cash_success);
                  break;
                }
                case 'Check': {
                  this.toastr.showSuccess(this.error_data.reverse_check_success);
                  break;
                }
                case 'E-Check': {
                  this.toastr.showSuccess(this.error_data.reverse_e_check_success);
                  break;
                }
                case '1 - Primary Retainer Trust': {
                  this.toastr.showSuccess(this.error_data.reverse_primary_trust_success);
                  break;
                }
              }
            } else {
              this.toastr.showSuccess(this.error_data.reverse_transfer_success);
            }

            if (this.trustAccountId > 0) {
              this.sharedService.reloadTrustOnlyAccountBalance$.next();
            } else {
              this.sharedService.reloadPrimaryTrustBalance$.next();
            }
            this.reverseTransfer = false;
            this.getTransactions();
          } else {
            this.isLoading = false;
            this.reverseTransfer = false;
            this.toastr.showError(this.error_data.server_error);
          }
        },
        () => {
          this.isLoading = false;
        });
      } else {
        this.reverseTransfer = false;
      }
    });
  }
  printReceipt(url: string) {
    if (url) {
      this.isLoading = true;

      this.dmsService
        .v1DmsCheckImageFileDownloadGet({
          checkImageUrl: url
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe(res => {
          let file = UtilsHelper.base64toFile(
            res,
            `Receipt_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
            'application/pdf'
          );

          saveAs(file);
        });
    } else {
      this.toastr.showError(this.error_data.receipt_file_missing);
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  retryRefund(id:number)
  {
    this.isLoading=true;
    this.billingService
        .v1BillingRetryRefundForTrustPost$Response({transactionHistoryId:id})
        .subscribe(
          (resp: any) => {
            resp = JSON.parse(resp.body as any).results;
            if(resp.usioResponseCode != 'success')
            {
            this.toastr.showError(resp.usioResponseMessage);
            }
            else
            {
              this.toastr.showSuccess("Transaction processed.")
            }
          },
          err => {
            this.isLoading = false;
          }
        );
        this.getTransactions();
  }

  get footerHeight() {
    if (this.transactions) {
      return this.transactions.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }

  chargeBack(row: vwTrustTransaction, action: string) {
    let modalRef = this.modalService.open(ChargeBackTrustTransactionComponent, {
      centered: true,
      windowClass: 'modal-xlg',
      backdrop: 'static'
    });
    let displayChargeback = [row];
    if (action === 'view') {
      let chargebackRecord = this.transactions.find(
        item => item.id === row.chargeBackTrustTransactionHistoryId
      );
      if (chargebackRecord) {
        displayChargeback.push(chargebackRecord);
      }
    }

    modalRef.componentInstance.chargeDetails = displayChargeback;
    modalRef.componentInstance.viewMode = action;

    modalRef.result.then(res => {
      if (res) {
        this.getTransactions();
      }
    });
  }
}
