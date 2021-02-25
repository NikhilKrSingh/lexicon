import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { PropertyHeldInLineItemViewModel, PropertyHeldInTrustModel } from 'src/app/modules/models/propert-held-in-trust.model';
import { PropertyHeldInLineItemModel } from 'src/app/modules/models/property-held-in-line-Items.model';
import * as Constant from 'src/app/modules/shared/const';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { removeAllBorders } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-client-property-held-in-trust',
  templateUrl: './client-property-held-in-trust.component.html',
  styleUrls: ['./client-property-held-in-trust.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientPropertyHeldInTrustComponent implements OnInit {
  @Input() matterAdmin: any;
  @Input() matterAdminEdit: any;
  @Input() nextTrustNumber: number;
  @Output() readonly trustNumber = new EventEmitter<number>();
  @Output() readonly propertyHeldInTrustData = new EventEmitter<any>();

  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public isPropertyHeldInTrustItemAdded = false;
  public propertyHeldInTrustItem: Array<any> = [];
  public counter = Array;
  public trustAccountingForm: FormGroup;
  public addPropertyHeldInTrustForm: FormGroup;
  public addPropertyHeldInTrustLineItemForm: FormGroup;
  public editPropertyHeldInTrustLineItemForm: FormGroup;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public selected = [];
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound,
  };
  public addPropertyLineItem = false;
  public descriptionError = false;
  public valueError = false;
  gracePeriod = 0;
  overPaymentOption = true;
  loadingIndicator = true;
  reorderable = true;
  public lastIndex = 0;
  public isPropertyInEditState = false;
  newPropertyLineItem = new PropertyHeldInLineItemModel();
  lastSavedPropertyLineItem = new PropertyHeldInLineItemModel();
  submittedIndex = null;
  selectedPropertyheldRows = null;
  propertyIdTodelete = null;
  isPermission = true;

  public editTrustNumber: number;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  modalOptions: NgbModalOptions;
  closeResult: string;

  propertyheldRows = [];
  public disable: boolean = false;
  selectedRow: any;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder
  ) {
    this.isPropertyHeldInTrustItemAdded =
      this.propertyHeldInTrustItem.length > 0 ? true : false;
  }

  ngOnInit() {
    this.disable = false;
    this.initializeTrustAccountingForm();
    this.initializeAddPropertyHeldInTrustForm();
    this.initializeAddPropertyHeldInTrustLineItemForm();
    this.initalizeEditPropertyHeldInTrustLineItemForm();
    this.isPermission = this.matterAdmin || this.matterAdminEdit;
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.propertyheldRows.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-client-property-held-in-trust');
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  editPropertyHeldInTrust(item: any) {
    this.addPropertyHeldInTrustForm = this.formBuilder.group({
      propertyHeldInTrustName: [item['trustName'], Validators.required],
    });
    this.propertyHeldInTrustItem = JSON.parse(
      JSON.stringify(item['propertyLineItems'])
    );
    this.selectedPropertyheldRows = item;
    this.editTrustNumber = item.trustNumber;
  }

  modifyLineItemVal(index) {
    let value = this.propertyHeldInTrustItem[index].value;
    if (value) {
      if (typeof value == 'string') {
        value = parseFloat(value);
        value = value.toFixed(2);
      } else {
        value = value.toFixed(2);
      }
    }
    this.propertyHeldInTrustItem[index].value = value;
  }

  modifyBal() {
    let value = this.addPropertyHeldInTrustLineItemForm.value['value'];
    if (value) {
      if (typeof value == 'string') {
        value = parseFloat(value);
        value = Number(value).toFixed(2);
      } else {
        value = Number(value).toFixed(2);
      }
    }

    this.addPropertyHeldInTrustLineItemForm.controls['value'].setValue(value);
  }

  openInfo(content: any, className, winClass, isAdd = false) {
    if (isAdd) {
      this.nextTrustNumber = this.nextTrustNumber + 1;
      this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static',
          keyboard: false,
        })
        .result.then(
          (result) => {
            this.selectedPropertyheldRows = null;
            this.propertyHeldInTrustItem = [];
            this.initializeAddPropertyHeldInTrustForm();
            this.closeResult = `Closed with: ${result}`;
            this.resetaddPropertyHeldInTrustForm();
          },
          (reason) => {
            this.selectedPropertyheldRows = null;
            this.propertyHeldInTrustItem = [];
            if (reason) {
              this.nextTrustNumber = this.nextTrustNumber - 1;
              this.trustNumber.emit(this.nextTrustNumber);
            }
            this.initializeAddPropertyHeldInTrustForm();
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
            this.resetaddPropertyHeldInTrustForm();
          }
        );
      this.trustNumber.emit(this.nextTrustNumber);
    } else {
      this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static',
          keyboard: false,
        })
        .result.then(
          (result) => {
            this.selectedPropertyheldRows = null;
            this.propertyHeldInTrustItem = [];
            this.initializeAddPropertyHeldInTrustForm();
            this.closeResult = `Closed with: ${result}`;
            this.resetaddPropertyHeldInTrustForm();
          },
          (reason) => {
            this.selectedPropertyheldRows = null;
            this.propertyHeldInTrustItem = [];
            this.initializeAddPropertyHeldInTrustForm();
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
            this.resetaddPropertyHeldInTrustForm();
          }
        );
    }
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

  initializeTrustAccountingForm() {
    this.trustAccountingForm = this.formBuilder.group({
      minimumPrimaryRetainerTrustBalance: [
        '',
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  initializeAddPropertyHeldInTrustForm() {
    this.addPropertyHeldInTrustForm = this.formBuilder.group({
      propertyHeldInTrustName: ['', Validators.required],
    });
  }

  async submitAddPropertyHeldInTrustForm() {
    if (!this.addPropertyHeldInTrustForm.valid) {
      return;
    }
    this.disable = true;
    var model = new PropertyHeldInTrustModel();
    model.Id =
      this.selectedPropertyheldRows != null
        ? this.selectedPropertyheldRows['id']
        : 0;
    model.TrustName = this.addPropertyHeldInTrustForm.value[
      'propertyHeldInTrustName'
    ];
    model.ClientId = 0;
    model.MatterId = 0;
    model.PropertyLineItems = new Array<PropertyHeldInLineItemViewModel>();
    this.propertyHeldInTrustItem.forEach((element) => {
      var lineItem: any = {};
      lineItem['description'] = element.description;
      let total = 0;
      if (element.value) {
        if (typeof element.value == 'string') {
          total = parseFloat(element.value);
        } else {
          total = element.value;
        }
      }
      lineItem['value'] = total;
      lineItem['id'] = element.id;
      model.PropertyLineItems.push(lineItem);
    });
    const data: any = {
      id: model.Id,
      trustName: model.TrustName,
      clientId: model.ClientId,
      matterId: model.MatterId,
      propertyLineItems: model.PropertyLineItems,
    };
    if (this.selectedPropertyheldRows == null) {
      data['trustNumber'] = this.nextTrustNumber;
    } else {
      data['trustNumber'] = this.selectedPropertyheldRows.trustNumber;
    }
    try {
      if (!this.selectedPropertyheldRows) {
        this.propertyheldRows.push(data);
        this.commonEmitToParent(this.propertyheldRows);
      } else {
        this.propertyheldRows.forEach((element, index) => {
          if (element.trustNumber === data.trustNumber) {
            this.propertyheldRows[index] = data;
          }
        });
        this.commonEmitToParent(this.propertyheldRows);
      }
      this.modalService.dismissAll();
      this.resetaddPropertyHeldInTrustForm();
      this.disable = false;
    } catch (err) {
      this.disable = false;
      console.log(err);
    }
  }

  addLineItem() {
    this.addPropertyLineItem = true;
    this.initializeAddPropertyHeldInTrustLineItemForm();
  }

  initializeAddPropertyHeldInTrustLineItemForm() {
    this.addPropertyHeldInTrustLineItemForm = this.formBuilder.group({
      description: ['', Validators.required],
      value: [null, [Validators.required, Validators.min(0)]],
    });
  }

  saveNewLineItem() {
    this.valueError = this.descriptionError = false;
    if (!this.addPropertyHeldInTrustLineItemForm.valid) {
      if (
        this.addPropertyHeldInTrustLineItemForm.value['description'] == '' ||
        this.addPropertyHeldInTrustLineItemForm.value['description'] == null
      ) {
        this.descriptionError = true;
      }
      if (
        this.addPropertyHeldInTrustLineItemForm.value['value'] == '' ||
        this.addPropertyHeldInTrustLineItemForm.value['value'] == null
      ) {
        this.valueError = true;
      }
      return;
    }
    var item = new PropertyHeldInLineItemModel();
    item.description = this.addPropertyHeldInTrustLineItemForm.value[
      'description'
    ];
    item.value = this.addPropertyHeldInTrustLineItemForm.value['value'];
    item.editable = false;
    item.id = 0;
    this.lastIndex = item.id;
    this.propertyHeldInTrustItem.push(item);
    this.initializeAddPropertyHeldInTrustLineItemForm();
    this.addPropertyLineItem = false;
    this.isPropertyLineItemAdded();
  }

  removeLineItem() {
    this.addPropertyLineItem = false;
    this.descriptionError = false;
    this.valueError = false;
    this.isPropertyLineItemAdded();
  }

  editExistingLineItem(item: any, index) {
    this.lastSavedPropertyLineItem = JSON.parse(JSON.stringify(item));
    let value = this.propertyHeldInTrustItem[index].value;
    if (value) {
      if (typeof value == 'string') {
        value = parseFloat(value);
        value = Number(value).toFixed(2);
      } else {
        value = Number(value).toFixed(2);
      }
    }
    this.propertyHeldInTrustItem[index].value = value;
    this.propertyHeldInTrustItem[index].editable = true;
  }

  cancelEditExistingLineItem(item: any, index) {
    this.propertyHeldInTrustItem[index] = JSON.parse(
      JSON.stringify(this.lastSavedPropertyLineItem)
    );
    this.propertyHeldInTrustItem[index].editable = false;
  }

  get getTotal() {
    let total = 0;
    this.propertyHeldInTrustItem.forEach((item) => {
      if (item.value) {
        if (typeof item.value == 'string') {
          total = total + parseFloat(item.value);
        } else {
          total = total + item.value;
        }
      }
    });

    return total;
  }

  getRowTotal(trustNumber) {
    let total = 0;
    this.propertyheldRows.filter((d) => {
      if (d.trustNumber === trustNumber) {
        d.propertyLineItems.filter((obj) => {
          if (obj.value) {
            if (typeof obj.value == 'string') {
              total = total + parseFloat(obj.value);
            } else {
              total = total + obj.value;
            }
          }
        });
      }
    });
    return total;
  }

  saveExistingLineItem(item: PropertyHeldInLineItemModel, index) {
    if (item.description && item.value) {
      this.submittedIndex = null;
      this.propertyHeldInTrustItem[index].editable = false;
    } else {
      this.submittedIndex = index;
    }
  }

  initalizeEditPropertyHeldInTrustLineItemForm() {
    this.editPropertyHeldInTrustLineItemForm = this.formBuilder.group({
      editdescription: ['', Validators.required],
      editvalue: ['', [Validators.required, Validators.min(0)]],
    });
  }

  deleteExistingLineItem(item: any, index) {
    let deletedItem = this.propertyHeldInTrustItem.splice(index, 1);
    this.isPropertyLineItemAdded();
  }

  isPropertyLineItemAdded() {
    this.isPropertyHeldInTrustItemAdded =
      this.propertyHeldInTrustItem.length > 0 ? true : false;
  }

  get isAddTrustValid() {
    var isValid = false;
    var isEditItemOpen = false;
    this.propertyHeldInTrustItem.forEach((item) => {
      if (item.editable) {
        isEditItemOpen = true;
      }
    });

    if (
      this.addPropertyHeldInTrustForm.valid &&
      !this.addPropertyLineItem &&
      this.propertyHeldInTrustItem.length &&
      !isEditItemOpen
    ) {
      isValid = true;
    } else {
      isValid = false;
    }
    return isValid;
  }

  deletePropertyHeldRow(item: any) {
    this.propertyIdTodelete = item.trustNumber;
  }

  deletePropertyHeldInTrust() {
    if (this.propertyIdTodelete) {
      let index = this.propertyheldRows.findIndex(
        (item) => item.trustNumber === this.propertyIdTodelete
      );
      this.propertyheldRows.splice(index, 1);
      this.commonEmitToParent(this.propertyheldRows);
    }
    this.modalService.dismissAll();
  }

  commonEmitToParent(propertyheldRows) {
    this.propertyheldRows = [...propertyheldRows];
    for(const data of this.propertyheldRows) {
      data['getRowTotalTrustNumber'] = this.getRowTotal(data.trustNumber);
    }
    this.propertyHeldInTrustData.emit(this.propertyheldRows);
  }

  resetaddPropertyHeldInTrustForm() {
    this.addPropertyLineItem = false;
    this.initializeAddPropertyHeldInTrustForm();
    this.initializeAddPropertyHeldInTrustLineItemForm();
    this.isPropertyLineItemAdded();
    this.propertyHeldInTrustItem = [];
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
