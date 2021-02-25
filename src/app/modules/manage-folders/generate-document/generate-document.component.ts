import { Component, ElementRef, EventEmitter, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HtmlEditorService, ImageService, ResizeService, ToolbarService } from '@syncfusion/ej2-angular-richtexteditor';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { AppConfigService } from 'src/app/app-config.service';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { FillableTemplateSupportedFileTypes } from 'src/common/swagger-providers/models';
import { DmsService, EmployeeService, TenantService } from 'src/common/swagger-providers/services';
import { SharedService } from '../../../../app/modules/shared/sharedService';
import { IndexDbService } from '../../../index-db.service';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { SendForESignComponent } from '../../shared/send-for-esign/send-for-esign.component';
import { UtilsHelper } from '../../shared/utils.helper';

enum DocType {
  pdf = 1,
  docx = 2
}

enum DocumentSigningStatus{
  Unknown = 0,
  PendingSignature = 1,
  DocumentSigned = 2
}

@Component({
  selector: 'app-generate-document',
  templateUrl: './generate-document.component.html',
  styleUrls: ['./generate-document.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [ToolbarService, ImageService, ResizeService, HtmlEditorService]
})
export class GenerateDocumentComponent implements OnInit, IBackButtonGuard {
  @ViewChild(SendForESignComponent, { static: false }) eSignComponent: SendForESignComponent;
  public title = 'Select Clients';
  public matterTitle = 'Select Matters';
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public errorData: any = (errorData as any).default;
  private folderId: number;
  private documentId: number;
  public docName = '';
  public clients: Array<any> = [];
  public selectedClients: Array<any> = [];
  initialClientDisplay: Array<any> = [];
  public displayClients: Array<any> = [];
  documentData: any;
  docTempdata: any;
  name = '';
  public matters: Array<any> = [];
  public selectedMatters: Array<any> = [];
  public displayMatters: Array<any> = [];
  public docShare: Array<any> = [];
  public folderList: Array<any>;
  public selectedTargetFolderId = null;
  clientNotifyArray: Array<any> = [];
  public officeList: Array<any>;
  public employeeList: Array<any>;
  public eventList: Array<any>;
  public selectedEmployee: any;
  public selectedOffice: any;
  public startDate: any;
  public startTime: any;
  public endTime: any;
  public endDate: any;
  public showEvents = false;
  public selectedEventId: number;
  public tools: object = {
    items: [
      'Bold',
      'Italic',
      'Underline',
      '|',
      'Alignments',
      '|',
      'OrderedList',
      'UnorderedList',
      'Indent',
      'Outdent',
      'Image'
    ]
  };
  emailNotification = {
    doNotSend: false,
    subject: '',
    description: ''
  };
  previewSelected = false;
  cancelSelected = false;
  missingPopup = {
    popupShow: false,
    misEmp: false,
    misOffice: false
  };
  formData: any = {};
  clientMatters: Array<any> = [];
  actionTaken = '';
  actionConfirmMessage = '';
  pdfUrl = '';
  urlSafe: SafeResourceUrl;
  pageType: any;
  clientId: any;
  timeList = UtilsHelper.timeList();
  public shareEmail = false;
  public emailClients: Array<any> = [];
  public warningsList: Array<any> = [];
  public defaultEmail = true;
  public tenantName: string;
  public loading;
  public infoLoading = false;

  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  isOfficeTypeFile = false;
  sendESign = false;
  s25 = false;

  isMatterSelected: boolean = false;
  isDifftContSelected = false;
  acceptedSendForSignFlag: boolean = false;

  @HostListener('document:click', ['$event']) public documentClick(event: MouseEvent) {
    if (event) {
      if (this.emailClients.length > 0 && this.defaultEmail) {
        this.defaultEmailTemplate();
      }
    }
  }

  constructor(
    private modalService: NgbModal,
    private activateRoute: ActivatedRoute,
    private dmsService: DmsService,
    private router: Router,
    private toaster: ToastDisplay,
    public sanitizer: DomSanitizer,
    public indexDbService: IndexDbService,
    public sharedService: SharedService,
    private appConfigService: AppConfigService,
    private tenantService: TenantService,
    private pagetitle: Title,
    private employeeService: EmployeeService,
    private dialogService: DialogService
  ) {
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Generate Document');
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
      alwaysVisible: true
    };
    this.activateRoute.queryParams.subscribe(params => {
      if (params && params.documentId) {
        this.clientId = params.clientId;
        this.pageType = params.pageType;
        this.documentId = parseInt(params.documentId, 10);
        this.folderId = params.folderId;
        this.getClients();
        this.getFilesList();
        this.getEmployeeList();
        this.getOfficeList();
        this.getTargetFolderList();
      }
    });
    this.getTenantInfo();
  }

  /**** function to get all files list on the basic of folder id */
  getFilesList() {
    this.dmsService
      .v1DmsFoldersFolderIdContentGet({ folderId: this.folderId })
      .subscribe((resp: any) => {
        resp = JSON.parse(resp);
        if (resp.results.files && resp.results.files.length) {
          this.documentData = resp.results.files.find(
            file => file.id === +this.documentId
          );
          if (this.documentData && Object.keys(this.documentData).length) {
            this.initFromTemplate();
          } else {
            this.manageRouting();
          }
        } else {
          this.manageRouting();
        }
      });
  }

  initFromTemplate() {
    this.infoLoading = true;
    const params = {
      docName: this.documentData.fileName
        ? this.documentData.fileName
        : '',
      pdfTemplateFileId: this.documentData.id
    };
    this.docName = this.documentData.fileName
      ? this.documentData.fileName
      : '';
    if (this.docName && this.docName !== '') {
      const ext = this.sharedService.getFileExtension(this.docName);
      if (ext === 'docx') {
        this.isOfficeTypeFile = true;
      }
    }
    this.dmsService
      .v1DmsDocsInitFromTemplatePost$Json$Plain({ body: params })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res);
          this.docTempdata = res && res.results ? res.results : {};
          this.infoLoading = false;
        },
        error => {
          this.docTempdata = {};
          this.infoLoading = false;
        }
      );
  }

  /**
   * To open create folder popup
   * @param content Popup content
   * @param className Class
   * @param winClass Window class
   */
  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.modalService.dismissAll();
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }
  /**
   * @param reason Dismissal reason
   */
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public async getClientsSelected(event: any, assign: boolean = true) {
    if (assign) {
      this.initialClientDisplay = JSON.parse(
        JSON.stringify(this.displayClients)
      );
    }
    let idsArr = this.displayClients.map(x => x.id); 
    if (!event.length) {
      this.title = 'Select Clients';
      this.matters = [];
      this.selectedMatters = [];
      this.displayMatters = [];
      this.emailClients = [];
      this.docShare = [];
      this.clientNotifyArray = [];
    } else {
      let displayClients =[];
      let beforeAssign = this.isDifftContSelected;
      event.forEach(cat => {
        const category = this.clients.filter(ele => ele.id === cat);
        if (!displayClients.some(ele => ele.id === cat)) {
          displayClients.push(category[0]);
        }
      });
      let arr = _.uniqBy(displayClients, 'isCompany');
      this.isDifftContSelected = (arr.length > 1);
      let isAccepted = false;
      if(this.isDifftContSelected && beforeAssign != this.isDifftContSelected && assign){
        const resp: any = await this.dialogService.confirm(
          this.errorData.generate_document_both_contact_selected_warn,
          'Accept',
          'Cancel',
          'Warning',
          true,
          '',
          true,
          null,
          true
        );
        if (!resp){   
          this.isDifftContSelected = false;
          let selectedClient = (_.differenceBy(event, idsArr))[0];
          let idx = event.findIndex(x => x == selectedClient)
          event.splice(idx, 1);
          let client = this.clients.find(x => x.id == selectedClient);
          client.checked = false;
          displayClients = displayClients.filter(x => x.id != selectedClient);
        } else {
          isAccepted = true;
        }
      }
      if(isAccepted && this.sendESign){
        this.eSignComponent.clearSelectionsForClients();
      }
      this.selectedClients = event;
      this.title = event.length.toString();
      this.displayClients = displayClients;
      if(this.initialClientDisplay.length != this.displayClients.length){
        this.findArrayDiff()
      }
    }
  }

  sortClients(arr: Array<any>) {
    arr.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return arr;
  }

  onMultiSelectSelectedOptions(event) { }

  getClients(): any {
    this.dmsService.v1DmsGetClientsGet().subscribe((res: any) => {
      res = JSON.parse(res);
      if (res.results && res.results) {
        this.clients = res.results.map((a, index) => {
          return {
            id: a.userId,
            name: a.fullName,
            email: a.clientEmail,
            isCompany: a.iscorporate
          };
        });
      }
    });
  }

  applyFilter(event: any) { }

  clrFiltercategory() {
    this.selectedClients = [];
    this.title = 'Select Clients';
    this.displayClients = [];
    this.clientNotifyArray = [];
    this.matters = [];
    this.selectedMatters = [];
    this.emailClients = [];
    this.docShare = [];
    this.clients.forEach(item => (item.checked = false));
  }

  removeClient(id: any, i?) {
    this.initialClientDisplay = JSON.parse(JSON.stringify(this.displayClients));
     let index = (i) ? i : this.displayClients.findIndex(x => x.id ==id);
    this.selectedClients = this.selectedClients.filter(
      element => element !== id
    );
    this.displayClients = this.displayClients.filter(
      element => element.id !== id
    );
    this.clients.map(element => {
      if (element.id === id) {
        element.checked = false;
      }
    });
    this.getClientsSelected(this.selectedClients, false);
    this.checkArrayEmpty()
  }

  getClientNotifyPermission(id: number): void {
    this.dmsService
      .v1DmsClientsContactPreferencesGet$Plain({ clientId: [id] })
      .subscribe((res: any) => {
        res = JSON.parse(res);
        if (res && res.results && res.results.length) {
          this.clientNotifyArray.push({
            clientId: id,
            email: res.results[0].email,
            clientName: res.results[0].fullName,
            notifyByEmail: res.results[0].notifyByEmail
          });
        }
      });
  }

  async findArrayDiff() {
    if (this.initialClientDisplay.length > this.displayClients.length) {
      const diff: any = _.differenceBy(
        this.initialClientDisplay,
        this.displayClients,
        'id'
      );
      const idx = this.initialClientDisplay.findIndex(
        (a: any) => a.id === diff[0].id
      );
      this.matters.splice(idx, 1);
      this.selectedMatters.splice(idx, 1);
      this.docShare.splice(idx, 1);
      this.clientNotifyArray.splice(idx, 1);
    } else {
      const diff: any = _.differenceBy(
        this.displayClients,
        this.initialClientDisplay,
        'id'
      );
      this.docShare.push({
        clientId: diff[0].id,
        name: diff[0].name,
        checked: false
      });
      this.loading = true;
      this.getClientNotifyPermission(diff[0].id);
      try {
        let res: any = await this.dmsService.v1DmsMattersClientIdGet({ clientId: diff[0].id }).toPromise();
        // let res: any = await this.dmsService
        //   .v1DmsClientClientIdGet({ clientId: diff[0].id })
        //   .toPromise();
        res = JSON.parse(res);
        if (res && res.results) {
          const fMatter = res.results.map(a => {
            return {
              id: a.id,
              name: (a.name + ' (' + a.id + ')').trim(),
              clientId: diff[0].id,
              matterHasTargetFolder: true
            };
          });

          this.selectedMatters.push([]);
          this.matters.push(fMatter);
        } else {
          this.selectedMatters.push([]);
          this.matters.push([]);
        }
        this.loading = false;
      } catch (e) {
        this.loading = false;
      }
    }
  }

  async getMattersSelected(event: any, index: any) {
    this.displayMatters[index] = [];
    if (!event.length) {
      this.matterTitle = 'Select Matters';
      this.checkArrayEmpty();
    } else {
      this.selectedMatters[index] = event;
      this.selectedMatters[index].forEach(async cat => {
        const category = this.matters[index].filter(ele => ele.id === cat);
        if (!this.displayMatters[index].some(ele => ele.id === cat)) {
          this.displayMatters[index].push(category[0]);
          if (this.selectedTargetFolderId) {
            const idx = this.folderList.findIndex(x => x.folderId === this.selectedTargetFolderId);
            if (idx > -1) {
              try {
                this.loading = true;
                let resp: any = await this.dmsService.v1DmsMattersFoldersGet({
                  matterId: category[0].id,
                  systemFolderName: this.folderList[idx].folderName
                })
                  .toPromise();
                this.loading = false;
                resp = JSON.parse(resp);
                if (resp && resp.results) {
                  this.displayMatters[index][
                    this.displayMatters[index].length - 1
                  ].matterHasTargetFolder = resp.results.matterHasTargetFolder;
                }
              } catch (e) {
                this.loading = false;
              }
            }
          }
        }
      });
      this.checkArrayEmpty();
    }
  }

  clrFilterMatter(index): void {
    this.selectedMatters[index] = [];
    this.displayMatters[index] = [];
    this.matters[index].forEach(item => (item.checked = false));
  }

  removemMatter(id: any, index): void {
    this.selectedMatters[index] = this.selectedMatters[index].filter(
      element => element !== id
    );
    this.displayMatters[index] = this.displayMatters[index].filter(
      element => element.id !== id
    );
    this.matters[index].map(element => {
      if (element.id === id) {
        element.checked = false;
      }
    });
    this.getMattersSelected(this.selectedMatters[index], index);
  }

  onShareSelected(clientId: number, idx: number, action: boolean): void {
    this.emailClients = [];
    this.shareEmail = action;
    const id = this.docShare.findIndex(cl => cl.clientId === clientId);
    if (id !== -1) {
      this.docShare[idx].checked = action;
      this.docShare[idx].notifyByEmail = this.clientNotifyArray[idx].notifyByEmail;
      this.clientNotifyArray[idx].isShared = action;
    }
    const clientShare = this.docShare;
    clientShare.forEach(client => {
      if (client.checked === true) {
        this.emailClients.push(client);
      }
    });
    if (this.emailClients.length > 0 && this.defaultEmail) {
      this.defaultEmailTemplate();
    }
  }

  public manageRouting() {
    if (this.pageType) {
      if (this.pageType === 'matter') {
        this.router.navigate(['/matter/create'], {
          queryParams: { clientId: this.clientId, step: 'documents' }
        });
      } else {
        this.router.navigate(['/contact/client-conversion'], {
          queryParams: {
            clientId: this.clientId,
            type: 'individual',
            step: 'documents'
          }
        });
      }
    } else {
      this.router.navigate(['/manage-folders/document'], {
        queryParams: {
          folderId: this.folderId,
        }
      });
    }
  }

  getEmployeeList() {
    this.employeeService.v1EmployeesGet$Response().subscribe(
      res => {
        const list = JSON.parse(res.body as any).results;
        this.employeeList = list;
        this.employeeList.forEach(row => {
          row.fullName = row.lastName ? row.lastName + ', ' + row.firstName : row.firstName
        });
        if (this.employeeList && this.employeeList.length) {
          this.employeeList = _.orderBy(this.employeeList, a => a.fullName.toLowerCase());
        }
      },
      err => { }
    );
  }

  getOfficeList() {
    this.dmsService.v1DmsOfficesGet$Response().subscribe(
      res => {
        const list = JSON.parse(res.body as any).results;
        this.officeList = list;
      },
      err => { }
    );
  }

  eventClick(event: any) { }

  getEvents() {
    let startDate: any;
    const todayDate = new Date();
    if (this.startDate && this.startTime) {
      startDate = moment(this.startDate).format('YYYY-MM-DD') +
        'T' +
        moment(this.startTime).format('HH:mm:ss') +
        '.000Z';
    } else {
      startDate = (this.startDate) ? moment(this.startDate).format('YYYY-MM-DD') : (this.startTime) ? moment(todayDate).format('YYYY-MM-DD') +
        'T' +
        moment(this.startTime).format('HH:mm:ss') +
        '.000Z' : moment(todayDate).format('YYYY-MM-DD');
    }
    const data: any = {
      startDateTime: startDate
    };
    if (this.endTime && this.endDate) {
      const endDateTime =
        moment(this.endDate).format('YYYY-MM-DD') +
        'T' +
        moment(this.endTime).format('HH:mm:ss') +
        '.000Z';
      data.endDateTime = endDateTime;
    }
    this.dmsService.v1DmsEventsGet$Response(data).subscribe(
      res => {
        const list = JSON.parse(res.body as any).results;
        this.eventList = list;
        this.showEvents = true;
      },
      err => { }
    );
  }

  clearFields() {
    this.startDate = this.startTime = this.endTime = this.endDate = null;
    this.showEvents = false;
  }

  async getTargetFolderList() {
    const res: any = await this.dmsService.v1DmsPracticeAreasFoldersaggregateGet$Json().toPromise();
    this.folderList = res && res.results ? res.results : [];
  }

  defaultEmailTemplate() {
    this.defaultEmail = true;
    if (this.endDate) {
      this.emailNotification.description =
        'Hi ' +
        this.emailClients[0].name +
        ',' +
        '</br>' +
        this.tenantName +
        ' has shared a new document with you, ' +
        this.docName +
        '. Please log into the document portal to access this document:' +
        '</br>' +
        '<a href="' +
        this.docTempdata.docShareUrl +
        '">View Document</a>' +
        '</br>' +
        '</br>' +
        'Please note that your access to this document will  be revoked on ' +
        moment(this.endDate).format('MMMM DD, YYYY') +
        '.' +
        '</br>' +
        'Regards,' +
        '</br>' +
        'The ' +
        this.tenantName +
        ' Team';
    } else {
      this.emailNotification.description =
        'Hi ' +
        this.emailClients[0].name +
        ',' +
        '</br>' +
        this.tenantName +
        ' has shared a new document with you, ' +
        this.docName +
        '. Please log into the document portal to access this document:' +
        '</br>' +
        '<a href="' +
        this.docTempdata.docShareUrl +
        '">View Document</a>' +
        '</br>' +
        '</br>' +
        'Regards,' +
        '</br>' +
        'The ' +
        this.tenantName +
        ' Team';
    }

    this.emailNotification.subject =
      'A document has been shared with you: ' + this.docName;

    setTimeout(() => {
      let rtcHeader = document.querySelector('#alltoolRTE_toolbar_wrapper') as HTMLElement;
      let rtcContent = document.querySelector('#alltoolRTE_rte-edit-view') as HTMLElement;
      let rtcContentAnchor = document.querySelector('#alltoolRTE_rte-edit-view a') as HTMLElement;
      if (rtcHeader) { rtcHeader.style.display = 'none'; }
      if (rtcContent) { rtcContent.style.backgroundColor = '#f0f0f0' };
      if (rtcContent) { rtcContent.style.color = '#a3a3a3' };
      if (rtcContentAnchor) { rtcContentAnchor.style.color = '#a3a3a3' };
    }, 60);
  }

  onEmailTemplateSelected() {
    this.defaultEmail = false;
    setTimeout(() => {
      let rtcHeader = document.querySelector('#alltoolRTE_toolbar_wrapper') as HTMLElement;
      let rtcContent = document.querySelector('#alltoolRTE_rte-edit-view') as HTMLElement;
      let rtcContentAnchor = document.querySelector('#alltoolRTE_rte-edit-view a') as HTMLElement;
      if (rtcHeader) { rtcHeader.style.display = 'block' };
      if (rtcContent) { rtcContent.style.backgroundColor = '#F4F7F9' };
      if (rtcContent) { rtcContent.style.color = '#353B4B' };
      if (rtcContentAnchor) { rtcContentAnchor.style.color = '#2e2ef1' };
    }, 62);
  }

  insertDocLink() {
    if (this.docTempdata && this.docTempdata.docShareUrl) {
      const link =
        this.appConfigService.appConfig.cpmg_domain +
        this.docTempdata.docShareUrl;
      this.emailNotification.description =
        this.emailNotification.description + '\n' + link;
    }
  }

  submitDocumentValid(content: any, className, winClass, action,isForcedESign:boolean = false,toManyTokens?:any, insufficientTokens?:any): void {
    this.modalService.dismissAll();
    let isMatterSelectedForClients = this.checkMatterSelectedForEachClient();
    if (this.validateForm() && (!this.sendESign || (this.sendESign && this.eSignComponent.checkESignValidate() && isMatterSelectedForClients))) {
      this.submitForm(this.actionTaken, true, content, className, winClass,isForcedESign,toManyTokens,insufficientTokens);
    } else {
      this.actionTaken = 'generate';
      let message = !isMatterSelectedForClients && this.sendESign ? this.errorData.generate_doc_no_matter_selected_warning : this.errorData.generate_doc_fill_all_fields_warning;
      this.toaster.showError(message);
    }
  }

  validateForm(): any {
    let returnVal =
      this.name && this.displayClients.length && this.selectedTargetFolderId
        ? true
        : false;
    if (returnVal) {
      if (this.docShare.length != this.displayClients.length) {
        returnVal = this.emailNotification.subject && this.emailNotification.description ? true : false;
      }
    }
    return returnVal;
  }

  submitForm(aciton, performValidation?: boolean, content?: any, className?: any, winClass?: any,isForcedESign?,toManyTokens?,insufficientTokens?): any {
    if (aciton === 'cancel') {
      this.loading = false;
      this.manageRouting();
      return;
    } else {
      this.dataEntered = false;
    }
    this.loading = true;
    this.setFormData();
    this.pdfUrl = '';
    const filetype = this.getSupportedFileType();
    if (filetype) {
      this.formData.fillableTemplateSupportedFileType = filetype;
    } else {
      delete this.formData.fillableTemplateSupportedFileType;
    }
    const value: any = this.formData;
    value.performValidation = performValidation;
    if (this.sendESign) {
      let matterIds = [];
      this.displayMatters.forEach(clientIndex => {
        if (clientIndex && clientIndex.length) {
          clientIndex.forEach(element => {
            matterIds.push(element.id);
          });
        }
      })
      if (!matterIds.length) {
        matterIds.push(0);
      }
      let to_Array: any = this.eSignComponent.signersArr.map(signer => {
        let role = signer.items.find(x => x.id == signer.role);
        let email = signer.email;
        let name = signer.name;
        let isOthersRole = (role.name == 'Other') ? true : false;
        let clientIds = this.selectedClients && !isOthersRole ? this.selectedClients : [0];
        let matters = matterIds && !isOthersRole ? matterIds : [0];
        let inpersonSignature = signer.inpersonSignature;
        return { role: role.name, clientIds, matterIds: matters, name, email, inpersonSignature };
      });
      let data = {
        documentId: this.documentData.id,
        to: to_Array,
        from: 'mchauhan@codal.com',
        subject: 'Document requires your signature',
        message: 'A document is ready for you to sign .',
        isOutforSignature: this.documentData.documentSigningStatus == DocumentSigningStatus.PendingSignature ? true : false,
        isForceProceed: isForcedESign
      }
      value.viewModel = data;
    }
    this.dmsService
      .v1DmsDocFinalizeDocPost$Json({ body: value }).subscribe(
        async (res: any) => {
          res = JSON.parse(res);
          this.actionTaken = aciton;
          if (performValidation) {
            this.warningsList = res.results.warnings;
            this.missingPopup.popupShow = !!(this.warningsList && this.warningsList.length);
            if (this.missingPopup.popupShow) {
              this.loading = false;
              this.openPersonalinfo(content, className, winClass);
            } else if(res.results.isInsufficientTokens){
              this.loading = false;
              this.openPersonalinfo(insufficientTokens,'','modal-lmd');
            } else if(res.results.isManyTokens) {
              this.loading = false;
              this.openPersonalinfo(toManyTokens,'','modal-lmd');
            } else {
              this.submitForm(this.actionTaken, false,content,'','',isForcedESign);
            }
          } else {
            if (res && res.results && res.results.isSuccess) {

              if (res.results.previewPDFUrl && this.actionTaken === 'preview') {
                this.pdfUrl = res.results.previewPDFUrl;
                this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
                  this.pdfUrl
                );
              }
              if (this.actionTaken === 'generate') {
                this.toaster.showSuccess('Document generated.');
                this.manageRouting();
              }
              this.loading = false;
            } else {
              const err =
                res && res.results && res.results.message
                  ? res.results.message
                  : 'Error occured while generating document';
              this.toaster.showError(err);
              this.loading = false;
            }
          }
          this.missingPopup.popupShow = false;
        },
        err => {
          this.loading = false;
        }
      );
  }

  setFormData(): void {
    const clientMatters = [];
    if (this.clientNotifyArray.length === 0) {
      this.defaultEmail = false;
    }
    let clientIds = [];
    this.displayMatters.forEach((value, index) => {
      if (value && value.length) {
        value.forEach((v, i) => {
          const idx = this.docShare.findIndex(
            (e: any) => +e.clientId === +v.clientId
          );
          const shareVal = this.docShare[idx]
            ? this.docShare[idx].checked && this.docShare[idx].notifyByEmail
            : false;
          const obj = {
            clientPersonId: v.clientId,
            matterId: v.id,
            shareDocSelected: shareVal
          };
          clientMatters.push(obj);
          clientIds.push(v.clientId);
        });
      }
    });
    if (this.displayClients && this.displayClients.length) {
      this.displayClients.forEach((value, index) => {
        const id = this.displayClients[index].id;
        if (!clientIds.includes(id)) {
          const idx = this.docShare.findIndex(e => +e.clientId === +id);
          const shareVal = this.docShare[idx].checked && this.docShare[idx].notifyByEmail;
          const obj = {
            clientPersonId: id,
            matterId: 0,
            shareDocSelected: shareVal
          };
          clientMatters.push(obj);
        }
      });
    }
    this.formData.fileId = this.documentId;
    this.formData.fillableTemplateSupportedFileType = FillableTemplateSupportedFileTypes.Pdf;
    this.formData.name = this.name;
    this.formData.matterFolderId = this.selectedTargetFolderId;
    this.formData.clientMatters = clientMatters;
    this.formData.selectedEmployeeId = this.selectedEmployee
      ? this.selectedEmployee
      : 0;
    this.formData.selectedOfficeId = this.selectedOffice
      ? this.selectedOffice
      : 0;
    this.formData.clientMatters = clientMatters;

    if (this.startDate) {
      this.formData.startDateTime =
        moment(this.startDate).format('YYYY-MM-DD') +
        'T' + this.startTime +
        '.000Z';
    }

    if (this.endDate) {
      this.formData.endDateTime =
        moment(this.endDate).format('YYYY-MM-DD') +
        'T' + this.endTime +
        '.000Z';
    }

    this.formData.sendEmailSelected = !this.emailNotification.doNotSend;
    this.formData.emailSubject = this.emailNotification.subject;
    this.formData.emailBody = this.emailNotification.description;
    this.formData.previewSelected = this.previewSelected;
    this.formData.cancelSelected = this.cancelSelected;
    this.formData.isDefaultEmail = this.defaultEmail;
    this.formData.containsESignatureFields = this.documentData.containsESignatureFields;
    this.formData.sendforEsignarure = this.sendESign;
  }

  actionHandle(action: string): void {
    this.actionTaken = action;
    switch (action) {
      case 'cancel':
        this.actionConfirmMessage = 'Yes, continue and cancel document';
        this.cancelSelected = true;
        this.previewSelected = false;
        break;
      case 'preview':
        this.actionConfirmMessage = 'Yes, continue and preview document';
        this.cancelSelected = false;
        this.previewSelected = true;
        this.pdfUrl = '';
        break;
      case 'generate':
        this.actionConfirmMessage = 'Yes, continue and generate document';
        this.cancelSelected = false;
        this.previewSelected = false;
        break;
      case 'back':
        this.cancelSelected = false;
        this.previewSelected = false;
        break;
    }
  }

  clearSigners() {
    if(this.eSignComponent) {
      this.eSignComponent.clearSigners();
    }
  }

  checkPdfExist(): void {
    if (this.pdfUrl) {
      this.actionTaken = 'preview';
    }
  }

  async targetFolderChange(event) {
    if (event && event.folderId && this.displayMatters.length) {
      const tmp = [...this.displayMatters];
      for (const x of tmp) {
        if (x && x.length) {
          for (const y of x) {
            try {
              const idx = this.folderList.findIndex(t => t.folderId === this.selectedTargetFolderId);
              if (idx > -1) {
                this.loading = true;
                let resp: any = await this.dmsService.v1DmsMattersFoldersGet({
                  systemFolderName: this.folderList[idx].folderName,
                  matterId: y.id
                })
                  .toPromise();
                resp = JSON.parse(resp);
                this.loading = false;
                if (resp && resp.results) {
                  y.matterHasTargetFolder = resp.results.matterHasTargetFolder;
                }
              }
            } catch (e) {
              this.loading = false;
            }
          }
        }
      }
      this.displayMatters = [...tmp];
    }
  }

  getTenantInfo() {
    this.tenantService.v1TenantProfileGet$Response({}).subscribe(res => {
      if (res) {
        const details = JSON.parse(res.body as any).results;
        this.tenantName = details.tenantName;
      }
    });
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  getSupportedFileType() {
    const ext = this.sharedService.getFileExtension(this.documentData.fileName);
    let type: any;
    type = DocType[ext] ? DocType[ext] : null;
    return type;
  }

  get getTargetFolderName() {
    if (this.selectedTargetFolderId) {
      const idx = this.folderList.findIndex(x => x.folderId === this.selectedTargetFolderId);
      return this.folderList[idx].folderName;
    }
    return false;
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  eSignInit(ev) {
    this.eSignComponent = ev;
  }

  async sendForESign() {
    if (this.eSignComponent && this.eSignComponent.checkESignValidate()) {
      let to_Array: any = this.eSignComponent.signersArr.map(signer => {
        let role = signer.items.find(x => x.id == signer.role);
        let email = signer.email;
        let name = signer.name;
        let inpersonSignature = signer.inpersonSignature;
        return { role: role.name, name, email, inpersonSignature };
      });
      let data = {
        documentId: this.documentData.id,
        to: to_Array,
        from: 'mchauhan@@codal.com',
        subject: 'Test Email For E-sIgn',
        message: 'The dummy message for the sending e-sign.'
      }
      try {
        let res = await this.dmsService.v1DmsDocumentSendforSignaturePost$Json({ body: data }).toPromise();
        const response = JSON.parse(res as any).results;
        if (response.status && response.status.status && response.status.status == 'success') {
          this.toaster.showSuccess(this.errorData.document_esign_sent_success);
          this.modalService.dismissAll();
        }
      } catch (err) {

      }
    }
  }

  checkArrayEmpty(arr?: any) {
    let isEmpty: boolean = true;
    for (let ele of this.displayMatters) {
      if (ele && ele.length) {
        isEmpty = false;
        break;
      }
    }
    this.isMatterSelected = !isEmpty;
  }

  checkDocumentAlreadySent(content?) {
    if(this.documentData.documentSigningStatus == 1 && !this.acceptedSendForSignFlag){
      this.openPersonalinfo(content, '', 'lg');
    } else {
      this.acceptedSendForSignFlag = true;
    }
  }

  acceptSendForEsign(){
    this.acceptedSendForSignFlag = true;
    this.modalService.dismissAll();
  }


  checkMatterSelectedForEachClient() {
    let status = true;
    for(const ind in this.displayClients){
      let cindex = +ind;
      if(!this.selectedMatters[cindex] || !this.selectedMatters[cindex].length){
        status = false;
        break;
      }
    }
    return status;
  }
}
