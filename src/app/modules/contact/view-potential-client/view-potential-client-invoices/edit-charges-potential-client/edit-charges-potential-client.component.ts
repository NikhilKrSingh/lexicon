import { Component, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AddEditConsulationComponent } from 'src/app/modules/contact/view-potential-client/potential-client-billing-details/new-consulation-fee/add-edit-consulation/add-edit-consulation.component';
import { vmWriteOffs, vwMatterResponse } from 'src/app/modules/models';
import { vwBillNowClientEmailInfo, vwBillToClientEmailAndPrintResponse, vwDefaultInvoice, vwSuccessBillToClient } from 'src/app/modules/models/bill-to-client.model';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import { vwBillingSettings, vwBillNowModel, vwBillToClientPrintAndEmail, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, FixedFeeServiceService, MatterService, PotentialClientBillingService, TenantService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../../store';
import { TimeWriteDownComponent } from '../../../../billing/pre-bill/view/time/write-down/write-down.component';

@Component({
  selector: 'app-edit-charges-potential-client',
  templateUrl: './edit-charges-potential-client.component.html',
  styleUrls: ['./edit-charges-potential-client.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditChargesPotentialClientComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  isEditChargeComponent = true;
  modalOptions: NgbModalOptions;
  closeResult: string;
  billToClientResponse: vwSuccessBillToClient;
  timekeepingList: Array<PreBillingModels.vwBillingLines> = [];
  disbursementList: Array<PreBillingModels.vwBillingLines> = [];
  matterDetails: vwMatterResponse;
  timeWriteDownBtn = false;
  workComplete = false;
  permissionList: any = {};
  matterId: number = null;
  clientId: number = null;
  lastPrebillDate: Date = new Date();
  prebillingSettings: PreBillingModels.vwPreBilling;
  fixedFeeSelected: Array<PreBillingModels.FixedFeeService> = [];
  writeOffsList: Array<vmWriteOffs> = [];
  issuenceDate: string = (new Date()).toString();
  timeEntrySelected: Array<PreBillingModels.vwBillingLines> = [];
  writeOffSelected: Array<vmWriteOffs> = [];
  disbursementSelected: Array<PreBillingModels.vwBillingLines> = [];
  addOnSelected: Array<PreBillingModels.AddOnService> = [];
  saveBtn = true;
  fixedFeeServices: Array<PreBillingModels.FixedFeeService> = [];
  invoicePrefList: Array<vwIdCodeName>;
  electronicInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;
  invoiceTemplateDetails: vwDefaultInvoice;
  loginUser: any;
  permissionSubscribe: Subscription;
  errorData = (errors as any).default;
  loading = true;
  clientEmailInfo: vwBillNowClientEmailInfo;
  paperInvoice: vwIdCodeName;
  tenantDetails: any;
  pageType = 'billing';
  invoiceId = null;
  cancelFormLoader = false;
  billingSettings: vwBillingSettings;
  totalBillAmount = 0;
  sendEmail = false;
  print = true;
  default_logo_url: string;

  cancelAllChargeForm: FormGroup = this.fb.group({
    billingNarrative: [null, Validators.required],
    noteToFile: [null, Validators.required],
    isVisibleToClient: ['no', Validators.required]
  });

  backbuttonPressed = false;
  steps = [];
  isOnFirstTab = true;
  routeLink: string;
  subscription: any;
  dataEntered = true;
  hasMadeChanges = false;
  navigateAwayPressed = false;

  private modalRef: NgbModalRef;


  showInvoice = false;
  public billNowModel: vwBillNowModel;

  loader = false;

  loaderCallback = () => {
    this.loader = false;
  }

  reveredInvoiceAmount = 0;
  consultationFees: any = [];
  selectedConsultationFees: any = [];
  clientDetails: any;
  isEmailPresent: any = '';
  public ColumnMode = ColumnMode;
  private newWriteDowns: any = [];
  selectedRow: any;
  isWriteDownAdmin: boolean;
  isAdmin: boolean;
  paymentDueDate: any;
  state: string = '';
  constructor(
    private route: ActivatedRoute,
    private matterService: MatterService,
    private router: Router,
    private clientService: ClientService,
    private toastr: ToastDisplay,
    private fixedFeeService: FixedFeeServiceService,
    private billingService: BillingService,
    private tenantService: TenantService,
    private pagetitle: Title,
    private dialogService: DialogService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private invoiceService: InvoiceService,
    private appConfigService: AppConfigService,
    private potentialClientBillingService: PotentialClientBillingService,
  ) {
    this.prebillingSettings = {} as PreBillingModels.vwPreBilling;
    this.invoiceService.loadImage(this.appConfigService.appConfig.default_logo).subscribe(blob => {
      const a = new FileReader();
      a.onload = (e) => {
        this.default_logo_url = (e.target as any).result;
      };
      a.readAsDataURL(blob);
    });
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart)) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Edit Charges');
    this.loginUser = UtilsHelper.getLoginUser();
    const validTier = UtilsHelper.validTenantTier();
    if (!validTier) {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return;
    }
    this.permissionSubscribe = this.store.select('permissions').subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin
          ) {
            this.state = 'edit';
          } else {
            this.state = 'view';
          }
        }
      }
    });
    this.getTenantProfile();
    this.getDefaultInvoiceTemplate();
    this.route.queryParams.subscribe(params => {
      this.matterId = +params.matterId;
      this.pageType = params.pageType;
      this.clientId = params.clientId;
      this.invoiceId = +params.invoiceId;

      if (this.clientId > 0 && this.matterId > 0) {
        this.getClientDetails();
      } else {
        this.toastr.showError('Please select a client');
      }
    });
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
    });
    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  back() {
    this.dataEntered = false;
    this.backbuttonPressed = false;
    this.navigateAwayPressed = false;
    this.isOnFirstTab = false;
    if (this.pageType === 'potentialClient') {
      this.router.navigate(['/contact/view-potential-client'], { queryParams: { clientId: this.clientId, state: this.state, selectedtab: 'Invoices' } });
    } else {
      this.router.navigate(['/billing'], { queryParams: { selectedtab: 'Invoices' } });
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
    row['isExpended'] = !row['isExpended'];
  }

  addConsulation(action, row = null, $event) {
    if ($event && $event.target && row && $event.target.closest('datatable-body-cell')) {
      $event.target.closest('datatable-body-cell').blur();
    }

    let modalRef = this.modalService.open(AddEditConsulationComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
    });
    if (action == 'edit') {
      modalRef.componentInstance.selectedRow = row;
    }
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.clientDetails = this.clientDetails;
    modalRef.result.then((res) => {
      if (res) {
        this.getUnbilledItems();
      }
    });
  }

  witeDown(row, action, details) {
    row = {
      id: row.consultationFeeList.id,
      amount: row.consultationFeeList.displayAmount,
      oriAmount: row.consultationFeeList.displayAmount,
      date:
        action == 'add'
          ? row.consultationFeeList.dateOfService
          : row.writeDownDetailList.length > 0
          ? row.writeDownDetailList[0].writeDownDateTime
          : null,
      person: {name: row.consultationFeeList.timeKeeper},
      disbursementType: {
        code: row.consultationFeeList.code,
        description: row.consultationFeeList.name,
        isBillable: null,
      },
      status: {
        name: row.consultationFeeList.status
      },
      hours: {
        value: {
          hours: row.consultationFeeList.totalHours,
          minutes: row.consultationFeeList.totalMins,
        },
      },
      writeDown:
        row.writeDownDetailList.length > 0
          ? [
            {
              writeDownAmount: row.writeDownDetailList[0].writeDownAmount,
              writeDownCode: {
                code: row.writeDownDetailList[0].code,
                name: row.writeDownDetailList[0].name,
              },
            },
          ]
          : null,
    };
    details = {
      id: details ? details.id : null,
      writeDownAmount: details ? details.writeDownAmount : null,
      writeDownCode: details
        ? {
          code: details.code,
          name: details.name,
          id: details.writeDownCodeId,
          WriteDownCodeId: details.writeDownCodeId,
        }
        : null,
      writeDownNarrative: details ? details.writeDownNarrative : null
    };
    let modalRef = this.modalService.open(TimeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg',
    });
    modalRef.componentInstance.rowDetails = {...row};
    modalRef.componentInstance.writeDownDetails = {...details};
    modalRef.componentInstance.type = 'consultation';

    if (action == 'add') {
      modalRef.componentInstance.billedAmount = Math.round(
        row.amount
      ).toString();
      modalRef.componentInstance.title = 'Consultation Fee Write-Down';
    }

    if (action === 'edit') {
      modalRef.componentInstance.isEdit = true;
      modalRef.componentInstance.writeDownDetails = details;
      modalRef.componentInstance.title = 'Edit Consultation Fee Write-Down';
      modalRef.componentInstance.rowDetails.amount +=
        details.writeDownAmount || 0;
    }

    if (action === 'view') {
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = 'View Consultation Fee Write-Down';
      modalRef.componentInstance.writeDownDetails = details;
      modalRef.componentInstance.rowDetails.amount +=
        details.writeDownAmount || 0;
    }

    modalRef.result.then((res) => {
      if (res && res.action) {
        if (res.action === 'add') {
          this.newWriteDowns.push(res.id);
        }
        this.getUnbilledItems();
      }
    });
  }

  async removeWriteDown(row) {
    const resp: any = await this.dialogService.confirm(
      'You are about to delete a time write-down from this pre-bill, Do you want to continue?',
      'Yes, delete Write-Down',
      'Cancel',
      'Delete Consultation Fee Write-Down',
      true,
      ''
    );
    if (resp) {
      try {
        await this.billingService
          .v1BillingWriteDownIdDelete({id: row.id})
          .toPromise();
        this.toastr.showSuccess('Consultation Fee Write-Down deleted.');
        this.getUnbilledItems();
      } catch (err) {
      }
    }
  }

  openModal(row, content, className: any = null, winClass: any = null) {
    this.selectedRow = row;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  deleteConsultation() {
    this.potentialClientBillingService
      .v1PotentialClientBillingConsultationFeeIdDelete$Response({
        id: this.selectedRow.consultationFeeList.id,
      })
      .subscribe((res) => {
        res = JSON.parse(res.body as any).results;
        if (res) {
          this.modalService.dismissAll();
          this.toastr.showSuccess('Consultation fee successfully deleted.');
          this.getUnbilledItems();
          this.selectedRow = null;
        }
      });
  }

  private getTenantProfile() {
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantId) {
      this.tenantDetails = {
        tenantId: userInfo.tenantId
      } as any;
      this.getTenantBillingSettings();
    } else {
      this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.tenantDetails = res;
          this.getTenantBillingSettings();
        },
        () => {
        }
      );
    }
  }

  getTenantBillingSettings() {
    this.billingService.v1BillingSettingsTenantTenantIdGet({tenantId: this.tenantDetails.tenantId})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((result) => {
        const paymentDueDate = moment(new Date()).add(result[0].daysToPayInvoices, 'days');
        this.paymentDueDate = paymentDueDate.toDate();
      })
  }

  private getDefaultInvoiceTemplate() {
    this.billingService.v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.invoiceTemplateDetails = res;
      });
  }

  getClientDetails() {
    this.clientService
      .v1ClientClientIdGet({clientId: this.clientId})
      .subscribe(
        (res) => {
          this.clientDetails = JSON.parse(res as any).results;
          this.isEmailPresent = this.clientDetails.isCompany ? this.clientDetails.primaryContactPerson && this.clientDetails.primaryContactPerson.email : this.clientDetails.email
          let loginUserAttorny = UtilsHelper.checkPermissionOfConsultAtn(
            this.clientDetails
          );
          if (
            loginUserAttorny ||
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
          ) {
            this.isAdmin = true;
          }

          if (
            loginUserAttorny ||
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin
          ) {
            this.isWriteDownAdmin = true;
          }

          this.getUnbilledItems();
          this.getReversedInvoiceInfo();
        },
        (err) => {
        }
      );
  }

  getUnbilledItems() {
    this.matterService.v1MatterUnbilleditemsMatteridGet({matterid: this.matterId})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((result: any) => {
        if (result.consultationFees && result.consultationFees.length) {
          this.consultationFees = [...result.consultationFees];
          this.selectedConsultationFees = [...this.consultationFees];
          this.saveBtn = this.selectedConsultationFees.length > 0 ? false : true;
        }
        this.loading = false;
      })
  }

  private getReversedInvoiceInfo() {
    this.billingService.v1BillingGetCancelledInvoiceAmountMatterIdGet({
      matterId: this.clientDetails.matterId
    })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.reveredInvoiceAmount = res;
      });
  }

  public previewInvoice() {
    this.showInvoice = true;
    this.loader = true;

    this.loaderCallback = () => {
      this.loader = false;
    }

    const queryParams: any = {
      matterId: this.matterId
    };

    if (this.selectedConsultationFees && this.selectedConsultationFees.length > 0) {
      queryParams.consultationFees = this.selectedConsultationFees.map(a => a.consultationFeeList.id).toString();
    };

    this.pagetitle.setTitle("Preview Invoice");

    this.billNowModel = {
      timeEntries: [],
      disbursements: [],
      addOnIds: [],
      fixedFeeMappingIds: [],
      writeOffs: [],
      consultationFees: this.toNumberArray(queryParams['consultationFees']),
    };
  }

  private toNumberArray(str: string) {
    if (str) {
      let arr = str.split(',').map((a) => +a);
      return arr;
    } else {
      return [];
    }
  }

  returnToEditCharges() {
    this.showInvoice = false;
    this.loader = false;
    this.pagetitle.setTitle('Edit Charges');
  }

  onSelectRow($event) {
    this.selectedConsultationFees = ($event && $event.selected) ? $event.selected : [];
  }

  cancelAllCharges() {
    if (this.cancelAllChargeForm.invalid) {
      return;
    }
    this.cancelFormLoader = true;

    const formData: any = this.cancelAllChargeForm.value;
    formData.dateOfService = moment().format('YYYY-MM-DD[T]HH:mm:ssZ');
    formData.matterId = this.matterId;
    formData.isVisibleToClient = (formData.isVisibleToClient === 'yes') ? true : false;
    const consultationFeesId = [];
    if (this.consultationFees.length > 0) {
      this.consultationFees.map((obj) => {
        consultationFeesId.push(obj.consultationFeeList.id);
      });
    };

    const data: any = {
      billingNarrative: formData,
      disbursements: [],
      fixFeeServices: [],
      fixFeeAddon: [],
      timeEntries: [],
      consultationFee: consultationFeesId
    };

    this.billingService.v1BillingReversebillClearallchargesPost$Json({ body: data }).subscribe((res: any) => {
      this.hasMadeChanges = true;
      this.cancelFormLoader = false;
      res = JSON.parse(res as any).results;
      if (res) {
        this.modalService.dismissAll();
        this.toastr.showSuccess(this.errorData.all_charges_cancel_success);
        this.back();
      } else {
        this.toastr.showError(this.errorData.all_charges_cancel_error);
      }
    }, () => {
      this.cancelFormLoader = false;
    });
  }

  /**
   * Function to copy Billing Narative to Notes
   */
  public copytoNote() {
    if (!this.cancelAllChargeForm.value.noteToFile || this.cancelAllChargeForm.value.noteToFile.trim() === '') {
      this.cancelAllChargeForm.patchValue({
        noteToFile: this.cancelAllChargeForm.value.billingNarrative
      });
    }
  }

  public reBill(popup) {
    if (this.saveBtn) {
      return this.toastr.showError(this.errorData.rebill_charges_warning);
    }

    this.totalBillAmount = 0;
    this.print = true;
    if (this.isEmailPresent) {
      this.sendEmail = true;
    }
    this.consultationFees.forEach(consultationFee => {
      this.totalBillAmount += consultationFee.consultationFeeList.displayAmount
    })
    this.totalBillAmount = this.totalBillAmount - this.reveredInvoiceAmount;
    const consultationFeesId = [];
    this.consultationFees.map((obj) => {
      consultationFeesId.push(obj.consultationFeeList.id);
    });

    let body = {
      clientId: +this.clientId,
      matterId: +this.clientDetails.matterId,
      totalBillAmount: this.totalBillAmount,
      appURL: this.appConfigService.APP_URL,
      consultationFees: consultationFeesId,
      invoiceDueDate: this.paymentDueDate
    }

    this.modalService.open(popup, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    }).result.then(res => {
      if (res) {
        this.submitBillNow(body);
      }
    });
  }

  public submitBillNow(body) {
    this.loading = true;
    this.matterService.v1MatterUnbilleditemsBillToClientPost$Json({
      body
    })
      .pipe(
        map(UtilsHelper.mapData)
      )
      .subscribe(res => {
        this.hasMadeChanges = true;
        if (res) {
          this.loading = false;
          this.billToClientResponse = res;
        } else {
          this.loading = false;
          this.toastr.showError(this.errorData.server_error);
        }
      }, () => {
        this.loading = false;
      });
  }

  getContactTypeObj (type: string) {
    return this.clientDetails.corporateContacts.find(d => d.code === type);
  }

  sendEmailAndPrint(invoiceHTML: vwSendInvoice) {
    const body: vwBillToClientPrintAndEmail = {
      invoices: [
        {
          invoiceInfo: invoiceHTML,
          emailInfo: {
            billingContact: this.getContactTypeObj('Billing Contact'),
            primaryContact: this.getContactTypeObj('Primary Contact'),
            updatePrimaryContactEmail: false,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            email: (this.isEmailPresent) ? this.isEmailPresent : null,
          },
          print: this.print,
          sendEmail: this.sendEmail && !!this.isEmailPresent
        }
      ],
      print: this.print,
      sendEmail: this.sendEmail && !!this.isEmailPresent
    };

    this._sendEmailAndPrint(body);
    this.redirect();
  }

  private _sendEmailAndPrint(body) {
    this.loading = true;
    this.billingService.v1BillingBillToClientEmailAndPrintPost$Json({
      body
    }).pipe(map(UtilsHelper.mapData))
      .subscribe((res: vwBillToClientEmailAndPrintResponse) => {
        if (res) {
          if (this.print) {
            const file = UtilsHelper.base64toFile(
              res.invoicesToPrint[0].bytes,
              `invoice_${this.billToClientResponse.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);

            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
          }
        }
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  private redirect() {
    let msg = '';
    if (this.clientDetails && this.clientDetails.isCompany) {
      msg = 'Invoice Number ' + this.billToClientResponse.invoiceId + ' has been issued to ' + this.clientDetails.companyName;
    } else {
      msg = 'Invoice Number ' + this.billToClientResponse.invoiceId + ' has been issued to ' + this.clientDetails.firstName + ' ' + this.clientDetails.lastName;
    }
    if (this.pageType === 'potentialClient') {
      this.toastr.showSuccess(msg);
    } else {
      this.toastr.showSuccess(msg);
    }
    this.back();
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    if (!this.hasMadeChanges) {
      this.isOnFirstTab = true;
      this.backbuttonPressed = true;
    } else {
      this.isOnFirstTab = false;
      this.backbuttonPressed = false;
      this.dataEntered = false;
    }
  }
}
