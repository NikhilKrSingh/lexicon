import { Component, EventEmitter, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subscription } from 'rxjs';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { CommonService } from 'src/app/service/common.service';
import { ClientAssociationService, DmsService, DocumentSettingService } from 'src/common/swagger-providers/services';
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

@Component({
  selector: 'app-replace-document',
  templateUrl: './replace-document.component.html',
  styleUrls: ['./replace-document.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ReplaceDocumentComponent implements OnInit, IBackButtonGuard {
  public scrollbarOptions = { axis: 'y', theme: 'dark-3' };
  public loading = false;
  public fileData: any;
  public documentTitle = '';
  private folderId: number;
  private documentId: number;
  public documentData: any;
  public documentForm: FormGroup;
  public errorData: any = (errorData as any).default;
  public fileExtenson = '';
  public currentIndex;
  pageType: any;
  clientId: any;
  aettornyList: any = [];
  sharedUserList: any = [];
  orgAettornyList: any;
  orgShredUserList: any;
  externalUserList: any;
  selectedExternalUser: any;
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
  title = 'Select document attributes';
  attributesArray = [
    { id: 1, name: 'Drafting Template' },
    { id: 2, name: 'Fillable Template' },
    { id: 3, name: 'Contains E-Signature Fields' }
  ];
  selectedAttArr = [];
  initialFileSelected = false;

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
    this.getAettorny();
    this.getSharedusers();
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
      document.getElementById('provide-name').blur();
      this.loading = true;
      if(this.request) this.request.unsubscribe() 
      this.request = this.dmsService.v1DmsFileIsFileExistGet({
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
      status: ['', Validators.required],
      isFillableTemplate: [false],
      ownerId: [null, Validators.required]
    });
  }

  /***function to select the document */
  async selectedFile(event: any) {
    if (!event.length) {
      return;
    }

    if (event) {
      this.dataEntered = true;
    }
    let isFileSizeError = false;
    if (this.commonService.bytesToSize(event[0].size) > 25) {
      isFileSizeError = true;
    }
    const fileName = event[0].name;
    this.fileExtenson = this.sharedService.getFileExtension(fileName);
    if (this.documentData.isFillableTemplate && this.fileExtenson !== 'pdf' && this.fileExtenson !== 'docx') {
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

    if (this.documentData.isFillableTemplate) {
      (this.attributesArray[1] as any).disabled = true;
    }

    this.attributesArray.forEach((element: any) => {
      if (element.id == 1) {
        element.checked = this.documentData.isDraftingTemplate;
      } else if (element.id == 2){
        element.checked = ((['docx', 'pdf'].indexOf(this.fileExtenson)) > -1) && this.documentData.isFillableTemplate ? true : false;
      } else if (element.id == 3 && this.esignEnabled){
        element.checked = ((['docx', 'pdf'].indexOf(this.fileExtenson)) > -1) && this.documentData.containsESignatureFields ? true : false;
      }
      if (element.checked) {
        this.selectedAttArr.push(element.id)
      }
    });
    let length = this.selectedAttArr.length;
    this.title = length ? this.selectedAttArr.length as any : 'Select document attributes';

    this.initialFileSelected = true;
    this.documentForm.patchValue({
      nameOfFile: fileName.substring(0, fileName.lastIndexOf('.')),
    });
    const data: IDocumentAction = {
      isCancel: false,
      isScanOnly: false,
      isVerify: true,
      isUpload: false
    };
    if (!this.fileData.isFileSizeError) {
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
      const value: any = this.prepareDataForRequest(actions);
      this.request = this.dmsService.v1DmsFileReplacePost$Response(value).subscribe((res: any) => {
        const response = JSON.parse(res.body).results;
        this.loading = false;
        if (actions.isVerify) {
          if (response && response.dmsFileStatus !== 'VerifyFileNamePassed') {
            // const uploadAction: IDocumentAction = {
            //   isScanOnly: true,
            //   isCancel: false,
            //   isUpload: false,
            //   isVerify: false
            // };
            // this.ReplaceDocument(uploadAction);
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
    this.dmsService.v1DmsFoldersFolderIdContentGet$Response({ folderId: this.folderId }).subscribe((response: any) => {
      const res = JSON.parse(response.body).results.files;
      const currentDocument = res.filter(fileObj => fileObj.id === +this.documentId);
      this.documentData = currentDocument[0];
      this.documentTitle = this.documentData ? this.documentData.fileName : '';
      
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
        isDraftingTemplate: this.documentData ? this.documentData.isDraftingTemplate : false,
        containsESignatureFields: this.documentData ? this.documentData.containsESignatureFields : false,
        status: this.documentData ? this.documentData.status : null,
        ownerId: this.documentData ? this.documentData.owner.id : null,
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
    const clientId = this.clientId;
    if (this.pageType) {
      if (this.pageType === 'matter') {
        this.route.navigate(['/matter/create'], { queryParams: { clientId, step: 'documents' } });
      } else if (this.pageType === 'matterDetails') {
        this.router.navigate(['/matter/dashboard'], {
          queryParams: {
            matterId: this.matterId,
            selectedtab: 'Documents'
          }
        });
      } else {
        this.route.navigate(['/contact/client-conversion'], { queryParams: { clientId, type: 'individual', step: 'documents' } });
      }
    } else {
      this.route.navigate(['/manage-folders/document']);
    }
  }

  public getSharedusers() {
    this.loading = true;
    this.dmsService.v1DmsDocumentSharedetailsPost$Json$Response({
      body: {
        folderId: this.folderId,
        documentId: this.documentId,
        userId: 0
      }
    }).subscribe((response: any) => {
      const res = JSON.parse(response.body).results;
      res.currentAccessList = res.currentAccessList.filter(item => {
        return item.name = item.lastName ? item.lastName + ', ' + item.firstName : item.firstName;
      });
      res.currentAccessList.sort((a, b) => a.name.localeCompare(b.name));
      this.sharedUserList = res.currentAccessList;
      this.orgShredUserList = res.currentAccessList;
      this.externalUserList = res.currentAccessList;
      if (!this.sharedUserList || !this.sharedUserList.length) {
        this.documentForm.controls['shared_option'].setValue(null);
        this.documentForm.controls['shared_option'].disable();
      }
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }

  public getAettorny() {
    if (!this.clientId) {
      return;
    }

    this.loading = true;
    this.clientAssociationService.v1ClientAssociationAllClientIdGet$Response({
      clientId: this.clientId
    }).subscribe((response: any) => {
      let res = JSON.parse(response.body).results;
      res = res.filter(item => {
        if (this.matterId) {
          if (
            item.clientId == this.clientId &&
            item.matterId == this.matterId &&
            item.associationType === 'Billing Attorney'
          ) {
            return item;
          }
        } else {
          if (
            item.clientId == this.clientId &&
            item.associationType === 'Billing Attorney'
          ) {
            return item;
          }
        }
      });
      this.aettornyList = res;
      this.orgAettornyList = res;
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }

  public toggleClass() {
    this.classApplied = !this.classApplied;
    const $toolbar = $('.mCSB_dragger > .mCSB_draggerRail');
    $toolbar.parent().after($toolbar);
  }

  public onClickedOutside(val: any) {
    if (val.target.className === 'selected-employee') {
      this.selectedTextVisible = false;
      this.classApplied = true;
    } else {
      this.classApplied = false;
      if (this.selectedEmployeeCount > 0) {
        this.selectedTextVisible = true;
      }
    }
    this.searchActive = false;
  }

  openSubMenu() {
    this.currentIndex = !this.currentIndex;
  }

  public filterNotifyUsers() {
    this.aettornyList = this.orgAettornyList.filter(item => {
      return item.firstName.toUpperCase().search(this.documentForm.value.searchterm.toUpperCase()) > -1 || item.lastName.toUpperCase().search(this.documentForm.value.searchterm.toUpperCase()) > -1;
    });

    this.sharedUserList = this.orgShredUserList.filter(item => {
      return item.firstName.toUpperCase().search(this.documentForm.value.searchterm.toUpperCase()) > -1 || item.lastName.toUpperCase().search(this.documentForm.value.searchterm.toUpperCase()) > -1;
    });
  }

  public changeNotifySelection(event, item, index, type) {
    this.selectedEmployeeCount = 0;
    if (event.srcElement.checked === true) {
      if (type === 'other') {
        this.sharedUserList = this.sharedUserList.filter(val => {
          if (val.personId == item.personId && val.securityGroup == item.securityGroup) {
            val.checked = true;
          }
          return val;
        });
      } else {
        this.aettornyList = this.aettornyList.filter(val => {
          if (val.personId == item.personId && val.securityGroup == item.securityGroup) {
            val.checked = true;
          }
          return val;
        });
      }
    } else {
      if (type === 'other') {
        this.sharedUserList[index].checked = false;
      } else {
        this.aettornyList[index].checked = false;
      }
    }

    this.sharedUserList.filter(x => {
      if (x.checked) {
        this.selectedEmployeeCount = this.selectedEmployeeCount + 1;
      }
    });

    this.aettornyList.filter(y => {
      if (y.checked) {
        this.selectedEmployeeCount = this.selectedEmployeeCount + 1;
      }
    });

    if (this.selectedEmployeeCount > 0) {
      this.selectedTextVisible = true;
    }

    setTimeout(() => {
      let width = $('.get-width').outerWidth();
      width = width + 34;
      $('.custom-padding').css('padding-left', 10 + width + 'px');
      $('.selected-employee').css('left', width + 'px');
    }, 50);
  }

  public changedRadio() {
  }

  public changeExternalSelection(event, item, index) {
    if (event.srcElement.checked === true) {
      this.externalUserList = this.externalUserList.filter(val => {
        if (val.personId == item.personId && val.securityGroup == item.securityGroup) {
          val.checked = true;
        }
        return val;
      });
    } else {
      this.externalUserList[index].checked = false;
    }
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

  manageLable() {
    this.searchActive = true;
    const val = { target: { className: 'selected-employee' } };
    this.onClickedOutside(val);
  }

  removeAllNotify() {
    this.sharedUserList.filter(item => {
      if (item.checked) {
        item.checked = false;
        return item;
      }
      return item;
    });

    this.aettornyList.filter(item => {
      if (item.checked) {
        item.checked = false;
        return item;
      }
      return item;
    });
    this.selectedEmployeeCount = 0;
    this.selectedTextVisible = false;
    $('.custom-padding').css('padding-left', 34 + 'px');
    $('.selected-employee').css('left', 0);
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
    this.loading = true;
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
    if (event && event.length) {
      this.title = event.length;
    } else {
      this.title = 'Select document attributes';
    }
  }

  clrAttributes() {
    this.attributesArray.forEach((element: any) => {
      element.checked = false;
    });
    this.selectedAttArr = [];
    this.title = 'Select document attributes';
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  prepareDataForRequest(actions){
    let value: any = this.documentForm.value;
      value.id = this.documentId;
      value.body = {
        file: actions.isScanOnly || actions.isUpload ? this.fileData : null
      };
      if (value.nameOfFile) {
        if (value.nameOfFile.includes('.')) {
          value.nameOfFile = value.nameOfFile.substring(0, value.nameOfFile.lastIndexOf('.'));
        }
        value.nameOfFile = `${value.nameOfFile}.${this.fileExtenson}`;
      }
      value.isFillableTemplate = this.selectedAttArr.indexOf(2) > -1;
      value.isDraftingTemplate = this.selectedAttArr.indexOf(1) > -1;
      value.containsESignatureFields = this.selectedAttArr.indexOf(3) > -1;
      value.originalFileName = this.fileData.name;
      value.dmsFileStatus = actions.isVerify ? DMSFileStatus.VerifyFileName : actions.isScanOnly ? DMSFileStatus.SecurityScanInProgress : actions.isCancel ? DMSFileStatus.UploadCancelled : DMSFileStatus.UploadInProgress;
      return value;
  }

  sendFileForUpload(actions) {
    let data = this.prepareDataForRequest(actions);
    data.isReplaceFile = true; 
    data.name = data.originalFileName;
    delete data.dmsFileStatus;
    let file = [data];
    this.commonService.docs.next(file);
    this.manageRouting();
  }
}
