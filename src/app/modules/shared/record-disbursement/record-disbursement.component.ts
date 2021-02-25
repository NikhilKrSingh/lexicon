import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IFolder, vwMatterResponse } from 'src/app/modules/models';
import { CreateNoteError } from 'src/app/modules/models/fillable-form.model';
import * as errors from 'src/app/modules/shared/error.json';
import { CommonService } from 'src/app/service/common.service';
import { vwBillingSettings, vwIdCodeName, vwRecordDisbursement } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, DmsService, DocumentPortalService, MatterService, MiscService } from 'src/common/swagger-providers/services';
import { BillingSettingsHelper } from '../billing-settings-helper';
import { SharedService } from '../sharedService';
import { UtilsHelper } from '../utils.helper';

enum DMSFileStatus {
  Unknown = 0,
  VerifyFileName = 1,
  VerifyFileNamePassed = 2,
  VerifyFileNameFailed = 3,
  SecurityScanInProgress = 4,
  SecurityScanPassed = 5,
  SecurityScanFailedVirus = 6,
  SecurityScanFailedError = 7,
  UploadInProgress = 8,
  UploadDone = 9,
  UploadFailed = 10,
  UploadCancelled = 11,
  UploadRejected = 12,
  GeneratedFile = 13
}


interface IDocumentAction {
  isCancel: boolean;
  isUpload: boolean;
  isVerify: boolean;
  isScanOnly: boolean;
}

interface IDocumentUpload {
  param: any;
  isCancel: boolean;
  isUpload: boolean;
  isVerify: boolean;
  isScanOnly: boolean;
  lastIteration?: boolean;
  index?: number;
}

@Component({
  selector: 'app-record-disbursement',
  templateUrl: './record-disbursement.component.html',
  styleUrls: ['./record-disbursement.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RecordDisbursementComponent implements OnInit {
  recordDisbursement: vwRecordDisbursement;
  officeBillingSettings: vwBillingSettings;
  matterDetails: vwMatterResponse;
  showWarning = false;
  disbursementType: number;
  _disbursementTypes: any;
  disbursementTypes: Array<vwIdCodeName>;
  error_data = (errors as any).default;
  changeNotes: string;
  public folderDetails: IFolder;
  minDate: string;
  maxDate: string;
  public dis_check_warn: string;
  public loading = false;
  public fileErrorMsg = '';
  public fileForm = this.formBuilder.group({
    file: new FormControl(File)
  });
  public blockedExtension: Array<any> = [];
  public fileDetails: any;
  private loginUser: any;
  public selectFileFlag = false;
  public displayWarningMsg = false;
  public uploadButtonText = 'Upload Receipt';
  public currentUserInfo = JSON.parse(localStorage.getItem('profile'));
  public disbursementTypeErrMsg = '';
  common = false;
  isNegativeAmount = false;
  amountPrefix = '';
  allowNegative = true;
  createNoteError: CreateNoteError;
  public clientSubscribe: Subscription;
  public isSearchLoading = false;
  public originalClientList: any[];
  public clientListPopUp: Array<any> = [];
  public clientDetail: any = null;
  allowedExtensions = ['jpg', 'jpeg', 'tiff', 'pdf', 'doc', 'docx', 'png'];
  public clientError = false;
  public matterListPopUp: Array<any> = [];
  public filterdisbursementTypeListPopUP: Array<any> = [];
  public searchclient: string;
  public searchMatter: string;
  public matterDetail: any = null;
  public incorrectMatter = false;
  public incorrectClient = false;
  public disabledMatter = false;
  public rate = 0;
  public chargePrefix = '$';
  public code: string;
  public disbursementTypeDetail: any;
  public originalMatterList: any[];
  public matterError = false;
  public originalChargeCodes: Array<any> = [];
  public matterSubscribe: Subscription;
  public isMatterSearchLoading = false;
  public formSubmitted = false;
  public billingNarrativeError = false;
  public noteError = false;
  public changeNotesError = false;
  pageType: string;

  constructor(
    public modalService: NgbActiveModal,
    private toastr: ToastDisplay,
    private billingSettingsHelper: BillingSettingsHelper,
    private dmsService: DmsService,
    private documentPortalService: DocumentPortalService,
    private formBuilder: FormBuilder,
    private miscService: MiscService,
    private clockService: ClockService,
    private matterService: MatterService,
    private billingService: BillingService,
    private commonService: CommonService,
    private sharedService: SharedService
  ) {
    this.disbursementTypes = [];
    this.createNoteError = new CreateNoteError();
  }

  async ngOnInit() {
    if (this.recordDisbursement.id && this.pageType && this.pageType === 'matter') {
      const resp = await this.billingService.v1BillingRecordRecordDisbursementIdGet({recordDisbursementId: this.recordDisbursement.id}).toPromise();
      this.recordDisbursement = JSON.parse(resp as any).results;
    }
    this.loginUser = UtilsHelper.getLoginUser();
    if (this.matterDetails) {
      this.getFolder();
      this.getBlockedExtension();
    }
    this.dis_check_warn = this.error_data.disb_check_amount_warning;
    if (this._disbursementTypes) {
      if (this.recordDisbursement.id) {
        this._disbursementTypes = this._disbursementTypes.filter(
          a =>
            a.status === 'Active' ||
            a.id == this.recordDisbursement.disbursementType.id
        );
      } else {
        this._disbursementTypes = this._disbursementTypes.filter(
          a => a.status === 'Active'
        );
      }

      this.disbursementTypes = this._disbursementTypes.map(a => {
        return {
          id: a.id,
          name: `${a.code} - ${a.description}`
        } as vwIdCodeName;
      });
    }

    if (this.recordDisbursement.id) {
      this.disbursementType = this.recordDisbursement.disbursementType.id;
      if (this.recordDisbursement.isVendorPaid) {
        this.showWarning = true;
      }
      if (this._disbursementTypes && this._disbursementTypes.length > 0) {
        this.recordDisbursement.disbursementType = this._disbursementTypes.find(
          a => a.id == this.disbursementType
        );
      }

      if (this.recordDisbursement.finalBilledAmount < 0) {
        this.isNegativeAmount = true;
        this.amountPrefix = '-$';
      } else {
        this.isNegativeAmount = false;
        this.amountPrefix = '$';
      }

      this.allowNegative = false;
    } else {
      this.recordDisbursement.isVendorPaid = true;
    }

    if (this.matterDetails && this.matterDetails.isFixedFee) {
      this.minDate = this.matterDetails.openDate;
      this.maxDate = this.officeBillingSettings.fixedFeeDueDate;
    } else {
      const billGenerationPeriod = this.billingSettingsHelper.getBillGenerationPeriod(
        this.officeBillingSettings
      );

      this.minDate = billGenerationPeriod.start;
      this.maxDate = billGenerationPeriod.end;
    }
    this.selectFileFlag = !!(
      this.recordDisbursement &&
      this.recordDisbursement.receiptFile &&
      this.recordDisbursement.receiptFile.name
    );
    this.uploadButtonTextChange();
  }

  changeDisbursementType() {
    const disType = this._disbursementTypes.find(
      a => a.id == this.disbursementType
    );
    if (disType) {
      let amount =
      disType && disType.isCustom ? +(disType.customRate) : +(disType.rate);
      amount = amount ? amount : 0;
      this.recordDisbursement.disbursementType = disType;

      if (
        disType.billType.code === 'PER_UNIT' &&
        this.recordDisbursement.dateOfService
      ) {
        this.recordDisbursement.rateAmount = +(Number(amount) || 0).toFixed(2);
        this.recordDisbursement.fixedAmount = null;
        this.recordDisbursement.finalBilledAmount = 0;
        this.changeHours();
      } else if (
        disType.billType.code === 'FIXED' &&
        this.recordDisbursement.dateOfService
      ) {
        this.recordDisbursement.hoursBilled = null;
        this.recordDisbursement.rateAmount = null;
        this.recordDisbursement.fixedAmount = +(Number(amount) || 0).toFixed(2);
        this.recordDisbursement.finalBilledAmount = +(Number(amount) || 0).toFixed(2);
      } else {
        this.recordDisbursement.rateAmount = null;
        this.recordDisbursement.fixedAmount = null;
        this.recordDisbursement.finalBilledAmount = null;
      }
    } else {
      this.recordDisbursement.disbursementType = null;
      this.recordDisbursement.hoursBilled = null;
      this.recordDisbursement.rateAmount = null;
      this.recordDisbursement.finalBilledAmount = null;
      this.recordDisbursement.fixedAmount = null;
    }
  }

  changeHours() {
    if (
      this.recordDisbursement.hoursBilled &&
      this.recordDisbursement.dateOfService
    ) {
      this.recordDisbursement.finalBilledAmount =
        (this.recordDisbursement.hoursBilled || 0) *
        this.recordDisbursement.rateAmount;
    } else {
      this.recordDisbursement.finalBilledAmount = null;
    }
  }

  close() {
    this.modalService.close(null);
  }

  /**
   * get folderr details
   */
  public getFolder() {
    this.loading = true;
    this.dmsService
      .v1DmsFolderDisbursementReceiptMatterMatterIdGet({
        matterId: this.matterDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.loading = false;
          this.folderDetails = res;
        },
        () => {
          this.loading = false;
        }
      );
  }

  /*** function to get all blocked extension */
  async getBlockedExtension(): Promise<any> {
    try {
      let resp: any = await this.miscService
        .v1MiscFileextensionsGet$Response()
        .toPromise();
      resp = JSON.parse(resp.body);
      this.blockedExtension = resp.results;
    } catch (err) {}
  }
  disbursementErr() {
    if (this.disbursementType) {
      this.disbursementTypeErrMsg = null;
    }
  }

  save() {
    let firstChar: string;
    const pattern = '[a-zA-Z0-9_]';

    this.billingNarrativeError = this.noteError = this.changeNotesError = false;

    if (this.recordDisbursement.changeNotes) {
      firstChar = this.recordDisbursement.changeNotes.charAt(0);
    }
    if (this.recordDisbursement.changeNotes && !firstChar.match(pattern)) {
      this.changeNotesError = true;
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.error_data.insecure_input;
    } else {
      this.changeNotesError = false;
      this.createNoteError.note = false;
    }

    if (this.recordDisbursement.billingNarrative) {
      firstChar = this.recordDisbursement.billingNarrative.charAt(0);
    }
    if (this.recordDisbursement.billingNarrative && !firstChar.match(pattern)) {
      this.billingNarrativeError = true;
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.error_data.insecure_input;
    } else {
      this.billingNarrativeError = false;
      this.createNoteError.note = false;
    }

    if (this.recordDisbursement.note && this.recordDisbursement.note.content) {
      firstChar = this.recordDisbursement.note.content.charAt(0);
    }

    if (
      this.recordDisbursement.note &&
      this.recordDisbursement.note.content &&
      !firstChar.match(pattern)
    ) {
      this.noteError = true;
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.error_data.insecure_input;
    } else {
      this.noteError = false;
      this.createNoteError.note = false;
    }

    if (
      this.common &&
      this.recordDisbursement &&
      Object.keys(this.recordDisbursement).length
    ) {
      if (!this.clientDetail) {
        this.clientError = true;
      }

      if (!this.matterDetail) {
        this.matterError = true;
      }
    }

    this.formSubmitted = true;

    if (
      !this.disbursementType ||
      (this.recordDisbursement.id && (!this.clientDetail ||
      !this.matterDetail)) ||
      !this.recordDisbursement.dateOfService ||
      !this.recordDisbursement.billingNarrative ||
      (!this.recordDisbursement.note.content && !this.recordDisbursement.id) ||
      this.noteError ||
      this.changeNotesError ||
      this.billingNarrativeError ||
      !this.recordDisbursement.note.applicableDate ||
      (!this.recordDisbursement.hoursBilled &&
        this.recordDisbursement.disbursementType.billType.code == 'PER_UNIT')
    ) {
      return false;
    }

    if (
      this.fileDetails &&
      this.fileDetails.isExistError
    ) {
      const message = this.recordDisbursement.id
        ? 'Your security scan must pass before you can finish editing your disbursement.'
        : 'Your security scan must pass before you can finish adding your disbursement.';
      // this.toastr.showError(message);
      return;
    }

    if (this.createNoteError.hasError()) {
      return;
    }

    if (
      this.common &&
      this.recordDisbursement &&
      Object.keys(this.recordDisbursement).length
    ) {
      if (!this.clientDetail) {
        this.clientError = true;
      }

      if (!this.matterDetail) {
        this.matterError = true;
      }

      if (!this.clientDetail || !this.matterDetail) {
        return;
      }

      const clientName = this.clientDetail.isCompany
        ? this.clientDetail.companyName || this.clientDetail.company
        : this.clientDetail.lastName + ', ' + this.clientDetail.firstName;
      const matterName =
        this.matterDetail.matterNumber +
        ' - ' +
        (this.matterDetail.matterName || '');

      if (this.searchMatter.trim() != matterName.trim()) {
        this.incorrectMatter = true;
      }

      if (this.searchclient.trim() != clientName.trim()) {
        this.incorrectClient = true;
      }

      if (this.incorrectClient || this.incorrectMatter) {
        return;
      }
    }

    if (this.recordDisbursement.finalBilledAmount) {
      if (this.fileDetails) {
        this.fileDetails['displayCategories'] = [];
        this.fileDetails['folderId'] = this.folderDetails.id;
        this.commonService.docs.next([this.fileDetails]);
      }
      this._save();
    } else {
      return false;
    }
  }

  private _save() {
    this.recordDisbursement.finalBilledAmount = parseFloat(
      this.recordDisbursement.finalBilledAmount as any
    );

    if (this.recordDisbursement.rateAmount) {
      this.recordDisbursement.rateAmount = parseFloat(
        this.recordDisbursement.rateAmount as any
      );
    }

    if (this.recordDisbursement.hoursBilled) {
      this.recordDisbursement.hoursBilled = parseFloat(
        this.recordDisbursement.hoursBilled as any
      );
    }

    if (this.recordDisbursement.rateAmount) {
      this.recordDisbursement.rateAmount = +this.recordDisbursement.rateAmount;
    }
    if (this.recordDisbursement.finalBilledAmount) {
      this.recordDisbursement.finalBilledAmount = +this.recordDisbursement
        .finalBilledAmount;
    }
    if (this.recordDisbursement.fixedAmount) {
      this.recordDisbursement.fixedAmount = +this.recordDisbursement
        .fixedAmount;
    }

    if (this.recordDisbursement.note && !this.recordDisbursement.note.content) {
      this.recordDisbursement.note.name = '';
    } else {
      this.recordDisbursement.note.name = this.recordDisbursement.note.content.slice(
        0,
        100
      );
      this.recordDisbursement.applicableDate = this.recordDisbursement.note.applicableDate;
      this.recordDisbursement.isVisibleToClient = this.recordDisbursement.note.isVisibleToClient;
    }

    this.recordDisbursement.dateOfService =
      moment(this.recordDisbursement.dateOfService).format('YYYY-MM-DD') +
      'T00:00:00';

    if (
      this.common &&
      this.recordDisbursement &&
      Object.keys(this.recordDisbursement).length
    ) {
      this.recordDisbursement.person = this.clientDetail;
      this.recordDisbursement.matter = this.matterDetail;
    }
    if(this.recordDisbursement.disbursementType && this.recordDisbursement.disbursementType.customRate){
      this.recordDisbursement.disbursementType.customRate = +(this.recordDisbursement.disbursementType.customRate);
    }
    if (this.fileDetails) {
      this.displayWarningMsg = false;
      this.recordDisbursement.receiptFile = { id: +this.fileDetails.fileId };

      const disb = {
        ...this.recordDisbursement
      };

      if (
        this.isNegativeAmount &&
        disb.disbursementType.billType.code === 'OPEN'
      ) {
        disb.finalBilledAmount = disb.finalBilledAmount * -1;
      }

      this.modalService.close(disb);
    } else {
      if (
        this.displayWarningMsg ||
        (this.recordDisbursement &&
          this.recordDisbursement.receiptFile &&
          this.recordDisbursement.receiptFile.name)
      ) {
        const disb = {
          ...this.recordDisbursement
        };

        if (
          this.isNegativeAmount &&
          disb.disbursementType.billType.code === 'OPEN'
        ) {
          disb.finalBilledAmount = disb.finalBilledAmount * -1;
        }

        this.modalService.close(disb);
      } else {
        this.displayWarningMsg = true;
        this.recordDisbursement.finalBilledAmount = Number(
          this.recordDisbursement.finalBilledAmount
        ).toFixed(2) as any;
      }
    }
  }

  /**
   *
   * Function to remove image from preview
   */
  public removeImage() {
    if (this.fileDetails && this.fileDetails.fileId) {
      this.loading = true;
      this.dmsService
        .v1DmsFileDeleteIdDelete({ id: this.fileDetails.fileId })
        .subscribe(
          () => {
            this.selectFileFlag = false;
            this.fileDetails = null;
            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
    } else {
      this.selectFileFlag = false;
      this.fileDetails = null;
    }
    if (
      this.recordDisbursement &&
      this.recordDisbursement.receiptFile &&
      Object.keys(this.recordDisbursement.receiptFile).length
    ) {
      this.loading = true;
      this.dmsService
        .v1DmsFileDeleteIdDelete({ id: this.recordDisbursement.receiptFile.id })
        .subscribe(
          () => {
            this.selectFileFlag = false;
            this.fileDetails = null;
            this.recordDisbursement.receiptFile = {
              id: 0
            };
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
   * @param event
   * Function to configure selected files for upload
   */
  public selectedFile(event: any) {
    if (
      event &&
      event.target &&
      event.target.files &&
      event.target.files.length > 0
    ) {
      const fileObj = event.target.files[0];
      this.fileErrorMsg = '';

      if (this.bytesToSize(fileObj.size) > 500) {
        this.fileErrorMsg =
          'The file ' + fileObj.name + ' exceeds the maximum file size limit.';
        return;
      }

      const fileName = fileObj.name;
      const fileExtenson = fileName.split('.').pop();

      if (
        this.blockedExtension.some(ext => ext.extension === `.${fileExtenson}`)
      ) {
        this.fileErrorMsg = this.error_data.not_allowed_file_error;
        return;
      }

      if (
        this.allowedExtensions.every(
          ext => ext != `${fileExtenson}`.toLowerCase()
        )
      ) {
        this.fileErrorMsg = this.error_data.not_allowed_file_error;
        return;
      }

      this.displayWarningMsg = false;
      this.checkFileAndUpload(fileObj);
    }
  }

  async checkFileAndUpload(fileObj) {
    fileObj.originalFileName = fileObj.name;
    fileObj.isDraftingTemplate = false;
    fileObj.isFillableTemplate = false;
    fileObj.iseSignatureField = false;
    fileObj.nameOfFile = fileObj.name;
    fileObj.selectedAttArr = [];
    fileObj.isExistError = null;
    fileObj.isScanned = false;
    fileObj.isScanFailed = false;
    fileObj.isScanPassed = false;
    fileObj.fileId = null;
    fileObj.virusDetails = null;
    fileObj.currentDMSStatus = DMSFileStatus.SecurityScanInProgress;
    fileObj.dmsFileStatus = DMSFileStatus.VerifyFileName;
    this.fileDetails = fileObj;
    const params: IDocumentAction = {
      isCancel: false,
      isUpload: false,
      isScanOnly: false,
      isVerify: true
    };
    await this.uploadDocument(params);
  }

  async uploadDocument(actions: IDocumentAction) {
    if (actions.isUpload) {
      this.loading = true;
    }
    const item = this.fileDetails;
    item.isScanned = true;
    this.fileForm.setValue({
      file: actions.isScanOnly ? item : null
    });
    const param: any = {
      folderId: this.folderDetails.id,
      nameOfFile: item.nameOfFile,
      status: 'Active',
      isFillableTemplate: item.isFillableTemplate,
      isDraftingTemplate: item.isDraftingTemplate,
      ownerId: +this.currentUserInfo.id,
      body: this.fileForm.value,
      dmsFileStatus: actions.isCancel
        ? DMSFileStatus.UploadCancelled
        : actions.isVerify
        ? DMSFileStatus.VerifyFileName
        : actions.isScanOnly
        ? DMSFileStatus.SecurityScanInProgress
        : DMSFileStatus.UploadInProgress,
      actualFile: item,
      originalFileName: item.originalFileName,
      id: item.fileId ? item.fileId : null
    };

    // parameters for UploadFile function
    const { isUpload, isScanOnly, isCancel, isVerify } = actions;
    const documentActions: IDocumentUpload = {
      param,
      isCancel,
      isUpload,
      isScanOnly,
      isVerify
    };
    await this.uploadFile(documentActions);
  }

  async uploadFile(actions: IDocumentUpload) {
    if (actions.isUpload) {
      try {
        let resp: any = await this.documentPortalService
          .v1DocumentPortalSendDocumentPost(actions.param)
          .toPromise();
        resp = JSON.parse(resp);
        const status: string = resp.results.dmsFileStatus;
        this.fileDetails.currentDMSStatus = DMSFileStatus[status];
        if (
          resp &&
          resp.results &&
          resp.results.dmsFileStatus === 'UploadDone'
        ) {
          this.fileDetails.id = resp.results.id;

          this.loading = false;
        } else {
          this.loading = false;
        }
      } catch (err) {
        this.loading = false;
      }
    } else if(actions.isVerify) {// hits request for verification only, rest flow will be carried out by Doc Widget
      this.documentPortalService
        .v1DocumentPortalSendDocumentPost(actions.param)
        .subscribe(
          (resp: any) => {
            resp = JSON.parse(resp);
            const status: string = resp.results.dmsFileStatus;
            this.fileDetails.currentDMSStatus = DMSFileStatus[status];

            if (resp.results.dmsFileStatus !== 'VerifyFileNameFailed') {
              this.fileDetails.fileId = resp.results.id;
            }

            if (actions.isVerify) {
              // check if the verification is passed
              if (
                resp &&
                resp.results &&
                resp.results.dmsFileStatus === 'VerifyFileNamePassed'
              ) {
                // Hit scan doc request if verification is passed
                actions.param.dmsFileStatus =
                  DMSFileStatus.SecurityScanInProgress;
                actions.param.body = { file: actions.param.actualFile };
                actions.isVerify = false;
                actions.param.id = resp.results.id;
                this.fileDetails.isScanPassed = true;
                return;
              } else {
                this.fileDetails.isExistError = this.error_data.folder_contain_doc_error; //  to show the error
                this.fileDetails.isScanFailed = true; // to show Red badge
                if (this.fileDetails.isScanPassed) {
                  // if verfication gets failed after scan passed
                  this.fileDetails.isScanPassed = false;
                }
              }
              this.loading = false;
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
   * @param bytes
   * Function to check and format file size
   */
  public bytesToSize(bytes) {
    const size = bytes / Math.pow(1024, 2); // size in new units
    // keep up to 2 decimals
    return Math.round(size * 100) / 100;
  }

  public blurAmount() {
    if (!this.recordDisbursement.finalBilledAmount) {
      this.recordDisbursement.finalBilledAmount = null;
      this.amountPrefix = '$';
      this.isNegativeAmount = false;
    }

    if (
      (this.recordDisbursement.finalBilledAmount as any) == '-' ||
      (this.recordDisbursement.finalBilledAmount as any) == ''
    ) {
      this.recordDisbursement.finalBilledAmount = null;
      this.amountPrefix = '$';
      this.isNegativeAmount = false;
    }
    this.recordDisbursement.finalBilledAmount = Number(
      this.recordDisbursement.finalBilledAmount
    ).toFixed(2) as any;
  }

  public amountKeyDown(e) {
    const key = e.key;
    if (key === 'Backspace') {
      if (
        !this.recordDisbursement.finalBilledAmount ||
        String(this.recordDisbursement.finalBilledAmount).length == 0 ||
        (this.recordDisbursement.finalBilledAmount as any) == '0.00'
      ) {
        if (this.isNegativeAmount) {
          this.amountPrefix = '-$';
          this.isNegativeAmount = false;
        } else {
          this.amountPrefix = '$';
        }
      }

      if (
        (this.recordDisbursement.finalBilledAmount as any) === '-' ||
        (this.recordDisbursement.finalBilledAmount as any) === '' ||
        (this.recordDisbursement.finalBilledAmount as any) === '0.00'
      ) {
        this.recordDisbursement.finalBilledAmount = null;
      }
    }
  }

  public amountKeyPress(e) {
    if (
      !this.recordDisbursement.finalBilledAmount ||
      String(this.recordDisbursement.finalBilledAmount).length == 0 ||
      (this.recordDisbursement.finalBilledAmount as any) === '0.00'
    ) {
      if (e.keyCode == 45) {
        this.amountPrefix = '-$';
        this.allowNegative = false;
        this.isNegativeAmount = true;
        if (this.recordDisbursement.finalBilledAmount) {
          this.recordDisbursement.finalBilledAmount = Math.abs(
            this.recordDisbursement.finalBilledAmount
          );
        }
      } else {
        this.amountPrefix = '$';
        this.allowNegative = true;
      }
    }

    if (this.isNegativeAmount) {
      this.amountPrefix = '-$';
    } else {
      this.amountPrefix = '$';
    }
  }

  uploadButtonTextChange() {
    if (this.recordDisbursement.isVendorPaid) {
      this.uploadButtonText = ' Upload Receipt';
    } else {
      this.uploadButtonText = 'Upload Invoice';
    }
  }

  /**
   * change event of vendor was pain or not.
   */
  onChangeVendor(value) {
    if (value === 'true') {
      this.uploadButtonText = 'Upload Receipt';
    } else {
      this.uploadButtonText = 'Upload Invoice';
    }
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || +k == 8 || +k == 9 || +k == 45;
  }

  public updateClientFilter(event, type) {
    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowRight' ||
      event.code === 'ArrowLeft'
    ) {
      return;
    }
    let val = event.target.value;
    val = val || '';
    val = val.trim();

    if (val && val !== '' && val.length > 2) {
      if (this.clientSubscribe) {
        this.clientSubscribe.unsubscribe();
      }
      this.isSearchLoading = true;
      this.clientSubscribe = this.clockService
        .v1ClockClientsSearchusingindexGet({ search: val })
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            this.originalClientList = list;
            this.addoverhead('client', val, list);
            if (list && list.length > 0) {
              list.map(obj => {
                obj.preferredPhone = obj.preferredPhone
                  ? '(' +
                    obj.preferredPhone.substr(0, 3) +
                    ') ' +
                    obj.preferredPhone.substr(3, 3) +
                    '-' +
                    obj.preferredPhone.substr(6, 4)
                  : '-';
              });
            }
            if (list.length) {
              this.clientListPopUp = _.orderBy(
                list,
                ['lastName', 'firstName'],
                ['asc']
              );
            }
            this.isSearchLoading = false;
          },
          err => {
            this.isSearchLoading = false;
          }
        );
    } else {
      this.clientDetail = null;
      this.clientListPopUp = [];
      this.isSearchLoading = false;
    }
  }

  private addoverhead(type: string, value: string, arr) {
    const v = value ? value.toLowerCase() : '';
    if (type === 'client') {
      if ('overhead'.match(v)) {
        return arr.push({ id: 0, lastName: 'Overhead' });
      }
    } else {
      if ('overhead'.match(v)) {
        return arr.push({ id: 0, matterName: 'Overhead' });
      }
    }
  }

  setClientList() {
    this.clientListPopUp = this.originalClientList;
  }
  clearDropDown(actionOn: string) {
    switch (actionOn) {
      case 'clientListPopUp': {
        this.clientListPopUp = [];
        break;
      }

      case 'matterListPopUp': {
        this.matterListPopUp = [];
        break;
      }
    }
  }
  public selectClient(item, isMatterPresent = false) {
    this.clientError = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    this.searchclient = item.isCompany
      ? item.companyName || item.company
      : !item.firstName
      ? item.lastName
      : item.lastName + ', ' + item.firstName;
    this.clientDetail = item;
    this.clientListPopUp = [];
    this.searchMatter = null;
    this.matterDetail = null;
    this.incorrectClient = false;
    this.incorrectMatter = false;

    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = null;
      this.disbursementTypeDetail = null;
      this.selectMatter({ id: 0, matterName: 'Overhead' });
    } else {
      if (!isMatterPresent) {
        this.disabledMatter = false;
        this.matterBasedOnClients({ clientId: item.id });
      }
    }
  }

  public selectMatter(item: any) {
    this.matterError = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    if (item.client != null) {
      this.searchclient = item.client.isCompany
        ? item.client.companyName
        : item.client.lastName + ', ' + item.client.firstName;
      this.clientDetail = item.client;
      this.incorrectClient = false;
    }
    this.searchMatter =
      item.id === 0
        ? item.matterName
        : item.matterNumber + ' - ' + (item.matterName || '');
    this.matterDetail = item;
    this.matterListPopUp = [];
    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = ' ';
      this.disbursementTypeDetail = null;
      this.searchclient = 'Overhead';
      this.clientDetail = { id: 0, lastName: 'Overhead' };
      this.incorrectClient = false;
    } else {
      this.disabledMatter = false;
      this.getDisbursement(item);
    }
  }

  public getDisbursement(item) {
    this.billingService
      .v1BillingDisbursementTypeMatterMatterIdGet({ matterId: item.id })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        let result = [];
        if (this.recordDisbursement.id) {
          result = res.filter(
            a =>
              a.status === 'Active' ||
              a.id == this.recordDisbursement.disbursementType.id
          );
        } else {
          result = res.filter(a => a.status === 'Active');
        }
        this.disbursementType = null;
        this._disbursementTypes = [...result];
        this.disbursementTypes = result.map(a => {
          return {
            id: a.id,
            name: `${a.code} - ${a.description}`
          } as vwIdCodeName;
        });
      });
  }

  public async matterBasedOnClients(clientId: any) {
    let resp: any;
    try {
      resp = await this.matterService
        .v1MatterClientClientIdGet(clientId)
        .toPromise();
      if (resp != null) {
        this.matterListPopUp = [...(JSON.parse(resp).results as Array<any>)];
        this.originalMatterList = this.matterListPopUp;
        this.loading = false;
      }
    } catch (error) {
      this.loading = false;
    }
  }

  setMatterList() {
    this.matterListPopUp = this.originalMatterList;
  }

  public actionDropDown() {
    if (this.loading) {
      return;
    }
    if (this.clientListPopUp.length) {
      this.selectClient(this.clientListPopUp[0]);
      this.clientListPopUp = [];
      this.clientSubscribe.unsubscribe();
    }
    if (this.matterListPopUp.length) {
      this.selectMatter(this.matterListPopUp[0]);
      this.matterListPopUp = [];
      if (this.matterSubscribe != null) {
        this.matterSubscribe.unsubscribe();
      }
    }
  }
  public updateMatterFilter(event, type) {
    let val = event.target.value;
    val = val || '';
    val = val.trim();

    if (val !== '') {
      if (this.matterSubscribe) {
        this.matterSubscribe.unsubscribe();
      }
      let param = {};
      if (this.clientDetail !== null && type === '2') {
        param = { search: val, clientId: +this.clientDetail.id };
      } else {
        param = { search: val };
      }
      this.isMatterSearchLoading = true;
      this.matterSubscribe = this.clockService
        .v1ClockMattersSearchGet(param)
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            const newList = [];
            list.forEach(matter => {
              const matterName = (matter.matterName || '').trim();
              matter.matterName = matterName;
              newList.push(matter);
            });
            const sortedList = newList.sort((a, b) =>
              a.matterName.localeCompare(b.matterName)
            );
            this.originalMatterList = sortedList;
            this.addoverhead('matter', val, list);
            this.matterListPopUp = list;
            this.isMatterSearchLoading = false;
          },
          err => {
            this.isMatterSearchLoading = false;
          }
        );
    } else {
      this.matterDetail = null;
      this.matterListPopUp = [];
      this.isMatterSearchLoading = false;
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  /**
   * Function to copy Billing Narative to Notes
   */
  public copytoNote() {
    if (!this.recordDisbursement.note.content) {
      this.recordDisbursement.note.content = this.recordDisbursement.billingNarrative;
    }
  }
}
