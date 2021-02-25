import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BillingCodeHelper } from 'src/app/modules/models/used-billing-code.model';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { BillingService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../../shared/error.json';

@Component({
  selector: 'app-time-write-down',
  templateUrl: './write-down.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class TimeWriteDownComponent implements OnInit {
  constructor(
    private activeModal: NgbActiveModal,
    private billingService: BillingService,
    private builder: FormBuilder,
    private toastr: ToastDisplay
  ) {}
  public errorData: any = (errorData as any).default;
  public writeDownForm: FormGroup;
  public rowDetails: PreBillingModels.vwBillingLines;
  public title: string = 'Time Write-Down';
  public writeDownAmount: string = '0';
  public amountToBilled: string;
  public type: string;
  public isEdit: boolean = false;
  public isView: boolean = false;
  public writeDownDetails: any;
  public writeDownList = [];
  public formSubmitted: boolean = false;
  public jselected: any;
  public billedAmount: any;
  public writeDownAmountErr: boolean = false;
  public writeDownNarrative: string;

  loading = true;

  ngOnInit() {
    this.createForm();
    this.getAllWriteDownCodes();
    this.amountToBilled = this.rowDetails.amount.toString();
    if (this.isEdit || this.isView) {
      this.writeDownAmount = this.writeDownDetails.writeDownAmount.toFixed(2);
      this.onWriteDownValueChange(this.writeDownAmount, 'writedown');
    }
  }

  /***
   * function to create form
   */
  createForm(): void {
    this.writeDownForm = this.builder.group({
      writeDownCodeId: new FormControl('', [Validators.required]),
      writeDownAmount: ['0', [Validators.required, Validators.min(0.1)]],
      writeDownNarrative: ['', Validators.required],
    });
  }

  get f() {
    return this.writeDownForm.controls;
  }

  /***
   * function to update form
   */
  updateForm() {
    this.writeDownForm.patchValue({
      writeDownCodeId: this.writeDownDetails.writeDownCode.id
        ? this.writeDownDetails.writeDownCode.id
        : -1,
      writeDownAmount: this.writeDownDetails.writeDownAmount
        ? this.writeDownDetails.writeDownAmount.toFixed(2)
        : 0,
      writeDownNarrative: this.writeDownDetails.writeDownNarrative
        ? this.writeDownDetails.writeDownNarrative
        : '',
    });
  }

  get viewWritedownAmount() {
    return this.rowDetails.oriAmount - +this.writeDownAmount;
  }

  getAllWriteDownCodes() {
    this.billingService
      .v1BillingWriteDownCodesGet()
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (res) => {
          if (res) {
            if (this.isEdit || this.isView) {
              const activeWriteDown = res.filter((d) => {
                if (this.writeDownDetails.writeDownCode) {
                  return (
                    d.status === 'Active' ||
                    d.id == this.writeDownDetails.writeDownCode.id
                  );
                }
                return d.status === 'Active';
              });
              this.writeDownList = activeWriteDown;
              if (this.writeDownDetails.writeDownCode) {
                this.updateForm();
              }
            } else {
              const activeWriteDown = res.filter((d) => {
                return d.status === 'Active';
              });
              this.writeDownList = activeWriteDown;
            }

            this.writeDownList = BillingCodeHelper.getSortedList(
              this.writeDownList
            );
          }
          this.loading = false;
        },
        (err) => {
          this.loading = false;
        }
      );
  }

  /**
   * function to trigger when write down value change
   */
  onWriteDownValueChange(value: any, type: string, isChanged= false): void {
    this.writeDownAmountErr = false;
    if (value) {
      if (typeof value === 'string') {
        let repVal = value.replace('$', '').replace(/\,/g, '');
        value = Number(repVal).toFixed(2);
      } else {
        value = Number(value).toFixed(2);
      }

      if (type === 'writedown') {
        if (this.rowDetails.amount < +value) {
            this.writeDownAmountErr = true;
            this.writeDownForm.controls['writeDownAmount'].setValue(
              value
            );
          } else {
            let actualValue = isChanged ? value : this.writeDownDetails.writeDownAmount.toFixed(2);
            this.writeDownForm.controls['writeDownAmount'].setValue(
              actualValue
            );
          }
        this.billedAmount = (+this.rowDetails.amount - +value).toFixed(2);
      } else {
        if (this.rowDetails.amount < +value) {
          this.billedAmount = this.rowDetails.amount.toFixed(2);
        }
        this.writeDownForm.controls['writeDownAmount'].setValue(
          (this.rowDetails.amount - +this.billedAmount).toFixed(2)
        );
      }
    }
    if (+this.billedAmount < 0) {
      if (!this.isEdit) this.writeDownAmountErr = true;
    }
  }

  close() {
    this.activeModal.close({ action: null });
  }

  save() {
    this.formSubmitted = true;

    let formVal = this.writeDownForm.value;
    if (this.writeDownAmountErr) {
      this.toastr.showError(this.errorData.writedown_amount_error);
      return;
    }

    if (formVal.writeDownAmount === '') {
      this.toastr.showError(this.errorData.writedown_required);
      return;
    }

    if (formVal.writeDownAmount === '0' || formVal.writeDownAmount === '0.00') {
      this.toastr.showError(this.errorData.writedown_min);
      return;
    }

    // stop here if form is invalid
    if (this.writeDownForm.invalid) {
      return;
    }

    let body = {
      writeDownCodeId: formVal.writeDownCodeId,
      writeDownAmount: Number(Number(formVal.writeDownAmount).toFixed(2)),
      writeDownNarrative: formVal.writeDownNarrative,
      applicableDate: moment(new Date()).format(
        Constant.SharedConstant.DateFormat
      ),
    };
    if (this.type === 'timeentry') {
      body['timeEntryId'] = this.rowDetails.id;
    }
    if (this.type === 'consultation') {
      body['consultationFeeId'] = this.rowDetails.id;
    }
    let observal = this.billingService.v1BillingWriteDownPost$Json({
      body: body,
    });
    if (this.isEdit && this.writeDownDetails) {
      body['id'] = this.writeDownDetails.id;
      observal = this.billingService.v1BillingWriteDownPut$Json({ body: body });
    }

    this.loading = true;
    observal
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (res) => {
          if (res) {
            this.activeModal.close({ action: this.isEdit ? 'edit' : 'add' });
            if (this.isEdit) {
              this.toastr.showSuccess(
                this.type == 'consultation' ? 'Consultation fee write-down updated.' : 'Time entry write-down updated'
              );
            } else {
              this.toastr.showSuccess(
                this.type == 'consultation' ? 'Consultation fee write-down added.':  'Time entry write-down recorded'
              );
            }
          }
          this.loading = false;
        },
        (err) => {
          this.loading = false;
        }
      );
  }
}
