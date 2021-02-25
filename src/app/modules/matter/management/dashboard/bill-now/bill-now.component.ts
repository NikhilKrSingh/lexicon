import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vmWriteOffs, vwMatterResponse } from 'src/app/modules/models';
import { vwBillNowClientEmailInfo, vwBillToClientEmailAndPrintResponse, vwDefaultInvoice, vwSuccessBillToClient } from 'src/app/modules/models/bill-to-client.model';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillingSettings, vwBillToClientPrintAndEmail, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, FixedFeeServiceService, MatterService, TenantService, TrustAccountService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-bill-now',
  templateUrl: './bill-now.component.html',
  styleUrls: ['./bill-now.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillNowComponent implements OnInit, OnDestroy {
  public timekeepingList: Array<PreBillingModels.vwBillingLines> = [];
  public timeEntrySelected: Array<PreBillingModels.vwBillingLines> = [];
  public matterId: number;
  public matterDetails: vwMatterResponse;
  public error_data = (errors as any).default;
  public timeWriteDownBtn: boolean = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public loginUser: any;
  public lastPrebillDate: Date = new Date();
  public disbursementList: Array<PreBillingModels.vwBillingLines> = [];
  public disbursementSelected: Array<PreBillingModels.vwBillingLines> = [];
  public writeOffsList: Array<vmWriteOffs> = [];
  public writeOffSelected: Array<vmWriteOffs> = [];
  public workComplete: boolean = false;
  public fixedFeeServices: Array<PreBillingModels.FixedFeeService> = [];
  public fixedFeeSelected: Array<PreBillingModels.FixedFeeService> = [];
  public addOnServices: Array<PreBillingModels.AddOnService> = [];
  public addOnSelected: Array<PreBillingModels.AddOnService> = [];
  public saveBtn: boolean = true;
  public issuenceDate: string = (new Date()).toString();
  public prebillingSettings: PreBillingModels.vwPreBilling;
  public totalBillAmount: number = 0;

  public billingSettings: vwBillingSettings;

  loading = true;

  sendEmail = true;
  print = true;

  invoicePrefList: Array<vwIdCodeName>;
  paperInvoice: vwIdCodeName;
  electronicInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;

  clientEmailInfo: vwBillNowClientEmailInfo;
  emailAddressToUpdate: string;

  public billToClientResponse: vwSuccessBillToClient;
  public invoiceTemplateDetails: vwDefaultInvoice;
  public tenantDetails: any;
  public default_logo_url: string;
  public trustAccountEnabled: boolean;

  private reveredInvoiceAmount = 0;
  isWorkCompleteFlow = false;

  constructor(
    private route: ActivatedRoute,
    private toastr: ToastDisplay,
    private matterService: MatterService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private billingService: BillingService,
    private router: Router,
    private fixedFeeService: FixedFeeServiceService,
    private modalService: NgbModal,
    private clientService: ClientService,
    private tenantService: TenantService,
    private appConfigService: AppConfigService,
    private invoiceService: InvoiceService,
    private pagetitle: Title,
    private trustAccountService: TrustAccountService
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.prebillingSettings = {} as PreBillingModels.vwPreBilling;

    this.invoiceService.loadImage(this.appConfigService.appConfig.default_logo).subscribe(blob => {
      const a = new FileReader();
      a.onload = (e) => {
        this.default_logo_url = (e.target as any).result;
      };
      a.readAsDataURL(blob);
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Bill Now');
    this.loginUser = UtilsHelper.getLoginUser();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
            this.permissionList = obj.datas;
        }
      }
    });
    this.route.queryParams.subscribe(params => {
      let matterId = params['matterId'];
      let billType = params['billType'];
      this.isWorkCompleteFlow = params.isWorkCompleteFlow == 'true';

      this.matterId = +matterId;
      if (matterId) {
        this.getBillingSecondaryDetails();
        this.getInvoicePreferences();
        this.getDefaultInvoiceTemplate();
        this.getMatterDetails();
        this.getTenantProfile();
        this.checkTrustAccountStatus();
        this.getReversedInvoiceInfo(this.matterId);
      } else {
        this.toastr.showError('Please select a matter');
        this.loading = false;
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

  ngOnDestroy() {
    if (this.permissionSubscribe) {
        this.permissionSubscribe.unsubscribe();
    }
  }

  private checkTrustAccountStatus() {
    this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise().then(res => {
      let resp = JSON.parse(res.body as any).results;
      if (resp) {
        this.trustAccountEnabled = resp;
      }
    });
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
      })
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

  private getDefaultInvoiceTemplate() {
    this.billingService.v1BillingGetDefaultInvoiceTemplateGet()
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      this.invoiceTemplateDetails = res;
    });
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

  public getMatterDetails() {
    this.matterService.v1MatterMatterIdGet({matterId: this.matterId})
    .pipe(map(UtilsHelper.mapData))
    .subscribe((res) => {
      this.matterDetails = res;
      this.timeWriteDownBtn = UtilsHelper.checkPermissionOfRepBingAtn(this.matterDetails);
      if (this.permissionList && this.permissionList.BILLING_MANAGEMENTisAdmin) {
        this.timeWriteDownBtn = true;
      }
      if (!this.timeWriteDownBtn) {
        this.loading = false;
        this.router.navigate(['/matter/dashboard'], {queryParams: {matterId: this.matterId}});
      }
      this.getDetails();
      this.getClientEmailInfo();
      this.loading = false;
    }, () => {
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

  /**
   * Get details of time entry, disbusment, write offs
   */
  public getDetails() {
    this.loading = true;
    this.matterService.v1MatterUnbilleditemsMatteridGet({matterid: this.matterId})
    .pipe(map(UtilsHelper.mapData), finalize(() => {
      this.loading = false;
    }))
    .subscribe((res: PreBillingModels.IUnbilleditems) => {
      if (res.lastPrebillDate) {
        this.lastPrebillDate = res.lastPrebillDate;
      }
      this.timekeepingList = res.timeEntries;

      if (this.timekeepingList && this.timekeepingList.length > 0) {
        this.timekeepingList = this.timekeepingList.filter(a => a.disbursementType && a.disbursementType.billableTo.name != 'Overhead');
      }

      this.prebillingSettings.fixedFeeService = res.fixedFeeServices;
      this.prebillingSettings.addOnServices = res.addOns;
      this.prebillingSettings.matter = {
        id: +this.matterId
      };
      if (res.fixedFeeServices) {
        this.fixedFeeSelected = [...res.fixedFeeServices];
      }
      let disbList: Array<PreBillingModels.vwBillingLines> = res.disbursements;
      if (disbList && disbList.length > 0) {
        disbList.map((obj) => {
          obj.oriAmount = obj.amount;
          if (obj.writeDown && obj.writeDown.length > 0) {
            let sum = _.sumBy(obj.writeDown, a => a.writeDownAmount || 0);
            if (obj.oriAmount >= 0) {
              obj.amount = obj.amount - sum;
            } else {
              obj.amount = obj.amount + sum;
            }
          }
          obj.disbursementType.code = (+obj.disbursementType.code) as any;
          if (obj.createdOn) {
            obj.createdOn = moment(new Date(moment(obj.createdOn).format("MM/DD/YYYY h:mm:ss A") + ' UTC')).format('MM/DD/YY, h:mm A');
          }
          if (obj.writeDown && obj.writeDown.length > 0) {
            obj.writeDown.map((item) => {
              item.createdAt = moment(new Date(moment(item.createdAt).format("MM/DD/YYYY h:mm:ss A") + ' UTC')).format('MM/DD/YY, h:mm A');
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
    }, (err) => {
      this.loading = false;
    });
  }

  private calculateAmount() {
    this.timekeepingList.map(time => {
      if (time.disbursementType.billingType.name == 'Fixed') {
        time.amount = time.disbursementType.rate;
        time.disbursementType.billableTo.amount = time.amount;
      } else {
        const tmin = time.hours.value.hours * 60 + time.hours.value.minutes;
        time.amount = tmin * (time.disbursementType.rate / 60);
        time.disbursementType.billableTo.amount = time.amount;
      }
      time.oriAmount = time.amount;
      if (time.writeDown && time.writeDown.length > 0) {
        let sum = _.sumBy(time.writeDown, a => a.writeDownAmount || 0);

        if (time.oriAmount >= 0) {
          time.amount = time.amount - sum;
        } else {
          time.amount = time.amount + sum;
        }

        time.disbursementType.billableTo.amount = time.amount;
      }
    });
  }


  public removeWriteDown(row: PreBillingModels.IWriteDown) {
    this.dialogService.confirm(
      this.error_data.time_write_down_delete_warning_message,
      'Yes, delete',
      'Cancel',
      'Delete Write-Down',
      true,
      ''
    ).then(response => {
      if (response) {
        this.billingService.v1BillingWriteDownIdDelete({id: row.id})
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

  /**
   * Cancel bill now
   */
  public cancel() {
    this.dialogService.confirm(
      this.error_data.cancel_bill_now_warning_message,
      'Yes, cancel bill now',
      'Cancel',
      'Cancel Bill Now',
      true,
      'modal-lmd'
    ).then(response => {
      if (response) {
        let writeDownIds: Array<number> = [];
        if (this.timekeepingList && this.timekeepingList.length > 0) {
          this.timekeepingList.map((item) => {
            if (item.writeDown && item.writeDown.length > 0) {
              item.writeDown.map(obj => {
                writeDownIds.push(obj.id);
              });
            }
          })
        }
        if (this.disbursementList && this.disbursementList.length > 0) {
          this.disbursementList.map((item) => {
            if (item.writeDown && item.writeDown.length > 0) {
              item.writeDown.map(obj => {
                writeDownIds.push(obj.id);
              });
            }
          })
        }
        if (writeDownIds.length > 0) {
          this.matterService.v1MatterCancelBillnowPost$Json({body: {writeDownIds}})
            .pipe(map(UtilsHelper.mapData))
            .subscribe(res => {
              this.router.navigate(['/matter/dashboard'], {queryParams: {matterId: this.matterId, selectedtab: 'Billing'}});
            },
            () => {
            });
        } else {
          this.router.navigate(['/matter/dashboard'], {queryParams: {matterId: this.matterId, selectedtab: 'Billing'}});
        }
      }
    });
  }

  public validateSaveBtn(event) {
    if (event) {
      switch(event.type) {
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
      this.saveBtn = (!(this.disbursementSelected.length > 0 || this.writeOffSelected.length > 0 ||
        this.fixedFeeSelected.length > 0 || this.addOnSelected.length > 0));
    } else {
      this.saveBtn =  (!(this.disbursementSelected.length > 0 || this.writeOffSelected.length > 0 ||
        this.timeEntrySelected.length > 0));
    }
  }

  public billToClient(billToClientWarningTemplate) {
    let currentDate = moment(this.issuenceDate).format('MM/DD/YY');
    this.totalBillAmount = 0;
    let timeEntries: Array<number> = [];
    let disbursements: Array<number> = [];
    let writeOffs: Array<number> = [];
    let fixedFeeMappingIds: Array<number> = [];
    let addOnIds: Array<number> = [];
    let totalWriteOff: number = 0;

    if (this.fixedFeeSelected && this.fixedFeeSelected.length > 0) {
      this.fixedFeeSelected.map((obj) => {
        this.totalBillAmount = this.totalBillAmount + obj.rateAmount;
        fixedFeeMappingIds.push(obj.id);
        let sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
        if (obj.rateAmount >= 0) {
          this.totalBillAmount = this.totalBillAmount - sum;
        } else {
          this.totalBillAmount = this.totalBillAmount + sum;
        }
      });
    }

    if (this.addOnSelected && this.addOnSelected.length > 0) {
      this.addOnSelected.map((obj) => {
        let sum = _.sumBy(obj.writeDownList, a => a.writeDownAmount || 0);
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

    let body = {
      "matterId": +this.matterId,
      "disbursements": disbursements,
      "writeOffs": writeOffs,
      "totalBillAmount": this.totalBillAmount,
      "totalWriteOff": totalWriteOff,
      "appURL": `${window.location.protocol}//${window.location.host}`,
      "isWorkComplete": this.isWorkCompleteFlow
    }
    if (this.matterDetails.isFixedFee) {
      body["fixedFeeMappingIds"] = fixedFeeMappingIds;
      body["addOnIds"] = addOnIds;
    } else {
      body["timeEntries"] = timeEntries;
    }

    if (this.billingSettings && this.billingSettings.invoiceDelivery) {
      let invoicePref = this.billingSettings.invoiceDelivery.id;
      this.sendEmail = invoicePref == this.electronicInvoice.id || invoicePref == this.paperAndElectronicInvoice.id;
      this.print = invoicePref == this.paperInvoice.id || invoicePref == this.paperAndElectronicInvoice.id;
    }

    this.modalService.open(billToClientWarningTemplate, {
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
      body: body
    })
    .pipe(
      map(UtilsHelper.mapData)
    )
    .subscribe(res => {
      if (res) {
        this.billToClientResponse = res;
      } else {
        this.toastr.showError(this.error_data.server_error);
      }
    },
    () => {
      this.loading = false;
    });
  }

  public sendEmailAndPrint(invoiceHTML: vwSendInvoice, emailAddressNotonFile) {
    let body: vwBillToClientPrintAndEmail = {
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
    this.redirectToBillingTab();
  }

  private _sendEmailAndPrint(body) {
    this.billingService.v1BillingBillToClientEmailAndPrintPost$Json({
      body: body
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe((res: vwBillToClientEmailAndPrintResponse) => {
      if (res) {
        if (this.print) {
          let file = UtilsHelper.base64toFile(
            res.invoicesToPrint[0].bytes,
            `invoice_${this.billToClientResponse.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
            'application/pdf'
          );
          saveAs(file);

          let url = URL.createObjectURL(file);
          window.open(url, '_blank');
        }
      }
    }, () => {
      this.loading = false;
    });
  }

  private redirectToBillingTab() {
    if (this.workComplete) {
      this.markAsComplete(() => {
        this.toastr.showSuccess(this.error_data.bill_to_client_success);
        const queryParams = {
          matterId: this.matterId,
          selectedtab: 'Billing'
        }
        this.router.navigate(['/matter/dashboard'], {queryParams});
      });
    } else {
      if (this.isWorkCompleteFlow) {
        this.toastr.showSuccess(this.error_data.bill_to_client_success_mark_as_complete);
      } else {
        this.toastr.showSuccess(this.error_data.bill_to_client_success);
      }
      this.router.navigate(['/matter/dashboard'], {queryParams: {matterId: this.matterId, selectedtab: 'Billing'}});
    }
  }

  private markAsComplete(onSuccess = () => {}) {
    this.billingService.v1BillingSettingsPut$Json({
      body: {
        ...this.billingSettings,
        isWorkComplete: true
      }
    }).subscribe(() => {
      onSuccess();
    });
  }

  public previewInvoice() {
    let queryParams: any = {
      matterId: this.matterId,
      isWorkCompleteFlow: this.isWorkCompleteFlow
    };

    if (this.timeEntrySelected && this.timeEntrySelected.length > 0) {
      queryParams.timeEntries = this.timeEntrySelected.map(a => a.id).toString();
    }

    if (this.disbursementSelected && this.disbursementSelected.length > 0) {
      queryParams.disbursements =  this.disbursementSelected.map(a => a.id).toString();
    }

    if (this.prebillingSettings && this.matterDetails && this.matterDetails.isFixedFee) {
      if (this.fixedFeeSelected && this.fixedFeeSelected.length > 0) {
        queryParams.fixedFees =  this.fixedFeeSelected.map(a => a.id).toString();
      }

      if (this.addOnSelected.length > 0) {
        queryParams.addOns = this.addOnSelected.map(a => a.id).toString();
      }
    }

    if (this.writeOffSelected && this.writeOffSelected.length > 0) {
      queryParams.writeOffs = this.writeOffSelected.map(a => a.id).toString();
    }

    this.router.navigate(['/matter/bill-now-invoice'], {
      queryParams: queryParams
    });
  }

  private getIdsAndTotal(arr, type) {
    switch(type) {
      case 'disbursement':
        arr = arr.filter(list => list.disbursementType.isBillable);
        break;
      case 'timeentry':
        arr = arr.filter(list => (list.disbursementType.billableTo.name === "Client" || list.disbursementType.billableTo.name === "Both"));
        break;
    }
    let ids: Array<number> = [];
    if (arr && arr.length > 0) {
      arr.map((obj) => {
        ids.push(obj.id);
        this.totalBillAmount = this.totalBillAmount + obj.amount;
      });
    }
    return ids;
  }
}
