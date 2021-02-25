import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import * as _ from 'lodash';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice } from 'src/app/modules/models';
import { CommonService } from 'src/app/service/common.service';
import { DmsService, DocumentPortalService, DocumentSettingService, EmployeeService, MiscService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../../index-db.service';
import { SharedService } from '../../../modules/shared/sharedService';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

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
  selector: 'app-upload-docv',
  templateUrl: './upload-docv.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class UploadDocvComponent implements OnInit, IBackButtonGuard, OnDestroy {
  public title = 'Select Categories';
  public propTitle = 'Select document attributes';
  public selectedCategories: Array<any> = [];
  public selectedAttributes: Array<any> = [];
  public fileArray: any[] = [];
  public employeeList: Array<IOffice> = [];
  public documentForm: FormGroup;
  public errorData: any = (errorData as any).default;
  public fileErrorMsg = '';
  public documentId = 0;
  public folderId = 0;
  public isEditMode = false;
  public blockedExtension: Array<any> = [];
  public currentUserInfo: any;
  public fileExtenson = '';
  public coOwnerTitle = 'Select Co-Owners';
  public selectedCoOwner: Array<number> = [];
  public filterName = 'Apply Filter';
  public editDocumentForm: FormGroup;
  public displayCategories: Array<any> = [];
  public displayCoOwners: Array<any> = [];
  public categoriesArray: Array<any> = [];
  public extensionsArray: Array<any> = UtilsHelper.getDocExtensions();
  public currentIndex;
  public scanPassDocsExist = false;
  public subscriptionArray: Array<Subscription> = [];
  public fileForm = this.formBuilder.group({
    file: new FormControl(File)
  });
  public errorSelectFolder = '';
  public nameOfFile = '';
  public pageType: any;
  public clientId: any;
  public loading: boolean;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  matterId = null;
  docAttributes = [
    { id: 'isDraftingTemplate', name: 'Drafting Template' },
    { id: 'isFillableTemplate', name: 'Fillable Template' },
    { id: 'containsESignatureFields', name: 'Contains E-Signature Fields' }
  ];
  esignEnabled = false;
  public reqTimout: any;
  public folderLoading = true;
  editDoc = null;
  isExistError = null;
  fileLoading: boolean;

  public offlineEvent: Observable<Event>;
  public onlineEvent: Observable<Event>;
  public isOffline = false;
  private eventSubscriptionArray: Array<Subscription> = [];
  isDraftingTemplate: any;
  isFillableTemplate: any;
  tempParams: any;
  tempselectedcoOwner: any[] = [];

  constructor(
    public dmsService: DmsService,
    private miscService: MiscService,
    private employeeService: EmployeeService,
    private formBuilder: FormBuilder,
    private toaster: ToastDisplay,
    private route: ActivatedRoute,
    private router: Router,
    public sharedService: SharedService,
    public indexDbService: IndexDbService,
    private portalService: DocumentPortalService,
    public commonService: CommonService,
    public documentSettingService: DocumentSettingService,
    private pagetitle: Title
  ) {
    this.createDocumentForm();
    this.createEditDocumentForm();
    this.getCategories();
    this.route.queryParams.subscribe(params => {
      if (params && params.documentId && params.folderId) {
        this.documentId = params.documentId;
        this.folderId = params.folderId;
        this.isEditMode = true;
      }
      if (params && params.clientId && params.pageType) {
        this.pageType = params.pageType;
        this.clientId = params.clientId;
        if (params.matterId) {
          this.matterId = params.matterId;
        }
      }
      if (params && params.matterId && params.pageType && params.pageType === 'matterDetails') {
        this.matterId = params.matterId;
        this.pageType = params.pageType;
      }
    });
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
    this.offlineEvent = fromEvent(window, 'offline');
    this.onlineEvent = fromEvent(window, 'online');

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
    UtilsHelper.removeObject('multiFolderSelection');
    this.eventSubscriptionArray.forEach(subscription => subscription.unsubscribe());
  }

  async ngOnInit() {
    this.getBlockedExtension();
    this.currentUserInfo = localStorage.getItem('profile');
    if (this.currentUserInfo) { this.currentUserInfo = JSON.parse(this.currentUserInfo); }
    if (!this.isEditMode) {
      this.initAllDocumentAsyncFunctionCall();
      this.pagetitle.setTitle('Upload Document');
    }
    if (this.isEditMode) {
      await this.initAllEditDocumentAsyncFunctionCall();
      this.pagetitle.setTitle('Modify Document Properties');
    }
  }

  /*****function to create document form */
  createDocumentForm(): void {
    this.documentForm = this.formBuilder.group({
      folderId: [null, Validators.required]
    });
  }

  /**** function to create edit document form */
  createEditDocumentForm(): void {
    this.editDocumentForm = this.formBuilder.group({
      id: 0,
      nameOfFile: ['', Validators.required],
      status: [''],
      ownerId: [null, Validators.required]
    });
  }

  /*** function to initailize document request call */
  async initAllDocumentAsyncFunctionCall() {
    try {
      await Promise.all([
        this.getDesignateOwners(),
        this.getDocumentSettings(false)
      ]);
    } catch (err) {
    }
  }

  /**** function to initialize edit document request */
  async initAllEditDocumentAsyncFunctionCall() {
    // this.loading = true;
    try {
      await Promise.all([
        this.getDocumentSettings(true),
        this.getDesignateOwners(),
      ]).then(async ()=>{
        await this.getFilesList()
      });
      const categories = [];
      this.displayCategories.forEach(ele => {
        categories.push(ele.id);
      });
      this.tempParams = {
        coOwnerId: this.tempselectedcoOwner,
        id: this.editDocumentForm.get('id').value,
        isFillableTemplate: this.isFillableTemplate,
        isDraftingTemplate: this.isDraftingTemplate,
        nameOfFile: this.editDocumentForm.get('nameOfFile').value,
        ownerId: this.editDocumentForm.get('ownerId').value,
        status: this.editDocumentForm.get('status').value,
        categories: (categories.length) ? categories : []
      };
      // this.loading = false;
    } catch (err) {
    }
  }

  async getDocumentSettings(isEditMode?: boolean) {
    let resp: any = await this.documentSettingService.v1DocumentSettingTenantTenantIdGet({ tenantId: this.currentUserInfo.tenantId }).toPromise();

    resp = JSON.parse(resp).results;
    this.esignEnabled = resp.isSignatureEnable ? true : false;

    if (!this.esignEnabled && isEditMode) {
      // const idx = this.docAttributes.findIndex(x => x.id === 'containsESignatureFields');
      // if (idx > -1) {
        // (this.docAttributes[idx] as any).checked = false;
        // (this.docAttributes[idx] as any).disabled = true;
      // }

      this.docAttributes = this.docAttributes.filter(x => x.id != 'containsESignatureFields')
    }
  }

  /**
   *
   * @param event
   * Function to configure selected files for upload
   */
  public selectedFile(event: any) {
    this.fileErrorMsg = '';
    for (let i = 0; i < event.length; i++) {
      const obj = event[i];
      event[i].folderId = this.documentForm.get('folderId').value;
      event[i].originalFileName = event[i].name;
      event[i].isFileSizeError = false;
      event[i].isDraftingTemplate = false;
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
      event[i].dmsFileStatus = DMSFileStatus.VerifyFileName;
      event[i].isAlreadySelected = (this.fileArray.some(item => item.originalFileName === event[i].name));
      event[i].attributesArray = [
        { id: 1, name: 'Drafting Template' },
        { id: 2, name: 'Fillable Template' },
        { id: 3, name: 'Contains E-Signature Fields' }
      ];
      event[i].title = 'Select document attributes';
      this.nameOfFile = obj.name;
      if (this.commonService.bytesToSize(obj.size) > 25) {
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

      if (!this.esignEnabled) {
        // const idx = event[i].attributesArray.findIndex(x => x.id === 3);
        // if (idx > -1) {
        //   (event[i].attributesArray[idx] as any).disabled = true;
        // }
        event[i].attributesArray = event[i].attributesArray.filter(x => x.id != 3);
      } else if((['docx', 'pdf'].indexOf(fileExtenson)) === -1) {
        const idx = event[i].attributesArray.findIndex(x => x.id === 3);
        if (idx > -1) {
          (event[i].attributesArray[idx] as any).disabled = true;
        }
      }

      if (this.blockedExtension.some((ext) => ext.extension === `.${fileExtenson}`)) {
        this.fileErrorMsg = this.errorData.not_allowed_file_error;
        return;
      }
      this.dataEntered = true;
    }
    const files: any = Array.from(event);
    files.filter(item => !item.isAlreadySelected);
    this.fileArray = this.fileArray.concat(files);
    if (this.fileArray.length > 0) {
      this.dataEntered = true;
    }
    this.verifyFileNames(true);
  }

  async verifyFileNames(isFirstCall?: boolean) {
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
      const value: any = this.documentForm.value;
      value.file = item.file;

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
        // item.isExistError = this.errorData.file_name_required;
        if (lastIteration) {
          // to stop the loader
          this.loading = false;
        }
        continue;
      }
      /*for file name ends*/
      const file = item;
      this.fileForm.setValue({
        file: null
      });
      /** verification ends */

      /*for categories*/
      const categories = [];
      let CommaCategories = null;
      this.displayCategories.forEach(ele => {
        categories.push(ele.id);
      });
      if (categories.length) {
        CommaCategories = categories.join(',');
      }
      /*for categories end */
      const param: any = {
        folderId: value.folderId,
        nameOfFile: nameofFile,
        status: 'Active',
        isFillableTemplate: item.isFillableTemplate,
        isDraftingTemplate: item.isDraftingTemplate,
        ownerId: +this.currentUserInfo.id,
        body: this.fileForm.value,
        commaCategories: CommaCategories,
        containsESignatureFields: item.iseSignatureField,
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
      const index = actions.index;
      if (response.dmsFileStatus != 'VerifyFileNamePassed') {
        this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
        this.fileArray[index].isScanFailed = true; // to show Red badge
        if (this.fileArray[index].isScanPassed) {// if verfication gets failed after scan passed
          this.fileArray[index].isScanPassed = false;
        }
        this.fileArray[index].isScanned = false;
      } else {
        this.fileArray[index].fileId = response.id;
        this.fileArray[index].isScanPassed = true;
        this.fileArray[index].isScanned = true;
      }
      if (actions.lastIteration || retry) {
        this.loading = false;
      }
      this.checkIfScanPassedDocsExistFn();
      this.loading = false;
    } catch (err) {
      this.loading = false;
    }
  }


  async verifyDoc(actions: IDocumentAction) {
    if (this.fileArray.length) {
      let lastIteration = false;
      const arrLength = this.fileArray.length;
      for (const key in this.fileArray) {
        const index = parseInt(key, 10);
        const item = this.fileArray[key];

        if (index === arrLength - 1) {
          lastIteration = true;
        }

        if (item.isScanned && actions.isVerify) {
          // check if the docs in the array is passed so there is no api call for thm when new file added to the array
          continue;
        }

        if (!item.isScanPassed && actions.isUpload) {
          if (lastIteration) {
            this.manageRouting();
          }
          // Skipping the docs that have not passed the scan for Uploading
          continue;
        }

        if (actions.isUpload) {
          this.loading = true;
        }

        const value: any = this.documentForm.value;
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

        /*for categories*/
        const categories = [];
        let CommaCategories = null;
        this.displayCategories.forEach(ele => {
          categories.push(ele.id);
        });
        if (categories.length) {
          CommaCategories = categories.join(',');
        }
        /*for categories end */
        const param: any = {
          folderId: value.folderId,
          nameOfFile: nameofFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          commaCategories: CommaCategories,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: (actions.isCancel) ? DMSFileStatus.UploadCancelled : (actions.isVerify) ? DMSFileStatus.VerifyFileName : (actions.isScanOnly) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadInProgress,
          actualFile: file,
          originalFileName: item.originalFileName,
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

    }
  }

  /**
   *
   * @param index
   * Function to remove image from preview
   */
  async removeImage(index: number) {
    if (this.subscriptionArray[index]) {
      // If the scan is in progress and user selects to remove the document
      this.subscriptionArray[index].unsubscribe();
    }
    this.fileArray.splice(index, 1);
    if (!this.fileArray.length) {
      const form = document.getElementById('fileForm') as HTMLFormElement;
      form.reset();
    }
    this.checkIfScanPassedDocsExistFn();
  }

  /**
   *
   * @param event
   * Function to get folder name on change
   */
  public onSelectionChanged(event: any) {
    const isChanged = (this.documentForm.value.folderId == event.id) ? false : true;
    this.folderLoading = false;
    this.documentForm.patchValue({
      folderId: event.id
    });
    this.dataEntered = true;
    if (this.fileArray.length && isChanged) {
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

  /**** function to get Designate Co-Owners */
  async getDesignateOwners(): Promise<any> {
    try {
      let resp: any = await this.employeeService.v1EmployeesGet$Response().toPromise();
      resp = JSON.parse(resp.body);
      this.employeeList = resp.results.filter(item => {
        return item.name = !item.companyName ? item.lastName + ', ' + item.firstName : item.companyName;
      });
      this.selectCoOwner(this.selectedCoOwner);
    } catch (err) {
    }
  }

  /*** function to upload document  */
  public async uploadDocument(actions: IDocumentAction) {
    if (actions.isUpload && !this.documentForm.valid) {
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

        if (item.isScanned && (actions.isScanOnly || actions.isVerify)) {
          // check if the docs in the array is passed so there is no api call for thm when new file added to the array
          continue;
        }

        if (!item.isScanPassed && actions.isUpload) {
          if (lastIteration) {
            this.manageRouting();
          }
          // Skipping the docs that have not passed the scan for Uploading
          continue;
        }

        if (actions.isUpload) {
          this.loading = true;
        }

        const value: any = this.documentForm.value;
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

        /*for categories*/
        const categories = [];
        let CommaCategories = null;
        this.displayCategories.forEach(ele => {
          categories.push(ele.id);
        });
        if (categories.length) {
          CommaCategories = categories.join(',');
        }
        /*for categories end */
        const param: any = {
          folderId: value.folderId,
          nameOfFile: nameofFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          commaCategories: CommaCategories,
          containsESignatureFields: item.iseSignatureField,
          dmsFileStatus: (actions.isCancel) ? DMSFileStatus.UploadCancelled : (actions.isVerify) ? DMSFileStatus.VerifyFileName : (actions.isScanOnly) ? DMSFileStatus.SecurityScanInProgress : DMSFileStatus.UploadInProgress,
          actualFile: file,
          originalFileName: item.originalFileName,
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
      this.manageRouting();
    }
  }

  public manageRouting() {
    if (this.pageType) {
      if (this.pageType === 'matter') {
        this.router.navigate(['/matter/create'], { queryParams: { clientId: this.clientId, step: 'documents', matterId: this.matterId } });
      } else if (this.pageType === 'matterDetails') {
        this.router.navigate(['/matter/dashboard'], {
          queryParams: {
            matterId: this.matterId,
            selectedtab: 'Documents'
          }
        });
      } else {
        this.router.navigate(['/contact/client-conversion'], { queryParams: { clientId: this.clientId, type: 'individual', step: 'documents', matterId: this.matterId } });
      }
    } else {
      this.router.navigate(['/manage-folders/document']);
    }
  }

  /**** function to upload file */
  async uploadFile(actions: IDocumentUpload) {
    // Unsubscrobe the APi request before cancelling
    if (actions.isCancel && this.subscriptionArray[actions.index]) {
      this.subscriptionArray[actions.index].unsubscribe();
    }
    /*
      Hit await APi request if the action if for uploading for rest scenarios(verification.scanning, cancellation) hit subscribe request for mapping and cancelling api request
    */
    if (actions.isUpload) {
      try {
        let resp: any = await this.portalService.v1DocumentPortalSendDocumentPost(actions.param).toPromise();
        resp = JSON.parse(resp);
        const status: string = resp.results.dmsFileStatus;
        this.fileArray[actions.index].currentDMSStatus = DMSFileStatus[status];
        this.dataEntered = false;
        if (resp && resp.results && resp.results.dmsFileStatus === 'UploadDone') {
          this.toaster.showSuccess(this.errorData.document_uploaded_success);
          if (this.selectedCoOwner.length > 0) {
            await this.updateDocumentProperties(resp.results, 'add', actions.lastIteration);
          } else {
            if (actions.lastIteration) {
              // if last element of the array, navigate to other route
              this.manageRouting();
            }
          }
          this.loading = false;
        } else {
          this.toaster.showError(this.errorData.server_error);
          this.loading = false;
        }
      } catch (err) {
        this.loading = false;
      }
    } else {
      this.subscriptionArray[actions.index] = this.portalService.v1DocumentPortalSendDocumentPost(actions.param).subscribe((resp: any) => {
        resp = JSON.parse(resp);
        const status: string = resp.results.dmsFileStatus;
        this.fileArray[actions.index].currentDMSStatus = DMSFileStatus[status];

        if (resp.results.dmsFileStatus !== 'VerifyFileNameFailed') {
          this.fileArray[actions.index].fileId = resp.results.id;
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
            if (this.fileArray[index].isScanPassed) {// if verfication gets failed after scan passed
              this.fileArray[index].isScanPassed = false;
            }
          }
          this.loading = false;
        }
        // If the request is for scanning
        if (actions.isScanOnly) {
          this.fileArray[actions.index].isScanPassed = (resp.results.dmsFileStatus === 'SecurityScanPassed') ? true : false;
          this.fileArray[actions.index].isScanFailed = (resp.results.dmsFileStatus === 'SecurityScanPassed' || resp.results.dmsFileStatus === 'SecurityScanInProgress') ? false : true;
          this.fileArray[actions.index].virusDetails = (resp.results.dmsFileStatus === 'SecurityScanFailedVirus') ? resp.results.dmsFileStatusDetails : null;
        }

        if (actions.isCancel && actions.lastIteration) {
          this.manageRouting();
        }
        this.checkIfScanPassedDocsExistFn();
        this.loading = false;
      }, err => {
        this.loading = false;
      });
    }
  }

  /***** function to edit document properties */
  async updateDocumentProperties(val: any, type: string, lastIteration: boolean = false): Promise<any> {
    this.dataEntered = false;
    this.loading = true;
    if (type === 'edit') {
      let providerName = false;
      if (val.nameOfFile) {
        providerName = true;
        if (val.nameOfFile.includes('.')) {
          val.nameOfFile = val.nameOfFile.substring(0, val.nameOfFile.lastIndexOf('.'));
        }
        if (!val.nameOfFile) { providerName = false; }
        if (!providerName) {
          this.toaster.showError(this.errorData.provider_name_required);
          return;
        }
        val.nameOfFile = `${val.nameOfFile}.${this.fileExtenson}`;
        val.owner = {
          id: val.ownerId
        };
      }
    }
    if (type === 'add') {
      val.nameOfFile = val.fileName;
    }
    const categories = [];
    this.displayCategories.forEach(ele => {
      categories.push(ele.id);
    });
    const params: any = {
      coOwnerId: this.selectedCoOwner,
      id: val.id,
      isFillableTemplate: val.isFillableTemplate,
      isDraftingTemplate: val.isDraftingTemplate,
      nameOfFile: val.nameOfFile,
      ownerId: val.owner.id,
      status: val.status,
      categories: (categories.length) ? categories : []
    };
    if (type === 'edit') {
      params.isFillableTemplate = this.selectedAttributes.indexOf('isFillableTemplate') > -1 ? true : false;
      params.isDraftingTemplate = this.selectedAttributes.indexOf('isDraftingTemplate') > -1 ? true : false;
      params.containsESignatureFields = this.selectedAttributes.indexOf('containsESignatureFields') > -1 && this.esignEnabled ? true : !this.esignEnabled ? this.editDoc.containsESignatureFields : false;
      if (_.isEqual(params, this.tempParams)) {
        this.loading = false;
        this.manageRouting();
        return;
      }
    }
    try {
      let resp: any = await this.dmsService.v1DmsFilePropertiesPut$Json$Response({ body: params }).toPromise();
      resp = JSON.parse(resp.body);
      if (resp.results) {
        if (type === 'edit') {
          this.toaster.showSuccess(this.errorData.document_property_updated);
          this.manageRouting();
        } else {
          if (lastIteration) {
            this.fileArray = [];
            this.documentForm.reset();
            this.clearCoOwnerFilter();
            const form = document.getElementById('fileForm') as HTMLFormElement;
            form.reset();
            this.manageRouting();
          }
        }
        this.loading = false;
      } else {
        this.toaster.showError(this.errorData.server_error);
        this.loading = false;
      }
    } catch (err) {
      this.loading = false;
    }
  }

  /*** function to get all blocked extension */
  async getBlockedExtension(): Promise<any> {
    try {
      let resp: any = await this.miscService.v1MiscFileextensionsGet$Response().toPromise();
      resp = JSON.parse(resp.body);
      this.blockedExtension = resp.results;
    } catch (err) { }
  }

  /**** function to get all files list on the basic of folder id */
  async getFilesList(): Promise<any> {
    try {
      this.loading = true;
      let resp: any = await this.dmsService.v1DmsFileIdGet({ id: this.documentId }).toPromise();
      // let resp: any = await this.dmsService.v1DmsFoldersFolderIdContentGet$Response({ folderId: this.folderId }).toPromise();
      this.loading = false;
      resp = JSON.parse(resp as any).results;
      // let documentData: any = [];
      // if (resp) {
      //   documentData = resp.files.filter((file) => +file.id === +this.documentId);
      // }
      // if (documentData.length) {
      this.isDraftingTemplate = resp.isDraftingTemplate || false;
      this.isFillableTemplate = resp.isFillableTemplate || false;
      if (resp.coOwner && resp.coOwner.length) {
        resp.coOwner.forEach(value => {
          this.tempselectedcoOwner.push(value.id);
          this.selectedCoOwner.push(value.id);
        });
        this.coOwnerTitle = '' + this.selectedCoOwner.length;
        this.employeeList.forEach((list) => {
          if (this.selectedCoOwner.includes(list.id)) {
            list.checked = true;
          } else {
            list.checked = false;
          }
        });
        this.selectCoOwner(this.selectedCoOwner);
      }
      if (resp.categories) {
        resp.categories.forEach(element => {
          this.selectedCategories.push(element.id);
        });
        this.displayCategories = resp.categories;
        this.categoriesArray.forEach((list) => {
          if (this.selectedCategories.includes(list.id)) {
            list.checked = true;
          } else {
            list.checked = false;
          }
        });
        this.getCategorySelected(this.selectedCategories);
      }
      this.fileExtenson = (resp.fileName).split('.').pop();
      this.setDocAttr(resp);
      this.editDocumentForm.patchValue({
        id: +resp.id,
        nameOfFile: (resp.fileName) ? resp.fileName : '',
        ownerId: (resp.owner) ? +resp.owner.id : null,
        status: resp.status
      });
      if (['doc', 'docx', 'pdf'].indexOf(this.sharedService.getFileExtension(resp.fileName)) === -1) {
        const idx = this.docAttributes.findIndex(x => x.id === 'isFillableTemplate');
        if (idx > -1) {
          (this.docAttributes[idx] as any).disabled = true;
        }

        const idx2 = this.docAttributes.findIndex(x => x.id === 'containsESignatureFields');
        if (idx2 > -1) {
          (this.docAttributes[idx2] as any).disabled = true;
        }
      }
      if (['docx', 'pdf'].indexOf(this.sharedService.getFileExtension(resp.fileName)) === -1 || resp.documentSigningStatus != 0) {
        const idx2 = this.docAttributes.findIndex(x => x.id === 'containsESignatureFields');
        if (idx2 > -1) {
          (this.docAttributes[idx2] as any).disabled = true;
        }
      }

      this.editDoc = resp;
      // } else {
      //   this.manageRouting();
      // }
    } catch (err) {
      this.manageRouting();
    }
  }

  setDocAttr(file) {
    this.docAttributes.map((x: any) => x.checked = false);
    this.selectedAttributes = [];

    if (file.isDraftingTemplate) {
      const idx = this.docAttributes.findIndex(x => x.id === 'isDraftingTemplate');
      if (idx > -1) {
        (this.docAttributes[idx] as any).checked = true;
        this.selectedAttributes.push('isDraftingTemplate');
      }
    }

    if (file.isFillableTemplate && ['doc', 'docx', 'pdf'].indexOf(this.sharedService.getFileExtension(file.fileName)) > -1) {
      const idx = this.docAttributes.findIndex(x => x.id === 'isFillableTemplate');
      if (idx > -1) {
        (this.docAttributes[idx] as any).checked = true;
        this.selectedAttributes.push('isFillableTemplate');
      }
    }
    if (file.containsESignatureFields && ['doc', 'docx', 'pdf'].indexOf(this.sharedService.getFileExtension(file.fileName)) > -1 && this.esignEnabled) {
      const idx = this.docAttributes.findIndex(x => x.id === 'containsESignatureFields');
      if (idx > -1) {
        (this.docAttributes[idx] as any).checked = true;
        this.selectedAttributes.push('containsESignatureFields');
      }
    }

    this.getAttributesSelected(this.selectedAttributes);
  }

  /*** select Co-Owners drop down*/
  public selectCoOwner(event) {
    this.dataEntered = true;
    this.displayCoOwners = [];
    this.coOwnerTitle = '';
    if (event.length > 0) {
      this.coOwnerTitle = event.length;
      this.selectedCoOwner.forEach(cat => {
        const employee = this.employeeList.filter(ele => +ele.id === +cat);
        if (!this.displayCoOwners.some(ele => ele.id === cat)) {
          this.displayCoOwners.push(employee[0]);
        }
      });
    } else {
      this.coOwnerTitle = 'Select Co-Owners';
    }
  }

  removeCoOwners(id: any) {
    this.selectedCoOwner = this.selectedCoOwner.filter(element => +element !== +id);
    this.displayCoOwners = this.displayCoOwners.filter(element => +element.id !== +id);
    this.employeeList.map(element => {
      if (+element.id === +id) {
        element.checked = false;
      }
    });
    this.selectCoOwner(this.selectedCoOwner);
  }

  clrEditAttributes() {
    this.selectedAttributes = [];
    this.docAttributes.forEach((item: any) => (item.checked = false));
    this.propTitle = 'Select document attributes';
  }


  /**
   * Clear Co-Owners filter
   */
  public clearCoOwnerFilter() {
    this.selectedCoOwner = [];
    this.employeeList.forEach(item => (item.checked = false));
    this.coOwnerTitle = 'Select Co-Owners';
  }

  applyFilterCoOwner() {

  }

  /**
   *
   * @param event
   * Function to get the selected categories
   */
  public getCategorySelected(event: any) {
    this.dataEntered = true;
    this.displayCategories = [];
    if (!event.length) {
      this.title = 'Select Categories';
    } else {
      this.selectedCategories = event;
      this.title = (event.length).toString();
      this.selectedCategories.forEach(cat => {
        const category = this.categoriesArray.filter(ele => +ele.id === +cat);
        if (!this.displayCategories.some(ele => ele.id === cat)) {
          this.displayCategories.push(category[0]);
        }
      });
      this.displayCategories = this.sortCategory(this.displayCategories);
    }
  }

  getAttributesSelected(event) {
    if (!event.length) {
      this.propTitle = 'Select document attributes';
    } else {
      this.propTitle = (event.length).toString();
      this.selectedAttributes = event;
    }
  }

  onMultiSelectSelectedOptions(event) {
  }

  clrFiltercategory() {
    this.selectedCategories = [];
    this.title = 'Select Categories';
    this.displayCategories = [];
    this.categoriesArray.forEach(item => (item.checked = false));
  }

  applyFilter(event: any) {
  }

  getCategories() {
    this.dmsService.v1DmsFileCategoriesGet().subscribe((res: any) => {
      this.categoriesArray = JSON.parse(res).results;
    });
  }

  removeCategory(id: any) {
    this.selectedCategories = this.selectedCategories.filter(element => +element !== +id);
    this.displayCategories = this.displayCategories.filter(element => +element.id !== +id);
    this.categoriesArray.map(element => {
      if (+element.id === +id) {
        element.checked = false;
      }
    });
    this.getCategorySelected(this.selectedCategories);
  }


  sortCategory(arr: Array<any>) {
    arr.sort((a, b) => {
      if (a.name < b.name) { return -1; }
      if (a.name > b.name) { return 1; }
      return 0;
    });
    return arr;
  }

  validateFileType(file?): void {
    const filename = file ? file.name : this.editDocumentForm.value.nameOfFile;
    const message = file ? 'Please upload PDF or DOCX document.' : 'Valid for PDF and DOCX Only.';
    if (['doc', 'docx', 'pdf'].indexOf(this.sharedService.getFileExtension(filename)) === -1) {
      this.toaster.showError(message);
    }
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }


  getAttributeSelected(event: any, i) {
    this.dataEntered = true;
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

  retryScan(index: any, isNameChanged?: boolean) {
    const item = this.fileArray[index];
    this.fileLoading = false;
    if (item.isScanPassed && !isNameChanged) {
      // If scan is passed and no name change call is there
      return;
    }
    this.fileArray[index].isExistError = null;
    this.fileArray[index].isScanned = false;
    this.fileArray[index].isScanFailed = false;
    if (this.fileArray[index].isScanPassed) {
      // If scan passed document gets it name changed
      this.fileArray[index].isScanPassed = false;
    }
    const value: any = this.documentForm.value;
    value.file = item.file;
    let nameofFile = '';
    let providerName = false;
    if (item.nameOfFile) {
      providerName = true;
      nameofFile = `${item.nameOfFile}.${item.name.substr(item.name.lastIndexOf('.') + 1)}`;
    }
    if (!providerName) {
      item.isScanFailed = item.isScanned = true;
      // item.isExistError = this.errorData.file_name_required;
      return;
    }

    const file = item;
    this.fileForm.setValue({
      file
    });
    const categories = [];
    let CommaCategories = null;
    this.displayCategories.forEach(ele => {
      categories.push(ele.id);
    });
    if (categories.length) {
      CommaCategories = categories.join(',');
    }
    const param: any = {
      folderId: this.documentForm.value.folderId,
      nameOfFile: nameofFile,
      status: 'Active',
      isFillableTemplate: item.isFillableTemplate,
      isDraftingTemplate: item.isDraftingTemplate,
      ownerId: +this.currentUserInfo.id,
      body: (!isNameChanged) ? this.fileForm.value : null,
      commaCategories: CommaCategories,
      dmsFileStatus: (isNameChanged || +item.currentDMSStatus === 3) ? DMSFileStatus.VerifyFileName : DMSFileStatus.SecurityScanInProgress,
      actualFile: this.fileForm.value.file,
      originalFileName: this.fileForm.value.file.name,
      id: item.fileId ? item.fileId : null
    };
    const actions: IDocumentUpload = {
      isCancel: false,
      isUpload: false,
      isScanOnly: (!isNameChanged) ? true : false,
      isVerify: (isNameChanged) ? true : false,
      index,
      param
    };
    this.VerifyFileExistOrNot(actions, true);
  }

  get checkIfScanPassedDocsExist() {
    return this.fileArray.length && this.fileArray.every(obj => obj.isScanPassed);
  }

  checkIfScanPassedDocsExistFn() {
    return this.fileArray.length && this.fileArray.every(obj => obj.isScanPassed);
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
    } else {
      this.fileArray[index].isExistError = this.errorData.file_name_required;
    }
    }, 1000);
  }

  fileNameChanged() {
    this.isExistError = null;
    let name = this.editDocumentForm.value.nameOfFile.trim();
    if (!name || !name.trim()) {
      return;
    }

    if (this.reqTimout) {
      clearTimeout(this.reqTimout);
      this.reqTimout = null;
    }

    this.reqTimout = setTimeout(async () => {
      try {
        if (name.includes('.')) {
          const ext = this.editDoc.fileName.substring(this.editDoc.fileName.lastIndexOf('.') + 1, this.editDoc.fileName.length);
          name = (this.extensionsArray.includes(ext)) ? name.substring(0, +name.lastIndexOf('.')) : name;
        }

        name = `${name.trim()}.${this.editDoc.fileName.substr(this.editDoc.fileName.lastIndexOf('.') + 1)}`;

        let res: any = await this.dmsService.v1DmsFileIsFileExistGet({
          folderId: this.folderId,
          fileName: name
        }).toPromise();

        res = JSON.parse(res).results;
        this.isExistError = res === +this.documentId || !res ? false : this.errorData.document_exists_err;
      } catch (e) {
        this.loading = false;
      }
    }, 400);
  }

  sendFilesForScan() {
    if (this.isOffline) {
      return;
    }
    if (this.fileArray.every(item => !item.isScanFailed && !item.isExistError)) {
      this.fileArray.forEach(file => {
        file.displayCategories = this.displayCategories;
        file.coOwnerId = this.selectedCoOwner;
        file.folderId = this.documentForm.value.folderId;
        file.nameOfFile = `${file.nameOfFile}.${this.sharedService.getFileExtension(file.name)}`;
      });
      this.commonService.docs.next(this.fileArray);
      this.manageRouting();
    }
  }
  crossBtnClick() {
    this.fileErrorMsg = '';
  }

  checkIfDocNameAlreadyExistsInFiles(index) {
    const fileArray = JSON.parse(JSON.stringify(this.fileArray));
    fileArray.splice(index, 1);
    this.fileArray[index].nameOfFile = this.fileArray[index].nameOfFile.trim();
    const changeFileName = this.fileArray[index].nameOfFile;
    const idx: any = fileArray.findIndex(e => e.nameOfFile === changeFileName);
    return idx;
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  public async verifyFileName(index?) {
    this.fileArray[index].isExistError = '';
    if (this.fileArray[index].nameOfFile) {
      this.loading = true;
      try {
        const resp: any = await this.dmsService
          .v1DmsFileIsFileExistGet({ folderId: this.documentForm.value.folderId, fileName: this.fileArray[index].nameOfFile })
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
