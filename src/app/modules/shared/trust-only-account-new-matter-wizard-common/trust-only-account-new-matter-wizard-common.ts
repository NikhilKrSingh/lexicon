import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as Constant from 'src/app/modules/shared/const';
import * as errorData from '../error.json';

@Component({
  selector: 'app-trust-only-account-new-matter-wizard-common',
  templateUrl: './trust-only-account-new-matter-wizard-common.html',
  styleUrls: ['./trust-only-account-new-matter-wizard-common.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustOnlyAccountNewMatterWizardCommonComponent implements OnInit {
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
  @Input() trustOnlyAccountList: any = [];
  @Output() readonly trustOnlyAccountData = new EventEmitter<any>();
  @Output() readonly trustNumber = new EventEmitter<number>();
  private modalRef: NgbModalRef;
  public disable: boolean = false;

  @ViewChild(DatatableComponent, { static: false }) modalOptions: NgbModalOptions;
  closeResult: string;
  isPermission = true;

  propertyheldRows = [];
  @Input() nextTrustNumber: number;
  public editTrustNumber: number;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
  ) {
  }

  ngOnInit() {
    this.disable = false;
    window.scroll(0, 0);
    this.addTrustPopUp();
    this.editTrustPopUp();
    this.isPermission = this.matterAdmin || this.matterAdminEdit;
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

  addEditTrustAccountModal(content: any, className, winClass, rowItem) {
    if (rowItem) {
      this.EditTrustNameForm.controls['editTrustName'].setValue(rowItem.name);
      this.editTrustNumber = rowItem.trustNumber;
      this.modalRef = this.modalService.open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
    } else {
        this.nextTrustNumber = this.nextTrustNumber + 1
        this.modalRef = this.modalService.open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static',
          keyboard: false
        });
        this.modalRef.result.then(res => {

        }).catch(err => {
          this.nextTrustNumber = this.nextTrustNumber - 1
          this.getDismissReason(err);
        })
    }

    this.trustNumber.emit(this.nextTrustNumber);
  }

  btnAddTrust() {
    if (!this.addTrustNameForm.valid) {
      return;
    }
    this.disable = true;
    const data: any = {
      id: 0,
      name: this.addTrustNameForm.value['addTrustName'],
      amount: 0,
      matterTrustAccountId: 0,
      trustNumber: this.nextTrustNumber
    };

    this.trustOnlyAccountList.unshift(data);
    this.trustOnlyAccountData.emit(this.trustOnlyAccountList);

    this.disable = false;
    this.addTrustPopUp();
    this.modalRef.close();
  }
  
  btnEditTrust() {
    if (!this.EditTrustNameForm.valid) {
      return;
    }

    this.trustOnlyAccountList.filter(d => {
      if (d.trustNumber === this.editTrustNumber) {
        d.name = this.EditTrustNameForm.value['editTrustName'];
        return d;
      }
    })
   
    this.trustOnlyAccountData.emit(this.trustOnlyAccountList);

    this.editTrustPopUp();
    this.modalRef.close();
  }

  deleteTrustOnlyAccount(rowItem) {
    let index = this.trustOnlyAccountList.findIndex(item => item.trustNumber === rowItem.trustNumber);
    this.trustOnlyAccountList.splice(index, 1);
    this.trustOnlyAccountList = [...this.trustOnlyAccountList];
    this.trustOnlyAccountData.emit(this.trustOnlyAccountList);
  }
  
  addTrustPopUp() {
    this.addTrustNameForm = this.formBuilder.group({
      addTrustName: ['', Validators.required],
    });
  }

  editTrustPopUp() {
    this.EditTrustNameForm = this.formBuilder.group({
      editTrustName: ['', Validators.required],
    });
  }

  clearData() {
    this.addTrustNameForm = this.formBuilder.group({
      addTrustName: ['', Validators.required],
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

}

