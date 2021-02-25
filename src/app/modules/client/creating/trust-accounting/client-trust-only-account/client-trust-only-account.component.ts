import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as Constant from 'src/app/modules/shared/const';
import * as errorData from 'src/app/modules/shared/error.json';

@Component({
  selector: 'app-client-trust-only-account',
  templateUrl: './client-trust-only-account.component.html',
  styleUrls: ['./client-trust-only-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientTrustOnlyAccountComponent implements OnInit {
  @Input() matterAdmin: any;
  @Input() matterAdminEdit: any;
  @Input() trustOnlyAccountList: any[] = [];
  @Output() readonly trustOnlyAccountData = new EventEmitter<any>();
  @Output() readonly trustNumber = new EventEmitter<number>();

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
    emptyMessage: Constant.SharedConstant.NoDataFound,
  };
  public descriptionError = false;
  gracePeriod = 0;
  overPaymentOption = true;
  loadingIndicator = true;
  reorderable = true;
  public lastIndex = 0;
  submittedIndex = null;
  public trustAccountList = [];

  private modalRef: NgbModalRef;

  @ViewChild(DatatableComponent, { static: false }) modalOptions: NgbModalOptions;
  closeResult: string;
  isPermission = true;

  propertyheldRows = [];
  @Input() nextTrustNumber: number;
  public editTrustNumber: number;
  public formSubmitted = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.formSubmitted = false;
    this.addTrustPopUp();
    this.editTrustPopUp();
    this.isPermission = this.matterAdmin || this.matterAdminEdit;
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

  addEditTrustAccountModal(content: any, className, winClass, rowItem) {
    this.formSubmitted = false;
    if (rowItem) {
      this.EditTrustNameForm.controls['editTrustName'].setValue(rowItem.name);
      this.editTrustNumber = rowItem.trustNumber;
      this.modalRef = this.modalService.open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });
    } else {
      this.nextTrustNumber = this.nextTrustNumber + 1;
      this.modalRef = this.modalService.open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });
      this.modalRef.result
        .then((res) => {})
        .catch((err) => {
          this.nextTrustNumber = this.nextTrustNumber - 1;
          this.trustNumber.emit(this.nextTrustNumber);
          this.getDismissReason(err);
        });
    }

    this.trustNumber.emit(this.nextTrustNumber);
  }

  btnAddTrust() {
    if (!this.addTrustNameForm.valid) {
      this.formSubmitted = true;
      return;
    }
    const data: any = {
      id: 0,
      name: this.addTrustNameForm.value['addTrustName'],
      amount: 0,
      matterTrustAccountId: 0,
      trustNumber: this.nextTrustNumber,
    };

    this.trustOnlyAccountList.unshift(data);
    this.trustOnlyAccountData.emit(this.trustOnlyAccountList);

    this.addTrustPopUp();
    this.modalRef.close();
  }
  get editForm(){
    return this.EditTrustNameForm.controls;
  }

  get addForm(){
    return this.addTrustNameForm.controls;
  }

  btnEditTrust() {
    if (!this.EditTrustNameForm.valid) {
      this.formSubmitted = true;
      return;
    }

    this.trustOnlyAccountList.filter((d) => {
      if (d.trustNumber === this.editTrustNumber) {
        d.name = this.EditTrustNameForm.value['editTrustName'];
        return d;
      }
    });

    this.trustOnlyAccountData.emit(this.trustOnlyAccountList);

    this.editTrustPopUp();
    this.modalRef.close();
  }

  deleteTrustOnlyAccount(rowItem) {
    let index = this.trustOnlyAccountList.findIndex(
      (item) => item.trustNumber === rowItem.trustNumber
    );
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
