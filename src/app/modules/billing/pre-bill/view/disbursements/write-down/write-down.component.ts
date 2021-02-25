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
  selector: 'app-disbursement-write-down',
  templateUrl: './write-down.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class DisbursementWriteDownComponent implements OnInit {
  public rowDetails: PreBillingModels.vwBillingLines;
  public form: FormGroup;
  public billedAmount: any;
  public writeDownAmountErr: boolean = false;
  public title: string = 'Disbursement Write-Down';
  public writeDownDetails: any;
  public isEdit: boolean = false;
  public isView: boolean = false;
  public writeDownList = [];
  public formSubmitted: boolean = false;
  public errorData: any = (errorData as any).default;
  public amountToBilled: string;
  public writeDownAmount: any = '0';

  loading = true;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private billingService: BillingService,
    private toastr: ToastDisplay
  ) {}

  ngOnInit() {
    this.createForm();
    this.getAllWriteDownCodes();
    this.amountToBilled = this.rowDetails.amount.toString();
    if ((this.isEdit || this.isView) && this.writeDownDetails) {
      this.writeDownAmount = this.writeDownDetails.writeDownAmount.toFixed(2);
    }
  }

  /****
   * function to create form
   */
  createForm(): void {
    this.form = this.fb.group({
      writeDownCodeId: new FormControl(null, [Validators.required]),
      writeDownAmount: ['0', [Validators.required, Validators.min(0.1)]],
      writeDownNarrative: ['', Validators.required],
    });
  }

  get f() {
    return this.form.controls;
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
            if ((this.isEdit || this.isView) && this.writeDownDetails) {
              if (this.writeDownDetails.writeDownCode) {
                const activeWriteDown = res.filter((d) => {
                  return (
                    d.status === 'Active' ||
                    d.id == this.writeDownDetails.writeDownCode.id
                  );
                });
                this.writeDownList = activeWriteDown;
              } else {
                const activeWriteDown = res.filter((d) => {
                  return d.status === 'Active';
                });
                this.writeDownList = activeWriteDown;
              }
              this.updateForm();
              this.onWriteDownValueChange(this.writeDownAmount, 'writedown');
            } else {
              const activeWriteDown = res.filter((d) => {
                return d.status === 'Active';
              });
              this.writeDownList = activeWriteDown;
            }

            this.writeDownList = BillingCodeHelper.getSortedList(this.writeDownList);
          }
          this.loading = false;
        },
        (err) => {
          this.loading = false;
        }
      );
  }

  /***
   * function to update form
   */
  updateForm() {
    this.form.patchValue({
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

  close() {
    this.activeModal.close(null);
  }

  /***
   * function to save disbursement write down
   */
  async save() {
    this.formSubmitted = true;

    let formVal = this.form.value;
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
    if (this.form.invalid) {
      return;
    }

    if (this.form.valid) {
      let body = {
        recordDisbursementId: this.rowDetails.id,
        writeDownCodeId: formVal.writeDownCodeId,
        writeDownAmount: Number(Number(formVal.writeDownAmount).toFixed(2)),
        writeDownNarrative: formVal.writeDownNarrative,
        applicableDate: moment(new Date()).format(
          Constant.SharedConstant.DateFormat
        ),
      };

      let url = this.billingService.v1BillingWriteDownPost$Json$Response({
        body: body,
      });
      if (this.isEdit && this.writeDownDetails) {
        body['id'] = this.writeDownDetails.id;
        url = this.billingService.v1BillingWriteDownPut$Json$Response({
          body: body,
        });
      }
      try {
        this.loading = true;
        await url.toPromise();
        if (this.isEdit && this.writeDownDetails) {
          this.toastr.showSuccess(
            'Disbursement write-down updated'
          );
        } else {
          this.toastr.showSuccess(
            'Disbursement write-down recorded'
          );
        }
        this.loading = false;
        this.activeModal.close(true);
      } catch (err) {
        this.loading = false;
      }
    }
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
            this.form.controls['writeDownAmount'].setValue(
              value
          );
          } else {
            let actualValue = isChanged ? value : this.writeDownDetails.writeDownAmount.toFixed(2);
            this.form.controls['writeDownAmount'].setValue(
              actualValue
            );
          }
        this.billedAmount = (
          +this.rowDetails.amount - this.form.controls['writeDownAmount'].value
        ).toFixed(2);
      } else {
        if (this.rowDetails.amount < +value) {
          this.billedAmount = this.rowDetails.amount.toFixed(2);
        }
        this.form.controls['writeDownAmount'].setValue(
          (this.rowDetails.amount - this.billedAmount).toFixed(2)
        );
      }
    }
    if (+this.billedAmount < 0) {
      if (!this.isEdit) this.writeDownAmountErr = true;
    }
  }
}
