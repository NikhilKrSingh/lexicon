import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdownConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwEmployee, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, EmployeeService, MatterService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-pre-bill-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PreBillViewComponent implements OnInit, OnDestroy {
  error_data = (errors as any).default;
  private loggedInUser: vwEmployee;
  prebillingId: number;
  prebillingSettings: PreBillingModels.vwPreBilling;
  isBillingAttorney: boolean;
  preBillStatusList: Array<vwIdCodeName>;
  plan: PreBillingModels.PaymentPlan;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  private selectedPreBillTimeArr: Array<PreBillingModels.vwBillingLines>;
  private selectedDisbursementArr: Array<PreBillingModels.vwBillingLines>;
  private selectedWriteOffsArr: Array<PreBillingModels.MatterWriteOff>;
  private selectedPreBillFixedFeeArr: Array<PreBillingModels.FixedFeeService>;
  private selectedPreBillAddOnArr: Array<PreBillingModels.AddOnService>;
  public showDefer: boolean = false;
  public showSubmit: boolean = false;
  public matterId: number;
  public viewmode: boolean = false;
  public submitBtn: boolean = false;
  public forceApproveBtn: boolean = false;
  private concernedDate: any = new Date();
  matterDetails: vwMatterResponse;

  loading = true;

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private activateRoute: ActivatedRoute,
    private employeeService: EmployeeService,
    private invoiceService: InvoiceService,
    config: NgbDropdownConfig,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private router: Router,
    private matterService: MatterService,
    private pagetitle: Title
  ) {
    config.placement = 'bottom-left';
    config.autoClose = true;
    this.plan = {} as PreBillingModels.PaymentPlan;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.pagetitle.setTitle("Review Pre-Bill");
    this.loadListItems();
    this.activateRoute.queryParams.subscribe(params => {
      let id = params['prebillingId'];
      this.matterId = params['matterId'];
      this.viewmode = params['viewmode'] == 1 ? false : true;
      this.prebillingId = +id;
      if (this.prebillingId) {
        this.employeeService
          .v1EmployeeGet()
          .pipe(map(UtilsHelper.mapData))
          .subscribe(res => {
            this.loggedInUser = res;
            this.verifyLoggedinUserData();
            this.getPrebillingInfo();
          }, () => {
            this.loading = false;
          });
      }
      if (this.matterId) {
        this.getMatterDetails();
      }
    });
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private verifyLoggedinUserData() {
    if (this.loggedInUser || (this.loggedInUser && !this.loggedInUser.id)) {
      this.loggedInUser = JSON.parse(localStorage.getItem('profile'));
    }
  }

  private loadListItems() {
    this.billingService
      .v1BillingPrebillstatusGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.preBillStatusList = res;
        } else {
          this.preBillStatusList = [];
        }
      });
  }

  private getPrebillingInfo() {
    this.billingService
      .v1BillingPrebillingPreBillIdGet({
        preBillId: this.prebillingId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.prebillingSettings = res[0];

            if (this.prebillingSettings && this.prebillingSettings.preBillStatus && this.prebillingSettings.preBillStatus.code === 'PENDING_APPROVAL' && this.permissionList.BILLING_MANAGEMENTisAdmin) {
              this.forceApproveBtn = true;
            }
            this.calculatePaymentPlan();
            this.updateBillableAmount();
            if (this.permissionList.BILLING_MANAGEMENTisAdmin) {
              this.isBillingAttorney = true;
            }
            if (!this.isBillingAttorney && this.loggedInUser && this.prebillingSettings) {
              if (this.prebillingSettings.concernedPerson) {
                this.isBillingAttorney =
                  this.loggedInUser.id ==
                  this.prebillingSettings.concernedPerson.id;
              }
              if (!this.isBillingAttorney && this.prebillingSettings.billingPerson) {
                this.isBillingAttorney =
                  this.loggedInUser.id ==
                  this.prebillingSettings.billingPerson.id;
              }
            }
            if (this.prebillingSettings) {
              if (this.prebillingSettings.timeEntries && this.prebillingSettings.timeEntries.length > 0) {
                this.prebillingSettings.timeEntries = this.prebillingSettings.timeEntries.filter(a => a.disbursementType.billableTo.name != 'Overhead');
              }
              this.selectedPreBillTimeArr = (this.prebillingSettings.timeEntries) ? this.prebillingSettings.timeEntries : [];
              this.selectedDisbursementArr = (this.prebillingSettings.recordDisbursement) ? this.prebillingSettings.recordDisbursement : [];
              this.selectedWriteOffsArr = (this.prebillingSettings.matterWriteOffs) ? this.prebillingSettings.matterWriteOffs : [];
              this.selectedPreBillAddOnArr = (this.prebillingSettings.addOnServices) ? this.prebillingSettings.addOnServices : [];
              this.selectedPreBillFixedFeeArr = (this.prebillingSettings.fixedFeeService) ? this.prebillingSettings.fixedFeeService : [];
              this.checkDeferAction();
              if (this.prebillingSettings.concernedDate) {
                this.concernedDate = this.prebillingSettings.concernedDate;
              }
            }
          } else {
            this.prebillingSettings = {} as PreBillingModels.vwPreBilling;
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  private calculatePaymentPlan() {
    if (this.prebillingSettings.isFixed) {
      if (this.prebillingSettings.fixedFeeService) {
        this.prebillingSettings.fixedFeeService.forEach(a => {
          this.plan.totalAmount += a.rateAmount;
        });
      } else {
        this.plan.totalAmount = 0;
      }

      if (this.prebillingSettings.addOnServices) {
        this.prebillingSettings.addOnServices.forEach(a => {
          this.plan.totalAmount += a.serviceAmount;
        });
      }
    }
  }

  viewPDF() {
    this.invoiceService.getInvoicePDFHTML().subscribe(
      pdf => {
        if (pdf) {
          this.invoiceService.printPDF(pdf).subscribe(
            res => {
              let file = UtilsHelper.base64toFile(
                res.results,
                'invoice.pdf',
                'application/pdf'
              );
              saveAs(file);

            },
            () => {
            }
          );
        }
      },
      () => {
      }
    );
  }

  forceGenerateInvoice(row: PreBillingModels.vwPreBilling) {
    if (this.preBillStatusList) {
      let approvedPreBillStatus = this.preBillStatusList.find(
        a => a.code == 'APPROVED'
      );

      if (
        row.preBillStatus &&
        row.preBillStatus.id == approvedPreBillStatus.id
      ) {
        this.generateInvoice(row);
      } else {
        this.changeStatus(row, approvedPreBillStatus.id, () => {
          this.generateInvoice(row);
        });
      }
    } else {
      this.toastr.showError('Not able to fetch Pre Bill Status List');
    }
  }

  private generateInvoice(row: PreBillingModels.vwPreBilling) {
    this.billingService
      .v1BillingPrebillingGenerateinvoicePrebillidGet({
        prebillid: row.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess('Invoice generated.');
          } else {
            this.toastr.showError(
              'Some error occured while generating invoice'
            );
          }
        },
        () => {
        }
      );
  }

  private changeStatus(
    row: PreBillingModels.vwPreBilling,
    statusId: number,
    onSuccess: () => void
  ) {
    this.billingService
      .v1BillingPrebillingPut$Json({
        body: {
          id: row.id,
          statusId: statusId
        }
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            onSuccess();
          } else {
            this.toastr.showError(
              'Some Error occured while updating pre-bill status'
            );
          }
        },
        () => {
        }
      );
  }

  /***
   * function to update list
   */
  updateList(event: any) {
    if (event) {
      this.loading = true;
      this.getPrebillingInfo();
    }
  }

  /***
   * function to open defer confirmation popup
   */
  async deferSelected(): Promise<any> {
    let resp: any = await this.dialogService.confirm(
      this.error_data.defer_selected_warning_message,
      'Yes, defer',
      'Cancel',
      'Defer Pre-Bill',
      true,
      ''
    );
    if (resp) {
      let body: any = {
        prebillId: +this.prebillingId,
        timeEntries: [],
        disbursements: [],
        writeOffs: [],
        isAllitemsDefer: ((this.selectedPreBillTimeArr && this.prebillingSettings && this.prebillingSettings.timeEntries && this.prebillingSettings.timeEntries.length == this.selectedPreBillTimeArr.length)
        && (this.selectedDisbursementArr && this.prebillingSettings && this.prebillingSettings.recordDisbursement && this.prebillingSettings.recordDisbursement.length == this.selectedDisbursementArr.length))
        ? true : false
      }
      if (this.selectedPreBillTimeArr && this.selectedPreBillTimeArr.length) {
        body.timeEntries = this.selectedPreBillTimeArr.map(time => time.id);
      }
      if (this.selectedDisbursementArr && this.selectedDisbursementArr.length) {
        body.disbursements = this.selectedDisbursementArr.map(disbursement => disbursement.id);
      }
      if (this.selectedWriteOffsArr && this.selectedWriteOffsArr.length) {
        body.writeOffs = this.selectedWriteOffsArr.map(write => write.id);
      }
      body.totalWriteOffAmount = this.calculateTotalWriteOffAmount(body.writeOffs);
      body.totalBillAmount = this.calculateTotalBillAmount(body.disbursements, body.timeEntries);
      try {
        let resp: any = await this.billingService.v1BillingReviewprebilDeferPut$Json$Response({ body }).toPromise();
        resp = JSON.parse(resp.body);
        this.toastr.showSuccess('Selected items deferred');
        if (body.isAllitemsDefer) {
          this.router.navigate(['/billing/pre-bills/list']);
        } else {
          this.getPrebillingInfo();
        }
      } catch (err) {
      }
    }
  }

  /**
   * function to enable disable defer selected option
   */
  checkDeferAction(): void {
    this.showDefer = ((this.selectedPreBillTimeArr && this.selectedPreBillTimeArr.length) || (this.selectedDisbursementArr && this.selectedDisbursementArr.length) || (this.selectedWriteOffsArr && this.selectedWriteOffsArr.length)) ? true : false;
    if (this.prebillingSettings.isFixed) {
      this.showSubmit = ((this.selectedPreBillFixedFeeArr && this.selectedPreBillFixedFeeArr.length) || (this.selectedDisbursementArr && this.selectedDisbursementArr.length) || (this.selectedWriteOffsArr && this.selectedWriteOffsArr.length) || (this.selectedPreBillAddOnArr && this.selectedPreBillAddOnArr.length)) ? true : false;
    } else {
      this.showSubmit = ((this.selectedPreBillTimeArr && this.selectedPreBillTimeArr.length) || (this.selectedDisbursementArr && this.selectedDisbursementArr.length) || (this.selectedWriteOffsArr && this.selectedWriteOffsArr.length)) ? true : false;
    }
  }

  /**
   * function to call when pre bill time checked selected/deselected
   */
  selectedPreBill(event: any) {
    switch (event.type) {
      case 'time':
        this.selectedPreBillTimeArr = event.selected;
        break;
      case 'disbursement':
        this.selectedDisbursementArr = event.selected;
        break;
      case 'write-off':
        this.selectedWriteOffsArr = event.selected
        break;
      case 'fixedfee':
        this.selectedPreBillFixedFeeArr = event.selected
        break;
      case 'addon':
        this.selectedPreBillAddOnArr = event.selected
        break;
    }
    this.checkDeferAction();
  }

  /**
   * function to calculate total write off account
   */
  calculateTotalWriteOffAmount(selected) {
    let sum = 0;
    if (this.prebillingSettings.matterWriteOffs && this.prebillingSettings.matterWriteOffs.length) {
      const filteredRows = this.prebillingSettings.matterWriteOffs.filter(list => !selected.includes(list.id));
      sum = filteredRows.reduce(function (a, b) {
        return a + b.writeOffAmount;
      }, 0);
    }
    return sum;
  }

  /**
   * function to calculate total time and disbursement amount
   */
  calculateTotalBillAmount(disbursementIds, timeIds) {
    let sum = 0;
    if (this.prebillingSettings.recordDisbursement && this.prebillingSettings.recordDisbursement.length) {
      const filteredRows = this.prebillingSettings.recordDisbursement.filter(list => !disbursementIds.includes(list.id) && list.disbursementType.isBillable);
      sum = filteredRows.reduce(function (a, b) {
        return a + b.amount;
      }, 0);
    }
    if (this.prebillingSettings.timeEntries && this.prebillingSettings.timeEntries.length) {
      // tslint:disable-next-line: max-line-length
      const filteredRows = this.prebillingSettings.timeEntries.filter(list => !timeIds.includes(list.id) && ((list.disbursementType && list.disbursementType.billableTo && list.disbursementType.billableTo.name === "Client") || (list.disbursementType && list.disbursementType.billableTo && list.disbursementType.billableTo.name === "Both")));
      if (filteredRows) {
        filteredRows.map(item => {
          sum = sum + item.amount;
        })
      }
    }
    return sum;
  }

  previewInvoice() {
    let queryParams: any = {
      preBillId: this.prebillingId,
      matterId: this.matterId
    };

    if (this.prebillingSettings) {
      if (this.selectedPreBillTimeArr && this.selectedPreBillTimeArr.length > 0) {
        queryParams.timeEntries = this.selectedPreBillTimeArr.map(a => a.id).toString();
      }

      if (this.selectedDisbursementArr && this.selectedDisbursementArr.length > 0) {
        queryParams.disbursements = this.selectedDisbursementArr.map(a => a.id).toString();
      }

      if (this.prebillingSettings && this.prebillingSettings.isFixed) {
        if (this.selectedPreBillFixedFeeArr && this.selectedPreBillFixedFeeArr.length > 0) {
          queryParams.fixedFees = this.selectedPreBillFixedFeeArr.map(a => a.id).toString();
        }

        if (this.selectedPreBillAddOnArr && this.selectedPreBillAddOnArr.length > 0) {
          queryParams.addOns = this.selectedPreBillAddOnArr.map(a => a.id).toString();
        }
      }

      if (this.selectedWriteOffsArr && this.selectedWriteOffsArr.length > 0) {
        queryParams.writeOffs = this.selectedWriteOffsArr.map(a => a.id).toString();
      }
    }

    this.router.navigate(['/billing/pre-bills/preview-invoice'], {
      queryParams
    });
  }

  private getMatterDetails() {
    this.matterService.v1MatterMatterIdGet({ matterId: this.matterId })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.matterDetails = res;
        this.submitBtn = UtilsHelper.checkPermissionOfRepBingAtn(res);
        if (!this.submitBtn && this.permissionList.BILLING_MANAGEMENTisEdit) {
          this.viewmode = false;
        }
      });
  }

  public submitPriBill(type) {
    const currentDate = moment(this.concernedDate).format('MM/DD/YY');
    const confirmbtn = type === 'force' ? 'Yes, force-approve' : 'Yes, submit';
    const title = type === 'force' ? 'Force-Approve Pre-Bill' : 'Submit Pre-Bill';
    const message = `Are you sure you want to ${ type === 'force' ? 'force-approve' : 'submit'} your pre-bill? All charges will be applied to the client’s Balance Due. An invoice will be available to send to the client on the next Bill Issuance date ${currentDate}.`;

    this.dialogService.confirm(
      message,
      confirmbtn,
      'Cancel',
      title,
      true,
      'modal-lmd'
    ).then(response => {
      if (response) {
        let totalBillAmount = 0;
        const fixedFee: Array<{ id: number; amount: number }> = [];
        const addOn: Array<{ id: number; amount: number }> = [];
        const writeOffs: Array<{ id: number; amount: number }> = [];
        const disbursements: Array<{ id: number; amount: number }> = [];
        const timeEntries: Array<{ id: number; amount: number }> = [];
        let totalWriteOffAmount = 0;
        if (this.selectedPreBillFixedFeeArr && this.selectedPreBillFixedFeeArr.length > 0) {
          this.selectedPreBillFixedFeeArr.map((obj) => {
            totalBillAmount = totalBillAmount + obj.rateAmount;
            const sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
            fixedFee.push({ id: obj.id, amount: obj.rateAmount - sum });
            totalBillAmount = totalBillAmount - sum;
          });
        }
        if (this.selectedPreBillAddOnArr && this.selectedPreBillAddOnArr.length > 0) {
          this.selectedPreBillAddOnArr.map((obj) => {
            const sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
            totalBillAmount = totalBillAmount + (obj.serviceAmount - sum);
            addOn.push({ id: obj.id, amount: obj.serviceAmount - sum });
          });
        }
        if (this.selectedWriteOffsArr && this.selectedWriteOffsArr.length > 0) {
          totalWriteOffAmount = _.sumBy(this.selectedWriteOffsArr, a => a.writeOffAmount || 0);
          this.selectedWriteOffsArr.map((obj) => {
            writeOffs.push({ id: obj.id, amount: obj.writeOffAmount });
          });
        }
        if (this.selectedDisbursementArr && this.selectedDisbursementArr.length > 0) {
          this.selectedDisbursementArr = this.selectedDisbursementArr.filter(list => list.disbursementType.isBillable);
          if (this.selectedDisbursementArr) {
            this.selectedDisbursementArr.map((obj) => {
              const sum = _.sumBy(obj.writeDown, a => a.writeDownAmount || 0);
              totalBillAmount = totalBillAmount + obj.amount;
              disbursements.push({ id: obj.id, amount: obj.amount });
            });
          }
        }
        if (this.selectedPreBillTimeArr && this.selectedPreBillTimeArr.length > 0) {
          this.selectedPreBillTimeArr = this.selectedPreBillTimeArr.filter(list => (list.disbursementType.billableTo.name === 'Client' || list.disbursementType.billableTo.name === 'Both'));
          if (this.selectedDisbursementArr) {
            this.calculateAmount();
            this.selectedPreBillTimeArr.map((obj) => {
              totalBillAmount = totalBillAmount + obj.amount;
              timeEntries.push({ id: obj.id, amount: obj.amount });
            });
          }
        }

        const body: any = {
          prebillId: +this.prebillingId,
          writeOffs,
          disbursements,
          totalBillAmount,
          totalWriteOffAmount
        };

        if (this.prebillingSettings.isFixed) {
          body.fixedFee = fixedFee;
          body.addOn = addOn;
        } else {
          body.timeEntries = timeEntries;
        }

        this.loading = true;
        this.billingService.v1BillingReviewprebilSubmitPut$Json({ body })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(() => {
            this.loading = false;
            const msg = type === 'force' ? 'Pre-bill approved.' : 'Pre-bill Submitted';
            this.toastr.showSuccess(msg);
            this.router.navigate(['/billing/pre-bills/list']);
          },
            () => {
              this.loading = false;
            });
      }
    });
  }

  private calculateAmount() {
    this.selectedPreBillTimeArr.forEach(time => {
      if (time.disbursementType.billingType.name == 'Fixed') {
        time.amount = time.disbursementType.rate;
      } else {
        const tmin = time.hours.value.hours * 60 + time.hours.value.minutes;
        time.amount = tmin * (time.disbursementType.rate / 60);
      }
      if (time.writeDown && time.writeDown.length > 0) {
        let sum = _.sumBy(time.writeDown, a => a.writeDownAmount || 0);
        time.amount = time.amount - sum;
      }
    });
  }

  private updateBillableAmount(){
    let totalBillAmount = 0;
    let totalWriteOffAmount = 0;
    let prebilling = {...this.prebillingSettings};
    if (prebilling && prebilling.fixedFeeService.length > 0) {
          prebilling.fixedFeeService.map((obj) => {
            totalBillAmount = totalBillAmount + obj.rateAmount;
            const sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
            totalBillAmount = totalBillAmount - sum;
          });
    }
    if (prebilling && prebilling.addOnServices.length > 0) {
          prebilling.addOnServices.map((obj) => {
            const sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
            totalBillAmount = totalBillAmount + (obj.serviceAmount - sum);
          });
    }
    if (prebilling && prebilling.recordDisbursement.length > 0) {
          prebilling.recordDisbursement = prebilling.recordDisbursement.filter(list => list.disbursementType.isBillable);
          if (prebilling.recordDisbursement) {
            prebilling.recordDisbursement.map((obj) => {
              const sum = _.sumBy(obj.writeDown, a => a.writeDownAmount || 0);
              totalBillAmount = totalBillAmount +(obj.amount - sum);
            });
          }
    }
    if (prebilling && prebilling.timeEntries.length > 0) {
          prebilling.timeEntries = prebilling.timeEntries.filter(list => (list.disbursementType.billableTo.name === 'Client' || list.disbursementType.billableTo.name === 'Both'));
          if (prebilling.timeEntries) {
            prebilling.timeEntries.forEach(time => {
              if (time.disbursementType.billingType.name == 'Fixed') {
                time.amount = time.disbursementType.rate;
              } else {
                const tmin = time.hours.value.hours * 60 + time.hours.value.minutes;
                time.amount = tmin * (time.disbursementType.rate / 60);
              }
              if (time.writeDown && time.writeDown.length > 0) {
                let sum = _.sumBy(time.writeDown, (a:any) => a.writeDownAmount || 0);
                time.amount = time.amount - sum;
              }
            });
            prebilling.timeEntries.map((obj) => {
              totalBillAmount = totalBillAmount + obj.amount;
            });
          }
    }
    this.billingService.v1BillingPrebillingAmountPut$Json({body: {billAmount:totalBillAmount,id:this.prebillingId,writeOffAmount:0 }})
    .subscribe(() => {});
  }
  gotoPrebilling() {
    localStorage.setItem('Billing_SelectedTab', 'Pre-Bills');
    this.router.navigate(['/billing']);
  }
}
