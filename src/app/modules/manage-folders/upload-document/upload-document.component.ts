import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
  encapsulation: ViewEncapsulation.Emulated
})
export class UploadDocumentComponent implements OnInit, IBackButtonGuard, OnDestroy {
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
  private currentUserInfo: any;
  private fileExtenson = '';
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
  showDocumentError = [];
  public errorSelectFolder = '';
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
  ];
  esignEnabled = false;
  public reqTimout: any;
  public folderLoading = true;
  editDoc = null;
  isExistError = null;
  fileLoading: boolean;

  constructor(
    private dmsService: DmsService,
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
    private documentSettingService: DocumentSettingService,
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
  }

  ngOnDestroy() {
    UtilsHelper.removeObject('multiFolderSelection');
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
      this.initAllEditDocumentAsyncFunctionCall();
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
    try {
      await Promise.all([
        this.getFilesList(),
        this.getDesignateOwners(),
        this.getDocumentSettings(true)
      ]);
    } catch (err) {
    }
  }

  async getDocumentSettings(isEditMode?: boolean) {
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    let resp: any = await this.documentSettingService.v1DocumentSettingTenantTenantIdGet({ tenantId: userDetails.tenantId }).toPromise();

    resp = JSON.parse(resp).results;
    this.esignEnabled = resp.isSignatureEnable ? true : false;
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
      event[i].originalFileName = event[i].name;
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
      event[i].currentDMSStatus = DMSFileStatus.SecurityScanInProgress;
      event[i].dmsFileStatus = DMSFileStatus.VerifyFileName;
      event[i].attributesArray = [
        { id: 1, name: 'Drafting Template' },
        { id: 2, name: 'Fillable Template' },
      ];
      event[i].title = 'Select document attributes';
      if (this.commonService.bytesToSize(obj.size) > 2000) {
        this.fileErrorMsg = 'The file ' + obj.name + ' exceeds the maximum file size limit.';
        return;
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
    this.fileArray = this.fileArray.concat(Array.from(event));
    if (this.fileArray.length > 0) {
      this.dataEntered = true;
    }
    this.showDocumentError[this.fileArray.length] = false;
    const params: IDocumentAction = {
      isCancel: false,
      isUpload: false,
      isScanOnly: false,
      isVerify: true

    };
    this.uploadDocument(params);
  }

  /**
   *
   * @param index
   * Function to remove image from preview
   */
  async removeImage(index: number) {
    const value = this.fileArray[index];
    if (!value.isExistError && (value.isScanFailed || value.isScanPassed)) {
      this.loading = true;
      const params: any = {
        folderId: value.folderId,
        nameOfFile: value.nameofFile,
        status: 'Active',
        isFillableTemplate: value.isFillableTemplate,
        isDraftingTemplate: value.isDraftingTemplate,
        ownerId: +this.currentUserInfo.id,
        body: { file: null },
        commaCategories: null,
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

  /**
   *
   * @param event
   * Function to get folder name on change
   */
  public onSelectionChanged(event: any) {
    this.folderLoading = false;
    this.documentForm.patchValue({
      folderId: event.id
    });
    this.dataEntered = true;
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
          nameOfFile: item.nameOfFile,
          status: 'Active',
          isFillableTemplate: item.isFillableTemplate,
          isDraftingTemplate: item.isDraftingTemplate,
          ownerId: +this.currentUserInfo.id,
          body: this.fileForm.value,
          commaCategories: CommaCategories,
          // containsESignatureFields: item.iseSignatureField,
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
      this.cancel();
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
          this.fileArray[actions.index].isScanPassed = (resp.results.dmsFileStatus === 'SecurityScanPassed');
          this.fileArray[actions.index].isScanFailed = (!(resp.results.dmsFileStatus === 'SecurityScanPassed' || resp.results.dmsFileStatus === 'SecurityScanInProgress'));
          this.fileArray[actions.index].virusDetails = (resp.results.dmsFileStatus === 'SecurityScanFailedVirus') ? resp.results.dmsFileStatusDetails : null;
        }

        if (actions.isCancel && actions.lastIteration) {
          this.manageRouting();
        }
        this.checkIfScanPassedDocsExist();
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
      params.isFillableTemplate = this.selectedAttributes.indexOf('isFillableTemplate') > -1;
      params.isDraftingTemplate = this.selectedAttributes.indexOf('isDraftingTemplate') > -1 ? true : false;
      // params.containsESignatureFields = this.selectedAttributes.indexOf('containsESignatureFields') > -1 && this.esignEnabled ? true : false;
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
    this.loading = true;
    try {
      let resp: any = await this.dmsService.v1DmsFoldersFolderIdContentGet$Response({ folderId: this.folderId }).toPromise();
      this.loading = false;
      resp = JSON.parse(resp.body).results;
      let documentData: any = [];
      if (resp.files && resp.files.length) {
        documentData = resp.files.filter((file) => +file.id === +this.documentId);
      }
      if (documentData.length) {
        if (documentData[0].coOwner && documentData[0].coOwner.length) {
          documentData[0].coOwner.forEach(value => {
            this.selectedCoOwner.push(value.id);
          });
          this.coOwnerTitle = '' + this.selectedCoOwner.length;
          this.employeeList.forEach((list) => {
            list.checked = this.selectedCoOwner.includes(list.id);
          });
          this.selectCoOwner(this.selectedCoOwner);
        }
        if (documentData[0].categories) {
          documentData[0].categories.forEach(element => {
            this.selectedCategories.push(element.id);
          });
          this.displayCategories = documentData[0].categories;
          this.categoriesArray.forEach((list) => {
            list.checked = this.selectedCategories.includes(list.id);
          });
          this.getCategorySelected(this.selectedCategories);
        }
        this.fileExtenson = (documentData[0].fileName).split('.').pop();
        this.setDocAttr(documentData[0]);
        this.editDocumentForm.patchValue({
          id: +documentData[0].id,
          nameOfFile: (documentData[0].fileName) ? documentData[0].fileName : '',
          ownerId: (documentData[0].owner) ? +documentData[0].owner.id : null,
          status: documentData[0].status
        });
        if (['doc', 'docx', 'pdf'].indexOf(this.sharedService.getFileExtension(documentData[0].fileName)) === -1) {
          const idx = this.docAttributes.findIndex(x => x.id === 'isFillableTemplate');
          if (idx > -1) {
            (this.docAttributes[idx] as any).disabled = true;
          }
        }
        this.editDoc = documentData[0];
      } else {
        this.manageRouting();
      }
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

  cancel() {
    this.manageRouting();
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

  async retryScan(index: any, isNameChanged?: boolean) {
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
    this.checkIfScanPassedDocsExist();
    const value: any = this.documentForm.value;
    value.file = item.file;
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
    await this.uploadFile(actions);
  }

  checkIfScanPassedDocsExist() {
    this.scanPassDocsExist = this.fileArray.length && this.fileArray.some(obj => obj.isScanPassed && !obj.isExistError);
  }

  async cancelFilesUpload() {
    if (this.isEditMode) {
      return this.cancel();
    }

    const data: IDocumentAction = {
      isCancel: true,
      isUpload: false,
      isVerify: false,
      isScanOnly: false,
    };
    this.uploadDocument(data);
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
      const fileArray = JSON.parse(JSON.stringify(this.fileArray));
      fileArray.splice(index, 1);
      this.fileArray[index].nameOfFile = this.fileArray[index].nameOfFile.trim();
      const changeFileName = this.fileArray[index].nameOfFile;
      const idx: any = fileArray.findIndex(e => e.nameOfFile === changeFileName);
      if (idx === -1) {
        let nameofFile = '';
        if (this.fileArray[index].nameOfFile) {
          if (this.fileArray[index].nameOfFile.includes('.')) {
            const ext = this.fileArray[index].nameOfFile.substring(this.fileArray[index].nameOfFile.lastIndexOf('.') + 1, this.fileArray[index].nameOfFile.length);
            this.fileArray[index].nameOfFile = (this.extensionsArray.includes(ext)) ? this.fileArray[index].nameOfFile.substring(0, + this.fileArray[index].nameOfFile.lastIndexOf('.')) : this.fileArray[index].nameOfFile;
          }
          nameofFile = `${this.fileArray[index].nameOfFile}.${this.fileArray[index].name.substr(this.fileArray[index].name.lastIndexOf('.') + 1)}`;
        }
        if (nameofFile) {
          this.fileLoading = true;
          this.dmsService.v1DmsFileIsFileExistGet({
            folderId: this.documentForm.value.folderId,
            fileName: nameofFile
          }).subscribe((data: any) => {
            const existingId = JSON.parse(data).results;
            const isExists = existingId > 0 && existingId !== this.fileArray[index].fileId;
            if (isExists) {
              this.fileArray[index].isExistError = this.errorData.folder_contain_doc_error; //  to show the error
              this.fileLoading = false;
              this.checkIfScanPassedDocsExist();
            } else if (existingId !== this.fileArray[index].fileId) {
              this.retryScan(index, true);
            } else {
              this.fileArray[index].isExistError = false;
              this.fileLoading = false;
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
        this.isExistError = res === +this.documentId || !res ? false : this.errorData.document_exists_err_replace;
      } catch (e) {
        this.loading = false;
      }
    }, 400);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}

