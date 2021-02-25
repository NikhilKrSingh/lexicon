import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import * as errorData from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { CommonService } from 'src/app/service/common.service';
import { DmsService, DocumentSettingService, MiscService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../../../shared/utils.helper';

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
  selector: 'app-upload-document',
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UploadDocumentComponent implements OnInit {
  public fileErrorMsg = '';
  public showDocumentError = [];
  public dataEntered = false;
  public blockedExtension: Array<any> = [];
  public fileArray: any[] = [];
  public errorData: any = (errorData as any).default;
  public currentUserInfo: any;
  public fileForm = this.formBuilder.group({
    file: new FormControl(File)
  });
  public loading = false;
  public currentIndex;
  public anyErrorDocExist = false;
  public folderId;
  public esignEnabled = false;
  public subscriptionArray: Array<Subscription> = [];
  reqTimout: any;
  fileLoading: boolean;
  public extensionsArray: Array<any> = UtilsHelper.getDocExtensions();
  public anyFileSizeError: boolean;

  constructor(
    private dmsService: DmsService,
    private miscService: MiscService,
    private formBuilder: FormBuilder,
    private toaster: ToastDisplay,
    private documentSettingService: DocumentSettingService,
    public commonService: CommonService,
    private indexdbService: IndexDbService,
    private route: Router,
    public sharedService: SharedService
  ) {
  }

  async ngOnInit() {
    await this.getBlockedExtension();
    await this.getDocumentSettings();
    this.currentUserInfo = JSON.parse(localStorage.getItem('profile'));
    this.indexdbService.getObject('selectedFolderId', (res: any) => {
      if (res && res.value) {
        this.folderId = res.value;
      } else {
        this.route.navigate(['/firm/document-setting/matter-folder']);
      }
    });
  }

  public selectedFile(event: any) {
    this.fileErrorMsg = '';
    for (let i = 0; i < event.length; i++) {
      const obj = event[i];
      event[i].originalFileName = event[i].name;
      event[i].isFileSizeError = false;
      event[i].isDraftingTemplate = false;
      event[i].isFillableTemplate = false;
      event[i].iseSignatureField = false;
      event[i].nameOfFile = obj.name;
      event[i].selectedAttArr = [];
      event[i].isExistError = false;
      event[i].isScanned = false;
      event[i].isScanFailed = false;
      event[i].isScanPassed = false;
      event[i].fileId = null;
      event[i].virusDetails = null;
      event[i].currentDMSStatus = DMSFileStatus.SecurityScanInProgress;
      event[i].dmsFileStatus = DMSFileStatus.SecurityScanInProgress;
      event[i].attributesArray = [
        { id: 1, name: 'Drafting Template' },
        { id: 2, name: 'Fillable Template' },
        { id: 3, name: 'Contains E-Signature Fields' }
      ];
      event[i].title = 'Select document attributes';
      if (this.bytesToSize(obj.size) > 25) {
        event[i].isFileSizeError = true;
        this.anyFileSizeError = this.getFileSizeErorStatus()
      }
      const fileName = obj.name;
      const fileExtenson = this.sharedService.getFileExtension(fileName);
      let fileDocOrPdf = true;
      if (((['docx', 'pdf'].indexOf(fileExtenson)) === -1)) {
        const idx = event[i].attributesArray.findIndex(x => x.id === 2);
        if (idx > -1) {
          (event[i].attributesArray[idx] as any).disabled = true;
        }
        fileDocOrPdf = false;
      }
      if(!this.esignEnabled){
        event[i].attributesArray = event[i].attributesArray.filter(x => x.id != 3);
      } else if (!fileDocOrPdf) {
        const idx1 = event[i].attributesArray.findIndex(x => x.id === 3);
        if (idx1 > -1) {
          (event[i].attributesArray[idx1] as any).disabled = true;
        }
      }

      if (typeof this.showDocumentError[i] === 'undefined') {
        this.showDocumentError[i] = false;
        this.dataEntered = true;
      }
      if (this.blockedExtension.some((ext) => ext.extension === `.${fileExtenson}`)) {
        this.fileErrorMsg = this.errorData.not_allowed_file_error;
        return;
      }
    }
    this.fileArray = this.fileArray.concat(Array.from(event));
    this.showDocumentError[this.fileArray.length] = false;
    const params: IDocumentAction = {
      isCancel: false,
      isUpload: false,
      isScanOnly: false,
      isVerify: true
    };
    this.anyFileSizeError = this.getFileSizeErorStatus()
    this.uploadDocument(params);
  }

  public bytesToSize(bytes) {
    const size = bytes / Math.pow(1024, 2); // size in new units
    // keep up to 2 decimals
    return Math.round(size * 100) / 100;
  }

  /*** function to get all blocked extension */
  async getBlockedExtension(): Promise<any> {
    try {
      let resp: any = await this.miscService.v1MiscFileextensionsGet$Response().toPromise();
      resp = JSON.parse(resp.body);
      this.blockedExtension = resp.results;
    } catch (err) {
    }
  }

  async uploadFile(actions: IDocumentUpload) {
    if (actions.isCancel && this.subscriptionArray[actions.index]) {
      this.subscriptionArray[actions.index].unsubscribe();
    }
    if (actions.isUpload) {
      try {
        let resp: any = await this.documentSettingService.v1DocumentSettingDocumentUploadPost(actions.param).toPromise();
        resp = JSON.parse(resp);
        this.fileArray[actions.index].fileId = resp.results.id;
        const status: string = resp.results.dmsFileStatus;
        this.fileArray[actions.index].currentDMSStatus = DMSFileStatus[status];
        if (resp && resp.results && resp.results.dmsFileStatus === 'UploadDone') {
          if (actions.lastIteration) {
            this.toaster.showSuccess(this.errorData.document_uploaded_success);
            // if last element of the array, navigate to other route
            this.redirect();
          }
        } else {
          this.loading = false;
          this.toaster.showError(resp.results.dmsFileStatusDetails);
        }
      } catch (err) {
        this.loading = false;
      }
    } else {
      this.subscriptionArray[actions.index] = this.documentSettingService.v1DocumentSettingDocumentUploadPost(actions.param).subscribe((resp: any) => {
        resp = JSON.parse(resp);
        const status: string = resp.results.dmsFileStatus;
        this.fileArray[actions.index].currentDMSStatus = DMSFileStatus[status];
        if (resp.results.dmsFileStatus !== 'VerifyFileNameFailed') {
          this.fileArray[actions.index].fileId = resp.results.id;
        }

        if (actions.isVerify) {
          // check if the verification is passed
          if (resp && resp.results && resp.results.dmsFileStatus === 'VerifyFileNamePassed') {
            this.fileArray[actions.index].isScanPassed = true;//set true to enable button
          } else {
            const index = actions.index;
            this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
            this.fileArray[index].isScanFailed = true; // to show Red badge
            if (this.fileArray[index].isScanPassed) {// if verfication gets failed after scan passed
              this.fileArray[index].isScanPassed = false;
            }
          }
          this.loading = false;
        }

        // If the request is for scanning
        if (actions.isScanOnly) {
          this.fileArray[actions.index].isScanPassed = (resp.results.dmsFileStatus === 'SecurityScanPassed');
          this.fileArray[actions.index].isScanFailed = (!(resp.results.dmsFileStatus === 'SecurityScanPassed' || resp.results.dmsFileStatus === 'SecurityScanInProgress'));
          this.fileArray[actions.index].virusDetails = (resp.results.dmsFileStatus === 'SecurityScanFailedVirus') ? resp.results.dmsFileStatusDetails : null;
        }

        if (actions.isCancel && actions.lastIteration) {
          this.redirect();
        }
        // this.shouldButtonEnable();
        this.loading = false;
      }, () => {
        this.loading = false;
      });
    }
  }

  async uploadDocument(actions: IDocumentAction) {
    if (actions.isUpload && !this.folderId) {
      return;
    }
    if (this.fileArray.length) {
      let lastIteration = false;
      const arrLength = this.fileArray.length;
      for (const key in this.fileArray) {
        const index = parseInt(key, 10);
        const item = this.fileArray[key];

        if (index === arrLength - 1) {
          lastIteration = true;
        }

        if (item.isFileSizeError || (item.isScanned && (actions.isScanOnly || actions.isVerify))) {
          // check if the docs in the array is passed so there is no api call for thm when new file added to the array
          if (item.isFileSizeError) {
            this.fileArray[key].isScanFailed = true;
          }
          continue;
        }

        if (!item.isScanPassed && actions.isUpload) {
          if (lastIteration) {
            this.redirect();
          }
          // Skipping the docs that have not passed the scan for Uploading
          continue;
        }

        if (actions.isUpload) {
          this.loading = true;
        }

        item.isScanned = true;

        /*for file name*/
        let nameofFile = '';
        let providerName = false;
        if (item.nameOfFile) {
          providerName = true;
          item.nameOfFile = (actions.isScanOnly || actions.isVerify) ? item.nameOfFile.substring(0, +item.nameOfFile.lastIndexOf('.')) : item.nameOfFile;
          nameofFile = `${item.nameOfFile}.${item.name.substr(item.name.lastIndexOf('.') + 1)}`;
        }
        if (!providerName) {
          this.toaster.showError(this.errorData.provider_name_required);
          continue;
        }
        /*for file name ends*/

        const file = item;
        this.fileForm.setValue({
          file: actions.isScanOnly ? file : null
        });

        const param: any = {
          folderId: this.folderId,
          fileName: nameofFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          body: this.fileForm.value,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: (actions.isCancel) ? DMSFileStatus.UploadCancelled : (actions.isVerify) ? DMSFileStatus.VerifyFileName : (actions.isScanOnly) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadInProgress,
          actualFile: file,
          originalFileName: item.originalFileName,
          id: item.fileId ? item.fileId : null
        };

        // parameters for UploadFile function
        const { isCancel, isUpload, isScanOnly, isVerify } = actions;
        const documentActions: IDocumentUpload = {
          param,
          lastIteration,
          isCancel,
          isUpload,
          isScanOnly,
          isVerify,
          index
        };

        await this.uploadFile(documentActions);
      }

    } else {
      this.redirect();
    }
  }

  getAttributeSelected(event: any, i) {
    this.assignFalseToAttributes(i);
    if (event && event.length) {
      this.fileArray[i].title = event.length;
      event.forEach(element => {
        switch (element) {
          case 1:
            this.fileArray[i].isDraftingTemplate = true;
            break;
          case 2:
            this.fileArray[i].isFillableTemplate = true;
            break;
          case 3:
            this.fileArray[i].iseSignatureField = true;
            break;
        }
      });
    } else {
      this.fileArray[i].title = 'Select document attributes';
    }
  }

  assignFalseToAttributes(ind?: any) {
    this.fileArray[ind].iseSignatureField = false;
    this.fileArray[ind].isDraftingTemplate = false;
    this.fileArray[ind].isFillableTemplate = false;
  }

  clrAttributes(i) {
    this.assignFalseToAttributes(i);
    this.fileArray[i].attributesArray.forEach(element => {
      element.checked = false;
    });
    this.fileArray[i].selectedAttArr = [];
    this.fileArray[i].title = 'Select document attributes';
  }

  onMultiSelectSelectedOptions(event) {
  }

  applyFilter(event: any) {
  }

  openSubMenu(ind) {
    if (this.currentIndex == null) {
      this.currentIndex = ind;
    } else {
      this.currentIndex = null;
    }
  }

  onClickedOutside(index: number) {
    if (index === this.currentIndex) {
      this.currentIndex = null;
    }
  }

  get shouldButtonEnable() {
    return this.fileArray.length && this.fileArray.some(obj => obj.isExistError || !obj.isScanPassed);
  }

  /**
   *
   * @param index
   * Function to remove image from preview
   */
  async removeImage(index: number) {
    const value = this.fileArray[index];
    if (!value.isExistError && (value.isScanFailed || value.isScanPassed) && !value.isFileSizeError) {
      this.loading = true;
      this.fileForm.setValue({
        file: null
      });
      const params: any = {
        folderId: this.folderId,
        fileName: value.nameofFile,
        status: 'Active',
        isFillableTemplate: value.isFillableTemplate,
        isDraftingTemplate: value.isDraftingTemplate,
        body: this.fileForm.value,
        containsESignatureFields: value.iseSignatureField,
        dmsFileStatus: DMSFileStatus.UploadCancelled,
        id: value.fileId
      };
      try {
        let resp: any = await this.documentSettingService.v1DocumentSettingDocumentUploadPost(params).toPromise();
        resp = JSON.parse(resp);
        this.loading = false;
      } catch (err) {
        this.loading = false;
      }
    }
    if (this.subscriptionArray[index]) {
      this.subscriptionArray[index].unsubscribe();
    }
    this.fileArray.splice(index, 1);
    this.showDocumentError.splice(index, 1);
    if (!this.fileArray.length) {
      const form = document.getElementById('fileForm') as HTMLFormElement;
      form.reset();
    }
    // this.shouldButtonEnable();
  }

  async cancelFilesUpload() {
    const data: IDocumentAction = {
      isCancel: true,
      isUpload: false,
      isVerify: false,
      isScanOnly: false,
    };
    this.uploadDocument(data);
  }

  redirect() {
    setTimeout(() => {
      this.route.navigate(['/firm/document-setting/matter-folder']);
    }, 100);
  }

  async retryScan(index: any, isNameChanged?: boolean) {
    const item = this.fileArray[index];
    this.fileLoading = false;
    if (item.isScanPassed && !isNameChanged) {
      return;
    }
    this.fileArray[index].isScanned = false;
    this.fileArray[index].isScanFailed = false;
    if (this.fileArray[index].isScanPassed) {
      // If scan passed document gets it name changed
      this.fileArray[index].isScanPassed = false;
    }
    // this.shouldButtonEnable();
    let nameofFile = '';
    let providerName = false;
    if (item.nameOfFile) {
      providerName = true;
      nameofFile = `${item.nameOfFile}.${item.name.substr(item.name.lastIndexOf('.') + 1)}`;
    }
    nameofFile.trim();
    if (!providerName) {
      this.toaster.showError(this.errorData.provider_name_required);
      return;
    }

    const file = item;
    this.fileForm.setValue({
      file
    });

    const param: any = {
      folderId: this.folderId,
      fileName: nameofFile,
      status: 'Active',
      isFillableTemplate: item.isFillableTemplate,
      isDraftingTemplate: item.isDraftingTemplate,
      body: (!isNameChanged && !item.isExistError) ? this.fileForm.value : null,
      containsESignatureFields: item.iseSignatureField,
      dmsFileStatus: (isNameChanged || +item.currentDMSStatus === 3) ? DMSFileStatus.VerifyFileName : DMSFileStatus.SecurityScanInProgress,
      actualFile: item,
      originalFileName: item.originalFileName,
      id: item.fileId ? item.fileId : null
    };

    const actions: IDocumentUpload = {
      isCancel: false,
      isUpload: false,
      isScanOnly: (!isNameChanged && !item.isExistError),
      isVerify: !!(isNameChanged || item.isExistError),
      index,
      param
    };
    this.fileArray[index].isExistError = false;
    await this.uploadFile(actions);
  }

  async getDocumentSettings() {
    this.loading = true;
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    try {
      let resp: any = await this.documentSettingService.v1DocumentSettingTenantTenantIdGet({ tenantId: userDetails.tenantId }).toPromise();
      resp = JSON.parse(resp).results;
      this.esignEnabled = !!resp.isSignatureEnable;
      this.loading = false;
    } catch (err) {
      this.loading = false;
    }
  }

  onNameChanged(index: any) {
    if (this.subscriptionArray[index]) {
      this.subscriptionArray[index].unsubscribe();
    }

    if (this.reqTimout) {
      clearTimeout(this.reqTimout);
      this.reqTimout = null;
    }
    this.fileArray[index].isScanPassed = false;
    // this.shouldButtonEnable();
    this.reqTimout = setTimeout(() => {
      const fileArray = JSON.parse(JSON.stringify(this.fileArray));
      fileArray.splice(index, 1);
      const changeFileName = this.fileArray[index].nameOfFile;
      const idx: any = fileArray.findIndex(e => e.nameOfFile === changeFileName);
      if (idx === -1) {
        let nameofFile = '';
        //to disable the button;
        if (this.fileArray[index].nameOfFile) {
          if (this.fileArray[index].nameOfFile.includes('.')) {
            const ext = this.fileArray[index].nameOfFile.substring(this.fileArray[index].nameOfFile.lastIndexOf('.') + 1, this.fileArray[index].nameOfFile.length);
            this.fileArray[index].nameOfFile = (this.extensionsArray.includes(ext)) ? this.fileArray[index].nameOfFile.substring(0, +this.fileArray[index].nameOfFile.lastIndexOf('.')) : this.fileArray[index].nameOfFile;
          }
          nameofFile = `${this.fileArray[index].nameOfFile}.${this.fileArray[index].name.substr(this.fileArray[index].name.lastIndexOf('.') + 1)}`;
        } else {
          this.fileArray[index].isExistError = this.errorData.file_name_required;
          return;
        }
        if (nameofFile) {
          this.fileLoading = true;
          
          document.getElementById('file-name-index-' + index).blur();
          this.dmsService.v1DmsPracticeareaFileIsFileExistGet({
            folderId: this.folderId,
            fileName: nameofFile
          }).subscribe((data: any) => {
            const existingId = JSON.parse(data).results;
            const isExists = existingId > 0 && existingId !== this.fileArray[index].fileId;
            if (isExists) {
              this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
              this.fileLoading = false;
              // this.shouldButtonEnable();
            } else if (existingId !== this.fileArray[index].fileId) {
              this.retryScan(index, true);
            } else {
              this.fileArray[index].isExistError = false;
              this.fileLoading = false;
              this.fileArray[index].isScanPassed = true;
            }
          }, () => {
            this.fileLoading = false;
          });
        }
      } else {
        this.fileArray[index].isScanned = false;
        this.fileArray[index].isScanFailed = true;
        if (this.fileArray[index].isScanPassed) {
          this.fileArray[index].isScanPassed = false;
        }
        this.fileArray[index].isExistError = this.errorData.same_doc_name_already_taken_error;
        return;
      }
    }, 400);
  }

  getFileSizeErorStatus() {
    return this.fileArray.some(item => item.isFileSizeError);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  sendFilesForUploading() {
    if (this.fileArray.every(item => !item.isScanFailed && !item.isExistError)) {
      this.fileArray.forEach(file => {
        file.displayCategories = [];
        file.isAdminSettingsFile = true;
        file.folderId = this.folderId;
        file.nameOfFile = `${file.nameOfFile}.${this.sharedService.getFileExtension(file.name)}`;
      });
      this.commonService.docs.next(this.fileArray);
      this.redirect();
    }
  }
}
