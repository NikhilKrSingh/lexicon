import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import * as _ from 'lodash';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { CommonService } from 'src/app/service/common.service';
import { ContactsService, DmsService, DocumentPortalService, DocumentSettingService } from 'src/common/swagger-providers/services';
import * as errorData from '../../modules/shared/error.json';
import * as messages from '../../modules/shared/error.json';
import { UtilsHelper } from '../../modules/shared/utils.helper';

interface IDocumentAction {
  isCancel: boolean;
  isUpload: boolean;
  isScanOnly: boolean;
  isRemoveFailed?: boolean;
  isRetryFailed?: boolean;
  isCancelAll?: boolean;
}

interface IDocumentUpload {
  param: any;
  isCancel?: boolean;
  isUpload?: boolean;
  isScanOnly?: boolean;
  lastIteration?: boolean;
  index?: number;
  isRemoveFailed?: boolean;
}

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

@Component({
  selector: 'app-upload-progress-panel',
  templateUrl: './upload-progress-panel.component.html',
  encapsulation: ViewEncapsulation.Emulated
})

export class UploadProgressPenalComponent implements OnInit, OnDestroy {
  @Output() readonly closePenal = new EventEmitter();
  isOpen = true;
  fileArray = [];

  offlineEvent: Observable<Event>;
  onlineEvent: Observable<Event>;

  public errorData: any = (errorData as any).default;
  public extensionsArray: Array<any> = UtilsHelper.getDocExtensions();
  public currentUserInfo: any;
  currentActive = null;
  docsSubs: Subscription;
  public fileForm = this.formBuilder.group({
    file: new FormControl(File)
  });

  public displayCategories: Array<any> = [];

  private subscriptionArray: Array<any> = [];
  private eventSubscriptionArray: Array<any> = [];

  public isOffline: boolean = false;
  
  constructor(
    private dialogService: DialogService,
    public commonService: CommonService,
    public sharedService: SharedService,
    private router: Router,
    private portalService: DocumentPortalService,
    private formBuilder: FormBuilder,
    private toastr: ToastDisplay,
    private documentPortal: DocumentPortalService,
    private dmsService: DmsService,
    private contactsService: ContactsService,
    private documentSettingService: DocumentSettingService
  ) { }

  ngOnInit() {
    this.offlineEvent = fromEvent(window, 'offline');
    this.onlineEvent = fromEvent(window, 'online');
    this.currentUserInfo = JSON.parse(localStorage.getItem('profile'));
    this.docsSubs = this.commonService.docs.subscribe(val => {
      if (Array.isArray(val) && val.length) {
        if (!this.isOpen) {
          this.isOpen = true;
        }
        val.forEach(element => {
          element.isScanPassed = element.isScanned = false;
        });
        this.fileArray = this.fileArray.concat(val);
        const data: IDocumentAction = {
          isCancel: false,
          isScanOnly: true,
          isUpload: false
        };
        this.prepDataForScan(data);
        if(this.fileArray.some(x => x.isClientDoc)){
          this.prepareScanningClientRetentiondocParams();
        }
      }
    });
    this.eventSubscriptionArray.push(this.offlineEvent.subscribe(() => {
      this.isOffline = true;
      this.subscriptionArray.forEach(subscription => {
        if (subscription) {
          subscription.unsubscribe();
        }
      });
      this.fileArray.forEach(file => {
        if (!file.isUploaded) {
          file.isScanFailed = true;
        }
      });
    }));

    this.eventSubscriptionArray.push(this.onlineEvent.subscribe(() => {
      setTimeout(() => {
        this.isOffline = false;
        this.remove_retryFailedFiles('retry');
        this.commonService.isDMSInetConnection.next(true);
      }, 3000);
    }));
  }

  ngOnDestroy() {
    if (this.docsSubs) {
      this.docsSubs.unsubscribe();
    }
    this.eventSubscriptionArray.forEach(subscription => subscription.unsubscribe());
    this.commonService.isDmsRefresh.next(null);
  }

  @HostListener('window:beforeunload') confirmCancellation() {
    const status = this.getHeaderMsgTrue;
    return (status !== 1) ? false : true;
  }
  /**
   * Function to cancel all the upload/uploading files
   */
  cancelAllUpload() {
    const data: IDocumentAction = {
      isCancel: true,
      isUpload: false,
      isScanOnly: false,
      isCancelAll: true
    };
    this.prepDataForScan(data);
  }
  
  /**
   * Function to redirect user to the documents parent folder location
   * @param row 
   */
  goToDMS(row) {
    const navigationExtras: NavigationExtras = {
      state: {
        docPath: row.folderId
      }
    };
    if (this.router.url.includes('/manage-folders')) {
      this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      this.router.onSameUrlNavigation = 'reload';
    }
    this.router.navigate(['/manage-folders'], navigationExtras);
  }

  /**
   * Function to prepare the params for API request, based on the actions(retry, cancel, scan, upload) 
   * @param actions 
   */
  prepDataForScan(actions: IDocumentAction) {
    for (const key in this.fileArray) {
      const index = parseInt(key, 10);
      const item: any = this.fileArray[key];
      
      let lastIteration = false;
      const arrLength = this.fileArray.length;

      if (index === arrLength - 1) {
        lastIteration = true;
      }
      //condistion (isHidden)
      if(item.isHidden){
        continue;
      }

      // conditions(Cancel ALL, RetryFailed, RemoveFailed)

      if(item.isReplaceFile && !actions.isRetryFailed){
        if((actions.isCancelAll || (actions.isRemoveFailed && item.isScanFailed)) && !actions.isScanOnly){
          if(this.subscriptionArray[index]){
            this.subscriptionArray[index].unsubscribe();
          }
          let params = _.cloneDeep(item);
          params.body.file = null;
          this.uploadReplaceFile(item, index, false, false);
        } else if(actions.isScanOnly){
          this.uploadReplaceFile(item, index, true, false);
        }
        continue;
      }
      if(item.isClientDoc && !actions.isRetryFailed){
        //to check if the document is not from Client Retention
        if(actions.isCancelAll || (actions.isRemoveFailed && item.isScanFailed)){
          item.isHidden = true;
          if(this.subscriptionArray[index]){
            this.subscriptionArray[index].unsubscribe();
          }
          this.closeUploadPenal();
        }
        continue;
      }

      if(item.isClientDoc && actions.isRetryFailed){
        //If the request is for Retry all failed docs and the doc is from Client retention, hit other API request
        let params = this.getParamsForDocs(item, true);
        this.sendClientRetentionForScan(params, index);
        continue;
      }

      if ((actions.isRemoveFailed || actions.isRetryFailed) && !item.isScanFailed ) {
        // as remove failed or retry failed is only for scan failed files
        continue;
      }
      /**
       * If we already have fileArray and we select more files to upload, continue for previous files
       */
      if (actions.isScanOnly && (item.isScanFailed || item.isScanPassed || item.isExistError) && !(actions.isRemoveFailed || actions.isRetryFailed)) {
        continue;
      }

      if (actions.isRetryFailed) {
        item.isScanFailed = false;
        item.isExistError = null;
        item.isScanned = false;
      }
      if(item.isClientDoc && actions.isRetryFailed){
        //If the request is for Retry all failed docs and the doc is from Client retention, hit other API request
        let params = this.getParamsForDocs(item, true);
        this.sendClientRetentionForScan(params, index);
        continue;
    }

      if(item.isReplaceFile && actions.isRetryFailed){
        if(item.isScanFailed && !item.isHidden){
          this.uploadReplaceFile(item, index, true, false);//Retry scan
        }
        continue;
      }

      if (actions.isCancelAll && item.isHidden) {
        // cancel all those files that are currently available in the panel
        continue;
      }

      item.isScanned = true;

      const file = item.isAdminSettingRelpaceFile ? item.actualFile : item;
      this.fileForm.setValue({
        file: actions.isScanOnly ? file : null
      });
      let param: any;
      if(item.isAdminSettingsFile){
        param = {
          folderId: item.folderId,
          fileName: item.nameOfFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          body: this.fileForm.value,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: actions.isScanOnly ? DMSFileStatus.SecurityScanInProgress : actions.isUpload ? DMSFileStatus.UploadInProgress : DMSFileStatus.UploadCancelled,
          actualFile: file,
          originalFileName: item.originalFileName,
          id: item.fileId ? item.fileId : null
        };
      } else if (item.isAdminSettingRelpaceFile) {
        param = {
          id: item.id,
          folderId: item.folderId,
          status: 'Active',
          nameOfFile: item.nameOfFile,
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          containsESignatureFields: item.containsESignatureFields,
          originalFileName : item.originalFileName,
          dmsFileStatus: actions.isScanOnly ? DMSFileStatus.SecurityScanInProgress : actions.isUpload ? DMSFileStatus.UploadInProgress : DMSFileStatus.UploadCancelled,
          body: this.fileForm.value,
          OwnerId: item.OwnerId
        }
      } else {
        param = {
          folderId: item.folderId,
          nameOfFile: item.nameOfFile,
          status: (!item.isFromDmsPortal) ? 'Active' : 'Client Pending Review',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          commaCategories: (!item.isFromDmsPortal) ? this.getAllCategories(item) : null,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: actions.isScanOnly ? DMSFileStatus.SecurityScanInProgress : actions.isUpload ? DMSFileStatus.UploadInProgress : DMSFileStatus.UploadCancelled,
          actualFile: file,
          coOwnerId: item.coOwnerId ? item.coOwnerId : null,
          originalFileName: item.originalFileName,
          id: item.fileId ? item.fileId : null,
          isFromDmsPortal: (item.isFromDmsPortal) ? true : false
        };
      }

      const action: IDocumentUpload = {
        param,
        lastIteration,
        index,
        isCancel: actions.isCancel,
        isUpload: actions.isUpload,
        isScanOnly: actions.isScanOnly,
        isRemoveFailed: actions.isRemoveFailed ? true : false
      };
      this.sendFilesForScan(action);
    }
  }

  /**
   * Function to hit API request of DMS files for scan, cancel, upload based on the actions
   * @param actions 
   */
  sendFilesForScan(actions: any) {
    if (actions.isCancel && this.subscriptionArray[actions.index]) {
      this.subscriptionArray[actions.index].unsubscribe();
    }
    let url: any;
    if(this.fileArray[actions.index].isAdminSettingsFile){
      url = this.documentSettingService.v1DocumentSettingDocumentUploadPost(actions.param);
    } else if(this.fileArray[actions.index].isAdminSettingRelpaceFile) {
      url = this.dmsService.v1DmsPracticeAreaFileReplacePost(actions.param);
    } else {
      url = this.portalService.v1DocumentPortalSendDocumentPost(actions.param);
    }
    this.subscriptionArray[actions.index] = url.subscribe((resp: any) => {
      resp = JSON.parse(resp);
      const status: string = resp.results.dmsFileStatus;
      this.fileArray[actions.index].currentDmsStatus = DMSFileStatus[status];
      if (actions.isScanOnly) {
        this.fileArray[actions.index].isScanPassed = (status === 'SecurityScanPassed') ? true : false;
        this.fileArray[actions.index].isScanFailed = (status === 'SecurityScanPassed' || status === 'SecurityScanInProgress') ? false : true;
        this.fileArray[actions.index].virusDetails = (status === 'SecurityScanFailedVirus') ? resp.results.dmsFileStatusDetails : null;
        if (resp.results.dmsFileStatus === 'SecurityScanPassed') {
          actions.param.dmsFileStatus = DMSFileStatus.UploadInProgress;
          actions.param.body = { file: null };
          actions.isScanOnly = false;
          actions.isUpload = true;
          this.sendFilesForScan(actions);
        }
      }
      if (actions.isCancel) {
        if (resp.results.dmsFileStatus === 'UploadCancelled') {
          this.fileArray[actions.index].isHidden = true;
        }
        if (resp.results.dmsFileStatus === 'UploadCancelled' && actions.lastIteration && !actions.isRemoveFailed) {
          this.fileArray = [];
        }
        this.closeUploadPenal();
      }
      if (resp && resp.results && resp.results.dmsFileStatus === 'UploadDone' && actions.isUpload) {
        (this.fileArray[actions.index] as any).isUploaded = true;
        this.subscriptionArray[actions.index].unsubscribe();
        this.subscriptionArray[actions.index] = null;
        this.sendRefreshRequest(this.fileArray[actions.index]);
      }
    }, err => {

    });
  }

  /**
   * Function to remove the individual file from Widget
   * @param index 
   * @param isRetry 
   */
  async removeImage(index: number, isRetry?: boolean) {
    if (this.isOffline) {
      this.toastr.showError(this.errorData.connection_error);
      return;
    }
    let resp: any;
    const item = this.fileArray[index];
    const isFailedFile = item.isScanFailed;
    if (!isRetry && !item.isUploaded && !isFailedFile) {
      resp = await this.dialogService.confirm(
        messages.cancel_upload_warn,
        'Continue Upload',
        'Cancel Upload',
        'Cancel Upload?',
        true,
        '',
        true,
        null,
        true
      );
    }
    if (!resp || isRetry || isFailedFile) {
      if (this.subscriptionArray[index]) {
        // If the scan is in progress and user selects to remove the document
        this.subscriptionArray[index].unsubscribe();
      }
      if (this.fileArray[index].isUploaded) {
        this.fileArray[index].isHidden = true;
        if (this.fileArray.every(x => x.isHidden)) {
          this.closeUploadPenal();
        }
        return;
      }

      // If there was any error
      this.fileArray[index].isExistError = null;

      // To track scan/unscan files
      this.fileArray[index].isScanned = false;
      this.fileArray[index].isScanFailed = false;

      // remove the error
      if (this.fileArray[index].isScanPassed) {
        // If scan passed document gets it name changed
        this.fileArray[index].isScanPassed = false;
      }
      const file = item.isAdminSettingRelpaceFile ? item.actualFile : item;
      this.fileForm.setValue({
        file: isRetry ? file : null
      });
      let param: any;
      if(item.isAdminSettingsFile){
        param = {
          folderId: item.folderId,
          fileName: item.nameOfFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          body: this.fileForm.value,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: (isRetry) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadCancelled,
          actualFile: item,
          originalFileName: item.originalFileName,
          id: item.fileId ? item.fileId : null
        };
      } else if (item.isAdminSettingRelpaceFile) {
        param = {
          id: item.id,
          folderId: item.folderId,
          status: 'Active',
          nameOfFile: item.nameOfFile,
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          containsESignatureFields: item.containsESignatureFields,
          originalFileName : item.originalFileName,
          dmsFileStatus: (isRetry) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadCancelled,
          body: this.fileForm.value,
          OwnerId: item.OwnerId
        }
      } else {
        param = {
          folderId: item.folderId,
          nameOfFile: item.nameOfFile,
          status: (!item.isFromDmsPortal) ? 'Active' : 'Client Pending Review',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          commaCategories: (!item.isFromDmsPortal) ? this.getAllCategories(item) : null,
          dmsFileStatus: (isRetry) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadCancelled,
          actualFile: item,
          coOwnerId: item.coOwnerId ? item.coOwnerId : null,
          originalFileName: file.name,
          id: item.fileId ? item.fileId : null,
          isFromDmsPortal: (item.isFromDmsPortal) ? true : false
        };
      }
      
      const actions: IDocumentUpload = {
        isCancel: (isRetry) ? false : true,
        isUpload: false,
        isScanOnly: (isRetry) ? true : false,
        index,
        param
      };
      await this.sendFilesForScan(actions);
      if (!isRetry) {
        (this.fileArray[index] as any).isHidden = true;
      }
    }

  }

  /**
   * 
   * @param type Function to set actions for Bulk retry or remove files
   */
  remove_retryFailedFiles(type: string) {
    if (this.isOffline) {
      this.toastr.showError(this.errorData.connection_error);
      return;
    }
    const action: IDocumentAction = {
      isUpload: false,
      isCancel: false,
      isScanOnly: false
    };
    switch (type) {
      case 'retry':
        action.isRetryFailed = true;
        action.isScanOnly = true;
        break;
      case 'remove':
        action.isRemoveFailed = true;
        action.isCancel = true;
        break;
    }
    this.prepDataForScan(action);
  }

  /**
   * Function to get categories as array for Files
   * @param item 
   */
  getAllCategories(item) {
    const categories = [];
    let CommaCategories = null;
    item.displayCategories.forEach(ele => {
      categories.push(ele.id);
    });
    if (categories.length) {
      CommaCategories = categories.join(',');
    }
    return CommaCategories;
  }

  /**
   * Function to get the number of files that are currently in progress with upload and are not failed.
   */
  getDocUploadLength() {
    return (this.fileArray.filter((item: any) => !item.isUploaded && !item.isScanFailed && !item.isHidden)).length;
  }

  /**
   * Function to check/getLength of the failed files in widget
   * @param isLength 
   */
  get getFailedFilesStatus() {
    const length = (this.fileArray.filter(item => item.isScanFailed && !item.isHidden)).length;
    return length;
  }


  /**
   * Function to get the header message Of widget
   * @param isStatus 
   */
  get getHeaderMsgTrue() {
    let mess = '';
    let status: any;
    let isStatus = true;
    const failedLength = (this.fileArray.filter(item => item.isScanFailed && !item.isHidden)).length;
    const uploadLength = (this.fileArray.filter(item => item.isUploaded && !item.isHidden)).length;
    const originalLength = (this.fileArray.filter(item => !item.isHidden)).length;
    if (uploadLength === originalLength) {
      // All done
      status = 1;
      mess = 'Upload Complete';
    } else if (
      failedLength &&
      (failedLength + uploadLength) === originalLength
    ) {
      // Done with failed files
      status = 2;
      mess = `Upload complete (${this.getFailedFilesStatus} documents failed)`;
    } else {
      status = 3; // In queue
      mess = `Uploading ${this.getDocUploadLength()} documents`;
    }
    return (isStatus) ? status : mess;
  }

  get getHeaderMsgFalse() {
    let mess = '';
    let status: any;
    let isStatus;
    const failedLength = (this.fileArray.filter(item => item.isScanFailed && !item.isHidden)).length;
    const uploadLength = (this.fileArray.filter(item => item.isUploaded && !item.isHidden)).length;
    const originalLength = (this.fileArray.filter(item => !item.isHidden)).length;
    if (uploadLength === originalLength) {
      // All done
      status = 1;
      mess = 'Upload Complete';
    } else if (
      failedLength &&
      (failedLength + uploadLength) === originalLength
    ) {
      // Done with failed files
      status = 2;
      mess = `Upload complete (${this.getFailedFilesStatus} documents failed)`;
    } else {
      status = 3; // In queue
      mess = `Uploading ${this.getDocUploadLength()} documents`;
    }
    return (isStatus) ? status : mess;
  }


  /**
   * Function to handle closePanel functionality
   * @param forceClose 
   */
  closeUploadPenal(forceClose?: boolean) {
    if (!this.fileArray.length || this.fileArray.every(item => item.isHidden) || this.fileArray.every(item => item.isUploaded) || forceClose) {
      this.fileArray = [];
      this.closePenal.emit();
    }

    if (localStorage.getItem('isLogoutOutRequest')) {
      localStorage.removeItem('isLogoutOutRequest');
      this.closePenal.emit();
      this.sharedService.logoutUser();
      this.commonService.isLogOutRequest.next(false);
    }
  }

  /**
   * Called when user cicks on cross-icon of widget
   */
  async crossClickPenal() {
    const status = this.getHeaderMsgTrue;
    if (status === 1) {
      this.closeUploadPenal(true);
    } else if (status === 2) {
      const resp: any = await this.dialogService.confirm(
        messages.cancel_failed_document_exist_warn,
        'Yes, clear document queue',
        'No',
        messages.cancel_failed_document_exist,
        true,
        '',
        true,
        null,
        true
      );
      if (resp) {
        this.removeFailedandClosePanel();
      } else {
        this.clearLogoutRequestObs();
      }
    } else {
      const resp: any = await this.dialogService.confirm(
        messages.cancel_upload_warn,
        'Continue Upload',
        'Cancel Upload',
        'Cancel Upload?',
        true,
        '',
        true,
        null,
        true
      );
      if (!resp) {
        this.cancelAllUpload();
      } else {
        this.clearLogoutRequestObs();
      }
    }
  }

  
  async removeFailedandClosePanel() {
    const totalFailedFile = this.getFailedFilesStatus;
    let failedFilesCancelled = 0;
    for (const key in this.fileArray) {
      const index = parseInt(key, 10);
      const item = this.fileArray[key];

      let lastIteration = false;
      const arrLength = this.fileArray.length;

      if (index === arrLength - 1) {
        lastIteration = true;
      }
      if (!item.isScanFailed || item.isHidden) {
        continue;
      }

      if(item.isClientDoc){
        failedFilesCancelled += 1;
        continue;
      }

      this.fileForm.setValue({
        file: null
      });
      let param: any;
      if(item.isAdminSettingsFile){
        param = {
          folderId: item.folderId,
          fileName: item.nameOfFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          body: this.fileForm.value,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: DMSFileStatus.UploadCancelled,
          actualFile: item,
          originalFileName: item.originalFileName,
          id: item.fileId ? item.fileId : null
        };
      } else if (item.isAdminSettingRelpaceFile) {
        param = {
          id: item.id,
          folderId: item.folderId,
          status: 'Active',
          nameOfFile: item.nameOfFile,
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          containsESignatureFields: item.containsESignatureFields,
          originalFileName : item.originalFileName,
          dmsFileStatus: DMSFileStatus.UploadCancelled,
          body: this.fileForm.value,
          OwnerId: item.OwnerId
        }
      } else {
        param = {
          folderId: item.folderId,
          nameOfFile: item.nameOfFile,
          status: (!item.isFromDmsPortal) ? 'Active' : 'Client Pending Review',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          commaCategories: (!item.isFromDmsPortal) ? this.getAllCategories(item) : null,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: DMSFileStatus.UploadCancelled,
          actualFile: item,
          coOwnerId: item.coOwnerId ? item.coOwnerId : null,
          originalFileName: item.originalFileName,
          id: item.fileId ? item.fileId : null,
          isFromDmsPortal: (item.isFromDmsPortal) ? true : false
        };
      }
      

      let resp: any;
      if(this.fileArray[index].isAdminSettingsFile){
        resp = this.documentSettingService.v1DocumentSettingDocumentUploadPost(param).toPromise()
      } else if(this.fileArray[index].isAdminSettingRelpaceFile) {
        resp = this.dmsService.v1DmsPracticeAreaFileReplacePost(param);
      } else {
        resp = this.portalService.v1DocumentPortalSendDocumentPost(param).toPromise()
      }
      resp = JSON.parse(resp);
      if (resp.results.dmsFileStatus === 'UploadCancelled') {
        failedFilesCancelled += 1;
      }
    }
    if (failedFilesCancelled === totalFailedFile) {
      this.closeUploadPenal(true);
    }
  }

  openMenu(index: number): void {
    this.currentActive = this.currentActive !== index ? index : null;
  }

  /*** closed menu on body click */
  onClickedOutside(index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  clearLogoutRequestObs() {
    if (localStorage.getItem('isLogoutOutRequest')) {
      this.commonService.isLogOutRequest.next(false);
      localStorage.removeItem('isLogoutOutRequest');
    }
  }

  sendRefreshRequest(file){
    let data = {
      type:(file.isAdminSettingsFile || file.isAdminSettingRelpaceFile) ? 'matterfolder' : 'dms',
      folderId:file.folderId
    }
    this.commonService.isDmsRefresh.next(data);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }



  //Client Retentions Functions

  prepareScanningClientRetentiondocParams() {
    let files = this.fileArray.filter(x => x.isClientDoc);
    for(const index in this.fileArray){
      let obj = this.fileArray[index];
      if(!obj.isClientDoc){
        continue;
      }
      let params = this.getParamsForDocs(obj, true);
      this.sendClientRetentionForScan(params, index);
    }
  }

  sendClientRetentionForScan(params, index){
    this.subscriptionArray[index] = this.documentPortal.v1DocumentPortalScanClientOrMatterFilesPost(params).subscribe((res: any) => {
    res = JSON.parse(res as any).results;
      this.fileArray[index].uniqueFileName = res.uniqueFileName;
      this.fileArray[index].isScanPassed = (res.dmsFileStatus === 'SecurityScanPassed');
      this.fileArray[index].isScanFailed = (!(res.dmsFileStatus === 'SecurityScanPassed' || res.dmsFileStatus === 'SecurityScanInProgress'));
      this.fileArray[index].virusDetails = (res.dmsFileStatus === 'SecurityScanFailedVirus') ? res.dmsFileStatusDetails : null;
      if(res.dmsFileStatus == 'SecurityScanPassed'){
        let uploadparams = this.getParamsForDocs(this.fileArray[index], false);
        this.uploadSingleDoc(uploadparams, index);
      }
    },err => {

    });
  }

  uploadSingleDoc(params, index) {
    let obj = this.fileArray[index];
    let uploadDocuments = [params];
    let data = {
      matterDetailsId: obj.matterDetailsId,
      personId: obj.personId,
      uploadDocuments
    }
    this.subscriptionArray[index] = this.contactsService.v1ContactsCreateDmsFoldersForNewClientWizardPost$Json({ body: data}).subscribe((res: any) => {
      res = JSON.parse(res as any).results;
      if(res){
        this.fileArray[index].isUploaded = true;
      }
    }, err => {

    })
  }

  getParamsForDocs(item?: any, forScan: boolean = false, isReplaceFile?): any{
    const fileExtenson = this.sharedService.getFileExtension(item.name);
    let params: any;
    if(isReplaceFile){

    } else {
      if(forScan){
        params = {
          documentName: `${item.DocumentName}.${fileExtenson}`,
          status: item.status,
          body: {
            file: item
          },
          dmsFileStatus: DMSFileStatus.SecurityScanInProgress,
          originalFileName: item.originalFileName
        };
        
      } else {
        let matterDetails: any = item.matterDetails;
        params = {
          documentName: `${item.DocumentName}.${fileExtenson}`,
          status: item.status,
          body: {
            file: null
          },
          originalFileName: item.originalFileName,
          folderName: (matterDetails.matterNumber == item.folderId) ? null : item.folderName,
          isDraftingTemplate: item.isDraftingTemplate,
          isFillableTemplate: item.isFillableTemplate,
          ownerId: this.currentUserInfo.id,
          dmsFileStatus: DMSFileStatus.UploadInProgress,
          uniqueFileName: item.uniqueFileName,
          isMatterFolder: (matterDetails.matterNumber == item.folderId) ? true : false,
          isClientFolder: false
        };
      }
    }
    return params;
  }

  async removeClientFile(index: number){
    if(this.isOffline){
      this.toastr.showError(this.errorData.connection_error);
      return;
    }
    if(this.fileArray[index].isUploaded){
      this.fileArray[index].isHidden = true;
      if(this.fileArray.every(x => x.isHidden)){
        this.closeUploadPenal();
      }
    } else {
      const resp: any = await this.dialogService.confirm(
        messages.cancel_upload_warn,
        'Continue Upload',
        'Cancel Upload',
        'Cancel Upload?',
        true,
        '',
        true,
        null,
        true
      );
      if(!resp){
        if(this.subscriptionArray[index]){
          this.subscriptionArray[index].unsubscribe();
        }
        // If there was any error
      this.fileArray[index].isExistError = null;

      // To track scan/unscan files
      this.fileArray[index].isScanned = false;
      this.fileArray[index].isScanFailed = false;

      // remove the error
      if (this.fileArray[index].isScanPassed) {
        // If scan passed document gets it name changed
        this.fileArray[index].isScanPassed = false;
      }
      // remove the error
      if (this.fileArray[index].isUploaded) {
        // If scan passed document gets it name changed
        this.fileArray[index].isUploaded = false;
      }
        this.fileArray[index].isHidden = true;
      }
      if(this.fileArray.every(x => x.isHidden)){
        this.closeUploadPenal();
      }
    }
  }

  retryClientDoc(index){
    if(this.isOffline){
      this.toastr.showError(this.errorData.connection_error);
      return;
    }
    let params = this.getParamsForDocs(this.fileArray[index], true);
    this.fileArray[index].isExistError = null;

    // To track scan/unscan files
    this.fileArray[index].isScanned = true;
    this.fileArray[index].isScanFailed = false;
    this.sendClientRetentionForScan(params, index);
  }

  //Replace Document Functionality Handlers
  uploadReplaceFile(params, index, isScan: boolean, isUpload?: boolean) {
    params.dmsFileStatus = (isScan) ? DMSFileStatus.SecurityScanInProgress : (isUpload) ? DMSFileStatus.UploadInProgress : DMSFileStatus.UploadCancelled;
    this.subscriptionArray[index] = this.dmsService.v1DmsFileReplacePost$Response(params).subscribe((res: any) => {
      res = JSON.parse(res.body).results;
      //Scan 
      if(isScan){
        this.fileArray[index].isScanPassed = (res.dmsFileStatus === 'SecurityScanPassed');
        this.fileArray[index].isScanFailed = (!(res.dmsFileStatus === 'SecurityScanPassed' || res.dmsFileStatus === 'SecurityScanInProgress'));
        this.fileArray[index].virusDetails = (res.dmsFileStatus === 'SecurityScanFailedVirus') ? res.dmsFileStatusDetails : null;
        if(res.dmsFileStatus === 'SecurityScanPassed'){
          let uploadparams = _.cloneDeep(params);
          uploadparams.body.file = null;
          uploadparams.dmsFileStatus = DMSFileStatus.UploadInProgress;
          this.uploadReplaceFile(uploadparams, index, false, true);
        }

      } // Upload 
      else if(isUpload) {
        if(res.dmsFileStatus == 'UploadDone'){
          this.fileArray[index].isUploaded = true;
            this.sendRefreshRequest(this.fileArray[index]);
        }
      } //Remove
      else {
        if(res.dmsFileStatus == 'UploadCancelled'){
          this.fileArray[index].isHidden = true;
          if(this.fileArray.every(x => x.isHidden)){
            this.closeUploadPenal();
          }
        }
      }
    }, err => {
    
    })
  }

  async delete_retryReplaceFile(isRemove, index){
    if(this.isOffline){
      this.toastr.showError(this.errorData.connection_error);
      return;
    }
    let params: any = this.fileArray[index];
    if(isRemove){
      if(this.fileArray[index].isUploaded){
        this.fileArray[index].isHidden = true;
        if(this.fileArray.every(x => x.isHidden)){
          this.closeUploadPenal();
        }
      } else if(this.fileArray[index].isScanFailed){
        if (this.subscriptionArray[index]) {
          this.subscriptionArray[index].unsubscribe();
        }
        params.body.file = null;
        this.uploadReplaceFile(params, index, false, false);
      } else {
        const resp: any = await this.dialogService.confirm(
          messages.cancel_upload_warn,
          'Continue Upload',
          'Cancel Upload',
          'Cancel Upload?',
          true,
          '',
          true,
          null,
          true
        );
        if(!resp){
          if (this.subscriptionArray[index]) {
            this.subscriptionArray[index].unsubscribe();
          }
          params.body.file = null;
          this.uploadReplaceFile(params, index, false, false);
        }
      }
    } else {
      this.fileArray[index].isExistError = false;
      this.fileArray[index].isScanFailed = false;
      this.fileArray[index].virusDetails = false;
      this.uploadReplaceFile(params, index, true, false);
    }
  }
}
