import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { DmsService, DocumentPortalService, MiscService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

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
  isCancel?: boolean;
  isUpload?: boolean;
  isVerify?: boolean;
  isScanOnly?: boolean;
  lastIteration?: boolean;
  index?: number;
}

@Component({
  selector: 'app-send-document',
  templateUrl: './send-document.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class SendDocumentComponent implements OnInit, OnDestroy {
  @Input() rootFolderId: any;
  @Input() matterList: any = [];
  @Output() readonly closeModal = new EventEmitter();
  fileArray: any = [];
  fileNameErr = false;
  matterFolderId: any;
  fileForm: FormGroup;
  userId = '';
  fileLoader = false;
  docTimeout: any;
  public loading: boolean;
  public currentIndex;
  private currentUserInfo: any;
  private fileExtenson = '';
  dataEntered: any = false;
  scanPassDocsExist: any = false;
  showDocumentError = [];
  public errorData: any = (errorData as any).default;
  rootClientFolder: any;
  fileErrorMsg: string;
  public blockedExtension: Array<any> = [];
  public extensionsArray: Array<any> = UtilsHelper.getDocExtensions();
  public subscriptionArray: Array<Subscription> = [];
  public selectedCoOwner: Array<number> = [];
  matterFolderError = false;
  public reqTimout: any;

  public offlineEvent: Observable<Event>;
  public onlineEvent: Observable<Event>;
  public isOffline = false;
  private eventSubscriptionArray: Array<Subscription> = [];

  constructor(
    private miscService: MiscService,
    public sharedService: SharedService,
    private toaster: ToastDisplay,
    private dmsService: DmsService,
    public commonService: CommonService,
    private builder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private portalService: DocumentPortalService,
  ) { }

  ngOnInit() {
    this.offlineEvent = fromEvent(window, 'offline');
    this.onlineEvent = fromEvent(window, 'online');

    this.getBlockedExtension();

    this.route.queryParams.subscribe(params => {
      if (params && params.rootClientFolder) {
        this.rootClientFolder = params.rootClientFolder;
      }
    });
    this.currentUserInfo = localStorage.getItem('profile');
    if (this.currentUserInfo) {
      this.currentUserInfo = JSON.parse(this.currentUserInfo);
    }
    this.fileForm = this.builder.group({
      file: new FormControl(File)
    });
    this.userId = JSON.parse(localStorage.getItem('profile')) ? JSON.parse(localStorage.getItem('profile')).id : '';
    this.getMatterFolderListing();
    this.eventSubscriptionArray.push(this.offlineEvent.subscribe(() => {
      this.isOffline = true;
      this.subscriptionArray.forEach(subscription => {
        if (subscription) {
          subscription.unsubscribe();
        }
      });
    }));

    this.eventSubscriptionArray.push(this.onlineEvent.subscribe(() => {
      this.isOffline = false;
    }));
  }

  ngOnDestroy() {
    this.eventSubscriptionArray.forEach(subscription => subscription.unsubscribe());
  }

  getMatterFolderListing() {
    this.loading = true;
    this.dmsService
      .v1DmsClientClientIdGet({ clientId: +this.userId })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res).results;
          if (res && res.length) {
            const matterFolders = res.filter(x => x.folderId);
            this.matterList =
              matterFolders && matterFolders.length ? [...matterFolders] : [];
            const idx = this.matterList.findIndex(
              el =>
                el.matterName === 'Not Matter Related' &&
                el.folderId === this.rootClientFolder
            );
            if (idx > -1 && idx !== 0) {
              this.matterList.splice(0, 0, this.matterList.splice(idx, 1)[0]);
            } else {
              this.matterList.splice(0, 0, {
                folderId: this.rootClientFolder,
                matterName: 'Not Matter Related'
              });
            }
          } else {
            this.matterList = [{
              folderId: this.rootClientFolder,
              matterName: 'Not Matter Related'
            }];
          }
          this.loading = false;
          this.matterFolderId = this.rootClientFolder;
        },
        e => {
          this.loading = false;
        }
      );
  }

  close() {
    this.closeModal.emit();
  }

  selectedFile(event: any, isReverify?: boolean) {
    if (!this.matterFolderId) {
      this.matterFolderError = true;
      const form = document.getElementById('fileForm') as HTMLFormElement;
      form.reset();
      return;
    }

    this.matterFolderError = false;
    this.fileErrorMsg = '';
    for (let i = 0; i < event.length; i++) {
      const obj = event[i];
      event[i].isDraftingTemplate = false;
      event[i].isFileSizeError = false;
      event[i].isFillableTemplate = false;
      event[i].iseSignatureField = false;
      event[i].nameOfFile = obj.name;
      event[i].selectedAttArr = [];
      event[i].isExistError = null;
      event[i].isScanned = false;
      event[i].isScanFailed = false;
      event[i].isScanPassed = false;
      event[i].fileId = null;
      event[i].virusDetails = null;
      event[i].currentDMSStatus = DMSFileStatus.SecurityScanInProgress;
      event[i].dmsFileStatus = DMSFileStatus.VerifyFileName;
      event[i].attributesArray = [
        { id: 1, name: 'Drafting Template' },
        { id: 2, name: 'Fillable Template' },
      ];
      event[i].title = 'Select document attributes';
      if (this.bytesToSize(obj.size) > 25) {
        event[i].isFileSizeError = true;
      }
      const fileName = obj.name;
      const fileExtenson = this.sharedService.getFileExtension(fileName);
      if ((['docx', 'pdf'].indexOf(fileExtenson) === -1)) {
        const idx = event[i].attributesArray.findIndex(x => x.id === 2);
        if (idx > -1) {
          (event[i].attributesArray[idx] as any).disabled = true;
        }
      }
      if (typeof this.showDocumentError[i] === 'undefined') {
        this.showDocumentError[i] = false;
      }

      if (this.blockedExtension.some((ext) => ext.extension === `.${fileExtenson}`)) {
        this.fileErrorMsg = this.errorData.not_allowed_file_error;
        return;
      }
      this.dataEntered = true;
    }
    this.fileArray = (isReverify) ? event : this.fileArray.concat(Array.from(event));
    if (this.fileArray.length > 0) {
      this.dataEntered = true;
    }
    this.showDocumentError[this.fileArray.length] = false;
    this.verifyFileNames(true);
  }

  async verifyFileNames(isFirstCall?: boolean) {
    // tslint:disable-next-line: forin
    for (const key in this.fileArray) {
      const index = parseInt(key, 10);
      const item = this.fileArray[key];

      let lastIteration = false;
      if (item.isScanned || item.isFileSizeError) {
        if (item.isFileSizeError) {
          item.isScanFailed = true;
        }
        continue;
      }
      const arrLength = this.fileArray.length;
      item.isScanned = true;
      if (index === arrLength - 1) {
        lastIteration = true;
      }

      /*for file name*/
      let nameofFile = '';
      let providerName = false;
      if (item.nameOfFile) {
        providerName = true;
        item.nameOfFile = (isFirstCall) ? item.nameOfFile.substring(0, +item.nameOfFile.lastIndexOf('.')) : item.nameOfFile;
        nameofFile = `${item.nameOfFile}.${item.name.substr(item.name.lastIndexOf('.') + 1)}`;
      }
      if (!providerName) {
        item.isScanFailed = item.isScanned = true;
        item.isExistError = this.errorData.file_name_required;
        if (lastIteration) {//to stop the loader
          this.loading = false;
        }
        continue;
      }
      /*for file name ends*/

      const file = item;
      this.fileForm.setValue({
        file: null
      });


      const param: any = {
        folderId: this.matterFolderId,
        nameOfFile: nameofFile,
        status: 'Client Pending Review',
        isFillableTemplate: item.isFillableTemplate,
        isDraftingTemplate: item.isDraftingTemplate,
        ownerId: +this.currentUserInfo.id,
        body: this.fileForm.value,
        dmsFileStatus: DMSFileStatus.VerifyFileName,
        actualFile: file,
        originalFileName: item.originalFileName,
        id: item.fileId ? item.fileId : null
      };

      const action: IDocumentUpload = {
        param,
        lastIteration,
        index
      };
      await this.VerifyFileExistOrNot(action);
    }
  }

  async VerifyFileExistOrNot(actions: IDocumentUpload, retry?: boolean) {
    this.loading = true;
    try {
      const resp: any = await this.portalService.v1DocumentPortalSendDocumentPost(actions.param).toPromise();
      const response = JSON.parse(resp).results;
      this.fileArray[actions.index].dmsFileStatus = response.dmsFileStatus;
      this.fileArray[actions.index].isScanned = true;
      if (response.dmsFileStatus !== 'VerifyFileNamePassed') {
        const index = actions.index;
        this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
        // To show Red badge
        this.fileArray[index].isScanFailed = true;
        if (this.fileArray[index].isScanPassed) {
          // if verfication gets failed after scan passed
          this.fileArray[index].isScanPassed = false;
        }
        this.fileArray[index].isScanned = false;
      } else {
        this.fileArray[actions.index].isScanPassed = true;
        this.fileArray[actions.index].fileId = response.id;
      }
      if (actions.lastIteration || retry) {
        this.loading = false;
      }
      console.log(this.fileArray);
      this.checkIfScanPassedDocsExist();
    } catch (err) {
      this.loading = false;
    }
  }

  openSubMenu(index: number): void {
    this.currentIndex = this.currentIndex === index ? null : index;
  }

  public async uploadDocument(actions: IDocumentAction) {
    if (this.fileArray.length) {
      let lastIteration = false;
      const arrLength = this.fileArray.length;
      for (const key in this.fileArray) {
        const index = parseInt(key, 10);
        const item = this.fileArray[key];

        if (index === arrLength - 1) {
          lastIteration = true;
        }

        if (item.isScanned && (actions.isScanOnly || actions.isVerify)) {
          // check if the docs in the array is passed so there is no api call for thm when new file added to the array
          continue;
        }

        const value: any = this.fileForm.value;
        item.isScanned = true;
        value.file = item.file;

        /*for file name*/
        let nameofFile = '';
        let providerName = false;
        if (item.nameOfFile) {
          providerName = true;
          if (item.nameOfFile.includes('.')) {
            const ext = item.nameOfFile.substring(item.nameOfFile.lastIndexOf('.') + 1, item.nameOfFile.length);
            item.nameOfFile = (this.extensionsArray.includes(ext)) ? item.nameOfFile.substring(0, +item.nameOfFile.lastIndexOf('.')) : item.nameOfFile;
          }
          if (!item.nameOfFile) { providerName = false; }
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

        /*for categories end */
        const param: any = {
          folderId: this.matterFolderId,
          nameOfFile: nameofFile,
          status: 'Client Pending Review',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          dmsFileStatus: (actions.isCancel) ? DMSFileStatus.UploadCancelled : (actions.isVerify) ? DMSFileStatus.VerifyFileName : (actions.isScanOnly) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadInProgress,
          actualFile: file,
          originalFileName: file.name,
          id: item.fileId ? item.fileId : null
        };
        if (actions.isUpload || actions.isCancel) {
          // include the id in the param if call is for upload or cancel
          this.dataEntered = true;
        }

        // parameters for UploadFile function
        const { isUpload, isScanOnly, isCancel, isVerify } = actions;
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
      this.router.navigate(['/dmsportal/dashboard']);
    }
  }
  async uploadFile(actions: IDocumentUpload) {
    // Unsubscrobe the APi request before cancelling
    if (actions.isCancel && this.subscriptionArray[actions.index]) {
      this.subscriptionArray[actions.index].unsubscribe();
    }
    this.subscriptionArray[actions.index] = this.portalService.v1DocumentPortalSendDocumentPost(actions.param).subscribe((resp: any) => {
      resp = JSON.parse(resp);
      if (resp.results) {
        const status: string = resp.results.dmsFileStatus;
        if (this.fileArray[actions.index]) {
          this.fileArray[actions.index].currentDMSStatus = DMSFileStatus[status];
          if (resp.results.dmsFileStatus !== 'VerifyFileNameFailed') {
            this.fileArray[actions.index].fileId = resp.results.id;
          }
        }
      }
      if (actions.isVerify) {
        // check if the verification is passed
        if (resp && resp.results && resp.results.dmsFileStatus === 'VerifyFileNamePassed') {
          // Hit scan doc request if verification is passed
          actions.param.dmsFileStatus = DMSFileStatus.SecurityScanInProgress;
          actions.param.body = { file: actions.param.actualFile };
          actions.isVerify = false;
          actions.isScanOnly = true;
          actions.param.id = resp.results.id;
          this.uploadFile(actions);
          return;
        } else {
          const index = actions.index;
          this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
          this.fileArray[index].isScanFailed = true; // to show Red badge

          // if verfication gets failed after scan passed
          if (this.fileArray[index].isScanPassed) {
            this.fileArray[index].isScanPassed = false;
          }
        }
        this.loading = false;
      }
      // If the request is for scanning
      if (actions.isScanOnly) {
        if (this.fileArray[actions.index]) {
          this.fileArray[actions.index].isScanPassed = (resp.results.dmsFileStatus === 'SecurityScanPassed') ? true : false;
          this.fileArray[actions.index].isScanFailed = (resp.results.dmsFileStatus === 'SecurityScanPassed' || resp.results.dmsFileStatus === 'SecurityScanInProgress') ? false : true;
          this.fileArray[actions.index].virusDetails = (resp.results.dmsFileStatus === 'SecurityScanFailedVirus') ? resp.results.dmsFileStatusDetails : null;
          this.fileArray[actions.index].isScanned = true;
        }
      }

      if (actions.isCancel && actions.lastIteration) {
        this.cancel();
      }
      this.checkIfScanPassedDocsExist();
      this.loading = false;
    }, err => {
      if (err.status === 400 && err.error === 'Another file in that matter’s folder already has that name.') {
        const index = actions.index;
        this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
        this.fileArray[index].isScanFailed = true; // to show Red badge

        // if verfication gets failed after scan passed
        if (this.fileArray[index].isScanPassed) {
          this.fileArray[index].isScanPassed = false;
        }
      }
      this.loading = false;
    });
  }


  checkIfScanPassedDocsExist() {
    this.loading = false;
    return this.fileArray.length && this.fileArray.every(obj => obj.isScanPassed);
  }

  get checkIfScanPassedDocsExistFn() {
    this.loading = false;
    return this.fileArray.length && this.fileArray.every(obj => obj.isScanPassed);
  }

  async retryScan(index: any, isNameChanged?: any) {
    const item = this.fileArray[index];

    if (item.isScanPassed && !isNameChanged) {
      return;
    }
    const value: any = this.fileForm.value;
    value.file = item.file;
    let nameofFile = '';
    let providerName = false;
    if (item.nameOfFile) {
      providerName = true;
      nameofFile = `${item.nameOfFile}.${item.name.substr(item.name.lastIndexOf('.') + 1)}`;
    }

    if (!providerName) {
      item.isScanFailed = item.isScanned = true;
      item.isExistError = this.errorData.file_name_required;
      return;
    }

    const file = item;
    this.fileForm.setValue({
      file
    });

    const param: any = {
      folderId: this.matterFolderId,
      nameOfFile: nameofFile,
      status: 'Client Pending Review',
      isFillableTemplate: item.isFillableTemplate,
      isDraftingTemplate: item.isDraftingTemplate,
      ownerId: +this.currentUserInfo.id,
      body: (!isNameChanged) ? this.fileForm.value : null,
      containsESignatureFields: item.iseSignatureField,
      dmsFileStatus: DMSFileStatus.VerifyFileName,
      actualFile: item,
      originalFileName: item.name,
      id: item.fileId ? item.fileId : null
    };
    this.fileArray[index].isExistError = null;
    this.fileArray[index].isScanned = false;
    this.fileArray[index].isScanFailed = false;
    if (this.fileArray[index].isScanPassed) {
      this.fileArray[index].isScanPassed = false;
    }
    const actions: IDocumentUpload = {
      isCancel: false,
      isUpload: false,
      isScanOnly: (!isNameChanged) ? true : false,
      isVerify: (isNameChanged) ? true : false,
      index,
      param
    };
    await this.VerifyFileExistOrNot(actions, true);
  }


  async cancelFilesUpload() {
    const data: IDocumentAction = {
      isCancel: true,
      isScanOnly: false,
      isUpload: false,
      isVerify: false
    };
    this.uploadDocument(data);
  }


  cancel() {
    this.router.navigate(['/dmsportal/dashboard']);
  }

  async removeImage(index: number) {
    const value = this.fileArray[index];
    // Check if scan is failed or scan is passed to hit api call for cancelling otherwise remove the file from the array
    if (!value.isExistError && (value.isScanFailed || value.isScanPassed) && !value.isFileSizeError) {
      this.loading = true;
      const params: any = {
        folderId: value.folderId,
        nameOfFile: value.nameofFile,
        status: 'Client Pending Review',
        isFillableTemplate: value.isFillableTemplate,
        isDraftingTemplate: value.isDraftingTemplate,
        ownerId: +this.currentUserInfo.id,
        body: { file: null },
        commaCategories: null,
        // containsESignatureFields: value.iseSignatureField,
        dmsFileStatus: DMSFileStatus.UploadCancelled,
        id: value.fileId ? value.fileId : null
      };
      try {
        let resp: any = await this.portalService.v1DocumentPortalSendDocumentPost(params).toPromise();
        resp = JSON.parse(resp);
        this.loading = false;
      } catch (err) {
        this.loading = false;
      }
    }
    if (this.subscriptionArray[index]) {
      // If the scan is in progress and user selects to remove the document
      this.subscriptionArray[index].unsubscribe();
    }
    this.fileArray.splice(index, 1);
    this.showDocumentError.splice(index, 1);
    if (!this.fileArray.length) {
      const form = document.getElementById('fileForm') as HTMLFormElement;
      form.reset();
    }
    this.checkIfScanPassedDocsExist();
  }
  bytesToSize(bytes) {
    const sizeInBytes = bytes;
    const size = sizeInBytes / Math.pow(1024, 2); // size in new units
    const formattedSize = Math.round(size * 100) / 100; // keep up to 2 decimals
    return formattedSize;
  }

  removeDoc(index: number) {
    this.fileArray.splice(index, 1);
    if (!this.fileArray.length) {
      const form = document.getElementById('fileForm') as HTMLFormElement;
      form.reset();
    }
  }

  isValid() {
    if (
      this.fileArray && this.fileArray.length &&
      !this.fileNameErr && this.fileArray.some(x => x.isScanPassed)
    ) {
      return true;
    }

    return false;
  }

  async sendDoc() {
    try {
      this.matterFolderError = false;
      if (!this.matterFolderId) {
        return this.matterFolderError = true;
      }

      const fileIDs = [];
      this.loading = true;
      for (const x of this.fileArray) {
        if (x.uploaded || !x.isScanPassed) {
          continue;
        }
        let providerName = false;

        if (x.nameOfFile) {
          providerName = true;
          if (x.nameOfFile.includes('.')) {
            // Splitting text after last . appeared
            x.nameOfFile = x.nameOfFile.substring(0, +x.nameOfFile.lastIndexOf('.'));
          }

          if (!x.nameOfFile) {
            providerName = false;
          }

          // Appending extension to fileName
          x.nameOfFile = `${x.nameOfFile}.${x.name.substr(x.name.lastIndexOf('.') + 1)}`;
        }

        if (!providerName) {
          return this.toaster.showError('Provider name required');
        }

        this.fileForm.setValue({
          file: x
        });
        x.nameOfFile = x.nameOfFile.replace(/ /g, '_');
        const params: any = {
          dmsFileStatus: DMSFileStatus.UploadInProgress,
          folderId: this.matterFolderId,
          id: x.fileId ? x.fileId : null,
          nameOfFile: x.nameOfFile,
          status: 'Client Pending Review',
          isFillableTemplate: false,
          isDraftingTemplate: false,
          ownerId: +this.userId,
          fileName: x.nameOfFile
        };

        try {
          let response: any = await this.portalService.v1DocumentPortalSendDocumentPost(params).toPromise();
          response = JSON.parse(response);
          if (response && response.results && response.results.id) {
            fileIDs.push(response.results.id);
            x.uploaded = true;
          }
        } catch (e) {
          x.docExists = true;
        }
      }

      if (fileIDs && fileIDs.length) {
        const body = {
          clientAssociationIds: [],
          clientIds: [+this.userId],
          externalUsers: [],
          fileIds: fileIDs,
          folderId: parseInt(this.matterFolderId, 10),
          shareLink: 'www.example.com',
          expirationDate: null
        };

        try {
          await this.dmsService.v1DmsAddAccessDocumentportalPost$Json({ isFromDmsPortal: true, body }).toPromise();
          this.toaster.showSuccess('Documents sent.');
          this.cancel();
          this.closeModal.emit(true);
          this.loading = false;
        } catch (e) {
          this.loading = false;
        }
      } else {
        this.closeModal.emit();
        this.loading = false;
      }
    } catch (e) {
      this.loading = false;
    }
  }

  checkUniqueDoc(event, idx) {
    if (this.docTimeout) {
      clearTimeout(this.docTimeout);
      this.docTimeout = null;
    }

    if (!this.matterFolderId) {
      return this.toaster.showError('Please select matter folder or not-matter related checkbox');
    }

    if (event.target && event.target.value && event.target.value.trim() !== '') {
      const params = {
        id: +this.matterFolderId,
        name: event.target.value
      };

      this.docTimeout = setTimeout(() => {
        this.fileLoader = true;
        this.portalService.v1DocumentPortalCheckExistingFileGet(params).subscribe((res: any) => {
          res = JSON.parse(res);
          this.fileArray[idx].docExists = res.results;
          if (res.results) {
            this.toaster.showError('Another file in that matter’s folder already has that name.');
          } else {
            this.checkOtherDocs(event.target.value, idx);
          }
          this.fileLoader = false;
        }, e => {
          this.fileLoader = false;
        });
      }, 900);
    } else {
      this.fileArray[idx].nameOfFile = '';
      this.fileArray[idx].docExists = true;
    }
  }

  checkOtherDocs(val, idx): void {
    const index = this.fileArray.findIndex(e => e.nameOfFile === val);
    if (index === -1 || index === idx) {
      this.fileArray[idx].docExists = false;
    } else {
      this.fileArray[idx].docExists = true;
      return this.toaster.showError('Same document name is already taken.');
    }
  }

  checkFilesArr() {
    if (!this.fileArray.length) {
      return false;
    }
    const exists = this.fileArray.some(x => x.docExists);
    const name = this.fileArray.some(x => !x.nameOfFile);
    if (name) {
      this.fileArray.forEach(element => {
        element.docExists = !element.nameOfFile ? true : false;
      });
    }
    return (exists || name) ? false : true;
  }

  /*** function to get all blocked extension */
  async getBlockedExtension(): Promise<any> {
    try {
      let resp: any = await this.miscService.v1MiscFileextensionsGet$Response().toPromise();
      resp = JSON.parse(resp.body);
      this.blockedExtension = resp.results;
    } catch (err) { }
  }

  onNameChanged(index) {
    if (this.subscriptionArray[index]) {
      this.subscriptionArray[index].unsubscribe();
    }
    if (this.reqTimout) {
      clearTimeout(this.reqTimout);
      this.reqTimout = null;
    }
    this.reqTimout = setTimeout(() => {
      if(this.fileArray[index].nameOfFile && this.fileArray[index].nameOfFile.trim().length > 0){
        const idx = this.checkIfDocNameAlreadyExistsInFiles(index);
        document.getElementById('provide-name-' + index).blur();
        if (idx === -1) {
          this.verifyFileName(index);
        } else {
        this.fileArray[index].isScanned = false;
        this.fileArray[index].isScanFailed = true;
        if (this.fileArray[index].isScanPassed) {
          this.fileArray[index].isScanPassed = false;
        }
        this.fileArray[index].isExistError = this.errorData.same_doc_name_already_taken_error;
        return;
        }
      }
    }, 400);

  }

  onClickedOutside(index: number) {
    if (index === this.currentIndex) {
      this.currentIndex = null;
    }
  }

  reVerifyDocs(event) {
    if (this.fileArray.length) {
      this.fileArray.forEach(item => {
        item.isScanFailed = false;
        item.fileId = 0;
        item.isScanned = false;
        item.isScanPassed = false;
        item.isExistError = null;
      });
      this.verifyFileNames();
    }
  }
  sendFilesForScan() {
    if (this.isOffline) {
      return;
    }
    if (this.fileArray.every(item => !item.isScanFailed && !item.isExistError)) {
      this.fileArray.forEach(file => {
        file.CoOwnerId = this.selectedCoOwner;
        file.folderId = this.matterFolderId;
        file.nameOfFile = `${file.nameOfFile}.${this.sharedService.getFileExtension(file.name)}`;
        file.isFromDmsPortal = true;
      });
      this.commonService.docs.next(this.fileArray);
      this.cancel();
    }
  }

  checkIfDocNameAlreadyExistsInFiles(index) {
    const fileArray = JSON.parse(JSON.stringify(this.fileArray));
    fileArray.splice(index, 1);
    this.fileArray[index].nameOfFile = this.fileArray[index].nameOfFile.trim();
    const changeFileName = this.fileArray[index].nameOfFile;
    const idx: any = fileArray.findIndex(e => e.nameOfFile === changeFileName);
    return idx;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  public async verifyFileName(index?) {
    this.fileArray[index].isExistError = '';
    if (this.fileArray[index].nameOfFile) {
      this.loading = true;
      try {
        const resp: any = await this.dmsService
          .v1DmsFileIsFileExistGet({ folderId: this.matterFolderId, fileName: this.fileArray[index].nameOfFile })
          .toPromise();
        if (JSON.parse(resp).results > 0) {
          this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error;
          this.fileArray[index].isScanPassed = false;
          this.fileArray[index].isScanFailed = true;
        } else {
          this.retryScan(index, true);
        }
        this.loading = false;
      } catch (error) {
        this.loading = false;
      }
    }
  }
}
