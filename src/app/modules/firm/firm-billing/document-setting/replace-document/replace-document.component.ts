import { Component, EventEmitter, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subscription } from 'rxjs';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errorData from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { ClientAssociationService, DmsService, DocumentSettingService } from 'src/common/swagger-providers/services';

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

@Component({
  selector: 'app-replace-document',
  templateUrl: './replace-document.component.html',
  styleUrls: ['./replace-document.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ReplaceDocumentComponent implements OnInit, IBackButtonGuard {
  public scrollbarOptions = { axis: 'y', theme: 'dark-3' };
  public loading = true;
  public fileData: any;
  public documentTitle = '';
  private folderId: number;
  private documentId: number;
  public documentData: any;
  public documentForm: FormGroup;
  public errorData: any = (errorData as any).default;
  public fileExtenson = '';
  public isReplacedDocFillableTemplate = false;
  public isReplacedDoccontainsEsigns = false;
  public isReplacedDocDraftingTemplate = false;
  public currentIndex;
  pageType: any;
  clientId: any;
  searchList: any;
  classApplied = false;
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  selectedTextVisible: any;
  selectedEmployeeCount = 0;
  searchActive = false;
  matterId: any;
  esignEnabled = false;
  signatureHistoryWarning = false;
  request: Subscription;
  public extensionsArray: Array<any> = UtilsHelper.getDocExtensions();
  selectedAttArr = [];
  title = 'Select document attributes';
  attributesArray = [
    { id: 1, name: 'Drafting Template' },
    { id: 2, name: 'Fillable Template' },
    { id: 3, name: 'Contains E-Signature Fields' }
  ];
  initialFileSelected = false;
  isFillableTemplate = false;

  constructor(
    public sharedService: SharedService,
    private route: Router, private dmsService: DmsService,
    private clientAssociationService: ClientAssociationService,
    private formBuilder: FormBuilder, private toaster: ToastDisplay,
    private activateRoute: ActivatedRoute,
    public commonService: CommonService,
    private router: Router,
    private documentSettingService: DocumentSettingService,
    private pagetitle: Title
  ) {
    this.activateRoute.queryParams.subscribe(params => {
      this.documentId = parseInt(params.documentId, 10);
      this.folderId = parseInt(params.folderId, 10);
      this.clientId = parseInt(params.clientId, 10);
      this.matterId = parseInt(params.matterId, 10);
      this.pageType = params.pageType;
    });
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  async ngOnInit() {
    this.pagetitle.setTitle('Replace Document');
    this.getFileData();
    this.createDocumentForm();
    await this.getDocumentSettings();
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93', 
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true,
    };
    this.documentForm.controls.nameOfFile.valueChanges.debounceTime(1000).subscribe(val => {
      if (this.fileData && !this.initialFileSelected) {
        this.onNameChanged(this.documentForm.value);
      } else {
        this.initialFileSelected = false;
      }
    });
  }

  onNameChanged(fileData) {
    this.initialFileSelected = false;
    let nameofFile = '';
    if (fileData.nameOfFile && fileData.nameOfFile.trim() != '') {
      fileData.nameOfFile = fileData.nameOfFile.trim();
      if (fileData.nameOfFile.includes('.')) {
        const ext = fileData.nameOfFile.substring(fileData.nameOfFile.lastIndexOf('.') + 1, fileData.nameOfFile.length);
        fileData.nameOfFile = (this.extensionsArray.includes(ext)) ? fileData.nameOfFile.substring(0, + fileData.nameOfFile.lastIndexOf('.')) : fileData.nameOfFile;
      }
      nameofFile = `${fileData.nameOfFile}.${this.fileData.name.substr(this.fileData.name.lastIndexOf('.') + 1)}`;
    } else {
      this.fileData.isExistError = this.errorData.file_name_required;
      return
    }
    nameofFile = nameofFile.trim();
    if (nameofFile) {
      document.getElementById('name-of-file').blur();
      this.loading = true;
      if(this.request) this.request.unsubscribe() 
      this.request = this.dmsService.v1DmsPracticeareaFileIsFileExistGet({
        folderId: this.documentForm.value.folderId,
        fileName: fileData.nameOfFile
      }).subscribe((data: any) => {
        const existingId = JSON.parse(data).results;
        const isExists = existingId > 0 && existingId !== this.documentData.id;
        if (isExists) {
          this.fileData.isExistError = this.errorData.folder_contain_doc_error; //  to show the error
        }else {
          this.fileData.isScanPassed = this.documentData.dmsFileStatus === 'UploadDone' || this.documentData.dmsFileStatus === 'SecurityScanPassed';
          this.fileData.isScanFailed = false;
          this.fileData.isExistError = false;
        }
        this.loading = false;
      }, () => {
        this.loading = false;
      });
    }
  }

  /*****function to create document form */
  createDocumentForm(): void {
    this.documentForm = this.formBuilder.group({
      folderId: [this.folderId, Validators.required],
      nameOfFile: [null, Validators.required],
      searchterm: null,
      notifyUser: null,
      aettorneyuser: null,
      external_user: null,
      shared_option: 'do_not_share',
      status: ['Active'],
      isFillableTemplate: [false],
      isDraftingTemplate: [false],
      containsESignatureFields: [false],
      ownerId: [null]
    });
  }

  /***function to select the document */
  async selectedFile(event: any) {
    if (!event.length) {
      return;
    }

    this.isReplacedDocFillableTemplate = false;
    this.isReplacedDoccontainsEsigns = false;
    this.isReplacedDocDraftingTemplate = false;

    if (event) {
      this.dataEntered = true;
    }

    let isFileSizeError = false;
    if (this.commonService.bytesToSize(event[0].size) > 25) {
      isFileSizeError = true;
    }

    const fileName = event[0].name;
    this.fileExtenson = this.sharedService.getFileExtension(fileName);
    if (this.documentData && this.documentData.isFillableTemplate && this.fileExtenson !== 'pdf' && this.fileExtenson !== 'docx') {
      return;
    }
    this.attributesArray.forEach(x => {
      (x as any).disabled = false;
      (x as any).checked = false;
    });
    this.selectedAttArr = [];
    if (((['docx', 'pdf'].indexOf(this.fileExtenson)) === -1)) {
      const idx = this.attributesArray.findIndex(x => x.id === 2);
      if (idx > -1) {
        (this.attributesArray[idx] as any).disabled = true;
      }
    }

    if(!this.esignEnabled){
      this.attributesArray = this.attributesArray.filter(x => x.id != 3);
    } else if ((['docx', 'pdf'].indexOf(this.fileExtenson)) === -1) {
      const idx = this.attributesArray.findIndex(x => x.id === 3);
      if (idx > -1) {
        (this.attributesArray[idx] as any).disabled = true;
      }
    }
    this.fileData = event[0];
    this.fileData.isFileSizeError = isFileSizeError;
    this.isReplacedDocFillableTemplate = this.documentData.isFillableTemplate;
    this.isReplacedDocDraftingTemplate = this.documentData.isDraftingTemplate;
    this.attributesArray.forEach((element: any) => {
      if (element.id == 1) {
        element.checked = this.isReplacedDocDraftingTemplate;
      } else if(element.id == 2) {
        element.checked = this.isReplacedDocFillableTemplate;
      } else if (element.id == 3 && this.esignEnabled){
        element.checked = ((['docx', 'pdf'].indexOf(this.fileExtenson)) > -1) && this.documentData.containsESignatureFields ? true : false;
      }
      if (element.checked) {
        this.selectedAttArr.push(element.id)
      }
    });
    this.title = this.selectedAttArr.length ? this.selectedAttArr.length as any : 'Select document attributes';
    this.initialFileSelected = true;
    this.documentForm.patchValue({
      nameOfFile: fileName,
    });
    const data: IDocumentAction = {
      isCancel: false,
      isScanOnly: false,
      isVerify: true,
      isUpload: false
    };
    if(!this.fileData.isFileSizeError){
      await this.ReplaceDocument(data);
    }
  }

  /** function to remove the document */
  removeImage() {
    this.currentIndex = false;
    if (this.request) {
      this.request.unsubscribe();
    }
    delete this.fileData;
    (document.getElementById('fileForm') as HTMLFormElement).reset();
  }

  /***function to replace and upload new document */
  async ReplaceDocument(actions: IDocumentAction) {
    if (!actions.isScanOnly && !this.documentForm.valid) {
      return;
    }
    if (this.fileData) {
      this.dataEntered = false;
      this.loading = true;
      if (this.documentData.checkedOutTo && !actions.isScanOnly) {
        await this.documentCheckIn();
      }
      const value: any = this.getRequestParams(actions);
      // console.log(value);
      this.request = this.dmsService.v1DmsPracticeAreaFileReplacePost(value).subscribe((res: any) => {
        const response = JSON.parse(res).results;
        this.loading = false;
        if (actions.isVerify) {
          if (response && response.dmsFileStatus === 'VerifyFileNamePassed') {
            this.fileData.isScanPassed = true;
          } else {
            this.fileData.isExistError = this.errorData.folder_contain_doc_error;
            this.fileData.isScanFailed = true;
            if (this.fileData.isScanPassed) {
              this.fileData.isScanPassed = false;
            }
          }
        }

        // if (actions.isScanOnly) {
        //   this.fileData.isScanPassed = (response.dmsFileStatus === 'SecurityScanPassed');
        //   this.fileData.isScanFailed = (!(response.dmsFileStatus === 'SecurityScanPassed' || response.dmsFileStatus === 'SecurityScanInProgress'));
        //   this.fileData.virusDetails = (response.dmsFileStatus === 'SecurityScanFailedVirus') ? response.dmsFileStatusDetails : null;
        // }

        // if (actions.isUpload) {
        //   if (response && response.dmsFileStatus === 'UploadDone') {
        //     this.toaster.success(this.errorData.document_replaced_success, 'Success');
        //     this.manageRouting();
        //   } else {
        //     this.toaster.error(this.errorData.server_error, 'Error');
        //   }
        // }

        this.loading = false;
      }, err => {
        this.loading = false;
      });
    }
  }

  /***function to get the documentData */
  getFileData() {
    this.loading = true;
    const param = { practiceareaId: this.folderId, practiceArea: false };

    this.documentSettingService.v1DocumentSettingPracticeareaPracticeareaIdGet(param).subscribe((response: any) => {
      const res: any = JSON.parse(response as any);
      if (res.results && res.results.files) {
        const currentDocument = res.results.files.filter(fileObj => fileObj.id === +this.documentId);
        this.documentData = currentDocument[0];
      }
      this.isFillableTemplate = this.documentData.isFillableTemplate;
      this.isReplacedDocDraftingTemplate = this.documentData.isDraftingTemplate;
      this.isReplacedDocFillableTemplate = this.documentData.isFillableTemplate;
      this.documentTitle = this.documentData.fileName;
      // signatureHistoryWarning
      if (
        this.documentData && this.documentData.documentSigningStatus &&
        this.documentData.containsESignatureFields
      ) {
        this.signatureHistoryWarning = true;
      }
      this.documentForm.patchValue({
        folderId: this.folderId,
        isFillableTemplate: this.documentData ? this.documentData.isFillableTemplate : false,
        containsESignatureFields: this.documentData ? this.documentData.containsESignatureFields : false,
        isDraftingTemplate: this.documentData ?  this.documentData.isDraftingTemplate : false,
        status: 'Active',
        ownerId: this.documentData.owner ? this.documentData.owner.id : 0,
      });
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }

  /***function to reset form */
  clearfileData() {
    delete this.fileData;
    this.documentForm.reset();
  }

  public async documentCheckIn() {
    try {
      this.loading = true;
      const resp = await this.dmsService.v1DmsFileCheckinDmsFileIdGet({ dmsFileId: +this.documentData.id }).toPromise();
      const mess = JSON.parse(resp as any).results;
      if (typeof (+mess) !== 'number') {
        this.toaster.showError(mess);
      }
      this.loading = false;
    } catch (err) {
      this.loading = false;
    }
  }

  public manageRouting() {
    setTimeout(() => {
      this.route.navigate(['/firm/document-setting/matter-folder']);
    }, 100);
  }

  openSubMenu() {
    this.currentIndex = !this.currentIndex;
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  async cancel() {
    if (this.fileData) {
      const data = {
        isCancel: true,
        isUpload: false,
        isVerify: false,
        isScanOnly: false
      };
      await this.ReplaceDocument(data);
    }
    setTimeout(() => {
      this.manageRouting();
    }, 200);
  }

  async retryScan(isNameChanged?: any) {
    const data: IDocumentAction = {
      isCancel: false,
      isUpload: false,
      isVerify: false,
      isScanOnly: false
    };
    if (this.fileData.isExistError || isNameChanged) {
      data.isVerify = true;
    } else {
      data.isScanOnly = true;
    }
    this.fileData.isScanFailed = false;
    this.fileData.isExistError = false;
    if (this.fileData.isScanPassed) {
      this.fileData.isScanPassed = false;
    }
    await this.ReplaceDocument(data);
  }

  async getDocumentSettings() {
    try {
      const userDetails = JSON.parse(localStorage.getItem('profile'));
      let resp: any = await this.documentSettingService.v1DocumentSettingTenantTenantIdGet({ tenantId: userDetails.tenantId }).toPromise();

      resp = JSON.parse(resp).results;
      this.esignEnabled = resp.isSignatureEnable ? true : false;
      this.loading = false;
    } catch (e) {
      this.loading = false;
    }
  }
  /**
   * to select attributes
   */
  getAttributeSelected(event: any) {
    this.assignFalseToAttributes();
    if (event && event.length) {
      this.title = event.length;
      event.forEach(element => {
        switch (element) {
          case 1:
            this.documentData.isDraftingTemplate = true;
            break;
          case 2:
            this.documentData.isFillableTemplate = true;
            break;
          case 3:
            this.documentData.containsESignatureFields = true;
            break;
        }
      });
    } else {
      this.title = 'Select document attributes';
    }
  }
  assignFalseToAttributes() {
    this.documentData.isDraftingTemplate = false;
    this.documentData.isFillableTemplate = false;
    this.documentData.containsESignatureFields = false;
  }

  clrAttributes() {
    this.assignFalseToAttributes();
    this.attributesArray.forEach((element: any) => {
      element.checked = false;
    });
    this.selectedAttArr = [];
    this.title = 'Select document attributes';
  }

  getRequestParams(actions?, isFinal?: boolean){      
      const value: any = this.documentForm.value;
      value.id = this.documentId;
      value.body = {
        file: (actions && actions.isScanOnly) || isFinal ? this.fileData : null
      };
      if (value.nameOfFile) {
        if (value.nameOfFile.includes('.')) {
          value.nameOfFile = value.nameOfFile.substring(0, value.nameOfFile.lastIndexOf('.'));
        }
        value.nameOfFile = `${value.nameOfFile}.${this.fileExtenson}`;
      }
      value.isFillableTemplate = this.documentData.isFillableTemplate;
      value.isDraftingTemplate = this.documentData.isDraftingTemplate;
      value.containsESignatureFields = this.documentData.containsESignatureFields;
      value.originalFileName = this.fileData.name;
      value.OwnerId = 0;
      if(isFinal){
        value.name = this.fileData.name;
        value.isAdminSettingRelpaceFile = true;
        value.actualFile = this.fileData;
      } else {
        value.dmsFileStatus = actions.isVerify ? DMSFileStatus.VerifyFileName : actions.isScanOnly ? DMSFileStatus.SecurityScanInProgress : actions.isCancel ? DMSFileStatus.UploadCancelled : DMSFileStatus.UploadInProgress;
      }
      return value;
  }

  senFileForScan() {
    let value: any = this.getRequestParams(null, true);
    let file: any = [value];
    this.commonService.docs.next(file);
    this.manageRouting();
  }
}
