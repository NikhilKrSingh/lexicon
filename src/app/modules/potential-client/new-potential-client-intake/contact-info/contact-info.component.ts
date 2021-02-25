import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { TenantTier } from 'src/app/modules/models/tenant-tier.enum';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { ClientService, EmployeeService, MiscService, PlacesService } from 'src/common/swagger-providers/services';
import { Page } from '../../../models';
import { REGEX_DATA } from '../../../shared/const';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-contact-info',
  templateUrl: './contact-info.component.html',
  styleUrls: ['./contact-info.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ContactInfoComponent implements OnInit, OnChanges {
  @Output() readonly contactInfoDetails = new EventEmitter<any>();
  @Output() readonly showHideLoader = new EventEmitter();
  @Input() formSubmitted: boolean;
  @Input() contactType: string;
  @Input() uniqueNumber: any;
  @Output() readonly uniqueNumberChange = new EventEmitter<any>();
  @Input() isTuckerAllenAccount: boolean;
  public contactDetailsForm: FormGroup;
  public missingInfoForm: FormGroup;
  public corporateContactForm: FormGroup;
  public roleForm: FormGroup;
  public vendorForm: FormGroup;
  public salutationArr: Array<{
    name: string;
  }> = UtilsHelper.returnSalutationList();
  public genderList: Array<{
    val: string;
    text: string;
  }> = UtilsHelper.returndoGenderList();
  public doNotContactReasonArr: Array<{ name: string }>;
  public stateList: Array<any>;
  public currentDate: Date;
  public corporateContactList: Array<any> = [];
  public errorData: any = (errorData as any).default;
  public modalOptions: NgbModalOptions;
  private modalRef: NgbModalRef;
  public closeResult: string;
  public vendorFormSubmitted = false;
  public missingInfoFormSubmitted = false;
  public selectedExistedContactList: Array<any> = [];
  public createType = 'create';
  public editDetails = {
    isEdit: false,
    index: null
  };
  public emailExistence: boolean;
  public localEmailExist = false;
  public suffixList = [
    {name: 'Sr.'},
    {name: 'Jr.'},
    {name: 'I'},
    {name: 'II'},
    {name: 'III'}
  ];

  userInfo: any;
  tenantTier = TenantTier;

  public footerHeight = 50;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public pageSelected = 1;
  emailExistenceForPotentialClient: boolean;
  emailExistenceForCorporateContact: boolean = false;
  public existingSelected: boolean = false;
  stateCitySubscription: Subscription;
  cityList: any[] = [];
  public singleState: string = null;
  validZipErr = false;

  constructor(
    private builder: FormBuilder,
    private miscService: MiscService,
    private modalService: NgbModal,
    private employeeService: EmployeeService,
    private clientService: ClientService,
    private placeService: PlacesService
  ) {
    this.createVendorForm();
    this.createcontactDetailsForm();
    this.createCorporateContactForm();
  }

  ngOnInit() {
    this.currentDate = new Date();
    this.userInfo = UtilsHelper.getLoginUser();
    this.getDoNotContactReasons();
    // this.getState();

    this.contactDetailsForm.valueChanges.subscribe(val => {
      const data: any = {
        formData: this.contactDetailsForm
      };
      this.contactInfoDetails.emit({type: 'individual', data});
    });
    this.corporateContactForm.valueChanges.subscribe(val => {
      if (this.corporateContactList && this.corporateContactList.length) {
        const isPrimary: boolean = this.corporateContactList.some(list => list.isPrimary);
        const isBilling: boolean = this.corporateContactList.some(list => list.isBilling);
        if (isPrimary && isBilling) {
          this.emitContactDetailsEvent();
        }
      }
    });

    this.vendorForm.patchValue({uniqueNumber: +this.uniqueNumber});
    this.contactDetailsForm.patchValue({uniqueNumber: +this.uniqueNumber});
    this.corporateContactForm.patchValue({uniqueNumber: +this.uniqueNumber});
    this.validateEmailCorporateContactMethod();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.uniqueNumber && changes.uniqueNumber.currentValue && !this.uniqueNumber) {
      this.uniqueNumber = +changes.uniqueNumber.currentValue;
      this.vendorForm.patchValue({uniqueNumber: +this.uniqueNumber});
      this.contactDetailsForm.patchValue({uniqueNumber: +this.uniqueNumber});
      this.corporateContactForm.patchValue({uniqueNumber: +this.uniqueNumber});
      this.uniqueNumberChange.emit(this.uniqueNumber);
    }
    if(changes.contactType && this.contactType == 'corporate') {
      this.singleState = null;
      this.cityList = [];
      this.stateList = [];
      this.validZipErr = false;
      this.corporateContactForm.controls.primaryState.setValue(null);
      this.corporateContactForm.controls.primaryCity.setValue(null);
      this.corporateContactForm.controls.primaryZipCode.setValue(null);
      this.validateEmailCorporateContactMethod();
      this.setValidatorNextActionFields();
    }
    if(changes.contactType && this.contactType == 'individual') {
      this.singleState = null;
      this.cityList = [];
      this.stateList = [];
      this.validZipErr = false;
      this.contactDetailsForm.controls.primaryState.setValue(null);
      this.contactDetailsForm.controls.primaryCity.setValue(null);
      this.corporateContactForm.controls.primaryZipCode.setValue(null);
      this.setValidatorNextActionFields();
    }

  }

  createcontactDetailsForm() {
    this.contactDetailsForm = this.builder.group({
      salutation: [null],
      firstName: [null, [Validators.required, PreventInject]],
      middleName: [null, PreventInject],
      lastName: [null, [Validators.required, PreventInject]],
      suffix: [null],
      formerName: [null, PreventInject],
      uniqueNumber: [null],
      gender: [null],
      initialContactDate: [new Date(), [Validators.required]],
      primaryPhoneNumber: [null, Validators.required],
      cellPhoneNumber: [null],
      email: [null, [Validators.pattern(REGEX_DATA.Email), PreventInject]],
      primaryAddress: [null, [Validators.required, PreventInject]],
      primaryAddress2: [null, PreventInject],
      primaryCity: [null, [Validators.required, PreventInject]],
      primaryState: [null, Validators.required],
      primaryZipCode: [null, Validators.required],
      preferredContactMethod: [null, Validators.required],
      doNotContactReason: [null, Validators.required],
      DoNotContactReasonOther: [null, Validators.required],
      doNotContact: [false, Validators.required],
      notifyEmail: [false],
      notifySMS: [false],
      initialConsultations: ['no'],
      nextActionDate: [null],
      nextActionNote: [''],
      isDeceased: [false],
      spouseFirstName: [null, PreventInject],
      spouseMiddleName: [null, PreventInject],
      spouseLastName: [null, PreventInject],
      spouseGender: [null],
      spouseIsDeceased: [false],
      prospectFirstName: [null, PreventInject],
      prospectMiddleName: [null, PreventInject],
      prospectLastName: [null, PreventInject],
      prospectRelationship: [null, PreventInject],
      prospectGender: [null],
      prospectIsDeceased: false
    });

    this.missingInfoForm = this.builder.group({
      email: [null ,[Validators.required, Validators.pattern(REGEX_DATA.Email)]],
      primaryPhoneNumber: [null, Validators.required]
    });
  }

  createCorporateContactForm(): void {
    this.corporateContactForm = this.builder.group({
      uniqueNumber: [],
      companyName: [null, [Validators.required, PreventInject]],
      initialContactDate: [new Date(), [Validators.required]],
      primaryAddress: [null, [Validators.required, PreventInject]],
      primaryAddress2: [null, PreventInject],
      primaryCity: [null, [Validators.required, PreventInject]],
      primaryState: [null, Validators.required],
      primaryZipCode: [null, Validators.required],
      preferredContactMethod: [null, Validators.required],
      doNotContactReason: [null, Validators.required],
      DoNotContactReasonOther: [null, Validators.required],
      doNotContact: [false, Validators.required],
      notifyEmail: [false],
      notifySMS: [false],
      initialConsultDate: [false],
      changeNotes: [''],
      initialConsultations: ['no'],
      nextActionDate: [null],
      nextActionNote: ['']
    });
    this.changeDonotContact();
    this.changeDonotContactCorporate();
  }

  createVendorForm(): void {
    this.vendorForm = this.builder.group({
      id: [0],
      uniqueNumber: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [
        null,
        [Validators.required, Validators.pattern(REGEX_DATA.Email)]
      ],
      jobTitle: [''],
      primaryPhoneNumber: ['', Validators.required],
      cellPhoneNumber: [''],
      isPrimary: [false],
      isBilling: [false],
      isGeneralCounsel: [false],
      status: [true]
    });

    this.roleForm = this.builder.group({
      isPrimary: [null],
      isBilling: [null],
      isGeneralCounsel: [null]
    });
  }

  /****** update vendor form */
  updateVendorForm(): void {
    this.vendorForm.patchValue({
      isPrimary: false,
      isBilling: false,
      isGeneralCounsel: false,
      status: true,
      uniqueNumber: +this.uniqueNumber
    });
  }

  private getDoNotContactReasons() {
    this.miscService.v1MiscDoNotContactReasonCodesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.doNotContactReasonArr = JSON.parse(res.body).results;
      },
      err => {
      }
    );
  }

  // public getState() {
  //   this.miscService.v1MiscStatesGet$Response({}).subscribe(
  //     suc => {
  //       const res: any = suc;
  //       this.stateList = JSON.parse(res.body).results;
  //     },
  //     err => {
  //     }
  //   );
  // }

  changeDonotContact(preferTypeContactType?, notifyEmail?) {
    if (this.contactDetailsForm.value.doNotContact) {
      this.contactDetailsForm.get('preferredContactMethod').setValue(null);
      this.contactDetailsForm.get('preferredContactMethod').disable();
      this.contactDetailsForm.get('notifySMS').disable();
      this.contactDetailsForm.get('notifySMS').setValue(false);
      this.contactDetailsForm.get('notifyEmail').setValue(false);
      this.contactDetailsForm.get('notifyEmail').disable();
      this.contactDetailsForm.controls['doNotContactReason'].enable();
      this.contactDetailsForm.controls['doNotContactReason'].setValidators(Validators.required);
      this.contactDetailsForm.get('doNotContactReason').updateValueAndValidity();
      this.contactDetailsForm.get('DoNotContactReasonOther').clearValidators();
      this.contactDetailsForm.get('DoNotContactReasonOther').updateValueAndValidity();

    } else {
      this.contactDetailsForm.get('preferredContactMethod').enable();
      this.contactDetailsForm.get('notifySMS').enable();
      this.contactDetailsForm.get('notifyEmail').enable();
      this.contactDetailsForm.get('doNotContactReason').setValue(null);
      this.contactDetailsForm.get('doNotContactReason').disable();
      this.contactDetailsForm.get('doNotContactReason').clearValidators();
      this.contactDetailsForm.get('DoNotContactReasonOther').clearValidators();
      this.contactDetailsForm.get('doNotContactReason').updateValueAndValidity();
      this.contactDetailsForm.get('DoNotContactReasonOther').updateValueAndValidity();
      this.onEmailChange(preferTypeContactType, notifyEmail);
    }
  }

  changeDonotContactCorporate() {
    if (this.corporateContactForm.value.doNotContact) {
      this.corporateContactForm.get('preferredContactMethod').setValue(null);
      this.corporateContactForm.get('preferredContactMethod').disable();
      this.corporateContactForm.get('notifySMS').disable();
      this.corporateContactForm.get('notifySMS').setValue(false);
      this.corporateContactForm.get('notifyEmail').setValue(false);
      this.corporateContactForm.get('notifyEmail').disable();
      this.corporateContactForm.controls['doNotContactReason'].enable();
      this.corporateContactForm.controls['doNotContactReason'].setValidators(Validators.required);
      this.corporateContactForm.get('doNotContactReason').updateValueAndValidity();
      this.corporateContactForm.get('DoNotContactReasonOther').clearValidators();
      this.corporateContactForm.get('DoNotContactReasonOther').updateValueAndValidity();
    } else {
      this.corporateContactForm.get('preferredContactMethod').enable();
      this.corporateContactForm.get('notifySMS').enable();
      this.corporateContactForm.get('notifyEmail').enable();
      this.corporateContactForm.get('doNotContactReason').setValue(null);
      this.corporateContactForm.get('doNotContactReason').disable();
      this.corporateContactForm.get('doNotContactReason').clearValidators();
      this.corporateContactForm.get('DoNotContactReasonOther').clearValidators();
      this.corporateContactForm.get('doNotContactReason').updateValueAndValidity();
      this.corporateContactForm.get('DoNotContactReasonOther').updateValueAndValidity();
      this.validateEmailCorporateContactMethod();
    }
  }

  openPersonalinfo(
    content: any,
    className,
    winClass,
    setEditDetails: boolean = true,
    isNewCorporate?: boolean
  ) {
    if (setEditDetails) {
      this.editDetails.isEdit = false;
      this.editDetails.index = null;
    }
    if (isNewCorporate) {
      this.vendorForm.reset();
      this.uniqueNumber = this.uniqueNumber + 1;
      this.uniqueNumberChange.emit(this.uniqueNumber);
      this.updateVendorForm();
      this.vendorForm.controls['id'].setValue(0);
      this.roleForm.reset();
      this.disablePrimaryandBilling('add');
    }
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
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
    this.vendorFormSubmitted = false;
    this.missingInfoFormSubmitted = false;
    this.missingInfoForm.reset();
    this.createType = 'create';
    this.vendorForm.reset();
    this.uniqueNumber = this.uniqueNumber - 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.updateVendorForm();
    this.vendorForm.controls['id'].setValue(0);
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public isExist(type: string) {
    let exist = false;
    if (type === 'Primary') {
      exist = this.corporateContactList.some(e => e.isPrimary);
    }
    if (type === 'Billing') {
      exist = this.corporateContactList.some(e => e.isBilling);
    }
    return exist;
  }

  editVendorClick(idx, DOM): void {
    this.createType = 'create';
    this.editDetails.isEdit = true;
    this.editDetails.index = idx;
    this.vendorForm.patchValue({
      id: this.corporateContactList[idx].id,
      firstName: this.corporateContactList[idx].firstName,
      lastName: this.corporateContactList[idx].lastName,
      email: this.corporateContactList[idx].email,
      jobTitle: this.corporateContactList[idx].jobTitle,
      primaryPhoneNumber: this.corporateContactList[idx].primaryPhoneNumber,
      cellPhoneNumber: this.corporateContactList[idx].cellPhoneNumber,
      isPrimary: this.corporateContactList[idx].isPrimary,
      isBilling: this.corporateContactList[idx].isBilling,
      isGeneralCounsel: this.corporateContactList[idx].isGeneralCounsel,
      status: this.corporateContactList[idx].status
    });
    this.disablePrimaryandBilling();
    this.openPersonalinfo(DOM, '', 'modal-lmd', false);
  }

  /*** function to delete the corporate contact from the list **/
  deleteVendorClick(idx): void {
    this.corporateContactList.splice(idx, 1);
    this.vendorForm.reset();
    this.uniqueNumber = this.uniqueNumber - 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.updateVendorForm();
    this.vendorForm.controls['id'].setValue(0);
    this.emitContactDetailsEvent();
    this.validateEmailCorporateContactMethod();
  }

  /*** function to submit the form to add/edit corporate contact  **/
  public saveCorporateContact(missingInfoDOM) {
    this.vendorFormSubmitted = true;
    if ((this.createType == 'create' && this.emailExistenceForCorporateContact) ||
    (this.createType == 'existing' && !this.selectedExistedContactList.length)) {
      this.existingSelected = true;
      return;
    }
    this.existingSelected = false;
    if (this.isCorporateFormValid()) {
      this.modalRef.close();
      this.vendorFormSubmitted = false;
      if (!this.editDetails.isEdit) {
        if (this.createType === 'create') {
          const data = {...this.vendorForm.value};
          this.vendorForm.reset();
          this.updateVendorForm();
          this.vendorForm.controls['id'].setValue(0);
          // data.status = data.isVisible;
          const contactDetails = UtilsHelper.getObject('contactDetails');
          if (contactDetails && contactDetails.createDetails) {
            data.isNew = true;
          }
          this.corporateContactList.push(data);
          this.validateEmailCorporateContactMethod();
        } else {
          if (this.selectedExistedContactList.length) {
            if (this.corporateContactList.some(d => { return (d.isGeneralCounsel && +d.uniqueNumber === +this.selectedExistedContactList[0].uniqueNumber)})) {
              return;
            }
            const exitedData = this.selectedExistedContactList[0];
            this.selectedExistedContactList[0].status = true;
            this.selectedExistedContactList[0].isNew = true;
            this.selectedExistedContactList[0].uniqueNumber = +this.selectedExistedContactList[0].uniqueNumber ? Number(this.selectedExistedContactList[0].uniqueNumber) : 0;
            this.selectedExistedContactList[0] = {
              ...this.selectedExistedContactList[0],
              ...this.roleForm.getRawValue()
            };
            this.roleForm.reset();
            if (exitedData.email && exitedData.primaryPhoneNumber) {
              this.corporateContactList.push(
                this.selectedExistedContactList[0]
              );
            } else {
              this.missingInfoForm.patchValue({
                email: exitedData.email,
                primaryPhoneNumber: exitedData.primaryPhoneNumber
              });
              this.openPersonalinfo(missingInfoDOM, '', 'modal-lmd');
            }
          }
        }
      } else {
        this.corporateContactList[this.editDetails.index] = {
          ...this.vendorForm.value
        };
      }
      this.localEmailExist = false;
      this.roleForm.reset();
    }
    this.emitContactDetailsEvent();
  }

  /*** function to validate the form to add/edit corporate contact  **/
  isCorporateFormValid(): boolean {
    if (this.createType == 'existing') {
      let data = this.roleForm.getRawValue();
      return !!(data && (data.isBilling || data.isGeneralCounsel || data.isPrimary));
    }
    if (this.createType == 'create') {
      let data = this.vendorForm.value;
      return !!(data &&
        this.vendorForm.valid &&
        (data.isBilling || data.isGeneralCounsel || data.isPrimary));
    }
  }

  /*** convenience getter for easy access to form field **/
  /*** for individual conatct type form **/
  get f() {
    return this.contactDetailsForm.controls;
  }

  /*** for individual corporate type form **/
  get c() {
    return this.corporateContactForm.controls;
  }

  /*** for individual corporate contact form **/
  get v() {
    return this.vendorForm.controls;
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || +k === 8 || +k === 9;
  }

  onSelect(event): void {
    this.selectedExistedContactList = [];
    this.selectedExistedContactList.push(event);
    if(this.selectedExistedContactList.length) {
      this.existingSelected = false;
    }
  }

  /*** funcrion to emit event whem contact  */
  emitContactDetailsEvent(): void {
    const data: any = {
      formData: this.corporateContactForm,
      vendor: this.corporateContactList
    };
    this.contactInfoDetails.emit({type: 'corporate', data});
  }

  /*** funcrion to reset Preferred Contact Method and Notification on email value change */
  onEmailChange(preferTypeContactType, notifyEmail): void {
    const emailControl = this.contactDetailsForm.controls.email;
    const contactMethodEmail = preferTypeContactType as HTMLInputElement;
    const automaticNotifyEmail = notifyEmail as HTMLInputElement;
    if(contactMethodEmail && automaticNotifyEmail) {
      if (emailControl.errors || !emailControl.value || this.contactDetailsForm.value.doNotContact) {
        this.contactDetailsForm.controls.preferredContactMethod.setValue(null);
        this.contactDetailsForm.controls.notifyEmail.setValue(false);
        contactMethodEmail.disabled = true;
        automaticNotifyEmail.disabled = true;
        return;
      }
      contactMethodEmail.disabled = false;
      automaticNotifyEmail.disabled = false;
    }
  }

  saveMissingInfo(): void {
    this.missingInfoFormSubmitted = true;
    if (this.missingInfoForm.valid && !this.emailExistence) {
      this.missingInfoFormSubmitted = false;
      const data = this.selectedExistedContactList[0];
      data.email = this.missingInfoForm.value.email;
      data.primaryPhoneNumber = this.missingInfoForm.value.primaryPhoneNumber;
      this.corporateContactList.push(data);
      this.selectedExistedContactList = [];
      this.validateEmailCorporateContactMethod();
      this.modalService.dismissAll();
    }
  }

  /***
   * function to check email existence
   */
  async checkEmailExistenceForPotentialClient() {
    this.emailExistenceForPotentialClient = false;
    const email = this.contactDetailsForm.value.email;
    if (email && email.trim() != '') {
      if (this.contactDetailsForm.controls.email.valid) {
        this.miscService.v1MiscEmailCheckGet({email, id: 0})
          .subscribe((result: any) => {
            this.emailExistenceForPotentialClient = JSON.parse(result).results;
            if (this.emailExistenceForPotentialClient) {
              this.contactDetailsForm.controls.email.setErrors([{duplicateEmail: true}]);
            } else {
              this.contactDetailsForm.controls.email.setErrors(null);
              this.contactDetailsForm.controls['email'].updateValueAndValidity();
            }
          });
      }
    }
  }

  async checkEmailExistenceForCorporateContact() {
    this.emailExistenceForCorporateContact = false;
    const email = this.vendorForm.value.email;
    if (email && email.trim() !== '') {
      if (!this.editDetails.isEdit) {
        this.emailExistenceForCorporateContact = this.corporateContactList.some((corporateContact) => {
          return corporateContact.email === email;
        });
        if (this.emailExistenceForCorporateContact) {
          return;
        } else {
          if (this.vendorForm.controls.email.valid) {
            this.miscService.v1MiscEmailCheckGet({email, id: 0})
              .subscribe((result: any) => {
                this.emailExistenceForCorporateContact = JSON.parse(result).results;
              });
          }
        }
      } else {
        this.emailExistenceForCorporateContact = this.corporateContactList.some((corporateContact, index) => {
          return corporateContact.email === email && index !== this.editDetails.index;
        });
        if (this.emailExistenceForCorporateContact) {
          return;
        } else {
          if (this.vendorForm.controls.email.valid) {
            const id = this.corporateContactList[this.editDetails.index] ? this.corporateContactList[this.editDetails.index].id : 0;
            this.miscService.v1MiscEmailCheckGet({email, id})
              .subscribe((result: any) => {
                this.emailExistenceForCorporateContact = JSON.parse(result).results;
              });
          }
        }
      }
    }
  }

  checkEmailExistence() {
    this.emailExistence = false;
    const email = this.missingInfoForm.value.email;
    if (email && email.trim() != '') {
      if (this.missingInfoForm.controls.email.valid) {
        this.emailExistence = this.corporateContactList.some((corporateContact) => {
          return corporateContact.email === email;
        });
        if (this.emailExistence) {
          return;
        } else {
          const id = this.selectedExistedContactList[0] ? this.selectedExistedContactList[0].id : 0;
          this.miscService.v1MiscEmailCheckGet({email, id})
            .subscribe((result: any) => {
              this.emailExistence = JSON.parse(result).results;
            });
        }
      }
    }
  }

  getDisableStatus(type, caseType: any, email?: any) {
    if (this.corporateContactList.length) {
      let row: any;
      if (type == 'primary') {
        row = this.corporateContactList.filter(obj => obj.isPrimary);
      }
      if (type == 'billing') {
        row = this.corporateContactList.filter(obj => obj.isBilling);
      }
      if (caseType == 'add' && row.length) {
        return true;
      }
      if (caseType == 'edit' && row.length && email && email != row[0].email) {
        return true;
      }
    }
    return false;
  }

  disablePrimaryandBilling(type?: any) {
    let email = this.vendorForm.value.email;
    let isPrimaryExist =
      type == 'add'
        ? this.getDisableStatus('primary', type)
        : this.getDisableStatus('primary', 'edit', email);
    let isBillingExist =
      type == 'add'
        ? this.getDisableStatus('billing', type)
        : this.getDisableStatus('billing', 'edit', email);
    if (isBillingExist) {
      this.vendorForm.controls['isBilling'].disable();
      this.roleForm.controls['isBilling'].disable();
    } else {
      this.vendorForm.controls['isBilling'].enable();
      this.roleForm.controls['isBilling'].enable();
    }
    if (isPrimaryExist) {
      this.vendorForm.controls['isPrimary'].disable();
      this.roleForm.controls['isPrimary'].disable();
    } else {
      this.vendorForm.controls['isPrimary'].enable();
      this.roleForm.controls['isPrimary'].enable();
    }
  }

  returnToWorkflow(AddCorporateContact, content, size) {
    this.modalService.dismissAll();
    this.emailExistence = false;
    this.openPersonalinfo(AddCorporateContact, content, size);
    setTimeout(() => {
      this.createType = 'existing';
    }, 100);
  }

  selectDoNotContactReason() {
    this.contactDetailsForm.controls.doNotContactReason.setValue(this.contactDetailsForm.get('doNotContactReason').value);
    if (this.contactDetailsForm.value.doNotContactReason == 'Other') {
      this.contactDetailsForm.controls['DoNotContactReasonOther'].setValidators([Validators.required]);
      this.contactDetailsForm.get('DoNotContactReasonOther').updateValueAndValidity();
    } else {
      this.contactDetailsForm.get('DoNotContactReasonOther').setValue(null);
      this.contactDetailsForm.get('DoNotContactReasonOther').clearValidators();
      this.contactDetailsForm.get('DoNotContactReasonOther').updateValueAndValidity();
    }
  }

  selectDoNotContactReasonCorp() {
    if (this.corporateContactForm.value.doNotContactReason == 'Other') {
      this.corporateContactForm.controls['DoNotContactReasonOther'].setValidators([Validators.required]);
      this.corporateContactForm.get('DoNotContactReasonOther').updateValueAndValidity();
    } else {
      this.corporateContactForm.get('DoNotContactReasonOther').setValue(null);
      this.corporateContactForm.get('DoNotContactReasonOther')
        .clearValidators();
      this.corporateContactForm.get('DoNotContactReasonOther').updateValueAndValidity();
    }
  }

  /******* Resets Vendor Form Flag ***********/
  public clearVendorForm() {
    this.vendorFormSubmitted = false;
    this.existingSelected = false;
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['uniqueNumber'] || obj : index ;
  }

  public validateEmailCorporateContactMethod() {
    setTimeout(() => {
      const _email = document.getElementById('customradi31') as HTMLInputElement;
      const _notifyEmail = document.getElementById('customcheckbox21') as HTMLInputElement;
      if(this.corporateContactList && this.corporateContactList.length && (this.contactType === 'corporate')) {
        const obj = this.corporateContactList.find(contact => contact.isPrimary);
        if(obj.email) {
          if (_email) {
            _email.disabled = false;
          }
          if (_notifyEmail) {
            _notifyEmail.disabled = false;
          }
        }
        return;
      }
      this.corporateContactForm.controls.preferredContactMethod.setValue(null);
      this.corporateContactForm.controls.notifyEmail.setValue(false);
      if (_email) {
        _email.disabled = true;
      }
      if (_notifyEmail) {
        _notifyEmail.disabled = true;
      }
    }, 100)
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, corporateForm?: boolean)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription)
          this.stateCitySubscription.unsubscribe();
      if(input.length >= 3) {
        this.validZipErr = false;
        this.stateCitySubscription =  this.placeService.v1PlacesZipcodeInputGet({input})
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if(res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if(res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) => this.stateList.push({name: state, code: res.state[index]}))
            if(res.city && res.city.length)
              this.cityList = [...res.city]
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if(this.stateList.length == 1)
              this.singleState = this.stateList[0].name;

            if(corporateForm) {
              this.corporateContactForm.controls.primaryState.setValue(this.stateList.length ? this.stateList[0].code : null);
              this.corporateContactForm.controls.primaryCity.setValue(this.cityList.length ? this.cityList[0] : null);
            } else {
              this.contactDetailsForm.controls.primaryState.setValue(this.stateList.length ? this.stateList[0].code : null);
              this.contactDetailsForm.controls.primaryCity.setValue(this.cityList.length ? this.cityList[0] : null);
            }

            if (!this.stateList.length || !this.cityList.length) {
              setTimeout(() => {
                this.validZipErr = true;
              }, 100)
            }
          }
        });
        return;
      }
    this.stateList = [];
    this.cityList = [];
    this.validZipErr = false;
    this.singleState = null;
    this.contactDetailsForm.controls.primaryState.setValue(null);
    this.contactDetailsForm.controls.primaryCity.setValue(null);
    this.corporateContactForm.controls.primaryState.setValue(null);
    this.corporateContactForm.controls.primaryCity.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  setValidatorNextActionFields() {
    if (this.contactType == 'individual') {
      if (this.contactDetailsForm.value.initialConsultations === 'yes') {
        this.contactDetailsForm.get('nextActionDate').setValidators([Validators.required]);
        this.contactDetailsForm.get('nextActionDate').updateValueAndValidity();
        this.contactDetailsForm.get('nextActionNote').setValidators([Validators.required]);
        this.contactDetailsForm.get('nextActionNote').updateValueAndValidity();
      } else {
        this.contactDetailsForm.get('nextActionDate').patchValue(null);
        this.contactDetailsForm.get('nextActionDate').clearValidators();
        this.contactDetailsForm.get('nextActionDate').updateValueAndValidity();
        this.contactDetailsForm.get('nextActionNote').patchValue('');
        this.contactDetailsForm.get('nextActionNote').clearValidators();
        this.contactDetailsForm.get('nextActionNote').updateValueAndValidity();
      }
      this.corporateContactForm.get('nextActionDate').patchValue(null);
      this.corporateContactForm.get('nextActionDate').clearValidators();
      this.corporateContactForm.get('nextActionDate').updateValueAndValidity();
      this.corporateContactForm.get('nextActionNote').patchValue('');
      this.corporateContactForm.get('nextActionNote').clearValidators();
      this.corporateContactForm.get('nextActionNote').updateValueAndValidity();
    } else {
      if (this.corporateContactForm.value.initialConsultations === 'yes') {
        this.corporateContactForm.get('nextActionDate').setValidators([Validators.required]);
        this.corporateContactForm.get('nextActionDate').updateValueAndValidity();
        this.corporateContactForm.get('nextActionNote').setValidators([Validators.required]);
        this.corporateContactForm.get('nextActionNote').updateValueAndValidity();
      } else {
        this.corporateContactForm.get('nextActionDate').patchValue(null);
        this.corporateContactForm.get('nextActionDate').clearValidators();
        this.corporateContactForm.get('nextActionDate').updateValueAndValidity();
        this.corporateContactForm.get('nextActionNote').patchValue('');
        this.corporateContactForm.get('nextActionNote').clearValidators();
        this.corporateContactForm.get('nextActionNote').updateValueAndValidity();
      }
      this.contactDetailsForm.get('nextActionDate').patchValue(null);
      this.contactDetailsForm.get('nextActionDate').clearValidators();
      this.contactDetailsForm.get('nextActionDate').updateValueAndValidity();
      this.contactDetailsForm.get('nextActionNote').patchValue('');
      this.contactDetailsForm.get('nextActionNote').clearValidators();
      this.contactDetailsForm.get('nextActionNote').updateValueAndValidity();
    }
  }

  get hasBothCorporateContacts() {
    if (this.corporateContactList) {
      return this.corporateContactList.some(a => a.isPrimary) && this.corporateContactList.some(a => a.isBilling);
    } else {
      return false;
    }
  }
}
