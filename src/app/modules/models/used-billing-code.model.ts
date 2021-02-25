import * as _ from 'lodash';

interface ICodeList {
  code: string;
  name: string;
}

export interface vwUsedBillingCodes {
  hourlyCodes: string[];
  disbursementTypes: string[];
  fixedFeeServices: string[];
  fixedFeeAddOns: string[];
  writeDownCodes: string[];
  writeOffCodes: string[];
  reversedCheckReasonCodes: string[];
  consultationFeeCodes: string[];
}

export class vwBillingCodeRange {
  id: number;
  billingCodeCategory: string;
  billingCode: string;
  billingCodeName: string;
  minRange: number;
  maxRange: number;
  toUpdate?: boolean;

  emptyError?: string;
  rangeError?: string;
}

export class vwBillingCodeRangeModel {
  category: string;
  codes: Array<vwBillingCodeRange>;
}

export const ModelTypeToBillingCodeMapping = {
  hourly: 'HOURLY_CODE',
  fixedFee: 'FIXED_FEE_SERVICE',
  fixedFeeAddOn: 'FIXED_FEE_ADD_ON',
  disbursement: 'DISBURSEMENT_TYPE',
  writeDown: 'WRITE_DOWN_CODE',
  writeOff: 'WRITE_OFF_CODE',
  reversedCheck: 'REVERSED_CHECK_REASON_CODE',
  consultationCode: 'CONSULTATION_CODE',
};

export class DisbursementTypeError {
  code: boolean;
  codeMessage: string;
  name: boolean;
  nameMessage: string;
  rate: boolean;
  rateMessage: string;

  hasError() {
    return this.code || this.name || this.rate;
  }
}

export class ChargeCodeError {
  code: boolean;
  codeMessage: string;
  name: boolean;
  nameMessage: string;
  billType: boolean;
  billTypeMessage: string;
  billableTo: boolean;
  billableToMessage: boolean;
  rate: boolean;
  rateMessage: string;

  hasError() {
    return this.code || this.name || this.billType || this.billableTo;
  }
}

export class ConsultationCodeError {
  code: boolean;
  codeMessage: string;
  name: boolean;
  nameMessage: string;
  billType: boolean;
  billTypeMessage: string;
  rate: boolean;
  rateMessage: string;

  hasError() {
    return this.code || this.name || this.billType || this.rate;
  }
}

export class BillingCodeHelper {
  static checkUnique(code: number, usedCodeRange: vwUsedBillingCodes) {
    for (let type in usedCodeRange) {
      let codes = usedCodeRange[type] as Array<any>;
      let isExisting = codes.some((a) => a == code);

      if (isExisting) {
        return true;
      }
    }

    return false;
  }

  static getSortedList(list: Array<ICodeList>) {
    list = _.orderBy(list || [], (a) => a.name, 'asc');

    let codes = [];

    list.forEach((code) => {
      const newObj = {
        ...code,
        codeName: code.code + ' - ' + code.name,
      };

      codes.push(newObj);
    });

    return codes;
  }
}

export class WriteOffCodeError {
  code: boolean;
  codeMessage: string;
  name: boolean;
  nameMessage: string;

  hasError() {
    return this.code || this.name;
  }
}

export class RecordWriteOffCodeError {
  code: boolean;
  codeMessage: string;
  amount: boolean;
  amountMessage: string;
  note: boolean;
  noteMessage: string;
  date: boolean;
  dateMessage: string;

  hasError() {
    return this.code || this.amount || this.date || this.note;
  }
}
