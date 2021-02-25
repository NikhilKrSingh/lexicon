import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwAttorneyViewModel, vwMatterResponse } from 'src/app/modules/models';
import { MatterFormError } from 'src/app/modules/models/fillable-form.model';
import { Page } from 'src/app/modules/models/page';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwBillingSettings, vwIdName, vwMatterBasics } from 'src/common/swagger-providers/models';
import { BillingService, BlockService, ClockService, DmsService, FixedFeeServiceService, MatterService, NoteService, TrustAccountService, WorkFlowService } from 'src/common/swagger-providers/services';
import { ClientBackButtonGuard } from '../../../../guards/client-back-button-deactivate.guard';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { DialogService } from '../../../shared/dialog.service';
import * as errorData from '../../../shared/error.json';
import { UnsavedChangedClientDialogComponent } from '../../../shared/unsaved-changed-client-dialog/unsaved-changed-client-dialog.component';
import { AddBlockedEmployeeComponent } from '../edit/blocked-employee/blocked-employee.component';
import { CloseMatterComponent } from './close-matter/close-matter.component';
import { ReopenMatterComponent } from './reopen-matter/reopen-matter.component';

@Component({
  selector: 'app-matter-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DashboardComponent implements OnInit, OnDestroy, ClientBackButtonGuard {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;

  alltabs: string[] = [
    'Overview',
    'Associations',
    'Corporate Contacts',
    'Billing',
    'Trust Accounting',
    'Documents',
    'Notes',
    'Blocked Users'
  ];
  public idArr = {
    'Overview': 'overview',
    'Associations': 'associations',
    'Corporate Contacts': 'corporate-contacts',
    'Billing': 'billing',
    'Invoices': 'invoices',
    'Ledger History': 'ledger-history',
    'Timekeeping': 'timekeeping',
    'Trust Accounting': 'trust-accounting',
    'Calendar': 'calendar',
    'Documents': 'documents',
    'Notes': 'notes',
    'Blocked Users': 'blocked-users',
  };
  selecttabs1 = this.alltabs[0];
  type: string = 'matter';
  matterId: number;
  matterDetails: vwMatterResponse;
  matterStatusList: Array<vwIdName>;
  isAssociationsEditMode: boolean = false;
  closeMatterStatus: vwIdName;
  reopenMatterStatus: vwIdName;
  reopenSuccess = false;
  public fixedFreebillingSettings: vwBillingSettings = {};
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isTrustAccountEnabled = true;
  public matterBalanceDue: { balanceDue?: number; invoiceId?: number } = {
    balanceDue: null
  };
  public showTaskBuilder: boolean = false;
  public isTuckerAllenUser: boolean = false;
  public isWorkFlowCreated: boolean = false;
  public isRaOrBA = false;
  public isResponsibleAttorney = false;
  public isBillingAttorney = false;
  public taskBuilderTask: Array<any> = [];
  public blockUserList: Array<any> = [];
  public ColumnMode = ColumnMode;
  public page = new Page();
  public invoiceId: number;
  public prebillId: number;
  public errorData: any = (errorData as any).default;
  public msg_reopen: string;
  public scrollLeftValue = 0;
  public windowWidth = 0;
  public leftMoreBtn = false;
  public rightMoreBtn = false;
  public anchorTabWidth = 0;
  public righTabCount = 0;
  public totalRighTabCount = 0;
  public leftTabCount = 0;
  public objTab:any = [];

  public loading: boolean;
  public taskBuilder_loader: boolean;
  public userInfo = UtilsHelper.getLoginUser();
  public postPaymentBtn: boolean = false;
  public loadingdashboard: boolean = false;

  public matterForm: FormGroup;
  public matterFormError: MatterFormError;
  public matterTypes: Array<any> = [];
  private modalRef: NgbModalRef;
  private closeResult: any;
  public iseditMaterLoading = false;
  public taskBuilderType: any[] = [
    'estate planning',
    'medicaid chronic',
    'guardianship',
    'seminar',
    'legacy protection plan',
    'probate - small estate',
    'trust administration',
    'probate',
    'trust funding',
    'medicaid community'
  ];
  rateTables = [];
  isCustomBillingRate = false;
  isEditRateTableModeOn = false;
  tuckerAllenAccountSubscription: any;
  public paymentPlanEnabled: boolean = false
  matterFolderDetail: any;
  feesList:any =  [];
  orgFeesList :any = [];
  feesStatusList:any = [];
  selectedFeeStatus:any = [];
  feesTotal:number= 0;
  public titletype = 'All';
  public titlestatus = 'All';
  public filterName = 'Apply Filter';
  public feeSearchString : string = '';

  constructor(
    private matterService: MatterService,
    private trustAccountService: TrustAccountService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private router: Router,
    private dialogService: DialogService,
    private fixedFeeService: FixedFeeServiceService,
    private blockService: BlockService,
    private toastDisplay: ToastDisplay,
    private workflowService: WorkFlowService,
    private appConfig: AppConfigService,
    private pagetitle: Title,
    private notesService: NoteService,
    private fb: FormBuilder,
    private sharedService: SharedService,
    private billingService: BillingService,
    private dmsService: DmsService,
    private clockService : ClockService,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.matterFormError = new MatterFormError();
  }

  ngOnInit() {
    this.checkTuckerAllenAccount();
    this.creatMatterForm()
    this.msg_reopen = errorData.matter_reopen;
    this.route.queryParams.subscribe(params => {
      let matterId = params['matterId'];
      let selectedtab = params['selectedtab'];
      if (['Billing', 'Documents', 'Invoices'].indexOf(selectedtab) > -1) {
        this.selecttabs1 = selectedtab;
      }
      if (selectedtab && selectedtab === 'ledger') {
        this.selecttabs1 = 'Ledger History';
      }
      if (selectedtab && selectedtab === 'corporateContact') {
        this.selecttabs1 = 'Corporate Contacts';
      }
      this.matterId = +matterId;
      if (matterId) {
        this.loading = true;
        this.getMatterBlockedUsers();
        this.getMatterDetails(true);
        this.getTenantBillingConfiguration();
      } else {
        this.toastDisplay.showError('Please select a matter');
      }
    });
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (
            (this.permissionList.BILLING_MANAGEMENTisEdit ||
              this.permissionList.BILLING_MANAGEMENTisViewOnly ||
              this.permissionList.BILLING_MANAGEMENTisAdmin ||
              this.permissionList.MATTER_MANAGEMENTisAdmin ||
              this.permissionList.MATTER_MANAGEMENTisEdit ||
              this.permissionList.ACCOUNTINGisEdit) &&
            !this.permissionList.MATTER_MANAGEMENTisNoVisibility
          ) {
            this.alltabs = [
              'Overview',
              'Associations',
              'Corporate Contacts',
              'Billing',
              'Invoices',
              'Ledger History',
              'Trust Accounting',
              'Documents',
              'Notes',
              'Blocked Users',
            ];
          }
          if (!this.permissionList.MATTER_MANAGEMENTisAdmin) {
            let cindex = UtilsHelper.getIndex('Notes', this.alltabs);
            this.alltabs.splice(cindex, 1);
          }
        }
      }
    });
    this.getBillingSecondaryDetails();
    this.getTenantTrustAccountStatus();
    this.getMatterFolderPath();

    this.windowWidth = $( document ).width() - 320;
  }

  getAnchorTabWidth(){
    setTimeout(()=>{
      var width = 0;
      var count = 0;
      var self = this;
      $('.anchor-tab').each(function() {
        var $this = $(this);
         width = width + $this.outerWidth(true);
        let visible = true;
         if(width > self.windowWidth){
           visible = false
           count = count+1;
           self.righTabCount = count;
           self.totalRighTabCount = count;
         }
         self.objTab.push({id:$this.prop('id'),width:$this.outerWidth(true), visible:visible})

    });
      this.anchorTabWidth = width;
      if(this.anchorTabWidth >= this.windowWidth){
        this.rightMoreBtn = true;
      }
    },1000)

  }


  open(content: any, className) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      keyboard: false,
      backdrop: 'static'
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

  get hasAccountingPermission() {
    if (this.permissionList) {
      return (
        (this.permissionList.MATTER_MANAGEMENTisViewOnly ||
          this.permissionList.MATTER_MANAGEMENTisAdmin ||
          this.permissionList.MATTER_MANAGEMENTisEdit) &&
        this.permissionList.ACCOUNTINGisEdit
      );
    } else {
      return false;
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
    if(this.tuckerAllenAccountSubscription){
      this.tuckerAllenAccountSubscription.unsubscribe();
    }
  }

  getMatterDetails(loadStatusList = false) {
    this.loadingdashboard = true;
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        let matterDetails: any = res;
        let matterPracticeName = (
          matterDetails &&
          matterDetails.matterType &&
          matterDetails.matterType.name) ? matterDetails.matterType.name.toLowerCase() : null;
        if ((this.taskBuilderType.findIndex(item => item == matterPracticeName)) > -1) {
          this.showTaskBuilder = true;
        }
        if(matterDetails.isMatterWorkflowCreated){
          this.isWorkFlowCreated = true;
        }
        this.matterDetails = matterDetails;
        if (
          this.matterDetails && this.matterDetails.matterType &&
          this.matterDetails.matterType.name ===
          '!matterDetails?.clientName?.isCompany'
        ) {
          this.alltabs.splice(1, 0);
        }

        this.isRaOrBA = UtilsHelper.checkPermissionOfRepBingAtn(
          this.matterDetails
        );

        if (!this.matterDetails.clientName.isCompany){
          let cindex = UtilsHelper.getIndex('Corporate Contacts', this.alltabs);
          this.alltabs.splice(cindex, 1);
        }

        if (!this.isRaOrBA && this.permissionList.BILLING_MANAGEMENTisNoVisibility) {
        let cindex = UtilsHelper.getIndex('Billing', this.alltabs);
        this.alltabs.splice(cindex, 1);
        }
        this.getAnchorTabWidth();

        this.matterDetails.responsibleAttorney.forEach(responsibleAttorney => {
          if (this.userInfo.id === responsibleAttorney.id) {
            this.isResponsibleAttorney = true;
          }
        });


        this.matterDetails.billingAttorney.forEach(billingAttorney => {
          if (this.userInfo.id === billingAttorney.id) {
            this.isBillingAttorney = true;
          }
        });


        this.pagetitle.setTitle(this.matterDetails.matterName);

        if (this.permissionList) {
          this.postPaymentBtn =
            this.permissionList.BILLING_MANAGEMENTisAdmin ||
            this.permissionList.BILLING_MANAGEMENTisEdit;
        }

        if (!this.postPaymentBtn) {
          this.postPaymentBtn = this.isRaOrBA;
        }

        if (!this.matterDetails.clientName) {
          this.toastDisplay.showError('No Client data found for this matter.');
          this.router.navigate(['/matter/list']);
        } else {
          if (!this.matterDetails) {
            this.toastDisplay.showError('You do not have access to this matter');
          } else {
            if (matterDetails && matterDetails.clientName.isCompany) {
              matterDetails['displayClientName'] = matterDetails.clientName.company;
            } else {
              matterDetails['displayClientName'] = `${matterDetails.clientName.firstName} ${matterDetails.clientName.lastName}`;
            }
            if (loadStatusList) {
              this.getMatterStatusList();
            }
          }
        }
        this.loadingdashboard = false;
      }, err => {
        this.loadingdashboard = false;
      });
  }


  private getTenantTrustAccountStatus() {
    this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results as boolean;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        if (res) {
          this.isTrustAccountEnabled = true;
        } else {
          this.isTrustAccountEnabled = false;
          let tabList = JSON.parse(JSON.stringify(this.alltabs));
          let cindex = UtilsHelper.getIndex('Trust Accounting', tabList);
          tabList.splice(cindex, 1);
          this.alltabs = tabList;
        }
      });
  }

  openCorporateContact() {
    this.router.navigate(['/matter/modify-corporate-contact'], {
      queryParams: {matterId: this.matterId}
    });
  }

  private getMatterStatusList() {
    this.matterService
      .v1MatterStatusesGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdName>;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        this.matterStatusList = res;
        this.closeMatterStatus = this.matterStatusList.find(
          a => a.name == 'Closed'
        );

        this.reopenMatterStatus = this.matterStatusList.find(
          a => a.name == 'Open'
        );
      });
  }

  getName(user: vwAttorneyViewModel) {
    if (user) {
      return user.lastName + ', ' + user.firstName;
    } else {
      return '';
    }
  }

  public matterDueBalance(item) {
    this.matterBalanceDue = item;
    this.invoiceId = item.invoiceId;
    this.prebillId = item.prebillId;
  }

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
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  closeMatterWarnModal(content) {
    this.loading = true;
    let params = [this.matterDetails.id];

    this.trustAccountService
      .v1TrustAccountGetMatterListTrustBalanceDetailsPost$Json({body: params})
      .subscribe(
        res => {
          this.loading = false;
          let matterList = JSON.parse(res as any).results;
          let isPositiveBalance = false;

          for (let i = 0; i < matterList.length; i++) {
            if (matterList[i]['isPositiveMatterBalance']) {
              isPositiveBalance = true;
            }
          }

          if (isPositiveBalance) {
            this.openPersonalinfo(content, 'md', '');
          } else {
            this.closeMatter();
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  closeMatter() {
    this.loading = true;
    this.matterService
      .v1MatterCheckMatterHasUnBilledItemsMatteridGet({
        matterid: this.matterDetails.id
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(res => {
        this.loading = false;
        if (res) {
          this._closeMatter(false);
        } else {
          this._closeMatter(true);
        }
      }, err => {
        this.loading = false;
      });
  }

  _closeMatter(isPaid = false) {
    this.reopenSuccess = false;

    let modalRef = this.modalService.open(CloseMatterComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    let component = modalRef.componentInstance;
    component.isPaid = isPaid;

    modalRef.result.then(res => {
      if (res) {
        const data: vwMatterBasics = {
          id: this.matterDetails.id,
          name: this.matterDetails.matterName,
          clientId: this.matterDetails.clientName
            ? this.matterDetails.clientName.id
            : null,
          matterTypeId: this.matterDetails.matterType
            ? this.matterDetails.matterType.id
            : null,
          officeId: this.matterDetails.matterPrimaryOffice
            ? this.matterDetails.matterPrimaryOffice.id
            : null,
          statusId: this.closeMatterStatus ? this.closeMatterStatus.id : null,
          openDate: this.matterDetails.matterOpenDate,
          contingentCase: this.matterDetails.isContingentCase,
          closeDate: UtilsHelper.dateToDateString(new Date()),
          isPlaintiff: this.matterDetails.isPlainTiff,
          jurisdictionStateId: this.matterDetails.jurisdictionStateId,
          jurisdictionCounty: this.matterDetails.jurisdictionCounty
        };

        this.loading = true;
        this.matterService
          .v1MatterBasicsPut$Json({
            body: data
          })
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as number;
            }),
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe(res => {
            if (res > 0) {
              this.sendCloseMatterEmail();
              this.getMatterDetails();
            }
          });
      }
    });
  }

  private sendCloseMatterEmail() {
    this.matterService
      .v1MatterSendMatterCloseEmailToAttorneyPost$Json({
        body: {
          matterId: this.matterId,
          appURL: this.appConfig.APP_URL
        }
      })
      .subscribe(() => {
      });
  }

  public gotoDocuments(event: any) {
    if (event) {
      this.selecttabs1 = 'Documents';
    }
  }

  public gotoTrustAccountDashboard(event: any) {
    if (event) {
      this.selecttabs1 = 'Trust Accounting';
    }
  }

  public markWorkAsComplete() {
    this.router.navigate(['/matter/bill-now'], {
      queryParams: {
        matterId: this.matterDetails.id,
        billType: 'WorkComplete'
      }
    });
  }

  reopenMatter() {
    let modalRef = this.modalService.open(ReopenMatterComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    this.reopenSuccess = false;

    modalRef.result.then(res => {
      if (res && res.reopen) {
        const data: vwMatterBasics = {
          id: this.matterDetails.id,
          name: this.matterDetails.matterName,
          clientId: this.matterDetails.clientName
            ? this.matterDetails.clientName.id
            : null,
          matterTypeId: this.matterDetails.matterType
            ? this.matterDetails.matterType.id
            : null,
          officeId: this.matterDetails.matterPrimaryOffice
            ? this.matterDetails.matterPrimaryOffice.id
            : null,
          statusId: this.reopenMatterStatus ? this.reopenMatterStatus.id : null,
          openDate: this.matterDetails.matterOpenDate,
          contingentCase: this.matterDetails.isContingentCase,
          closeDate: UtilsHelper.dateToDateString(new Date()),
          isPlaintiff: this.matterDetails.isPlainTiff,
          jurisdictionStateId: this.matterDetails.jurisdictionStateId,
          jurisdictionCounty: this.matterDetails.jurisdictionCounty,
          isFixedFee: this.matterDetails.isFixedFee,
          isWorkComplete: this.matterDetails.isWorkComplete
        };

        this.loading = true;

        this.matterService
          .v1MatterBasicsPut$Json({
            body: data
          })
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as number;
            }),
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe(res => {
            if (res > 0) {
              this.reopenSuccess = true;
              this.getMatterDetails();
              this.sendReopenMatterEmail();
            }
          });
      }
    });
  }

  private sendReopenMatterEmail() {
    this.matterService
      .v1MatterSendMatterReopenEmailToAttorneyPost$Json({
        body: {
          matterId: this.matterId,
          appURL: this.appConfig.APP_URL
        }
      })
      .subscribe(() => {
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
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        this.fixedFreebillingSettings = res.billingSettings;
      });
  }

  /**
   * function to get blocked user by matter id
   */
  async getMatterBlockedUsers(): Promise<any> {
    this.loading = true;
    let matterId = this.matterId;
    try {
      let resp: any = await this.matterService
        .v1MatterBlockUsersMatterIdGet$Response({matterId})
        .toPromise();
      this.blockUserList = JSON.parse(resp.body).results;
      this.blockUserList = _.orderBy(this.blockUserList, a => a.lastName);
      this.loading = false;
      this.isAccess();
      this.page.size = this.blockUserList.length;
    } catch (err) {
      this.loading = false;
    }
  }

  public isAccess() {
    let userId = JSON.parse(localStorage.getItem('profile')).id;
    this.blockUserList.filter(user => {
      if (user.personId == userId) {
        UtilsHelper.setObject('access-denied', 'TRue');
        this.router.navigate(['/access-denied']);
      }
    });
  }

  /**
   * function to remove blocked users
   */
  async removeBlockUser(row,$event) {
    if (row && $event) {
      $event.target.closest('datatable-body-cell').blur();
    }
    let resp: any = await this.dialogService.confirm(
      errorData.delete_blocked_employee_confirm,
      'Delete'
    );
    if (resp) {
      const body = {
        id: row.blockId,
        personId: row.personId,
        targetMatterId: this.matterId
      };
      try {
        await this.blockService.v1BlockDelete$Json({body}).toPromise();
        this.toastDisplay.showSuccess(
          this.errorData.delete_blocked_employee_success
        );
        this.getMatterBlockedUsers();
      } catch (err) {
      }
    }
  }

  /**
   * function to open add blocked employee popup
   */
  async addBlockuser(): Promise<any> {
    let modalRef = this.modalService.open(AddBlockedEmployeeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    let component = modalRef.componentInstance;
    component.alreadyBlockedEmployees = this.blockUserList.map(
      (a: any) => a.personId
    );

    modalRef.result.then(res => {
      if (res) {
        const body: any = res.map((value, index) => {
          const data = {
            personId: value['id'],
            targetMatterId: this.matterId,
            description: value['description']
          };
          return data;
        });
        this.blockService.v1BlockPost$Json$Response({body}).subscribe(
          (res: any) => {
            this.toastDisplay.showSuccess(
              this.errorData.employee_blocked_success
            );
            this.getMatterBlockedUsers();
          },
          err => {
          }
        );
      }
    });
  }

  checkTuckerAllenAccount() {
    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(val => {
        this.isTuckerAllenUser = (val) ? true : false;
      })
  }

  async update() {
    const form = this.matterForm.value;
    const matterType = {
      id: form.matterType
    };

    if (!form.matterName) {
      this.matterFormError.matterName = true;
      this.matterFormError.matterNameMessage = this.errorData.matter_name_error;
    } else if (form.matterName && this.matterForm.controls.matterName.invalid) {
      this.matterFormError.matterName = true;
      this.matterFormError.matterNameMessage = this.errorData.insecure_input;
    } else {
      this.matterFormError.matterName = false;
    }

    if (!form.matterOpenDate) {
      this.matterFormError.matterDate = true;
      this.matterFormError.matterDateMessage = this.errorData.date_error;
    } else {
      this.matterFormError.matterDate = false;
    }

    if (form.caseNumbers && this.matterForm.controls.caseNumbers.invalid) {
      this.matterFormError.caseNumbers = true;
      this.matterFormError.caseNumbersMessage = this.errorData.insecure_input;
    } else {
      this.matterFormError.caseNumbers = false;

    }
    if (this.matterFormError.hasError()) {
      window.scrollTo(0, 0);
      return;
    }
    this.iseditMaterLoading = true;
    const data: vwMatterBasics = {
      id: this.matterDetails.id,
      name: form.matterName,
      clientId: this.matterDetails.clientName
        ? this.matterDetails.clientName.id
        : null,
      matterTypeId: matterType ? matterType.id : null,
      officeId: this.matterDetails.matterPrimaryOffice
        ? this.matterDetails.matterPrimaryOffice.id
        : null,
      openDate: form.matterOpenDate,
      contingentCase: form.isContingentCase,
      caseNumbers: form.caseNumbers,
      isPlaintiff: this.matterDetails.isPlainTiff,
      jurisdictionStateId: this.matterDetails.jurisdictionStateId,
      jurisdictionCounty: this.matterDetails.jurisdictionCounty
    };

    this.matterService
      .v1MatterBasicsPut$Json({
        body: data
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {

        })
      )
      .subscribe(
        async (res) => {
          if (res > 0) {
            if (this.matterForm.value.changeNotes && this.matterForm.value.changeNotes != '') {
              let data = {
                applicableDate: moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss'),
                content: this.matterForm.value.changeNotes,
                id: 0,
                isVisibleToClient: false,
                name: "Edit Matter Note",
                noteType: "Matter"
              }
              await this.notesService.v1NoteMatterAddMatterIdPost$Json({
                matterId: this.matterId,
                body: data
              }).toPromise();
            }
            this.toastDisplay.showSuccess(
              this.errorData.edit_matter_success
            );
            this.getMatterDetails();
            this.modalService.dismissAll();
          } else {
            this.toastDisplay.showError(this.errorData.server_error);
          }
          this.iseditMaterLoading = false;
        },
        () => {
          this.iseditMaterLoading = false;
          this.toastDisplay.showError(this.errorData.server_error);
        }
      );
  }

  creatMatterForm() {
    this.matterForm = this.fb.group({
      matterNumber: [null],
      matterName: [null, [Validators.required, PreventInject]],
      matterOpenDate: [null, [Validators.required]],
      caseNumber: '',
      isContingentCase: [null],
      practiceArea: [null],
      matterType: [null],
      changeNotes: [null],
      caseNumbers: [null]
    });

  }


  public openEditMatterPopup(template) {
    if (this.matterDetails) {
      this.matterForm.patchValue({
        matterNumber: this.matterDetails.matterNumber,
        matterName: this.matterDetails.matterName,
        matterOpenDate: this.matterDetails.matterOpenDate,
        caseNumber: '',
        isContingentCase: this.matterDetails.isContingentCase,
        practiceArea:
          this.matterDetails.practiceArea &&
          this.matterDetails.practiceArea.length > 0
            ? this.matterDetails.practiceArea[0].id
            : null,
        matterType: this.matterDetails.matterType
          ? this.matterDetails.matterType.id
          : '',
        changeNotes: null,
        caseNumbers: this.matterDetails.caseNumbers
          ? this.matterDetails.caseNumbers.map(a => a.name).join(',')
          : ''
      });
      this.matterForm.controls['matterNumber'].disable();
      this.open(template, 'md');
    }
  }

  changeTab(tab) {
    if (this.isEditRateTableModeOn) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static',
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
      }, () => {
        this.selecttabs1 = tab;
        this.isEditRateTableModeOn = false;
      });
    } else {
      this.selecttabs1 = tab;
      this.isEditRateTableModeOn = false;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  rightSlide(){
   var visibleIndex = this.objTab[this.objTab.length - this.righTabCount];
    if(this.anchorTabWidth >= this.windowWidth){
      var totalW =  this.anchorTabWidth - this.windowWidth;
      if(this.scrollLeftValue <= totalW ){
        this.leftMoreBtn = true;
        let scrollLeftValue = visibleIndex ? visibleIndex.width : 80;
        this.scrollLeftValue = scrollLeftValue + this.scrollLeftValue;
        document.getElementById('menu-tab').style.left = '-'+this.scrollLeftValue+'px';
        this.righTabCount =  this.righTabCount - 1 ;
        if(visibleIndex){
          visibleIndex.visible = true;
        }
        let count = 0
        let slideWidth = this.scrollLeftValue;
        for(let i= 0; i <= this.objTab.length; i++){
          slideWidth =  slideWidth - this.objTab[i].width;
          this.objTab[i].visible = false;
          count = count +1;
          if(slideWidth <= 0){
            break;
          }
        }
        this.leftTabCount = count;
      }

      if(this.righTabCount == 0){
        this.rightMoreBtn = false;
      }
   }
  }
  leftSlide(){
    if(this.leftTabCount > 0){
      this.rightMoreBtn = true;
      let slideWidth = this.objTab[this.leftTabCount-1].width;
      this.scrollLeftValue = this.scrollLeftValue - this.objTab[this.leftTabCount-1].width;
       document.getElementById('menu-tab').style.left = '-'+(this.scrollLeftValue > 0 ? this.scrollLeftValue : 0 )+'px';
       this.leftTabCount = this.leftTabCount - 1;
       let count = this.righTabCount;
       for(let i= this.objTab.length - (this.righTabCount +1); i <= this.objTab.length; i++){
        slideWidth =  slideWidth - this.objTab[i].width;
        this.objTab[i].visible = false;
        count =  count + 1
        if(slideWidth <= 0){
          break;
        }
      }
      this.righTabCount = count > this.totalRighTabCount ? this.totalRighTabCount : count;
    }
    if(this.leftTabCount == 0){
      this.scrollLeftValue = 0;
      this.leftMoreBtn = false;
    }
  }

public async getTenantBillingConfiguration() {
  const tenantId = JSON.parse(localStorage.getItem('profile')).tenantId;
  try {
    let resp:any = await this.billingService.v1BillingSettingsTenantTenantIdGet({tenantId}).toPromise();
    resp = JSON.parse(resp as any).results;
    if (resp.length) {
      this.paymentPlanEnabled = resp[0].paymentPlans;
    }
  } catch (error) {

  }
}
  async getMatterFolderPath() {
    try {
      this.loading = true;
      const resp = await this.dmsService.v1DmsFolderMatterMatterIdGet$Response({matterId:   this.matterId}).toPromise();
      this.matterFolderDetail = JSON.parse(resp.body as any).results;
      this.loading = false;
    } catch (err) {
      this.loading = false;
    }
  }
}
