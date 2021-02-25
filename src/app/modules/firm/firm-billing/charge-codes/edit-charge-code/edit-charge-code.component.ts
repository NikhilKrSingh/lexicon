import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { ChargeCodeError } from 'src/app/modules/models/used-billing-code.model';
import { vwIdCodeName, vwIdName } from 'src/common/swagger-providers/models';
import * as errors from '../../../../shared/error.json';

export interface vwRateI {
  billingTo: vwIdCodeName;
  billingType: vwIdCodeName;
  changeNotes?: null | string;
  code?: null | string;
  createdAt?: null | string;
  createdBy?: null | string;
  customRateAmount?: null | number;
  description: null | string;
  id?: number;
  isCustom?: null | boolean;
  matter?: vwIdName;
  office?: vwIdName;
  person?: vwIdName;
  rateAmount: null | any;
  status?: null | string;
  tenant?: vwIdName;
}


@Component({
  selector: 'app-edit-charge-code',
  templateUrl: './edit-charge-code.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class EditChargeCodeComponent implements OnInit {
  firmDetails: Tenant;
  chargeCode: vwRateI;
  oriChargeCode: vwRateI;
  billingToList: Array<vwIdCodeName>;
  billingTypeList: Array<vwIdCodeName>;
  error_data = (errors as any).default;
  changeNotes: string;
  public disable = false;
  public typeList = BILLING_CODE_TYPES;
  public selectedType: any = 1;
  public overheadFlag = false;
  chargeCodeError = new ChargeCodeError();

  constructor(
    private activeModal: NgbActiveModal
  ) {
  }

  ngOnInit() {
    this.disable = false;
    this.oriChargeCode = {...this.chargeCode};
    this.selectBillableTo(this.chargeCode.billingTo);
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.chargeCodeError = new ChargeCodeError();

    const form = this.chargeCode;

    if (!form.description) {
      this.chargeCodeError.name = true;
      this.chargeCodeError.nameMessage = this.error_data.name_error;
    }

    if (!form.billingType) {
      this.chargeCodeError.billType = true;
      this.chargeCodeError.billTypeMessage = this.error_data.bill_type_error;
    }

    if (!form.billingTo || (form.billingTo && !form.billingTo.id)) {
      this.chargeCodeError.billableTo = true;
      this.chargeCodeError.billableToMessage = this.error_data.billable_to_error;
    }

    if (this.chargeCodeError.hasError()) {
      return;
    }

    this.disable = true;
    this.chargeCode = {
      ...this.chargeCode,
      rateAmount: +this.chargeCode.rateAmount,
      billingTo: {
        id: +this.chargeCode.billingTo.id,
      },
      changeNotes: this.changeNotes,
    };

    this.activeModal.close(this.chargeCode);
  }

  public selectBillableTo(item) {
    if (item && item.code === 'OVERHEAD') {
      const hourly = this.billingTypeList.find((obj) => obj.code === 'HOURLY');
      this.chargeCode.billingType = {...hourly};
      this.chargeCode.rateAmount = 0;
      this.overheadFlag = true;
    } else {
      this.overheadFlag = false;
      const hourly1 = this.billingTypeList.find(
        (obj) => this.oriChargeCode && obj.id === this.oriChargeCode.billingType.id
      );
      this.chargeCode.billingType = {...hourly1};
      this.chargeCode.rateAmount = (+this.oriChargeCode.rateAmount).toFixed(2);
    }
  }
}
