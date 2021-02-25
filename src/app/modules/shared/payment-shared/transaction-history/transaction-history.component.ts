import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  Validators,
  FormBuilder
} from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
  ColumnMode,
  DatatableComponent,
  SelectionType
} from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vwMatterResponse } from 'src/app/modules/models';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { ILedgerHistory } from 'src/app/modules/models/ledger-history.model';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwPayment } from 'src/common/swagger-providers/models';
import {
  BillingService,
  DmsService,
  MatterService,
  TenantService,
  ReverseTransactionService,
  PotentialClientBillingService
} from 'src/common/swagger-providers/services';
import { ChargebackComponent } from './chargeback/chargeback.component';
import { WarningDynamicDialogComponent } from 'src/app/modules/shared/warning-dynamic-dialog/warning-dynamic-dialog.component';

@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  @Input() matterId: number;
  @Input() matterDetails: vwMatterResponse;
  @Input() clientId: number;
  @Input() clientDetails: any;

  @Output() refreshNotes = new EventEmitter<any>();

  error_data = (errors as any).default;

  public invoiceList: Array<ILedgerHistory> = [];
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected: number = 1;
  public counter = Array;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public selectedRow: ILedgerHistory;
  public currentActive: number;
  closeResult: string;
  public modalReference: any;
  public checkNumber: any;
  public checkImageUrl = '';

  public reverseTransactionNumber: string;
  public reverseTransactionReason: any;
  public reverseTransactionSubmitted = false;

  public reverseForm: FormGroup = this.builder.group({
    reverseTransactionReason: ['', Validators.required],
    applicableDate: ['', Validators.required],
    noteToFile: ['', [Validators.required]],
    isVisibleToClient: false
  });

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public downloadInvoiceComp: Subscription;
  public loading = true;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  checkImageRes: any;
  checkImageExtension: any;
  firmDetails: Tenant;
  originalReversedCheckCodes: any = [];
  isBillingOrResponsibleAttorney: boolean = false;

  constructor(
    private dmsService: DmsService,
    private matterService: MatterService,
    private toastr: ToastDisplay,
    private billingService: BillingService,
    private modalService: NgbModal,
    private invoiceService: InvoiceService,
    private store: Store<fromRoot.AppState>,
    private tenantService: TenantService,
    private builder: FormBuilder,
    private reverseTransactionService: ReverseTransactionService,
    private potentiialClientBillingService: PotentialClientBillingService
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.downloadInvoiceComp = this.invoiceService.downloadInvoiceComplete$.subscribe(
      (evt: boolean) => {
        if (evt) {
          this.loading = false;
        }
      }
    );
  }

  ngOnInit() {
    this.isBillingOrResponsibleAttorney = UtilsHelper.checkPermissionOfRepBingAtn(
      this.matterDetails
    );
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getTenantDetail();
    if (this.matterDetails) {
      this.getMatterTransactions();
    } else {
      this.getClientTransactions();
    }
  }

  ngOnDestroy() {
    if (this.downloadInvoiceComp) {
      this.downloadInvoiceComp.unsubscribe();
    }
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
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
  public getMatterTransactions() {
    this.matterService
      .v1MatterLedgerHistoryMatterIdGet$Response({ matterId: this.matterId })
      .subscribe(
        res => {
          if (res) {
            this.invoiceList = JSON.parse(res.body as any).results;
            if (this.invoiceList && this.invoiceList.length > 0) {
              this.invoiceList.reverse();
              let edBalance = 0;
              this.invoiceList.map(obj => {
                if (obj.status !== 'Failed') {
                  edBalance += obj.credit
                    ? -obj.credit
                    : obj.debit
                    ? obj.debit
                    : 0;
                }
                obj.endingBalance = edBalance;
              });
              this.invoiceList.forEach(invoice => {
                if (invoice.credit) {
                  invoice.amount = invoice.credit;
                } else {
                  invoice.amount = invoice.debit;
                  if (invoice.amount > 0) {
                    invoice.amount = Math.abs(invoice.amount);
                  }
                }

                if (invoice.type == 'Bill Reversed') {
                  invoice.amount = invoice.amount * -1;
                }
              });
              this.invoiceList.reverse();
            }
            this.page.totalElements = this.invoiceList.length;
            this.page.totalPages = Math.ceil(
              this.invoiceList.length / this.page.size
            );
            this.updateDatatableFooterPage();
          }
          this.loading = false;
        },
        err => {
          console.log(err);
          this.loading = false;
        }
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

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.invoiceList.length;
    this.page.totalPages = Math.ceil(this.invoiceList.length / this.page.size);
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
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

  retryPayment(row: vwPayment, $event) {
    // $event.target.closest('datatable-body-cell').blur();
    let rowDetails = { ...row };
    delete rowDetails.postedBy;
    this.loading = true;
    this.billingService
      .v1BillingPostPaymentPut$Json({
        body: rowDetails
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          if (res > 0) {
            if (this.matterDetails) {
              this.getMatterTransactions();
            } else {
              this.getClientTransactions();
            }
            this.toastr.showSuccess(this.error_data.success_payment);
          } else {
            this.toastr.showError(this.error_data.failed_payment);
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  /**
   *
   * @param row Display
   */
  toggleExpandRow(row) {
    if (this.selectedRow && this.selectedRow.id != row.id) {
      this.selectedRow.isExpandedRow = false;
      this.table.rowDetail.collapseAllRows();
    }
    this.table.rowDetail.toggleExpandRow(row);
    row.isExpandedRow = !row.isExpandedRow;
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpandedRow) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  chargeBack(action: string) {
    let modalRef = this.modalService.open(ChargebackComponent, {
      centered: true,
      windowClass: 'modal-xlg',
      backdrop: 'static'
    });
    let displayChargeback = [this.selectedRow];
    if (action === 'view') {
      let chargebackRecord = this.invoiceList.find(
        item => item.id === this.selectedRow.chargeBackPaymentId
      );
      if (chargebackRecord) {
        displayChargeback.push(chargebackRecord);
      }
    }
    modalRef.componentInstance.chargeDetails = displayChargeback;
    modalRef.componentInstance.viewMode = action;

    modalRef.result.then(res => {
      if (res) {
        if (this.matterDetails) {
          this.getMatterTransactions();
        } else {
          this.getClientTransactions();
        }
      }
    });
  }

  public downloadInvoice(row) {
    this.loading = true;
    if (row.invoiceFileId > 0) {
      this.billingService.v1BillingPrintInvoiceDetailsInvoiceIdGet({
        invoiceId: row.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          let file = UtilsHelper.base64toFile(
            res,
            `invoice_${row.id}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
            'application/pdf'
          );
          saveAs(file);
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
    } else {
      this.invoiceService.downloadInvoice$.next(row.id);
      setTimeout(() => {
        this.loading = false;
      }, 1000);
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

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
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
    this.loading = false;
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
  open(content: any, row, className: any, winClass) {
    this.loading = true;
    let checkImageUrlValue: any;
    if (row) {
      this.checkNumber = row.checkNumber;
      checkImageUrlValue = row.scannedCheckImgUrl;
      this.checkImageExtension = row.scannedCheckImgUrl.substring(
        row.scannedCheckImgUrl.lastIndexOf('.') + 1
      );
      this.dmsService
        .v1DmsCheckImageFileDownloadGet({
          checkImageUrl: checkImageUrlValue
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.loading = false;
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
            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
    }
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
      this.loading = true;
      this.reverseForm.reset();
      this.reverseForm.patchValue({ isVisibleToClient: false });
      this.reverseTransactionSubmitted = false;
      if (
        row.paymentMethodType == 'E-Check' ||
        row.paymentMethodType == 'Credit Card'
      ) {
        this.checkReverseTransaction(content, row);
      } else {
        this.reverse(content, row);
      }
    }
  }
  checkReverseTransaction(content, row) {
    this.reverseTransactionService
      .v1ReverseTransactionCheckPost$Json({
        body: {
          paymentId: row.id,
          trustTransactionHistoryId: 0
        }
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.loading = false;
          if (!res) {
            this.showWarningForNoRefund(row);
          } else if (res < row.amount) {
            if (row.paymentMethodType == 'Credit Card') {
              this.askForConfirmRefund(content, row, res);
            }
          } else if (res == row.amount || res > row.amount) {
            this.reverse(content, row);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  showWarningForNoRefund(row) {
    const activeModal = this.modalService.open(WarningDynamicDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    activeModal.componentInstance.title =
      row.paymentMethodType == 'E-Check'
        ? this.error_data.reverse_echeck_transaction_refund_warning_title
        : this.error_data.reverse_credit_transaction_refund_warning_title;
    activeModal.componentInstance.cancelBtnText = 'Cancel';
    activeModal.componentInstance.showOkButton = false;
    activeModal.componentInstance.warningMessage =
      row.paymentMethodType == 'E-Check'
        ? this.error_data.reverse_transaction_echeck_refund_warning_message
        : this.error_data
            .reverse_transaction_credit_card_refund_warning_message;
  }

  askForConfirmRefund(content, row, amount) {
    this.loading = false;
    const activeModal = this.modalService.open(WarningDynamicDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    activeModal.componentInstance.title = this.error_data.reverse_transaction_insufficient_refund_title;
    activeModal.componentInstance.showOkButton = true;
    activeModal.componentInstance.okBtnText = 'Yes, Refund';
    activeModal.componentInstance.cancelBtnText = 'Back';
    if (amount) {
      let cp = new CurrencyPipe('en-US');
      amount = cp.transform(amount || 0, 'USD', 'symbol', '1.2-2');
    }
    activeModal.componentInstance.warningMessage = `You can only reverse <strong>${amount}</strong> of this transaction, as the rest has already been fully or partially refunded. Do you want to proceed with a refund for <strong>${amount}</strong>?`;
    activeModal.result.then(res => {
      if (res) {
        this.reverse(content, row);
      }
    });
  }
  reverse(content, row) {
    this.loading = false;
    let modalRef = this.modalService.open(content, {
      centered: true,
      backdrop: 'static'
    });
    modalRef.result.then(res => {
      if (res && this.reverseForm.valid) {
        this.loading = true;
        this.reverseTransactionService
          .v1ReverseTransactionPost$Json({
            body: {
              matterId: this.matterId,
              paymentId: row.id,
              refundId: 0,
              trustTransactionHistoryId: 0,
              reversedCheckReasonId: this.reverseForm.controls[
                'reverseTransactionReason'
              ].value,
              applicableDate: this.reverseForm.controls['applicableDate'].value,
              noteToFile: this.reverseForm.controls['noteToFile'].value,
              isVisibleToClient: this.reverseForm.controls['isVisibleToClient']
                .value
            }
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            res => {
              if (res > 0 && res != row.id) {
                switch (row.paymentMethodType) {
                  case 'Credit Card': {
                    this.toastr.showSuccess(
                      this.error_data.reverse_credit_card_success
                    );
                    break;
                  }
                  case 'Cash': {
                    this.toastr.showSuccess(
                      this.error_data.reverse_cash_success
                    );
                    break;
                  }
                  case 'Check': {
                    this.toastr.showSuccess(
                      this.error_data.reverse_check_success
                    );
                    break;
                  }
                  case 'E-Check': {
                    this.toastr.showSuccess(
                      this.error_data.reverse_e_check_success
                    );
                    break;
                  }
                  case 'Primary Retainer Trust': {
                    this.toastr.showSuccess(
                      this.error_data.reverse_primary_trust_success
                    );
                    break;
                  }
                }

                if (this.matterDetails) {
                  this.getMatterTransactions();
                } else {
                  this.getClientTransactions();
                  this.refreshNotes.emit();
                }
              } else {
                this.toastr.showSuccess(this.error_data.server_error);
                this.loading = false;
              }
            },
            () => {
              this.loading = false;
            }
          );
      }
    });
  }
  printReceipt(url: string) {
    if (url) {
      this.loading = true;

      this.dmsService
        .v1DmsCheckImageFileDownloadGet({
          checkImageUrl: url
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(
          res => {
            let file = UtilsHelper.base64toFile(
              res,
              `Receipt_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );

            saveAs(file);
            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
    } else {
      this.toastr.showError(this.error_data.receipt_file_missing);
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  retryRefund(id: number) {
    this.loading = true;
    this.billingService
      .v1BillingRetryRefundForMatterPost$Response({ paymentId: id })
      .subscribe(
        (resp: any) => {
          if (resp) resp = JSON.parse(resp.body as any).results;
          if (resp.usioResponseCode != 'success') {
            this.toastr.showError(resp.usioResponseMessage);
          } else {
            this.toastr.showSuccess('Transaction processed.');
          }

          if (this.matterDetails) {
            this.getMatterTransactions();
          } else {
            this.getClientTransactions();
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  get footerHeight() {
    if (this.invoiceList) {
      return this.invoiceList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }

  public getClientTransactions() {
    this.potentiialClientBillingService
      .v1PotentialClientBillingLedgerHistoryContactIdGet$Response({
        contactId: this.clientId
      })
      .subscribe(
        res => {
          if (res) {
            console.log(1, res)
            this.invoiceList = JSON.parse(res.body as any).results;
            if (this.invoiceList && this.invoiceList.length > 0) {
              this.invoiceList.reverse();
              let edBalance = 0;
              this.invoiceList.map(obj => {
                if (obj.status !== 'Failed') {
                  edBalance += obj.credit
                    ? -obj.credit
                    : obj.debit
                    ? obj.debit
                    : 0;
                }
                obj.endingBalance = edBalance;
              });
              this.invoiceList.forEach(invoice => {
                if (invoice.credit) {
                  invoice.amount = invoice.credit;
                } else {
                  invoice.amount = invoice.debit;
                  if (invoice.amount > 0) {
                    invoice.amount = Math.abs(invoice.amount);
                  }
                }

                if (invoice.type == 'Bill Reversed') {
                  invoice.amount = invoice.amount * -1;
                }
              });
              this.invoiceList.reverse();
            }
            this.page.totalElements = this.invoiceList.length;
            this.page.totalPages = Math.ceil(
              this.invoiceList.length / this.page.size
            );
            this.updateDatatableFooterPage();
          }
          this.loading = false;
        },
        err => {
          console.log(err);
          this.loading = false;
        }
      );
  }
}
