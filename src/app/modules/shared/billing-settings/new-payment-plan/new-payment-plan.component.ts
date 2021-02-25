import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { FixedFeeServiceService } from 'src/common/swagger-providers/services';
import { DialogService } from '../../dialog.service';
import * as errors from '../../error.json';
import { UtilsHelper } from '../../utils.helper';
import { PaymentPlanComponent } from '../billing-info/payment-plan/payment-plan.component';
import { vwIdCodeName, vwPaymentPlan } from 'src/common/swagger-providers/models';
import { Store } from '@ngrx/store';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { Subscription, Observable } from 'rxjs';


@Component({
  selector: 'app-new-billing-plan-plan',
  templateUrl: './new-payment-plan.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class NewBillingPaymentPlanComponent implements OnInit, OnDestroy
{
  @Input() matterDetails: vwMatterResponse;
  @Input() balanceDue: number = null;
  @Input() billingSettings:any;
  @Input() paymentPlanEnabled: boolean
  @ViewChild('noPositiveMatterBalance', { static: false }) noPositiveMatterBalance: any;

  loading = false;
  public repeatsOn: Array<{ name: string; selected: boolean }> = [
    { name: 'Sunday', selected: false },
    { name: 'Monday', selected: false },
    { name: 'Tuesday', selected: false },
    { name: 'Wednesday', selected: false },
    { name: 'Thursday', selected: false },
    { name: 'Friday', selected: false },
    { name: 'Saturday', selected: false }
  ];

  public recursOnList: Array<{ id?: number; name?: string }> = [];
  public selectedDuration: vwIdCodeName = { code: '', name: '' };
  public selectedRecursDay: { id?: number; name?: string };
  public selectedDay = '';
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  hasPermissionToAdd = false;
  showGrid = false;
  @Input() paymentPlanAccordian = false;
  @Output() readonly paymentPlanAccordianChange = new EventEmitter();
  @Output() readonly refreshBillingPreference = new EventEmitter();
  createdPlan: any;
  requestCompleted = false;

  constructor(
    private modalService: NgbModal,
    private toastr: ToastDisplay,
    private dialogService: DialogService,
    private fixedFeeServiceService: FixedFeeServiceService,
    private store: Store<fromRoot.AppState>,
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    if (this.matterDetails) {
      this.getPaymentPlanList(true);
    }
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    let loginUserAttorny = UtilsHelper.checkPermissionOfRepBingAtn(
      this.matterDetails
    );
    if (this.permissionList.BILLING_MANAGEMENTisEdit ||
        this.permissionList.BILLING_MANAGEMENTisAdmin ||
        this.permissionList.MATTER_MANAGEMENTisAdmin || loginUserAttorny) {
      this.hasPermissionToAdd = true;
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getPaymentPlanList(firstLoading?:boolean) {
    this.loading = true;
    if (firstLoading) this.requestCompleted = false;
    this.fixedFeeServiceService
      .v1FixedFeeServicePaymentPlanMatteridGet({
        matterid: this.matterDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.loading = false;
          if (firstLoading) this.requestCompleted = true;
          this.createdPlan = null;

          if (res && res.length) {
            this.createdPlan = {...res[0]};
          }
          this.setPaymentPlanDetails();
        }
      }, () => {
        this.loading = false;
        if (firstLoading) this.requestCompleted = true;
      });
  }

  private setPaymentPlanDetails() {
    if (this.createdPlan) {
      const index = this.createdPlan.billFrequencyDay;
      this.repeatsOn.map(item => (item.selected = false));
      this.repeatsOn[index].selected = true;
      this.selectedDay = this.repeatsOn[index].name;
      this.recursOnList = [];

     this.setRepeatOn(this.createdPlan.repeatType, index);

      this.selectedRecursDay = this.recursOnList.find(
        a => a.id == this.createdPlan.billFrequencyRecursOn
      );
    }
  }

  public setRepeatOn(text, selectedDayNumber?) {
    this.recursOnList = [];
    if (text === 2) {
      for (let i = 1; i <= 31; i++) {
        this.recursOnList.push({id: i, name: i + ((i==1) ? 'st': (i==2) ? 'nd': (i==3) ? 'rd' : 'th') + ' of the month'});
      }
    } else {
      this.recurringName.map((item, index1) => {
        this.recursOnList.push({id: index1 + 1, name: item + ' ' + this.repeatsOn[selectedDayNumber].name + ' of the month'});
      });
    }
  }

  addPaymentPlan() {
    if (+this.balanceDue <= 0) {
      this.open(this.noPositiveMatterBalance, 'sm', '');
      return;
    }
    const modelRef = this.modalService.open(PaymentPlanComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modelRef.componentInstance.matterId = this.matterDetails.id;
    modelRef.componentInstance.balanceDue = this.balanceDue;
    modelRef.componentInstance.matterBillingDetails = this.billingSettings;
    modelRef.componentInstance.matterDetails = this.matterDetails;

    modelRef.result.then((res: vwPaymentPlan) => {
      if (res) {
        res.matterId = this.matterDetails.id;
        this.loading = true;
        this.fixedFeeServiceService
          .v1FixedFeeServicePaymentPlanPost$Json({
            body: res
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            resp => {
              if (resp > 0) {
                this.toastr.showSuccess(
                  this.error_data.create_payment_plan_success
                );
                this.refreshBillingPreference.emit();
                this.getPaymentPlanList();
              } else {
                this.toastr.showError(
                  this.error_data.create_payment_plan_error
                );
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



  editPaymentPlan() {
    const modelRef = this.modalService.open(PaymentPlanComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modelRef.componentInstance.matterId = this.matterDetails.id;
    modelRef.componentInstance.paymentPlan = this.createdPlan;
    modelRef.componentInstance.balanceDue = this.balanceDue;
    modelRef.componentInstance.matterBillingDetails = this.billingSettings;
    modelRef.componentInstance.matterDetails = this.matterDetails;

    modelRef.result.then(res => {
      if (res) {
        res.matterId = this.matterDetails.id;
        res.id = this.createdPlan.id;

        this.loading = true;
        this.fixedFeeServiceService
          .v1FixedFeeServicePaymentPlanPut$Json({
            body: res
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            resp => {
              if (resp > 0) {
                this.toastr.showSuccess(
                  this.error_data.edit_payment_plan_success
                );
                this.refreshBillingPreference.emit();
                this.getPaymentPlanList();
              } else {
                this.toastr.showError(this.error_data.edit_payment_plan_error);
                this.loading = false;
              }
            },
            () => {
              this.loading = false;
            }
          );
      } else {
        this.refreshBillingPreference.emit();
        this.getPaymentPlanList();
      }
    });
  }

  deletePaymentPlan() {
    this.dialogService
      .confirm(this.error_data.delete_payment_plan_confirm, 'Delete', 'Cancel', 'Delete Payment Plan')
      .then(res => {
        if (res) {
          this.loading = true;
          this.fixedFeeServiceService
            .v1FixedFeeServicePaymentPlanIdDelete({
              id: this.createdPlan.id
            })
            .pipe(map(UtilsHelper.mapData))
            .subscribe(
              resp => {
                if (resp > 0) {
                  this.toastr.showSuccess(
                    this.error_data.delete_payment_plan_success
                  );
                  this.refreshBillingPreference.emit();
                  this.getPaymentPlanList();
                } else {
                  this.toastr.showError(
                    this.error_data.delete_payment_plan_error
                  );
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

   /**
   * Function to open the modals
   * @param content
   * @param className
   * @param winClass
   */
  open(content: any, className: any, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        result => {
          `Closed with: ${result}`;
        },
        reason => {
          `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  /**
   * Function to get the dismiss reasons for the modals
   * @param reason
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

  changePaymentPlanAccordion() {
    this.paymentPlanAccordian = !this.paymentPlanAccordian;
    this.paymentPlanAccordianChange.emit(this.paymentPlanAccordian);
  }

  toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  get isPaymentPlanEnabled() {
    return this.matterDetails.matterStatus && this.matterDetails.matterStatus.name
      && (this.paymentPlanEnabled && this.matterDetails
        && this.matterDetails.matterStatus.name.toLowerCase() == 'closed')
          || (!this.paymentPlanEnabled && this.matterDetails
            && (this.matterDetails.matterStatus.name.toLowerCase() == 'open'
              || this.matterDetails.matterStatus.name.toLowerCase() == 'closed'));
  }

}
