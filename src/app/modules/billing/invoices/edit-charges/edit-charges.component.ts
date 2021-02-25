import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vmWriteOffs, vwMatterResponse } from 'src/app/modules/models';
import { vwBillNowClientEmailInfo, vwBillToClientEmailAndPrintResponse, vwDefaultInvoice, vwSuccessBillToClient } from 'src/app/modules/models/bill-to-client.model';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import { vwBillingSettings, vwBillNowModel, vwBillToClientPrintAndEmail, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, FixedFeeServiceService, MatterService, TenantService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';

@Component({
  selector: 'app-edit-charges',
  templateUrl: './edit-charges.component.html',
  styleUrls: ['./edit-charges.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditChargesComponent implements OnInit, OnDestroy {
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
  matterId: number;
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
  sendEmail = true;
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
  public matterBillingSettings: vwBillingSettings;

  loader = false;

  loaderCallback = () => {
    this.loader = false;
  }

  reveredInvoiceAmount = 0;

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
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      const matterId = params.matterId;

      if (matterId) {
        this.matterId = +matterId;
        this.invoiceId = params.invoiceId;
        this.pageType = params.pageType || 'billing';
        this.getBillingSecondaryDetails();
        this.getInvoicePreferences();
        this.getDefaultInvoiceTemplate();
        this.getMatterBillingSettings();
        this.getMatterDetails();
        this.getTenantProfile();
        this.getReversedInvoiceInfo(this.matterId);
      } else {
        this.toastr.showError('Please select a matter');
      }
    });
  }

  private getReversedInvoiceInfo(matterId: number) {
    this.billingService.v1BillingGetCancelledInvoiceAmountMatterIdGet({
      matterId: matterId
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      this.reveredInvoiceAmount = res;
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
    if (this.pageType === 'matter') {
      this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: this.matterId, selectedtab: 'Invoices' } });
    } else {
      this.router.navigate(['/billing'], { queryParams: { selectedTab: 'Invoices' } });
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.tenantDetails = res;
        },
        () => {
        }
      );
  }

  private getDefaultInvoiceTemplate() {
    this.billingService.v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getMatterBillingSettings() {
    this.billingService
      .v1BillingSettingsMatterMatterIdGet({
        matterId: this.matterId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: any[]) => {
        if (res && res.length > 0) {
          this.matterBillingSettings = res[0];
        } else {
          this.matterBillingSettings = {} as vwBillingSettings;
        }
      });
  }

  private getInvoicePreferences() {
    this.billingService.v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.invoicePrefList = res;
          this.paperInvoice = this.invoicePrefList.find(
            a => a.code === 'PAPER'
          );
          this.electronicInvoice = this.invoicePrefList.find(
            a => a.code === 'ELECTRONIC'
          );
          this.paperAndElectronicInvoice = this.invoicePrefList.find(
            a => a.code === 'PAPER_AND_ELECTRONIC'
          );
        } else {
          this.invoicePrefList = [];
        }
      });
  }

  public getMatterDetails() {
    this.matterService.v1MatterMatterIdGet({ matterId: this.matterId })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.matterDetails = res;
        this.timeWriteDownBtn = UtilsHelper.checkPermissionOfRepBingAtn(this.matterDetails);
        if (this.permissionList && this.permissionList.BILLING_MANAGEMENTisAdmin) {
          this.timeWriteDownBtn = true;
        }
        this.getDetails();
        this.getClientEmailInfo();
      }, () => {
        this.loading = false;
      });
  }

  public getDetails() {
    this.loading = true;
    this.matterService.v1MatterUnbilleditemsMatteridGet({ matterid: this.matterId, reverseBill: true })
      .pipe(map(UtilsHelper.mapData), finalize(() => {
        this.loading = false;
      }))
      .subscribe((res: PreBillingModels.IUnbilleditems) => {
        if (res.lastPrebillDate) {
          this.lastPrebillDate = res.lastPrebillDate;
        }
        this.timekeepingList = res.timeEntries;

        if (this.timekeepingList && this.timekeepingList.length > 0) {
          this.timekeepingList = this.timekeepingList.filter(a => a.disbursementType && a.disbursementType.billableTo.name !== 'Overhead');
        }

        this.prebillingSettings.fixedFeeService = res.fixedFeeServices;
        this.prebillingSettings.addOnServices = res.addOns;
        this.prebillingSettings.matter = {
          id: +this.matterId
        };
        if (res.fixedFeeServices) {
          this.fixedFeeSelected = [...res.fixedFeeServices];
        }
        const disbList: Array<PreBillingModels.vwBillingLines> = res.disbursements;
        if (disbList && disbList.length > 0) {
          disbList.map((obj) => {
            obj.oriAmount = obj.amount;
            if (obj.writeDown && obj.writeDown.length > 0) {
              const sum = _.sumBy(obj.writeDown, a => a.writeDownAmount || 0);
              if (obj.oriAmount >= 0) {
                obj.amount = obj.amount - sum;
              } else {
                obj.amount = obj.amount + sum;
              }
            }
            obj.disbursementType.code = (+obj.disbursementType.code) as any;
            if (obj.createdOn) {
              obj.createdOn = moment(new Date(moment(obj.createdOn).format('MM/DD/YYYY h:mm:ss A') + ' UTC')).format('MM/DD/YY, h:mm A');
            }
            if (obj.writeDown && obj.writeDown.length > 0) {
              obj.writeDown.map((item) => {
                item.createdAt = moment(new Date(moment(item.createdAt).format('MM/DD/YYYY h:mm:ss A') + ' UTC')).format('MM/DD/YY, h:mm A');
              });
            }
          });
        }
        this.disbursementList = disbList;
        this.disbursementList = _.orderBy(this.disbursementList, ['date', 'disbursementType.code']);
        this.writeOffsList = res.matterWriteOffs;
        if (res.issuenceDate) {
          this.issuenceDate = res.issuenceDate;
        }
        this.calculateAmount();
        this.timeEntrySelected = [...this.timekeepingList];
        if (this.matterDetails.isFixedFee) {
          this.timeEntrySelected = [];
        }
        this.writeOffSelected = [...this.writeOffsList];
        this.disbursementSelected = [...this.disbursementList];
        this.addOnSelected = [...this.prebillingSettings.addOnServices];
        this.validateSaveBtn(null);
        UtilsHelper.aftertableInit();
        this.loading = false;
      }, (err) => {
        this.loading = false;
      });
  }

  private getClientEmailInfo() {
    this.clientService.v1ClientClientEmailInfoClientIdGet({
      clientId: this.matterDetails.clientName.id
    })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.clientEmailInfo = res;
      });
  }

  private calculateAmount() {
    this.timekeepingList.map(time => {
      if (time.disbursementType.billingType.name === 'Fixed') {
        time.amount = time.disbursementType.rate;
        time.disbursementType.billableTo.amount = time.amount;
      } else {
        const tmin = time.hours.value.hours * 60 + time.hours.value.minutes;
        time.amount = tmin * (time.disbursementType.rate / 60);
        time.disbursementType.billableTo.amount = time.amount;
      }
      time.oriAmount = time.amount;
      if (time.writeDown && time.writeDown.length > 0) {
        const sum = _.sumBy(time.writeDown, a => a.writeDownAmount || 0);
        if (time.oriAmount >= 0) {
          time.amount = time.amount - sum;
        } else {
          time.amount = time.amount + sum;
        }
        time.disbursementType.billableTo.amount = time.amount;
      }
    });
  }
  public validateSaveBtn(event) {
    if (event) {
      switch (event.type) {
        case 'disbursement':
          this.disbursementSelected = event.selected;
          break;
        case 'writeoff':
          this.writeOffSelected = event.selected;
          break;
        case 'fixedfee':
          this.fixedFeeSelected = event.selected;
          break;
        case 'addon':
          this.addOnSelected = event.selected;
          break;
        case 'timeentry':
          this.timeEntrySelected = event.selected;
          break;
      }
    }
    if (this.matterDetails && this.matterDetails.isFixedFee) {
      this.saveBtn = (
        this.disbursementSelected.length > 0 || this.writeOffSelected.length > 0 ||
        this.fixedFeeSelected.length > 0 || this.addOnSelected.length > 0
      ) ? false : true;
    } else {
      this.saveBtn = (
        this.disbursementSelected.length > 0 || this.writeOffSelected.length > 0 ||
        this.timeEntrySelected.length > 0
      ) ? false : true;
    }
  }
  public removeWriteDown(row: PreBillingModels.IWriteDown) {
    this.dialogService.confirm(
      this.errorData.time_write_down_delete_warning_message,
      'Yes, delete',
      'Cancel',
      'Delete Write-Down',
      true,
      ''
    ).then(response => {
      if (response) {
        this.billingService.v1BillingWriteDownIdDelete({ id: row.id })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(res => {
            if (res) {
              this.getDetails();
            }
          },
            () => {
            });
      }
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

    if (this.timeEntrySelected && this.timeEntrySelected.length > 0) {
      queryParams.timeEntries = this.timeEntrySelected.map(a => a.id).toString();
    }

    if (this.disbursementSelected && this.disbursementSelected.length > 0) {
      queryParams.disbursements = this.disbursementSelected.map(a => a.id).toString();
    }

    if (this.prebillingSettings && this.matterDetails && this.matterDetails.isFixedFee) {
      if (this.fixedFeeSelected && this.fixedFeeSelected.length > 0) {
        queryParams.fixedFees = this.fixedFeeSelected.map(a => a.id).toString();
      }

      if (this.addOnSelected.length > 0) {
        queryParams.addOns = this.addOnSelected.map(a => a.id).toString();
      }
    }

    if (this.writeOffSelected && this.writeOffSelected.length > 0) {
      queryParams.writeOffs = this.writeOffSelected.map(a => a.id).toString();
    }

    this.pagetitle.setTitle("Preview Invoice");

    this.billNowModel = {
      timeEntries: this.toNumberArray(queryParams['timeEntries']),
      disbursements: this.toNumberArray(queryParams['disbursements']),
      addOnIds: this.toNumberArray(queryParams['addOns']),
      fixedFeeMappingIds: this.toNumberArray(queryParams['fixedFees']),
      writeOffs: this.toNumberArray(queryParams['writeOffs']),
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

  cancelAllCharges() {
    if (this.cancelAllChargeForm.invalid) {
      return;
    }
    const formData: any = this.cancelAllChargeForm.value;
    formData.dateOfService = moment().format('YYYY-MM-DD[T]HH:mm:ssZ');
    formData.matterId = this.matterId;
    formData.clientId = 0;
    formData.isVisibleToClient = (formData.isVisibleToClient === 'yes') ? true : false;
    const disbursements = this.disbursementList.map(x => x.id);

    const data: any = {
      billingNarrative: formData,
      disbursements
    };

    if (this.matterDetails.isFixedFee) {
      const fixFeeServices = this.prebillingSettings.fixedFeeService.map(x => x.id);
      const fixFeeAddon = this.prebillingSettings.addOnServices.map(x => x.id);
      data.fixFeeServices = fixFeeServices;
      data.fixFeeAddon = fixFeeAddon;
    } else {
      const timeEntries = this.timekeepingList.map(x => x.id);
      data.timeEntries = timeEntries;
    }

    this.cancelFormLoader = true;
    this.billingService.v1BillingReversebillClearallchargesPost$Json({ body: data }).subscribe((res: any) => {
      this.hasMadeChanges = true;
      this.cancelFormLoader = false;
      res = JSON.parse(res as any).results;
      if (res) {
        this.modalService.dismissAll();

        if (this.pageType === 'matter') {
          this.toastr.showSuccess(this.errorData.all_charges_cancel_success);
        } else {
          this.invoiceService.message$.next({
            type: 'Success',
            errors: [this.errorData.all_charges_cancel_success],
          });
        }

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

  private getBillingSecondaryDetails() {
    this.fixedFeeService
      .v1FixedFeeServiceBillingMatteridGet$Response({
        matterid: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results;
        })
      ).subscribe(res => {
        if (res && res.billingSettings) {
          this.billingSettings = res.billingSettings;
        }
      });
  }

  public reBill(popup) {
    if (this.saveBtn) {
      return this.toastr.showError(this.errorData.rebill_charges_warning);
    }

    this.totalBillAmount = 0;
    let timeEntries: Array<number> = [];
    let disbursements: Array<number> = [];
    let writeOffs: Array<number> = [];
    const fixedFeeMappingIds: Array<number> = [];
    const addOnIds: Array<number> = [];
    let totalWriteOff = 0;

    if (this.fixedFeeSelected && this.fixedFeeSelected.length > 0) {
      this.fixedFeeSelected.map((obj) => {
        this.totalBillAmount = this.totalBillAmount + obj.rateAmount;
        fixedFeeMappingIds.push(obj.id);
        const sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
        if (obj.rateAmount >= 0) {
          this.totalBillAmount = this.totalBillAmount - sum;
        } else {
          this.totalBillAmount = this.totalBillAmount + sum;
        }
      });
    }

    if (this.addOnSelected && this.addOnSelected.length > 0) {
      this.addOnSelected.map((obj) => {
        const sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
        if (obj.serviceAmount >= 0) {
          this.totalBillAmount = this.totalBillAmount + (obj.serviceAmount - sum);
        } else {
          this.totalBillAmount = this.totalBillAmount + (obj.serviceAmount + sum);
        }
        addOnIds.push(obj.id);
      });
    }

    if (this.writeOffSelected && this.writeOffSelected.length > 0) {
      totalWriteOff = _.sumBy(this.writeOffSelected, a => a.writeOffAmount || 0);
      writeOffs = this.writeOffSelected.map((obj) => obj.id);
    }

    disbursements = this.getIdsAndTotal(this.disbursementSelected, 'disbursement');
    timeEntries = this.getIdsAndTotal(this.timeEntrySelected, 'timeentry');

    let reversedInvoiceAmount = this.reveredInvoiceAmount || 0;
    this.totalBillAmount = this.totalBillAmount - reversedInvoiceAmount;

    const body: any = {
      matterId: +this.matterId,
      disbursements,
      writeOffs,
      totalBillAmount: this.totalBillAmount,
      totalWriteOff,
      appURL: `${window.location.protocol}//${window.location.host}`,
    };
    if (this.matterDetails.isFixedFee) {
      body.fixedFeeMappingIds = fixedFeeMappingIds;
      body.addOnIds = addOnIds;
    } else {
      body.timeEntries = timeEntries;
    }

    if (this.billingSettings && this.billingSettings.invoiceDelivery) {
      const invoicePref = this.billingSettings.invoiceDelivery.id;
      this.sendEmail = invoicePref == this.electronicInvoice.id || invoicePref == this.paperAndElectronicInvoice.id;
      this.print = invoicePref == this.paperInvoice.id || invoicePref == this.paperAndElectronicInvoice.id;
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

  private getIdsAndTotal(arr, type) {
    switch (type) {
      case 'disbursement':
        arr = arr.filter(list => list.disbursementType.isBillable);
        break;
      case 'timeentry':
        arr = arr.filter(list => (list.disbursementType.billableTo.name === 'Client' || list.disbursementType.billableTo.name === 'Both'));
        break;
    }
    const ids: Array<number> = [];
    if (arr && arr.length > 0) {
      arr.map((obj) => {
        ids.push(obj.id);
        this.totalBillAmount = this.totalBillAmount + obj.amount;
      });
    }
    return ids;
  }

  sendEmailAndPrint(invoiceHTML: vwSendInvoice) {
    const body: vwBillToClientPrintAndEmail = {
      invoices: [
        {
          invoiceInfo: invoiceHTML,
          emailInfo: {
            billingContact: this.clientEmailInfo.billingContact,
            primaryContact: this.clientEmailInfo.primaryContact,
            updatePrimaryContactEmail: false,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            email: this.clientEmailInfo.email
          },
          print: this.print,
          sendEmail: this.sendEmail
        }
      ],
      print: this.print,
      sendEmail: this.sendEmail
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
    const msg = 'Invoice Number ' + this.billToClientResponse.invoiceId + ' has been issued to ' + this.matterDetails.matterName;
    if (this.pageType === 'matter') {
      this.toastr.showSuccess(msg);
    } else {
      this.invoiceService.message$.next({
        type: 'Success',
        errors: [msg],
      });
    }
    this.back();
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
