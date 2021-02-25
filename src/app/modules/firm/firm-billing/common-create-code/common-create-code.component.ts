import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import {
  BillingCodeHelper,
  ChargeCodeError,
  ConsultationCodeError,
  DisbursementTypeError,
  ModelTypeToBillingCodeMapping,
  vwBillingCodeRange,
  vwUsedBillingCodes,
  WriteOffCodeError,
} from 'src/app/modules/models/used-billing-code.model';
import { vwLookupValuesBilling } from 'src/app/modules/models/vw-id-name-billing-codes';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import {
  vwAddConsultationFeeCode,
  vwDisbursement,
  vwIdCodeName,
  vwRate,
} from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-common-create-code',
  templateUrl: './common-create-code.component.html',
  styleUrls: ['./common-create-code.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class CommonCreateCodeComponent implements OnInit {
  modalType: string;

  firmDetails: Tenant;
  allBillingCodeListItems: Array<vwLookupValuesBilling>;

  billingToList: Array<vwIdCodeName>;
  hourlyBillingTypeList: Array<vwIdCodeName>;
  disbursementBillingTypeList: Array<vwIdCodeName>;
  disbursementTypeList: Array<vwIdCodeName>;
  consultationBillTypes: Array<vwIdCodeName>;

  openBillType: vwIdCodeName;
  hardDisbursementType: vwIdCodeName;
  openConsultationFeeType: vwIdCodeName;
  fixedConsultationFeeType: vwIdCodeName;

  error_data = (errors as any).default;
  public selectedType: any;
  public typeList = BILLING_CODE_TYPES;
  public errorData: any = (errorData as any).default;
  maxCodeHourly: string;
  maxCodeDisbursement: string;
  maxCode: string;
  maxCodeWriteOff: string;
  maxCodeFixedFee: string;
  maxCodeFixedFeeAddOn: string;
  maxCodeWriteDown: string;
  maxCodeReversedCheck: string;
  maxCodeConsultation: string;


  public disable = false;
  public name: string;
  public codeMax = false;

  public chargeForm: FormGroup;
  public writeOffForm: FormGroup;
  public consultationCodeForm: FormGroup;
  disbursementForm: FormGroup;

  usedCodeRange: vwUsedBillingCodes;
  billingCodeRanges: Array<vwBillingCodeRange>;
  loading = true;

  chargeCodeError: ChargeCodeError;
  consultationCodeError: ConsultationCodeError;
  disbursementError: DisbursementTypeError;
  writeOffCodeError: WriteOffCodeError;

  formSubmitted: boolean;
  public hideRate: boolean = false;
  public previousRate: number;

  constructor(
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay,
    private fb: FormBuilder,
    private billingService: BillingService
  ) {
    this.chargeCodeError = new ChargeCodeError();
    this.disbursementError = new DisbursementTypeError();
    this.writeOffCodeError = new WriteOffCodeError();
    this.consultationCodeError = new ConsultationCodeError();
  }

  ngOnInit() {
    this.codeMax = false;
    this.setListItems();

    if (this.modalType == 'hourly') {
      this.selectedType = 1;
    } else if (this.modalType == 'disbursement') {
      this.selectedType = 2;
    } else if (this.modalType == 'writeOff') {
      this.selectedType = 3;
    } else if (this.modalType == 'writeDown') {
      this.selectedType = 4;
    } else if (this.modalType == 'reversedCheckCode') {
      this.selectedType = 5;
    } else if (this.modalType == 'consultation') {
      this.selectedType = 6;
    }

    this.createChargeForm();
    this.createDisbursementForm();
    this.createWriteOffForm();

    this.createConsultationForm();

    const perUnit = this.disbursementBillingTypeList.find(
      (a) => a.code == 'PER_UNIT'
    );

    this.disbursementForm.patchValue({
      disbursementType: this.hardDisbursementType.id,
      billType: perUnit ? perUnit.id : null,
      billingTo: '1',
    });

    this.disbursementForm.controls.billingTo.disable();
    this.disbursementForm.updateValueAndValidity();
    this.disable = false;

    this.getBillingCodeMax();
  }

  private setListItems() {
    this.billingToList = this.allBillingCodeListItems.filter(
      (a) => a.categoryCode == 'RATE_BILLING_TO'
    );

    this.hourlyBillingTypeList = this.allBillingCodeListItems.filter(
      (a) => a.categoryCode == 'RATE_BILLING_TYPE'
    );

    this.disbursementBillingTypeList = this.allBillingCodeListItems.filter(
      (a) => a.categoryCode == 'DISBURSEMENT_TYPE_BILL_TYPE'
    );

    this.disbursementTypeList = this.allBillingCodeListItems.filter(
      (a) => a.categoryCode == 'DISBURSEMENT_TYPE_TYPE'
    );

    this.consultationBillTypes = this.allBillingCodeListItems.filter(
      (a) => a.categoryCode == 'CONSULTATION_FEE_BILL_TYPE'
    );

    this.hardDisbursementType = this.disbursementTypeList.find(
      (a) => a.code == 'HARD'
    );

    this.openBillType = this.disbursementBillingTypeList.find(
      (a) => a.code === 'OPEN'
    );

    this.openConsultationFeeType = this.consultationBillTypes.find(
      (a) => a.code == 'OPEN'
    );

    this.fixedConsultationFeeType = this.consultationBillTypes.find(
      (a) => a.code == 'FIXED'
    );
  }

  private getMaxCode() {
    if (this.billingCodeRanges) {
      this.maxCodeHourly = this.assignMaxCode(
        this.usedCodeRange.hourlyCodes,
        ModelTypeToBillingCodeMapping.hourly
      );

      this.maxCodeDisbursement = this.assignMaxCode(
        this.usedCodeRange.disbursementTypes,
        ModelTypeToBillingCodeMapping.disbursement
      );

      this.maxCodeFixedFee = this.assignMaxCode(
        this.usedCodeRange.fixedFeeServices,
        ModelTypeToBillingCodeMapping.fixedFee
      );

      this.maxCodeFixedFeeAddOn = this.assignMaxCode(
        this.usedCodeRange.fixedFeeAddOns,
        ModelTypeToBillingCodeMapping.fixedFeeAddOn
      );

      this.maxCodeWriteOff = this.assignMaxCode(
        this.usedCodeRange.writeOffCodes,
        ModelTypeToBillingCodeMapping.writeOff
      );

      this.maxCodeWriteDown = this.assignMaxCode(
        this.usedCodeRange.writeDownCodes,
        ModelTypeToBillingCodeMapping.writeDown
      );

      this.maxCodeReversedCheck = this.assignMaxCode(
        this.usedCodeRange.reversedCheckReasonCodes,
        ModelTypeToBillingCodeMapping.reversedCheck
      );

      this.maxCodeConsultation = this.assignMaxCode(
        this.usedCodeRange.consultationFeeCodes,
        ModelTypeToBillingCodeMapping.consultationCode
      );
    }
  }

  private assignMaxCode(usedCodes: Array<string>, codeType: string) {
    const code = this.billingCodeRanges.find((a) => a.billingCode == codeType);

    if (code) {
      const range = _.range(code.minRange, code.maxRange + 1, 1);
      const unusedCodes = range.filter(
        (a) => !usedCodes.includes(a.toString())
      );
      let nextCode = null;

      if (unusedCodes.length > 0) {
        let i = 0;
        nextCode = unusedCodes[0].toString();
        let isExisting = BillingCodeHelper.checkUnique(
          nextCode,
          this.usedCodeRange
        );
        while (isExisting) {
          i = i + 1;
          if (i < unusedCodes.length) {
            nextCode = unusedCodes[i].toString();
            isExisting = BillingCodeHelper.checkUnique(
              nextCode,
              this.usedCodeRange
            );
          } else {
            nextCode = null;
            isExisting = false;
          }
        }
      } else {
        nextCode = null;
      }
      return nextCode;
    } else {
      return (
        +_.maxBy(this.usedCodeRange.disbursementTypes, (a) => Number(a)) + 1
      ).toString();
    }
  }

  /***** function to create charge form */
  createChargeForm(): void {
    this.chargeForm = this.fb.group({
      code: [null, Validators.required],
      description: ['', Validators.required],
      billingType: [null, Validators.required],
      billableTo: [null, Validators.required],
    });

    if (this.hourlyBillingTypeList.length > 0) {
      this.chargeForm.patchValue({
        billingType: this.hourlyBillingTypeList[0].id,
      });
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    const form = this.chargeForm.getRawValue();
    const billingTo = this.billingToList.find(
      (item) => item.id === form.billableTo
    );
    this.chargeCodeError = new ChargeCodeError();

    if (!form.code) {
      this.chargeCodeError.code = true;
      this.chargeCodeError.codeMessage = this.error_data.code_error;

      if (this.codeMax) {
        this.chargeCodeError.code = true;
        this.chargeCodeError.codeMessage = this.error_data.code_max_error;
      }
    } else {
      const isExisting = BillingCodeHelper.checkUnique(
        form.code,
        this.usedCodeRange
      );

      if (isExisting) {
        this.chargeCodeError.code = true;
        this.chargeCodeError.codeMessage = this.error_data.code_duplicate_error;
      }
    }

    if (!form.description) {
      this.chargeCodeError.name = true;
      this.chargeCodeError.nameMessage = this.error_data.name_error;
    }

    if (!form.billingType) {
      this.chargeCodeError.billType = true;
      this.chargeCodeError.billTypeMessage = this.error_data.bill_type_error;
    }

    if (!form.billableTo) {
      this.chargeCodeError.billableTo = true;
      this.chargeCodeError.billableToMessage = this.error_data.billable_to_error;
    }

    if (this.chargeCodeError.hasError()) {
      return;
    }

    this.disable = true;

    const chargeCode = {
      modalType: this.modalType,
      description: form.description,
      rateAmount: 0,
      billingTo: {
        id: +form.billableTo,
      },
      billingType: {
        id: +form.billingType,
      },
      tenant: {
        id: +this.firmDetails.id,
      },
      code: form.code,
    } as vwRate;
    this.activeModal.close(chargeCode);
  }

  createConsultationForm() {
    this.consultationCodeForm = this.fb.group({
      code: ['', [Validators.required]],
      description: ['', [Validators.required, PreventInject]],
      billType: [
        this.fixedConsultationFeeType ? this.fixedConsultationFeeType.id : null,
        Validators.required,
      ],
      rate: [null],
    });
  }

  validateConsultationFeeCode() {
    const form = this.consultationCodeForm.getRawValue();
    this.consultationCodeError = new ConsultationCodeError();

    if (!form.code) {
      this.consultationCodeError.code = true;
      this.consultationCodeError.codeMessage = this.error_data.code_error;

      if (this.codeMax) {
        this.consultationCodeError.code = true;
        this.consultationCodeError.codeMessage = this.error_data.code_max_error;
      }
    } else {
      const isExisting = BillingCodeHelper.checkUnique(
        form.code,
        this.usedCodeRange
      );

      if (isExisting) {
        this.consultationCodeError.code = true;
        this.consultationCodeError.codeMessage = this.error_data.code_duplicate_error;
      }
    }

    if (!form.description) {
      this.consultationCodeError.name = true;
      this.consultationCodeError.nameMessage = this.error_data.name_error;
    }

    if (!form.billType) {
      this.consultationCodeError.billType = true;
      this.consultationCodeError.billTypeMessage = this.error_data.bill_type_error;
    }

    if (form.billType == this.openConsultationFeeType.id) {
      this.consultationCodeError.rate = false;
      this.consultationCodeError.rateMessage = null;
    } else {
      if (!form.rate) {
        this.consultationCodeError.rate = true;
        this.consultationCodeError.rateMessage = this.error_data.consult_fee_code_rate_error;
      }
    }
  }

  saveConsultationFeeCode() {
    this.formSubmitted = true;
    const form = this.consultationCodeForm.getRawValue();
    this.validateConsultationFeeCode();

    if (this.consultationCodeError.hasError()) {
      return;
    }

    this.disable = true;

    const consultCode = {
      modalType: this.modalType,
      name: form.description,
      rate: form.billType == this.openConsultationFeeType.id ? null : +form.rate,
      billTypeId: form.billType,
      code: form.code,
    } as vwAddConsultationFeeCode;

    this.activeModal.close(consultCode);
  }

  get isBillTypeOpen() {
    if (this.disbursementForm) {
      const billType = this.disbursementForm.controls.billType.value;
      return billType == this.openBillType.id;
    } else {
      return false;
    }
  }

  createDisbursementForm(): void {
    this.disbursementForm = this.fb.group({
      code: [null, Validators.required],
      description: ['', [Validators.required]],
      billType: [null, [Validators.required]],
      disbursementType: [null, [Validators.required]],
      billingTo: [null, Validators.required],
      rateAmount: [null, [Validators.required]],
    });
  }

  changeBillType() {
    const type = this.disbursementForm.controls.billType.value;
    if (type == this.openBillType.id) {
      this.disbursementForm.controls.rateAmount.setValue(null);
      this.disbursementForm.controls.rateAmount.clearValidators();
    } else {
      this.disbursementForm.controls.rateAmount.setValidators([
        Validators.required,
      ]);
    }

    this.disbursementForm.controls.rateAmount.updateValueAndValidity();
  }

  changeDisbursementType() {
    const type = this.disbursementForm.controls.disbursementType.value;
    if (type == this.hardDisbursementType.id) {
      this.disbursementForm.controls.billingTo.setValue('1');
      this.disbursementForm.controls.billingTo.disable();
    } else {
      this.disbursementForm.controls.billingTo.setValue(null);
      this.disbursementForm.controls.billingTo.enable();
    }
  }

  saveDisbursementForm() {
    const form = this.disbursementForm.value;
    this.disbursementError = new DisbursementTypeError();

    if (!form.code) {
      this.disbursementError.code = true;
      this.disbursementError.codeMessage = this.error_data.code_error;

      if (this.codeMax) {
        this.disbursementError.code = true;
        this.disbursementError.codeMessage = this.error_data.code_max_error;
      }
    } else {
      const isExisting = BillingCodeHelper.checkUnique(
        form.code,
        this.usedCodeRange
      );

      if (isExisting) {
        this.disbursementError.code = true;
        this.disbursementError.codeMessage = this.error_data.code_duplicate_error;
      }
    }

    if (!form.description) {
      this.disbursementError.name = true;
      this.disbursementError.nameMessage = this.error_data.name_error;
    }

    if (!this.isBillTypeOpen) {
      const rate = parseFloat(form.rateAmount as any);

      if (!form.rateAmount || !rate || isNaN(rate)) {
        this.disbursementError.rate = true;
        this.disbursementError.rateMessage = this.error_data.rate_error;
      }
    }

    if (this.disbursementError.hasError()) {
      return;
    }

    if (form.disbursementType != this.hardDisbursementType.id) {
      if (form.billingTo != '0' && form.billingTo != '1') {
        this.toastr.showError(this.error_data.billable_to_error);
        return;
      }
    }

    this.disable = true;

    const disbursement = {
      modalType: this.modalType,
      code: form.code,
      description: form.description,
      billType: {
        id: +form.billType,
      },
      type: {
        id: +form.disbursementType,
      },
      isBillableToClient:
        form.disbursementType == this.hardDisbursementType.id
          ? true
          : form.billingTo == 1,
      rate: this.isBillTypeOpen ? null : +form.rateAmount,
      tenant: {
        id: this.firmDetails.id,
      },
    } as vwDisbursement;

    this.activeModal.close(disbursement);
  }

  changeModalType() {
    if (this.selectedType == 1) {
      this.modalType = 'hourly';
    } else if (this.selectedType == 2) {
      this.modalType = 'disbursement';
    } else if (this.selectedType == 3) {
      this.modalType = 'writeOff';
    } else if (this.selectedType == 4) {
      this.modalType = 'writeDown';
    } else if (this.selectedType == 5) {
      this.modalType = 'reversedCheckCode';
    } else if (this.selectedType == 6) {
      this.modalType = 'consultation';
    }
    this.formSubmitted = false;
    this.validateMaxCode();
  }

  createWriteOffForm(): void {
    this.writeOffForm = this.fb.group({
      code: ['', [Validators.required]],
      name: ['', [Validators.required, PreventInject]],
    });
  }

  onCodeChange() {
    const form = this.writeOffForm.value;

    if (!form.code) {
      this.writeOffCodeError.code = true;
      this.writeOffCodeError.codeMessage = this.error_data.code_error;

      if (this.codeMax) {
        this.writeOffCodeError.code = true;
        this.writeOffCodeError.codeMessage = this.error_data.code_max_error;
      }
    } else {
      const isExisting = BillingCodeHelper.checkUnique(
        form.code,
        this.usedCodeRange
      );
      if (isExisting) {
        this.writeOffCodeError.code = true;
        this.writeOffCodeError.codeMessage = this.error_data.code_duplicate_error;
      } else {
        this.writeOffCodeError.code = false;
        this.writeOffCodeError.codeMessage = '';
      }
    }
  }

  onNameChange() {
    const form = this.writeOffForm.value;
    if (!form.name) {
      this.writeOffCodeError.name = true;
      this.writeOffCodeError.nameMessage = this.error_data.name_error;
    }
  }

  saveWriteOffForm() {
    this.formSubmitted = true;
    const form = this.writeOffForm.value;

    this.writeOffCodeError = new WriteOffCodeError();

    if (!form.code) {
      this.writeOffCodeError.code = true;
      this.writeOffCodeError.codeMessage = this.error_data.code_error;

      if (this.codeMax) {
        this.writeOffCodeError.code = true;
        this.writeOffCodeError.codeMessage = this.error_data.code_max_error;
      }
    } else {
      const isExisting = BillingCodeHelper.checkUnique(
        form.code,
        this.usedCodeRange
      );
      if (isExisting) {
        this.writeOffCodeError.code = true;
        this.writeOffCodeError.codeMessage = this.error_data.code_duplicate_error;
      }
    }

    if (!form.name) {
      this.writeOffCodeError.name = true;
      this.writeOffCodeError.nameMessage = this.error_data.name_error;
    }

    if (!this.writeOffForm.valid) {
      return false;
    }

    if (this.writeOffCodeError.hasError()) {
      return;
    }

    const writeOff = {
      code: form.code,
      name: form.name,
      modalType: this.modalType,
    };
    this.formSubmitted = false;
    this.activeModal.close(writeOff);
  }

  public selectBillableTo(item) {
    if (item && item.code === 'OVERHEAD') {
      const hourly = this.hourlyBillingTypeList.find(
        (obj) => obj.code === 'HOURLY'
      );
      this.chargeForm.patchValue({
        billingType: hourly ? hourly.id : 0,
      });
      this.chargeForm.controls.billingType.disable();
    } else {
      this.chargeForm.controls.billingType.enable();
    }
  }

  getBillingCodeMax(onSuccess = () => {}) {
    this.billingService
      .v1BillingBillingCodeRangesGet({})
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe((res) => {
        this.billingCodeRanges = res;
        this.getMaxCode();
        this.validateMaxCode();
      });
  }

  selectBillType(item) {
    if (item.name == 'Open') {
      this.previousRate = this.consultationCodeForm.value.rate
      this.hideRate = true;
      this.consultationCodeForm.patchValue({
        rate: null
      })
    } else {
      this.hideRate = false;
      this.consultationCodeForm.patchValue({
        rate: this.previousRate
      })
    }
  }

  public validateMaxCode() {
    this.codeMax = false;

    if (this.billingCodeRanges) {
      if (this.modalType == 'hourly') {
        const codeRange = this.billingCodeRanges.find(
          (a) => a.billingCode == 'HOURLY_CODE'
        );

        if (codeRange) {
          if (
            Number(this.maxCodeHourly) > codeRange.maxRange ||
            this.maxCodeHourly == null
          ) {
            this.codeMax = true;

            this.chargeForm.patchValue({
              code: null,
            });

            this.chargeCodeError = new ChargeCodeError();
            this.chargeCodeError.code = true;
            this.chargeCodeError.codeMessage = this.error_data.code_max_error;
          } else if (Number(this.maxCodeHourly) < codeRange.minRange) {
            this.chargeForm.patchValue({
              code: codeRange.minRange,
            });

            this.chargeCodeError = new ChargeCodeError();
          } else {
            this.chargeForm.patchValue({
              code: this.maxCodeHourly,
            });
            this.chargeCodeError = new ChargeCodeError();
          }
        }
      }

      if (this.modalType == 'disbursement') {
        const codeRange = this.billingCodeRanges.find(
          (a) => a.billingCode == 'DISBURSEMENT_TYPE'
        );

        if (codeRange) {
          if (
            Number(this.maxCodeDisbursement) > codeRange.maxRange ||
            this.maxCodeDisbursement == null
          ) {
            this.codeMax = true;

            this.disbursementForm.patchValue({
              code: null,
            });

            this.disbursementError = new DisbursementTypeError();
            this.disbursementError.code = true;
            this.disbursementError.codeMessage = this.error_data.code_max_error;
          } else if (Number(this.maxCodeDisbursement) < codeRange.minRange) {
            this.disbursementForm.patchValue({
              code: codeRange.minRange,
            });

            this.disbursementError = new DisbursementTypeError();
          } else {
            this.disbursementForm.patchValue({
              code: this.maxCodeDisbursement,
            });

            this.disbursementError = new DisbursementTypeError();
          }
        }
      }

      if (this.modalType == 'writeOff') {
        this.writeOffCodeError = new WriteOffCodeError();
        const codeRange = this.billingCodeRanges.find(
          (a) => a.billingCode == 'WRITE_OFF_CODE'
        );

        if (codeRange) {
          if (
            Number(this.maxCodeWriteOff) > codeRange.maxRange ||
            this.maxCodeWriteOff == null
          ) {
            this.codeMax = true;

            this.writeOffForm.patchValue({
              code: null,
            });

            this.writeOffCodeError.code = true;
            this.writeOffCodeError.codeMessage = this.error_data.code_max_error;
          } else if (Number(this.maxCodeWriteOff) < codeRange.minRange) {
            this.writeOffForm.patchValue({
              code: codeRange.minRange,
            });
          } else {
            this.writeOffForm.patchValue({
              code: this.maxCodeWriteOff,
            });
          }
        }
      }

      if (this.modalType == 'writeDown') {
        this.writeOffCodeError = new WriteOffCodeError();
        const codeRange = this.billingCodeRanges.find(
          (a) => a.billingCode == 'WRITE_DOWN_CODE'
        );

        if (codeRange) {
          if (
            Number(this.maxCodeWriteDown) > codeRange.maxRange ||
            this.maxCodeWriteDown == null
          ) {
            this.codeMax = true;

            this.writeOffForm.patchValue({
              code: null,
            });

            this.writeOffCodeError.code = true;
            this.writeOffCodeError.codeMessage = this.error_data.code_max_error;
          } else if (Number(this.maxCodeWriteDown) < codeRange.minRange) {
            this.writeOffForm.patchValue({
              code: codeRange.minRange,
            });
          } else {
            this.writeOffForm.patchValue({
              code: this.maxCodeWriteDown,
            });
          }
        }
      }

      if (this.modalType == 'reversedCheckCode') {
        this.writeOffCodeError = new WriteOffCodeError();
        const codeRange = this.billingCodeRanges.find(
          (a) => a.billingCode == 'REVERSED_CHECK_REASON_CODE'
        );

        if (codeRange) {
          if (
            Number(this.maxCodeReversedCheck) > codeRange.maxRange ||
            this.maxCodeReversedCheck == null
          ) {
            this.codeMax = true;

            this.writeOffForm.patchValue({
              code: null,
            });

            this.writeOffCodeError.code = true;
            this.writeOffCodeError.codeMessage = this.error_data.code_max_error;
          } else if (Number(this.maxCodeReversedCheck) < codeRange.minRange) {
            this.writeOffForm.patchValue({
              code: codeRange.minRange,
            });
          } else {
            this.writeOffForm.patchValue({
              code: this.maxCodeReversedCheck,
            });
          }
        }
      }

      if (this.modalType == 'consultation') {
        this.consultationCodeError = new ConsultationCodeError();
        const codeRange = this.billingCodeRanges.find(
          (a) => a.billingCode == 'CONSULTATION_CODE'
        );

        if (codeRange) {
          if (
            Number(this.maxCodeConsultation) > codeRange.maxRange ||
            this.maxCodeConsultation == null
          ) {
            this.codeMax = true;
            this.formSubmitted = true;

            this.consultationCodeForm.patchValue({
              code: null,
            });

            this.consultationCodeError.code = true;
            this.consultationCodeError.codeMessage = this.error_data.code_max_error;
          } else if (Number(this.maxCodeConsultation) < codeRange.minRange) {
            this.consultationCodeForm.patchValue({
              code: codeRange.minRange,
            });
          } else {
            this.consultationCodeForm.patchValue({
              code: this.maxCodeConsultation,
            });
          }
        }
      }
    }
    this.loading = false;
  }

  public formatRate() {
    if (
      this.modalType === 'disbursement' &&
      this.disbursementForm.value.rateAmount
    ) {
      this.disbursementForm.patchValue({
        rateAmount: (+this.disbursementForm.value.rateAmount).toFixed(2),
      });
    }

    if (
      this.modalType === 'consultation' &&
      this.consultationCodeForm.value.rate
    ) {
      this.consultationCodeForm.patchValue({
        rate: (+this.consultationCodeForm.value.rate).toFixed(2),
      });
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }
}
