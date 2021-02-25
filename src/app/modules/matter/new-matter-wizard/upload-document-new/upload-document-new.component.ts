import { Component, Input, OnChanges, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errorData from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { DmsService, DocumentPortalService, MiscService } from 'src/common/swagger-providers/services';

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
  selector: 'app-upload-document-new',
  templateUrl: './upload-document-new.component.html',
  styleUrls: ['./upload-document-new.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UploadDocumentNewComponent implements OnInit, OnChanges {
  @Input() pageType: string;
  @Input() matterDetails: any;
  @Input() clientId: any;
  public errorData: any = (errorData as any).default;
  public modalOptions: NgbModalOptions;
  public isSameFolderForAll = true;
  public modalSubmitted = false;
  public timeOut: any;
  public loginUser: any;
  public currentIndex: number;
  public selectedFolderId: number;
  public practiceAreaId: number;
  public selectedFileArray: Array<any> = [];
  public fileArray: Array<any> = [];
  public blockedExtension: Array<any> = [];
  public practiceAreaFolderList: Array<any> = [];
  private subscriptionArray: Array<Subscription> = [];
  public fileForm = this.formBuilder.group({
    file: new FormControl(File)
  });
  subs = null;
  public editFileDetails: any;
  public selectedEditFileIndex: number;
  public toBeUploadedFiles: Array<any> = []; 
  public isClientORMatterPage: boolean = false;
  constructor(
    private modalService: NgbModal,
    private dmsService: DmsService,
    private miscService: MiscService,
    private sharedService: SharedService,
    private toastr: ToastDisplay,
    private formBuilder: FormBuilder,
    private documentPortal: DocumentPortalService,
    public commonService: CommonService,
    private dialogService: DialogService
  ) { }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    this.getBlockedExtension();
    this.isClientORMatterPage = (this.pageType == 'client' || this.pageType == 'matter');
  }

  ngOnChanges(change) {
    if (change.hasOwnProperty('matterDetails')) {
      this.practiceAreaId = (this.matterDetails) ? this.matterDetails.practiceId : null;
      if (this.practiceAreaId) {
        this.getPracticeAreaFolders();
      }
    }
  }
  openPersonalinfo(content: any, className, winClass) {
    if (this.practiceAreaFolderList && this.practiceAreaFolderList.length) {
      this.selectedFolderId = this.practiceAreaFolderList[0].folderId;
    }
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
        },
        reason => {
          this.selectedFileArray = [];
          this.modalSubmitted = false;
        }
      );
  }

  /**
   * Function to get file selection
   */
  selectedFile(event) {
    for (let i = 0; i < event.length; i++) {
      const obj = event[i];
      event[i].originalFileName = event[i].name;
      event[i].isFileSizeError = false;
      event[i].isDraftingTemplate = false;
      event[i].isFillableTemplate = false;
      event[i].DocumentName = (obj.name.includes('.')) ? obj.name.substring(0, +obj.name.lastIndexOf('.')) : obj.name;
      event[i].selectedAttArr = [];
      event[i].isExistError = false;
      event[i].isScanned = false;
      event[i].isScanFailed = false;
      event[i].isScanPassed = false;
      event[i].status = 'Active';
      event[i].fileId = null;
      event[i].virusDetails = null;
      event[i].folderId = null;
      event[i].currentDMSStatus = DMSFileStatus.SecurityScanInProgress;
      event[i].dmsFileStatus = DMSFileStatus.SecurityScanInProgress;
      event[i].attributesArray = [
        { id: 1, name: 'Drafting Template' },
        { id: 2, name: 'Fillable Template' },
      ];
      event[i].title = 'Select document attribute';
      if (this.bytesToSize(obj.size) > 25) {
        event[i].isFileSizeError = true;
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

      if (this.blockedExtension.some((ext) => ext.extension === `.${fileExtenson}`)) {
        this.toastr.showError(this.errorData.not_allowed_file_error);
        return;
      }
    }

    this.selectedFileArray = (this.selectedFileArray.length) ? [...this.selectedFileArray, ...event] : Array.from(event);
    this.checkInternalFileNames();
  }

  /**
   * function to get folders of selected Practice Area
   */
  getPracticeAreaFolders() {
    if (!this.practiceAreaId) {
      return;
    }

    if (this.subs) {
      this.subs.unsubscribe();
      this.subs = null;
    }

    this.subs = this.dmsService.v1DmsFoldersPracticeAreaPracticeAreaIdGet$Plain({ practiceAreaId: this.practiceAreaId }).subscribe(res => {
      res = JSON.parse(res as any).results;
      if (res && res.length) {
        res.forEach(x => {
          x.folderName = x.folderName.replace('_', ' ');
        });
      }
      const data: any = {
        folderId: this.matterDetails.matterNumber,
        folderName: this.matterDetails.matterName,
        folderPath: null
      };
      this.practiceAreaFolderList = [data, ...res];
    });
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

  /**
   * @param bytes
   * function to get sze of file in MB
   */
  public bytesToSize(bytes) {
    const size = bytes / Math.pow(1024, 2); // size in new units
    // keep up to 2 decimals
    return Math.round(size * 100) / 100;
  }

  /**
   * @param index
   * function to open file menu
   */
  public openMenu(index) {
    this.currentIndex = (this.currentIndex === index) ? null : index;
  }

  getAttributeSelected(event: any, i) {
    if (this.selectedFileArray[i]) {
      if (event && event.length) {
        this.selectedFileArray[i].title = event.length;
      } else {
        this.selectedFileArray[i].selectedAttArr = [];
        this.selectedFileArray[i].title = 'Select document attribute';
      }
    }
  }

  /**
   * function to assign false to attribute selctions of documents
   */
  assignFalseToAttributes(ind?: any, isEditFile?: boolean) {
    // this.fileArray[ind].iseSignatureField = false;
    if (isEditFile) {
      this.editFileDetails.isDraftingTemplate = false;
      this.editFileDetails.isFillableTemplate = false;
    } else {
      this.selectedFileArray[ind].isDraftingTemplate = false;
      this.selectedFileArray[ind].isFillableTemplate = false;
    }

  }

  /**
   * @param i
   * function to clear the attributes selectionof the documents
   */
  clrAttributes(i) {
    this.assignFalseToAttributes(i);
    this.selectedFileArray[i].attributesArray.forEach(element => {
      element.checked = false;
    });
    this.selectedFileArray[i].selectedAttArr = [];
    this.selectedFileArray[i].title = 'Select document attribute';
  }

  /**
   * multi-level dropdown funtions
   */
  onMultiSelectSelectedOptions(event) {
  }

  applyFilter(event?: any) {
  }

  /**
   * function to toggle the same folder selction checkbox
   */
  toggleFolderLoction() {
    if (!this.selectedFileArray.length) {
      return;
    }
    this.selectedFileArray.map(element => {
      element.folderId = this.isSameFolderForAll ? null : this.selectedFolderId;
    });
  }

  /**
   * funciton to prepare data for scanning files
   */
  async scanFiles(actions?: any) {
    if (this.fileArray.length) {
      // tslint:disable-next-line:forin
      for (const key in this.fileArray) {
        const index = parseInt(key, 10);
        const item = this.fileArray[key];
        if (item.isScanned || item.isHidden) {
          continue;
        }
        item.isScanned = true;
        const file = item;
        this.fileForm.setValue({
          file
        });
        const fileExtenson = this.sharedService.getFileExtension(item.name);
        const params = {
          documentName: `${item.DocumentName}.${fileExtenson}`,
          status: item.status,
          body: this.fileForm.value,
          dmsFileStatus: DMSFileStatus.SecurityScanInProgress,
          originalFileName: item.originalFileName,
          actualFile: file 
        };
        if(this.pageType == 'client'){
          this.toBeUploadedFiles.push(params);
        } else {
          this.startSecurityScan(params, index);
        }
      }
    }
  }

  /**
   * function to send files for scanning
   */
  startSecurityScan(params: any, index) {
    this.subscriptionArray[index] = this.documentPortal.v1DocumentPortalScanClientOrMatterFilesPost(params).subscribe((res: any) => {
      res = JSON.parse(res as any).results;
      this.fileArray[index].uniqueFileName = res.uniqueFileName;
      this.fileArray[index].isScanPassed = (res.dmsFileStatus === 'SecurityScanPassed');
      this.fileArray[index].isScanFailed = (!(res.dmsFileStatus === 'SecurityScanPassed' || res.dmsFileStatus === 'SecurityScanInProgress'));
      this.fileArray[index].virusDetails = (res.dmsFileStatus === 'SecurityScanFailedVirus') ? res.dmsFileStatusDetails : null;
      if (params.dmsFileStatus == DMSFileStatus.UploadCancelled) {
        this.fileArray[index].isHidden = true;
      }
    });
  }

  /**
   * function to remove image from the file list
   */
  removeFile(index: any, type?: string) {
    if (type === 'modalFile') {
      this.selectedFileArray.splice(index, 1);
    } else {
      this.dialogService.confirm(
        'Are you sure you want to delete this document?',
        'Yes, delete',
        'Cancel',
        'Delete Document',
        true,
        ''
      ).then(res => {
        if (res) {
          this.fileArray.splice(index, 1);
          if(this.subscriptionArray[index]) {
            this.subscriptionArray[index].unsubscribe();
          }
        } else {
          this.modalService.dismissAll();
        }
      });
    }
  }

  onClickedOutside(index: number) {
    if (index === this.currentIndex) { this.currentIndex = null; }
  }

  /**
   * function to validate the selected files and data
   */
  approveDocuments() {
    if (this.selectedFileArray && !this.selectedFileArray.length) {
      return this.toastr.showError('Please select a file to upload.');
    }

    this.modalSubmitted = true;
    if ((!this.selectedFolderId && this.isSameFolderForAll) || (this.selectedFileArray.some(obj => !obj.folderId) && !this.isSameFolderForAll) || this.selectedFileArray.some(obj => obj.isExistError || !obj.DocumentName.trim())) {
      return;
    }

    if (this.selectedFileArray && this.selectedFileArray.length) {
      this.selectedFileArray.forEach((file: any) => {
        const searchedId = (this.isSameFolderForAll) ? this.selectedFolderId : file.folderId;
        const index = this.practiceAreaFolderList.findIndex(obj => obj.folderId === searchedId);
        const folder = this.practiceAreaFolderList[index];
        file.folderPath = (index >= 0) ? folder.folderPath : null;
        file.folderName = folder.folderName;
        file.folderId = searchedId;
        file.isFillableTemplate = file.selectedAttArr.indexOf(2) > -1;
        file.isDraftingTemplate = file.selectedAttArr.indexOf(1) > -1;
      });
      this.fileArray = (this.fileArray.length) ? [...this.fileArray, ...this.selectedFileArray] : this.selectedFileArray;
      this.selectedFileArray = [];
      if(!this.isClientORMatterPage) {
        this.scanFiles();
      }
      this.modalService.dismissAll();
    }
  }

  /**
   * function to internally verify the file names
   */
  checkInternalFileNames(index?: any, isEditFile?: boolean) {
    if (this.timeOut) {
      clearTimeout(this.timeOut);
      this.timeOut = null;
    }
    this.timeOut = setTimeout(() => {
      if (index >= 0) {
        const file = this.selectedFileArray[index];
        if (isEditFile) {
          this.editFileDetails.isExistError = this.fileArray.some((obj, fileIndex) => obj.DocumentName === this.editFileDetails.DocumentName && fileIndex != this.selectedEditFileIndex);
        } else {
          this.selectedFileArray[index].isExistError = this.selectedFileArray.some((obj, fileIndex) => obj.DocumentName === file.DocumentName && fileIndex != index);
        }

      } else {
        this.selectedFileArray.forEach((file, fileindex) => {
          this.selectedFileArray.forEach((item, searchindex) => {
            if (fileindex < searchindex && file.DocumentName === item.DocumentName) {
              this.selectedFileArray[searchindex].isExistError = true;
            }
          });
        });
      }
    }, 800);
  }


  getSecurityScanFailedStatus(isFailedStatus?: boolean) {
    if(isFailedStatus){
      return this.fileArray.some(obj => obj.isScanFailed && !obj.isHidden);
    } else {
      return this.fileArray.some(obj => !obj.isHidden && !obj.isScanPassed);
    }  
  }

  get getSecurityScanFailedStatusTrue() {
    return this.getSecurityScanFailedStatus(true);
  }

  retryScan(index: number) {
    this.currentIndex = null;
    const item = this.fileArray[index];
    item.isScanned = true;
    item.isScanFailed = false;
    const file = item;
    this.fileForm.setValue({
      file
    });
    const fileExtenson = this.sharedService.getFileExtension(item.name);
    const params = {
      documentName: `${item.DocumentName}.${fileExtenson}`,
      status: item.status,
      body: this.fileForm.value,
      dmsFileStatus: DMSFileStatus.SecurityScanInProgress,
      originalFileName: item.originalFileName
    };
    this.startSecurityScan(params, index);
  }

  sendFileForUpload() {
    const finalFiles = [];
    
    if (this.fileArray.some(obj => !obj.isHidden && !obj.isScanPassed) && !this.isClientORMatterPage) {
      return finalFiles;
    }
    // tslint:disable-next-line:forin
    for (const key in this.fileArray) {
      const item = this.fileArray[key];
      if (item.isHidden || !item.isScanPassed && !this.isClientORMatterPage) {
        continue;
      }
      const file = item;
      this.fileForm.setValue({
        file: (this.isClientORMatterPage) ? file : null
      });
      const fileExtenson = this.sharedService.getFileExtension(item.name);
      const params = {
        documentName: `${item.DocumentName}.${fileExtenson}`,
        status: item.status,
        body: this.fileForm.value,
        originalFileName: item.originalFileName,
        folderName: (this.matterDetails.matterNumber == file.folderId) ? null : item.folderName,
        isDraftingTemplate: item.isDraftingTemplate,
        isFillableTemplate: item.isFillableTemplate,
        ownerId: this.loginUser.id,
        dmsFileStatus: DMSFileStatus.UploadInProgress,
        uniqueFileName: item.uniqueFileName,
        isMatterFolder: (this.matterDetails.matterNumber == file.folderId) ? true : false,
        isClientFolder: false
      };
      if (this.isClientORMatterPage) {
        item.params = params;
        item.isScanFailed = false;
        item.isScanPassed = true;
        item.matterDetails = this.matterDetails;
        finalFiles.push(item);
      } else {
        finalFiles.push(params);
      }
      
    }

    return finalFiles;
  }

  editDocument(index: number, template: any) {
    this.selectedEditFileIndex = index;
    this.editFileDetails = this.fileArray[index];
    this.openPersonalinfo(template, 'xl', '');
  }

  getAttributeSelectedEditFile(event) {
    if (event && event.length) {
      this.editFileDetails.title = event.length;
    } else {
      this.editFileDetails.selectedAttArr = [];
      this.editFileDetails.title = 'Select document attribute';
    }
  }

  clrAttributesEditFile() {
    this.assignFalseToAttributes(0, true);
    this.editFileDetails.attributesArray.forEach(element => {
      element.checked = false;
    });
    this.editFileDetails.selectedAttArr = [];
    this.editFileDetails.title = 'Select document attribute';
  }

  saveEditFile() {
    if (this.editFileDetails.isExistError || !this.editFileDetails.DocumentName || this.editFileDetails.DocumentName.trim() == '') {
      return;
    }
    const searchedId = this.editFileDetails.folderId;
    const index = this.practiceAreaFolderList.findIndex(obj => obj.folderId === searchedId);
    const folder = this.practiceAreaFolderList[index];
    this.editFileDetails.folderPath = (index >= 0) ? folder.folderPath : null;
    this.editFileDetails.folderName = folder.folderName;
    this.editFileDetails.folderId = searchedId;
    this.editFileDetails.isFillableTemplate = this.editFileDetails.selectedAttArr.indexOf(2) > -1;
    this.editFileDetails.isDraftingTemplate = this.editFileDetails.selectedAttArr.indexOf(1) > -1;
    this.fileArray[this.selectedEditFileIndex] = this.editFileDetails;
    this.selectedEditFileIndex = null;
    this.modalService.dismissAll();
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
