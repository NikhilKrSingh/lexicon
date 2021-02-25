import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { BillingService } from 'src/common/swagger-providers/services';
import { vwBillingCodeRange } from '../../../models/used-billing-code.model';
import { UtilsHelper } from '../../../shared/utils.helper';

@Component({
  selector: 'app-edit-billing-code-ranges',
  templateUrl: './edit-billing-code-ranges.component.html',
  styleUrls: ['./edit-billing-code-ranges.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class EditBillingCodeRangesComponent implements OnInit {
  billingCodeRanges: vwBillingCodeRange[];

  loading = true;

  writeOffCode: vwBillingCodeRange;
  writeDownCode: vwBillingCodeRange;
  hourlyCode: vwBillingCodeRange;
  fixedFeeCode: vwBillingCodeRange;
  fixedFeeAddOnCode: vwBillingCodeRange;
  consultationCode: vwBillingCodeRange;
  disbursementTypeCode: vwBillingCodeRange;
  reservedCheckCode:vwBillingCodeRange;

  error_data = (errors as any).default;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private title: Title,
    private router: Router
  ) {
    this.title.setTitle('Configure Code Ranges');
  }

  ngOnInit() {
    this.getCodeRanges();
  }

  private getCodeRanges() {
    this.billingService
      .v1BillingBillingCodeRangesGet()
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.billingCodeRanges = res || [];

        this.prepareData();
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  private prepareData() {
    if (this.billingCodeRanges) {
      this.writeOffCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'WRITE_OFF_CODE'
      );

      this.formatTrailingZero(this.writeOffCode);

      this.reservedCheckCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'REVERSED_CHECK_REASON_CODE'
      );


      this.formatTrailingZero(this.reservedCheckCode);

      this.writeDownCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'WRITE_DOWN_CODE'
      );

      this.formatTrailingZero(this.writeDownCode);

      this.disbursementTypeCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'DISBURSEMENT_TYPE'
      );

      this.formatTrailingZero(this.disbursementTypeCode);

      this.fixedFeeAddOnCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'FIXED_FEE_ADD_ON'
      );

      this.formatTrailingZero(this.fixedFeeAddOnCode);

      this.fixedFeeCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'FIXED_FEE_SERVICE'
      );

      this.formatTrailingZero(this.fixedFeeCode);

      this.hourlyCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'HOURLY_CODE'
      );

      this.formatTrailingZero(this.hourlyCode);

      this.consultationCode = this.billingCodeRanges.find(
        (a) => a.billingCode == 'CONSULTATION_CODE'
      );

      this.formatTrailingZero(this.consultationCode);
    }
  }

  public change(code: vwBillingCodeRange, type: string, dir: string) {
    code.toUpdate = true;

    if (dir == 'up') {
      if (type == 'min') {
        code.minRange = +code.minRange + 1;
        this.addTrailingZero(code, 'min');
      }

      if (type == 'max') {
        code.maxRange = +code.maxRange + 1;
        this.addTrailingZero(code, 'max');
      }
    }

    if (dir == 'down') {
      if (type == 'min') {
        code.minRange = +code.minRange - 1;
        if (code.minRange < 0) {
          code.minRange = null;
        } else {
          this.addTrailingZero(code, 'min');
        }
      }

      if (type == 'max') {
        code.maxRange = +code.maxRange - 1;

        if (code.maxRange < 0) {
          code.maxRange = null;
        } else {
          this.addTrailingZero(code, 'max');
        }
      }
    }
  }

  changeInput(code: vwBillingCodeRange) {
    code.toUpdate = true;
  }

  private formatTrailingZero(code: vwBillingCodeRange) {
    if (code) {
      this.addTrailingZero(code, 'min');
      this.addTrailingZero(code, 'max');
    }
  }

  addTrailingZero(code: vwBillingCodeRange, type: string) {
    if (type == 'min') {
      if (code.minRange && code.minRange.toString().length < 5) {
        code.minRange = this.padNumber(code.minRange) as any;
      }
    }

    if (type == 'max') {
      if (code.maxRange && code.maxRange.toString().length < 5) {
        code.maxRange = this.padNumber(code.maxRange) as any;
      }
    }
  }

  padNumber(value) {
    return `00000${value}`.slice(-5);
  }

  private validateEmptyRange(code: vwBillingCodeRange) {
    if (!code.minRange || !code.maxRange) {
      code.emptyError = this.error_data.code_range_blank_error;
      return false;
    }

    if (+code.maxRange <= +code.minRange) {
      code.emptyError = this.error_data.code_range_unique_error;
      return false;
    }

    code.emptyError = null;
    return true;
  }

  private validateRange(
    code: vwBillingCodeRange,
    allCodes: vwBillingCodeRange[]
  ) {
    let remainingCodes = allCodes.filter(
      (a) => a.billingCode != code.billingCode
    );

    let codeRange = _.range(code.minRange, code.maxRange + 1, 1);

    let isDuplicate = remainingCodes.some((a) => {
      let range = _.range(a.minRange, a.maxRange + 1, 1);
      return range.some((a) => codeRange.includes(a));
    });

    if (isDuplicate) {
      code.rangeError = this.error_data.code_range_overlap_error;
      return false;
    }

    code.rangeError = null;
    return true;
  }

  public save() {
    let codes = [];

    let isHourlyEmpty = this.validateEmptyRange(this.hourlyCode);
    let isDisbEmpty = this.validateEmptyRange(this.disbursementTypeCode);
    let isFixedFeeEmpty = this.validateEmptyRange(this.fixedFeeCode);
    let isFixedFeeAddOnEmpty = this.validateEmptyRange(this.fixedFeeAddOnCode);
    let isWriteOffEmpty = this.validateEmptyRange(this.writeDownCode);
    let isWriteDownEmpty = this.validateEmptyRange(this.writeOffCode);
    let isReservedCheckCode = this.validateEmptyRange(this.reservedCheckCode);
    let isConsultationCode = this.validateEmptyRange(this.consultationCode);

    let isNonEmpty =
      isHourlyEmpty &&
      isDisbEmpty &&
      isFixedFeeEmpty &&
      isFixedFeeAddOnEmpty &&
      isWriteOffEmpty &&
      isWriteDownEmpty &&
      isReservedCheckCode &&
      isConsultationCode;

    if (!isNonEmpty) {
      return;
    }

    if (this.hourlyCode) {
      codes.push(this.hourlyCode);
    }

    if (this.fixedFeeCode) {
      codes.push(this.fixedFeeCode);
    }

    if (this.fixedFeeAddOnCode) {
      codes.push(this.fixedFeeAddOnCode);
    }

    if (this.disbursementTypeCode) {
      codes.push(this.disbursementTypeCode);
    }

    if (this.writeDownCode) {
      codes.push(this.writeDownCode);
    }

    if (this.writeOffCode) {
      codes.push(this.writeOffCode);
    }

    if (this.reservedCheckCode) {
      codes.push(this.reservedCheckCode);
    }

    if (this.consultationCode) {
      codes.push(this.consultationCode);
    }

    let hourlyValidRange = this.validateRange(this.hourlyCode, codes);
    let fixedFeeValidRange = this.validateRange(this.fixedFeeCode, codes);
    let fixedFeeAddOnValidRange = this.validateRange(
      this.fixedFeeAddOnCode,
      codes
    );

    let disbValidRange = this.validateRange(this.disbursementTypeCode, codes);
    let writeDownValidRange = this.validateRange(this.writeDownCode, codes);
    let writeOffValidRange = this.validateRange(this.writeOffCode, codes);
    let reservedCheckCodeRange = this.validateRange(this.reservedCheckCode, codes);
    let consultCodeRange = this.validateRange(this.consultationCode, codes);


    let validRange =
      hourlyValidRange &&
      fixedFeeValidRange &&
      fixedFeeAddOnValidRange &&
      disbValidRange &&
      writeDownValidRange &&
      writeOffValidRange &&
      reservedCheckCodeRange &&
      consultCodeRange;

    if (!validRange) {
      return;
    }

    let body = UtilsHelper.clone(codes);
    body.forEach((code) => {
      code.minRange = +code.minRange;
      code.maxRange = +code.maxRange;
    });

    this.loading = true;
    this.billingService
      .v1BillingBillingCodeRangesPost$Json({
        body: body,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.toastr.showSuccess(this.error_data.code_ranges_updated);
        this.router.navigate(['/firm/code-ranges']);
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }
}
