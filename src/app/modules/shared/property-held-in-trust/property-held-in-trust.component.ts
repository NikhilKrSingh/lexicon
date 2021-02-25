import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Page } from 'src/app/modules/models';
import { DescriptionFormError, NameFormError } from 'src/app/modules/models/fillable-form.model';
import { PropertyHeldInLineItemViewModel, PropertyHeldInTrustModel } from 'src/app/modules/models/propert-held-in-trust.model';
import { PropertyHeldInLineItemModel } from 'src/app/modules/models/property-held-in-line-Items.model';
import * as Constant from 'src/app/modules/shared/const';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { TrustAccountService } from 'src/common/swagger-providers/services';
import { isNullOrUndefined } from 'util';
import * as errorData from '../../shared/error.json';
import { removeAllBorders } from '../utils.helper';

@Component({
  selector: 'app-property-held-in-trust',
  templateUrl: './property-held-in-trust.component.html',
  styleUrls: ['./property-held-in-trust.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PropertyHeldInTrustComponent implements OnInit {
  @Input() clientId;
  @Input() matterId;
  @Input() matterAdmin: any;
  @Input() matterAdminEdit: any;
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
    emptyMessage: Constant.SharedConstant.NoDataFound
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
  public nextTrustNumber: number;
  public editTrustNumber: number;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;
  loading = false;

  propertyheldRows = [];
  public disable: boolean = false;
  nameFormError: NameFormError;
  descriptionFormError: DescriptionFormError;
  editDescriptionFormError: DescriptionFormError;
  public errorData: any = (errorData as any).default;
  isEdit: boolean;
  selectedRow: any;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private trustAccountService: TrustAccountService
  ) {
    this.isPropertyHeldInTrustItemAdded = this.propertyHeldInTrustItem.length > 0 ? true : false;
  }

  ngOnInit() {
    this.disable = false;
    this.getAllPropertyHeldInTrust();
    this.initializeTrustAccountingForm();
    this.initializeAddPropertyHeldInTrustForm();
    this.initializeAddPropertyHeldInTrustLineItemForm();
    this.initalizeEditPropertyHeldInTrustLineItemForm();
    this.isPermission = this.matterAdmin || this.matterAdminEdit;
    this.nameFormError = new NameFormError();
    this.descriptionFormError = new DescriptionFormError();
    this.editDescriptionFormError = new DescriptionFormError();

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
      removeAllBorders('app-property-held-in-trust');
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  getNextTrustNumber(content = null, className = null, winClass = null) {
    this.loading = true;
    return this.trustAccountService.v1TrustAccountGetNextTrustNumberIdGet$Response({ id: +this.matterId }).subscribe((data: {}) => {
      const res: any = data;
      this.loading = false;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.nextTrustNumber = parsedRes.results;
          if (content) {
            this.modalService
              .open(content, {
                size: className,
                windowClass: winClass,
                centered: true,
                backdrop: 'static',
                keyboard: false
              })
              .result.then(
                result => {
                  this.selectedPropertyheldRows = null
                  this.propertyHeldInTrustItem = [];
                  this.initializeAddPropertyHeldInTrustForm();
                  this.closeResult = `Closed with: ${result}`;
                  this.resetaddPropertyHeldInTrustForm();
                },
                reason => {
                  this.selectedPropertyheldRows = null
                  this.propertyHeldInTrustItem = [];
                  this.initializeAddPropertyHeldInTrustForm();
                  this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
                  this.resetaddPropertyHeldInTrustForm();
                }
              );
          }
        }
      }
    }, () => {
      this.loading = false;
    });
  }

  getAllPropertyHeldInTrust() {
    this.loading = true;
    return this.trustAccountService.v1TrustAccountGetAllPropertyHeldInTrustGet$Response({ matterId: +this.matterId }).subscribe((data: {}) => {
      const res: any = data;
      this.loading = false;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.propertyheldRows = parsedRes.results;
          if (this.propertyheldRows.length == 0) {
            this.propertyheldRows = [];
          }
          else {
            this.propertyheldRows = this.propertyheldRows.filter(item => {
              item.propertyHeldInTrustItems = item.propertyHeldInTrustItems.sort((a, b) => a.description.localeCompare(b.description));
              return true
            });
          }
        }
      }
    }, () => {
      this.loading = false;
    })
  }

  editPropertyHeldInTrust(item: any) {
    this.addPropertyHeldInTrustForm = this.formBuilder.group({
      propertyHeldInTrustName: [item['name'], [Validators.required, PreventInject]]
    });
    this.propertyHeldInTrustItem = JSON.parse(JSON.stringify(item['propertyHeldInTrustItems']));
    this.selectedPropertyheldRows = item;
    this.editTrustNumber = item.trustNumber;
  }

  modifyLineItemVal(index) {
    let value = this.propertyHeldInTrustItem[index].value;
    if (value) {
      if (typeof value == "string") {
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
      if (typeof value == "string") {
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
      this.getNextTrustNumber(content, className, winClass);
    } else {
      this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static',
          keyboard: false
        })
        .result.then(
          result => {
            this.selectedPropertyheldRows = null
            this.propertyHeldInTrustItem = [];
            this.initializeAddPropertyHeldInTrustForm();
            this.closeResult = `Closed with: ${result}`;
            this.resetaddPropertyHeldInTrustForm();
          },
          reason => {
            this.selectedPropertyheldRows = null
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

  initializeAddPropertyHeldInTrustForm() {
    this.addPropertyHeldInTrustForm = this.formBuilder.group({
      propertyHeldInTrustName: ['', [Validators.required, PreventInject]]
    });
  }
  async submitAddPropertyHeldInTrustForm() {
    this.disable = true;
    var model = new PropertyHeldInTrustModel();
    model.Id = this.selectedPropertyheldRows != null ? this.selectedPropertyheldRows['id'] : null;
    model.TrustName = this.addPropertyHeldInTrustForm.value['propertyHeldInTrustName'];
    model.ClientId = +this.clientId;
    model.MatterId = +this.matterId;
    model.PropertyLineItems = new Array<PropertyHeldInLineItemViewModel>();
    this.propertyHeldInTrustItem.forEach(element => {
      var lineItem = new PropertyHeldInLineItemViewModel();
      lineItem.Description = element.description;
      let total = 0;
      if (element.value) {
        if (typeof element.value == "string") {
          total = parseFloat(element.value);
        } else {
          total = element.value;
        }
      }
      lineItem.Value = total;
      lineItem.Id = element.id;
      model.PropertyLineItems.push(lineItem);
    });
    const data: any = {
      id: model.Id,
      trustName: model.TrustName,
      clientId: model.ClientId,
      matterId: model.MatterId,
      propertyLineItems: model.PropertyLineItems
    }

    if (!data.trustName) {
      this.nameFormError.name = true;
      this.nameFormError.nameMessage = this.errorData.trust_only_name_error
    } else if (data.trustName && this.addPropertyHeldInTrustForm.controls.propertyHeldInTrustName.invalid) {
      this.nameFormError.name = true;
      this.nameFormError.nameMessage = this.errorData.insecure_input
    } else {
      this.nameFormError.name = false;
    }

    if (this.nameFormError.hasError()) {
      return;
    }
    if (this.selectedPropertyheldRows == null) {
      data['trustNumber'] = this.nextTrustNumber;
    }
    this.loading = true;
    try {
      let resp = !this.selectedPropertyheldRows ? await this.trustAccountService.v1TrustAccountAddPropertyHeldInTrustPost$Json$Response({ body: data }).toPromise() :
        await this.trustAccountService.v1TrustAccountUpdatePropertyHeldInTrustPut$Json$Response({ body: data }).toPromise();
      this.modalService.dismissAll();
      this.resetaddPropertyHeldInTrustForm();
      this.getAllPropertyHeldInTrust();
      this.disable = false;
      this.loading = false;
    } catch (err) {
      this.loading = false;
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
      description: ['', [Validators.required, PreventInject]],
      value: [null, [Validators.required, Validators.min(0)]]
    });
  }

  saveNewLineItem() {
    var item = new PropertyHeldInLineItemModel();
    item.description = this.addPropertyHeldInTrustLineItemForm.value['description'];
    item.value = this.addPropertyHeldInTrustLineItemForm.value['value'];
    item.editable = false;
    item.id = 0;

    if (!item.description) {
      this.descriptionFormError.description = true;
      this.descriptionFormError.descriptionMessage = this.errorData.description_error
    } else if (item.description && this.addPropertyHeldInTrustLineItemForm.controls.description.invalid) {
      this.descriptionFormError.description = true;
      this.descriptionFormError.descriptionMessage = this.errorData.insecure_input
    } else {
      this.descriptionFormError.description = false;
    }

    if (!item.value) {
      this.descriptionFormError.value = true;
      this.descriptionFormError.valueMessage = this.errorData.value_error
    } else {
      this.descriptionFormError.value = false;
    }

    if (this.descriptionFormError.hasError()) {
      return;
    }

    this.lastIndex = item.id;
    this.propertyHeldInTrustItem.push(item);
    this.initializeAddPropertyHeldInTrustLineItemForm();
    this.addPropertyLineItem = false;
    this.isPropertyLineItemAdded();
    this.isEdit = false;
  }

  removeLineItem() {
    this.addPropertyLineItem = false;
    this.descriptionError = false;
    this.valueError = false;
    this.isPropertyLineItemAdded();
  }

  editExistingLineItem(item: any, index) {
    this.isEdit = true;
    this.lastSavedPropertyLineItem = JSON.parse(JSON.stringify(item));
    let value = this.propertyHeldInTrustItem[index].value;
    if (value) {
      if (typeof value == "string") {
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
    this.propertyHeldInTrustItem[index] = JSON.parse(JSON.stringify(this.lastSavedPropertyLineItem));
    this.propertyHeldInTrustItem[index].editable = false;
    this.isEdit = false;
  }

  get getTotal() {
    let total = 0;
    this.propertyHeldInTrustItem.forEach(item => {
      if (item.value) {
        if (typeof item.value == "string") {
          total = total + parseFloat(item.value);
        } else {
          total = total + item.value;
        }
      }
    });

    return total;
  }

  saveExistingLineItem(item: PropertyHeldInLineItemModel, index) {

    if (!item.description) {
      this.editDescriptionFormError.description = true;
      this.editDescriptionFormError.descriptionMessage = this.errorData.description_error
    } else if (item.description && this.editPropertyHeldInTrustLineItemForm.controls.editdescription.invalid) {
      this.editDescriptionFormError.description = true;
      this.editDescriptionFormError.descriptionMessage = this.errorData.insecure_input
    } else {
      this.editDescriptionFormError.description = false;
    }

    if (!item.value) {
      this.editDescriptionFormError.value = true;
      this.editDescriptionFormError.valueMessage = this.errorData.value_error
    } else {
      this.editDescriptionFormError.value = false;
    }

    if (this.editDescriptionFormError.hasError()) {
      return;
    }

    if (item.description && item.value) {
      this.submittedIndex = null;
      this.propertyHeldInTrustItem[index].editable = false;
    } else {
      this.submittedIndex = index;
    }
    this.isEdit = false;
  }

  initalizeEditPropertyHeldInTrustLineItemForm() {
    this.editPropertyHeldInTrustLineItemForm = this.formBuilder.group({
      editdescription: ['', [Validators.required, PreventInject]],
      editvalue: ['', [Validators.required, Validators.min(0)]]
    });
  }

  deleteExistingLineItem(item: any, index) {
    let deletedItem = this.propertyHeldInTrustItem.splice(index, 1);
    this.isPropertyLineItemAdded();
  }

  isPropertyLineItemAdded() {
    this.isPropertyHeldInTrustItemAdded = this.propertyHeldInTrustItem.length > 0 ? true : false;
  }

  isAddTrustValid() {
    var isValid = false;
    var isEditItemOpen = false;
    this.propertyHeldInTrustItem.forEach(item => {
      if (item.editable) {
        isEditItemOpen = true;
      }
    });

    if (this.addPropertyHeldInTrustForm.valid && !this.addPropertyLineItem && this.propertyHeldInTrustItem.length && !isEditItemOpen) {
      isValid = true;
    }
    else {
      isValid = false;
    }
    return isValid;
  }

  deletePropertyHeldRow(item: any) {
    this.propertyIdTodelete = item.id;
  }

  async deletePropertyHeldInTrust() {
    if (!isNullOrUndefined(this.propertyIdTodelete)) {
      let resp: any;
      try {
        resp = await this.trustAccountService.v1TrustAccountDeletePropertyHeldInTrustIdDelete$Response({ id: this.propertyIdTodelete }).toPromise();
        this.getAllPropertyHeldInTrust();
      } catch (err) {
      }
    }
    this.modalService.dismissAll();
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

