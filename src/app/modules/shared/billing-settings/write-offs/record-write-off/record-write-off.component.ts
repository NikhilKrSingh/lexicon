import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vmWriteOffs, vmWriteOffTiming } from 'src/app/modules/models';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { RecordWriteOffCodeError } from 'src/app/modules/models/used-billing-code.model';
import * as Constant from 'src/app/modules/shared/const';
import * as errors from 'src/app/modules/shared/error.json';
import { vwWriteOffCode } from 'src/common/swagger-providers/models';
import { BillingService, MatterService, TenantService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../../utils.helper';

@Component({
  selector: 'app-matter-record-write-off',
  templateUrl: './record-write-off.component.html',
  styleUrls: ['./record-write-off.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class MatterRecordWriteOffComponent implements OnInit {
  error_data = (errors as any).default;
  recordWriteOffForm: FormGroup;
  public balanceDue: number;
  public matterId: number;
  public currentDate: any = new Date();
  public warningMessageDisp: boolean = false;
  public writeOffDetails: vmWriteOffs;
  public writeOffTimingList: Array<vmWriteOffTiming>;
  public invoiceId: number;
  public prebillId: number;
  public isFixedFee: boolean;
  public maxDate: Date = new Date();
  public loading: boolean = false;
  public typeList = [];
  public selectedType: any;
  firmDetails: Tenant;
  writeOffCodes: Array<vwWriteOffCode>;
  originalWriteOffCodes: Array<vwWriteOffCode>;
  name: string;
  writeOffCodesArray = [];
  public modalLoading: boolean = true;

  recordWriteOffError = new RecordWriteOffCodeError();

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastDisplay,
    private matterService: MatterService,
    private billingService: BillingService,
    private tenantService: TenantService
  ) {}

  ngOnInit() {
    this.getTenantDetails();
    this.getWriteOffTiming();
    if (this.writeOffDetails) {
      this.recordWriteOffForm = this.fb.group({
        writeOffAmount: [
          this.writeOffDetails.writeOffAmount,
          Validators.required,
        ],
        applicableDate: [
          this.writeOffDetails.applicableDate,
          Validators.required,
        ],
        noteToFile: [this.writeOffDetails.noteToFile, Validators.required],
        billTimingId: [this.writeOffDetails.billTimingId],
        type: ['', Validators.required], // add in  this.writeOffDetails.type
      });
    } else {
      this.recordWriteOffForm = this.fb.group({
        writeOffAmount: [null, Validators.required],
        applicableDate: [this.currentDate, Validators.required],
        noteToFile: [null, Validators.required],
        billTimingId: [],
        type: [null, Validators.required],
      });
    }
  }

  close() {
    this.activeModal.close({ type: null });
  }

  public checkBalance() {
    this.warningMessageDisp =
      +this.recordWriteOffForm.value.writeOffAmount > this.balanceDue
        ? true
        : false;

    if (this.warningMessageDisp) {
      this.recordWriteOffError.amount = true;
      this.recordWriteOffError.amountMessage =
        'Enter a balance less than or equal to  the current AR balance.';
    } else {
      this.recordWriteOffError.amount = false;
      this.recordWriteOffError.amountMessage = null;
    }
  }

  private getWriteOffTiming() {
    this.billingService
      .v1BillingWriteoffTimingsGet({})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: Array<vmWriteOffTiming>) => {
        if (res) {
          this.writeOffTimingList = res;
          if (this.writeOffTimingList && this.writeOffTimingList.length > 0) {
            let code = 'BILL_NOW';
            let item = this.writeOffTimingList.find((ite) => ite.code === code);
            if (!this.writeOffDetails) {
              if (item) {
                this.recordWriteOffForm.patchValue({ billTimingId: item.id });
              }
            }
          }
        }
      });
  }

  save() {
    let body = { ...this.recordWriteOffForm.value };
    this.recordWriteOffError = new RecordWriteOffCodeError();

    if (!body.applicableDate) {
      this.recordWriteOffError.date = true;
      this.recordWriteOffError.dateMessage =
        'Please select a valid applicable date.';
    } else {
      if (
        moment(new Date()).format(Constant.SharedConstant.DateFormat) <
        moment(body.applicableDate).format(Constant.SharedConstant.DateFormat)
      ) {
        this.recordWriteOffError.date = true;
        this.recordWriteOffError.dateMessage =
          'Future date not allow, please select current or past.';
      }
    }

    if (!this.selectedType) {
      this.recordWriteOffError.code = true;
      this.recordWriteOffError.codeMessage = 'Please select a write-off type.';
    }

    if (!body.writeOffAmount) {
      this.recordWriteOffError.amount = true;
      this.recordWriteOffError.amountMessage = 'Please enter write-off amount.';
    } else {
      this.checkBalance();
    }

    if (
      !body.noteToFile ||
      (body.noteToFile && body.noteToFile.trim().length == 0)
    ) {
      this.recordWriteOffError.note = true;
      this.recordWriteOffError.noteMessage = 'Please enter note to file.';
    }

    if (this.recordWriteOffError.hasError()) {
      return;
    }

    if (this.matterId) {
      body.applicableDate = moment(body.applicableDate).format(
        Constant.SharedConstant.DateFormat
      );
      body.matterId = this.matterId;
      body.writeOffAmount = +body.writeOffAmount;
      body.writeOffCodeId = this.selectedType;
      let selectedTiming = this.writeOffTimingList.find(
        (item) => item.id === body.billTimingId
      );
      let observable;

      if (this.writeOffDetails) {
        body['statusId'] = this.writeOffDetails.statusId.id;
        body['id'] = this.writeOffDetails.id;
        observable = this.matterService.v1MatterWriteoffPut$Json({
          body: body,
        });
      } else {
        if (selectedTiming && selectedTiming.code === 'BILL_NOW') {
          body['invoiceId'] = this.invoiceId;
          body['prebillId'] = this.prebillId;
        }
        observable = this.matterService.v1MatterWriteoffPost$Json({
          body: body,
        });
      }
      this.loading = true;
      observable
        .pipe(
          map((res) => {
            return JSON.parse(res as any).results;
          })
        )
        .subscribe(
          (res) => {
            this.loading = false;
            if (res) {
              this.toastr.showSuccess(
                selectedTiming && selectedTiming.code === 'INCLUDE_IN_NEXT_BILL'
                  ? this.error_data.write_of_record_added
                  : this.error_data.write_of_record_added_bill_now
              );
              this.activeModal.close({ type: 'added' });
            }
          },
          (err) => {
            this.loading = false;
          }
        );
    }
  }

  changeType() {}

  private getWriteOffCodes() {
    this.billingService
      .v1BillingWriteOffCodesGet({
        tenantId: this.firmDetails.id,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as vwWriteOffCode[];
        }),
        finalize(() => {})
      )
      .subscribe(
        (res) => {
          if (res) {
            this.name = null;
            this.originalWriteOffCodes = res;
            this.originalWriteOffCodes = _.orderBy(
              this.originalWriteOffCodes,
              (a) => a.name,
              'asc'
            );
            let activeWriteOffCodes = [];
            this.originalWriteOffCodes.forEach((code) => {
              if (code.status == 'Active') {
                const newObj = {
                  ...code,
                  codeName: code.code + ' - ' + code.name,
                };
                activeWriteOffCodes.push(newObj);
              }
            });
            this.writeOffCodes = [...activeWriteOffCodes];
            this.modalLoading = false;
          } else {
            this.showError();
            this.modalLoading = false;
          }
        },
        () => {
          this.showError();
          this.modalLoading = false;
        }
      );
  }

  getTenantDetails() {
    this.tenantService
      .v1TenantGet()
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as Tenant;
        })
      )
      .subscribe(
        (res) => {
          this.firmDetails = res;
          if (this.firmDetails) {
            this.getWriteOffCodes();
          } else {
            this.showError();
          }
        },
        () => {
          this.showError();
        }
      );
  }

  private showError() {}
}
