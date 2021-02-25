import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { NameFormError } from 'src/app/modules/models/fillable-form.model';
import { TrustOnlyAccountsModel } from 'src/app/modules/models/trust-only-account.model';
import * as Constant from 'src/app/modules/shared/const';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { TrustAccountService } from 'src/common/swagger-providers/services';
import { isNullOrUndefined } from 'util';
import * as errorData from '../../shared/error.json';
import { SharedService } from '../sharedService';

@Component({
  selector: 'app-trust-only-account-common',
  templateUrl: './trust-only-account-common.component.html',
  styleUrls: ['./trust-only-account-common.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustOnlyAccountCommonComponent implements OnInit, OnDestroy {
  public primaryRetainerArray = [
  ]
  @Input() clientId: any;
  @Input() matterId: any;
  @Input() matterTrustAccountId: any;
  @Input() pageType: string;
  @Input() matterAdmin: any;
  @Input() matterAdminEdit: any;
  public pageSelected = 1;
  public counter = Array;
  public trustAccountingForm: FormGroup;
  public EditTrustNameForm: FormGroup;
  public addTrustNameForm: FormGroup;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public selected = [];
  public errorData: any = (errorData as any).default;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  public descriptionError = false;
  gracePeriod = 0;
  overPaymentOption = true;
  loadingIndicator = true;
  reorderable = true;
  public lastIndex = 0;
  submittedIndex = null;
  public trustAccountList = [];
  public trustOnlyAccountList: Array<TrustOnlyAccountsModel> = [];
  private modalRef: NgbModalRef;
  public disable: boolean = false;
  nameFormError: NameFormError;
  editNameFormError: NameFormError;

  @ViewChild(DatatableComponent, { static: false }) modalOptions: NgbModalOptions;
  closeResult: string;
  isPermission = true;

  propertyheldRows = [];
  public nextTrustNumber: number;
  public editTrustNumber: number;

  loading = false;
  reloadTrustOnlyAccountBalanceSub: Subscription;
  public popUpLoading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private trustAccountService: TrustAccountService,
    private sharedService: SharedService
  ) {
    this.nameFormError = new NameFormError();
    this.editNameFormError = new NameFormError();

    this.reloadTrustOnlyAccountBalanceSub = this.sharedService.reloadTrustOnlyAccountBalance$.subscribe(() => {
      this.loading = true;
      this.GetAllTrustAccounts();
    });
  }

  ngOnInit() {
    this.disable = false;
    // window.scroll(0, 0);
    this.initializeTrustAccountingForm();
    this.addTrustPopUp();
    this.editTrustPopUp();
    this.GetAllTrustAccounts();
    this.isPermission = this.matterAdmin || this.matterAdminEdit;
  }

  ngOnDestroy() {
    if (this.reloadTrustOnlyAccountBalanceSub) {
      this.reloadTrustOnlyAccountBalanceSub.unsubscribe();
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  initializeTrustAccountingForm() {
    this.trustAccountingForm = this.formBuilder.group({
      minimumPrimaryRetainerTrustBalance: ['', [Validators.required, Validators.min(0)]]
    });
  }

  GetAllTrustAccounts() {
    this.loading = true;
    return this.trustAccountService.v1TrustAccountGetAllTrustAccountsGet$Response({ matterId: this.matterId }).subscribe((data: {}) => {
      const res: any = data;
      this.loading = false;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.trustAccountList = parsedRes.results;
          if (this.trustAccountList.length == 0) {
            this.trustOnlyAccountList = [];
          }
          else {
            this.trustOnlyAccountList = this.trustAccountList
          }
        }
      }
    }, () => {
      this.loading = false;
    });
  }

  addEditTrustAccountModal(content: any, className, winClass, rowItem) {
    if (rowItem) {
      this.EditTrustNameForm.controls['editTrustName'].setValue(rowItem.name);
      this.EditTrustNameForm.controls['editTrustId'].setValue(rowItem.id);
      this.editTrustNumber = rowItem.trustNumber;
      this.modalRef = this.modalService.open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
    } else {
      this.getNextTrustNumber(content, className, winClass);
    }

  }

  async btnAddTrust() {
    this.disable = true;
    let resp: any;
    const data: any = {
      id: 0,
      name: this.addTrustNameForm.value['addTrustName'],
      amount: 0,
      matterTrustAccountId: this.matterTrustAccountId,
      trustNumber: this.nextTrustNumber
    };
    if (!data.name) {
      this.nameFormError.name = true;
      this.nameFormError.nameMessage = this.errorData.trust_only_name_error
    } else if (data.name && this.addTrustNameForm.controls.addTrustName.invalid) {
      this.nameFormError.name = true;
      this.nameFormError.nameMessage = this.errorData.insecure_input
    } else {
      this.nameFormError.name = false;
    }

    if (this.nameFormError.hasError()) {
      return;
    }
    this.popUpLoading = true;
    try {
      resp = await this.trustAccountService.v1TrustAccountAddTrustOnlyAccountPost$Json({ body: data }).toPromise();
      this.GetAllTrustAccounts();
      this.disable = false;
    } catch (err) {
      this.disable = false;
      this.popUpLoading = false;
    }
    this.addTrustPopUp();
    this.modalRef.close();
    this.popUpLoading = false;
  }
  async btnEditTrust() {
    const data: any = {
      id: this.EditTrustNameForm.value['editTrustId'],
      name: this.EditTrustNameForm.value['editTrustName'],
      amount: 0,
      matterTrustAccountId: this.matterTrustAccountId,
    };

    if (!data.name) {
      this.editNameFormError.name = true;
      this.editNameFormError.nameMessage = this.errorData.trust_only_name_error
    } else if (data.name && this.EditTrustNameForm.controls.editTrustName.invalid) {
      this.editNameFormError.name = true;
      this.editNameFormError.nameMessage = this.errorData.insecure_input
    } else {
      this.editNameFormError.name = false;
    }

    if (this.editNameFormError.hasError()) {
      return;
    }
    let resp: any;
    this.popUpLoading = true;
    try {
      resp = await this.trustAccountService.v1TrustAccountUpdateTrustOnlyAccountPut$Json$Response({ body: data }).toPromise();
      this.popUpLoading = false;
      this.GetAllTrustAccounts();
    } catch (err) {
      this.popUpLoading = false;
    }
    this.editTrustPopUp();
    this.modalRef.close();
  }
  async deleteTrustOnlyAccount(id: number) {
    this.loading = true;
    if (!isNullOrUndefined(id)) {
      let resp: any;
      try {
        resp = await this.trustAccountService.v1TrustAccountDeleteTrustOnlyAccountIdDelete$Response({ id: id }).toPromise();
        this.loading = false;
        this.GetAllTrustAccounts();
      } catch (err) {
        this.loading = false;
      }
    }
  }
  addTrustPopUp() {
    this.addTrustNameForm = this.formBuilder.group({
      addTrustName: ['', [Validators.required, PreventInject]],
    });
  }
  editTrustPopUp() {
    this.EditTrustNameForm = this.formBuilder.group({
      editTrustName: ['', [Validators.required, PreventInject]],
      editTrustId: ['', Validators.required]
    });
  }

  clearData() {
    this.addTrustNameForm = this.formBuilder.group({
      addTrustName: ['', [Validators.required, PreventInject]],
    });
  }
  getNextTrustNumber(content = null, className = null, winClass = null) {
    this.loading = true;
    return this.trustAccountService.v1TrustAccountGetNextTrustNumberIdGet$Response({ id: +this.matterId }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.nextTrustNumber = parsedRes.results;
          if (content) {
            this.modalRef = this.modalService.open(content, {
              size: className,
              windowClass: winClass,
              centered: true,
              backdrop: 'static',
              keyboard: false
            });
          }
        }
        this.loading = false;
      } else {
        this.loading = false;
      }
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}

