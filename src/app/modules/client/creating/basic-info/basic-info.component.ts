import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice } from 'src/app/modules/models';
import { IGender, IName } from 'src/app/modules/models/data.model';
import { TenantTier } from 'src/app/modules/models/tenant-tier.enum';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { ClientService, DocumentSettingService, EmployeeService, MiscService, OfficeService, PlacesService } from 'src/common/swagger-providers/services';
import { Page } from '../../../models';
import { REGEX_DATA } from '../../../shared/const';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-client-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientBasicInfoComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @Input() updateDetails;
  @Input() refresh: Date;
  @Input() formSubmitted: boolean;
  @Input() isTuckerAllenAccount: boolean;
  @Input() uniqueNumber: any;

  @Output() readonly showHideLoader = new EventEmitter();
  @Output() readonly stateListArr = new EventEmitter<any>();
  @Output() readonly contactInfoDetails = new EventEmitter<any>();
  @Output() readonly uniqueNumberChange = new EventEmitter<any>();
  @Output() readonly clientType = new EventEmitter<any>();
  @Output() readonly sendClientAssociation = new EventEmitter<boolean>();
  @Output() readonly changesMade = new EventEmitter<any>();
  @Output() readonly checkingEmail = new EventEmitter<boolean>();

  public contactDetailsForm: FormGroup;
  public missingInfoForm: FormGroup;
  public corporateClientForm: FormGroup;
  public roleForm: FormGroup;
  public salutationArr: Array<IName> = UtilsHelper.returnSalutationList();
  public genderList: Array<IGender> = UtilsHelper.returndoGenderList();
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
    { name: 'Sr.' },
    { name: 'Jr.' },
    { name: 'I' },
    { name: 'II' },
    { name: 'III' }
  ];

  userInfo: any;
  tenantTier = TenantTier;

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
  public form: FormGroup;
  public contactType: string = 'individual';
  public notDoNotContact: boolean = true;
  public officeList: Array<IOffice>;
  public consultofficelist: Array<IOffice>;
  public attorneyList: any;
  public tenantSetting;
  public isDocumentPortalAccess: boolean = false;

  clientAssociations = [];

  addVendorSubsidiary: any;
  type: any;
  associateVendor: any;
  associateSubsidiary: any;
  selectedRecord: any;
  actionMode = 'create';
  associationTypeLoading = true;

  getUniqueNumberSub: Subscription;

  inputIndividualContact;
  @ViewChild('inputIndividualContact', { read: ElementRef, static: false })  tref: ElementRef;
  stateCitySubscription: any;
  cityList: any[];
  singleState: any;
  validZipErr = false;

  constructor(
    private builder: FormBuilder,
    private miscService: MiscService,
    private modalService: NgbModal,
    private employeeService: EmployeeService,
    private clientService: ClientService,
    private officeService: OfficeService,
    private toastDisplay: ToastDisplay,
    private documentSettingService: DocumentSettingService,
    private dialogService: DialogService,
    private sharedService: SharedService,
    private placeService: PlacesService
  ) {}

  ngOnInit() {
    this.createForm();
    this.currentDate = new Date();
    this.userInfo = UtilsHelper.getLoginUser();
    this.checkDocumentPortalEnabled();
    this.emitClientType();
    this.createcontactDetailsForm();
    this.createCorporateClientForm();
    this.getDoNotContactReasons();
    // this.getState();
    this.getOffices();
    this.getconsultOffices();
    this.getAssociateType();

    this.contactDetailsForm.valueChanges.subscribe(val => {
      const data: any = {
        formData: this.contactDetailsForm
      };
      this.contactInfoDetails.emit({ type: 'individual', data });

      this.sharedService.datesChange$.next({
        initialConsultDate: this.contactDetailsForm.value.initialConsultDate,
        initialContactDate: this.contactDetailsForm.value.initialContactDate
      });
    });

    this.corporateClientForm.valueChanges.subscribe(val => {
      this.emitContactDetailsEvent();

      this.sharedService.datesChange$.next({
        initialConsultDate: this.contactDetailsForm.value.initialConsultDate,
        initialContactDate: this.contactDetailsForm.value.initialContactDate
      });
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.controls.contactType.value == 'individual') {
        this.contactType = 'individual';
        if (this.tref) {
          this.tref.nativeElement.disabled = true;
        }
        this.emitClientType();
        this.contactDetailsForm.reset();
        this.singleState = null;
        this.cityList = [];
        this.stateList = [];
        this.contactDetailsForm.patchValue({
          uniqueNumber: this.uniqueNumber,
          doNotContact: false,
          initialContactDate: this.currentDate,
          notifyEmailCase: false,
          notifySMSCase: false,
          notifyEmailMarketing: false,
          notifySMSMarketing: false,
          isDeceased: false,
          prospectIsDeceased: false,
          spouseIsDeceased: false
        });
      } else {
        this.contactType = 'corporate';
        if (this.tref) {
          this.tref.nativeElement.disabled = false;
        }
        this.emitClientType();
        this.singleState = null;
        this.cityList = [];
        this.stateList = [];
        this.corporateClientForm.reset();
        this.corporateClientForm.patchValue({
          uniqueNumber: this.uniqueNumber,
          doNotContact: false,
          initialContactDate: this.currentDate,
          notifyEmailCase: false,
          notifySMSCase: false,
          notifyEmailMarketing: false,
          notifySMSMarketing: false
        });
      }

      this.sharedService.ClientEmailChange$.next(null);
    });

    this.getUniqueNumberSub = this.sharedService.ContactUniqueNumber$.subscribe(
      uniqueNumber => {
        this.uniqueNumber = uniqueNumber;

        this.contactDetailsForm.patchValue({
          uniqueNumber: this.uniqueNumber
        });

        this.corporateClientForm.patchValue({
          uniqueNumber: this.uniqueNumber
        });
      }
    );
  }

  ngAfterViewInit() {
    this.onEmailChange();
  }

  ngOnDestroy() {
    if (this.getUniqueNumberSub) {
      this.getUniqueNumberSub.unsubscribe();
    }
  }

  createForm() {
    this.form = this.builder.group({
      contactType: ['individual']
    });
  }

  get t() {
    return this.form.controls;
  }

  createcontactDetailsForm() {
    this.contactDetailsForm = this.builder.group({
      salutation: [null],
      firstName: [null, [Validators.required, PreventInject]],
      middleName: [null, PreventInject],
      lastName: [null, [Validators.required, PreventInject]],
      suffix: [null],
      formerName: [null, PreventInject],
      uniqueNumber: [this.uniqueNumber],
      gender: [null],
      initialConsultDate: [null],
      initialContactDate: [this.currentDate, Validators.required],
      consultLawOffice: new FormControl(null),
      primaryLawOffice: new FormControl(null, [Validators.required]),
      consultAttorney: new FormControl(null),
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
      notifyEmailCase: [false],
      notifySMSCase: [false],
      notifyEmailMarketing: [false],
      notifySMSMarketing: [false],
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
      email: [
        null,
        [Validators.required, Validators.pattern(REGEX_DATA.Email)]
      ],
      primaryPhoneNumber: [null, Validators.required]
    });
  }

  createCorporateClientForm(): void {
    this.corporateClientForm = this.builder.group({
      uniqueNumber: [this.uniqueNumber],
      companyName: [null, [Validators.required, PreventInject]],
      initialConsultDate: [null],
      primaryAddress: [null, [Validators.required, PreventInject]],
      primaryAddress2: [null, PreventInject],
      primaryCity: [null, [Validators.required, PreventInject]],
      primaryState: [null, Validators.required],
      primaryZipCode: [null, Validators.required],
      preferredContactMethod: [null, Validators.required],
      doNotContactReason: [null, Validators.required],
      DoNotContactReasonOther: [null, Validators.required],
      doNotContact: [false, Validators.required],
      notifyEmailCase: [false],
      notifySMSCase: [false],
      notifyEmailMarketing: [false],
      notifySMSMarketing: [false],
      changeNotes: [''],
      initialContactDate: [this.currentDate, Validators.required],
      consultLawOffice: new FormControl(null),
      primaryLawOffice: new FormControl(null, [Validators.required]),
      consultAttorney: new FormControl(null)
    });
    this.changeDonotContact();
    this.changeDonotContactCorporate();
  }

  private getDoNotContactReasons() {
    this.miscService.v1MiscDoNotContactReasonCodesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.doNotContactReasonArr = JSON.parse(res.body).results;
      },
      err => {}
    );
  }

  // public getState() {
  //   this.miscService.v1MiscStatesGet$Response({}).subscribe(
  //     (suc) => {
  //       const res: any = suc;
  //       this.stateList = JSON.parse(res.body).results;
  //     },
  //     (err) => {}
  //   );
  // }

  changeDonotContact() {
    if (this.contactDetailsForm.value.doNotContact) {
      this.contactDetailsForm.get('preferredContactMethod').setValue(null);
      this.contactDetailsForm.get('preferredContactMethod').disable();
      this.contactDetailsForm.get('notifySMSCase').disable();
      this.contactDetailsForm.get('notifySMSCase').setValue(false);
      this.contactDetailsForm.get('notifyEmailCase').setValue(false);
      this.contactDetailsForm.get('notifyEmailCase').disable();
      this.contactDetailsForm.get('notifySMSMarketing').disable();
      this.contactDetailsForm.get('notifySMSMarketing').setValue(false);
      this.contactDetailsForm.get('notifyEmailMarketing').setValue(false);
      this.contactDetailsForm.get('notifyEmailMarketing').disable();
      this.contactDetailsForm.controls['doNotContactReason'].enable();
      this.contactDetailsForm.controls['doNotContactReason'].setValidators(
        Validators.required
      );
      this.contactDetailsForm
        .get('doNotContactReason')
        .updateValueAndValidity();
      this.contactDetailsForm.get('DoNotContactReasonOther').clearValidators();
      this.contactDetailsForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
      this.notDoNotContact = false;
    } else {
      this.contactDetailsForm.get('preferredContactMethod').enable();
      this.contactDetailsForm.get('notifySMSCase').enable();
      this.contactDetailsForm.get('notifyEmailCase').enable();
      this.contactDetailsForm.get('notifySMSMarketing').enable();
      this.contactDetailsForm.get('notifyEmailMarketing').enable();
      this.contactDetailsForm.get('doNotContactReason').setValue(null);
      this.contactDetailsForm.get('doNotContactReason').disable();
      this.contactDetailsForm.get('doNotContactReason').clearValidators();
      this.contactDetailsForm.get('DoNotContactReasonOther').clearValidators();
      this.contactDetailsForm
        .get('doNotContactReason')
        .updateValueAndValidity();
      this.contactDetailsForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
      this.notDoNotContact = true;
    }
    this.onEmailChange();
  }

  changeDonotContactCorporate() {
    if (this.corporateClientForm.value.doNotContact) {
      this.corporateClientForm.get('preferredContactMethod').setValue(null);
      this.corporateClientForm.get('preferredContactMethod').disable();
      this.corporateClientForm.get('notifySMSCase').disable();
      this.corporateClientForm.get('notifySMSCase').setValue(false);
      this.corporateClientForm.get('notifyEmailCase').setValue(false);
      this.corporateClientForm.get('notifyEmailCase').disable();
      this.corporateClientForm.get('notifySMSMarketing').disable();
      this.corporateClientForm.get('notifySMSMarketing').setValue(false);
      this.corporateClientForm.get('notifyEmailMarketing').setValue(false);
      this.corporateClientForm.get('notifyEmailMarketing').disable();
      this.corporateClientForm.controls['doNotContactReason'].enable();
      this.corporateClientForm.controls['doNotContactReason'].setValidators(
        Validators.required
      );
      this.corporateClientForm
        .get('doNotContactReason')
        .updateValueAndValidity();
      this.corporateClientForm.get('DoNotContactReasonOther').clearValidators();
      this.corporateClientForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
      this.notDoNotContact = false;
    } else {
      this.corporateClientForm.get('preferredContactMethod').enable();
      this.corporateClientForm.get('notifySMSCase').enable();
      this.corporateClientForm.get('notifyEmailCase').enable();
      this.corporateClientForm.get('notifySMSMarketing').enable();
      this.corporateClientForm.get('notifyEmailMarketing').enable();
      this.corporateClientForm.get('doNotContactReason').setValue(null);
      this.corporateClientForm.get('doNotContactReason').disable();
      this.corporateClientForm.get('doNotContactReason').clearValidators();
      this.corporateClientForm.get('DoNotContactReasonOther').clearValidators();
      this.corporateClientForm
        .get('doNotContactReason')
        .updateValueAndValidity();
      this.corporateClientForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
      this.notDoNotContact = true;
    }
  }

  /*** convenience getter for easy access to form field **/
  /*** for individual conatct type form **/
  get f() {
    return this.contactDetailsForm.controls;
  }

  /*** for individual corporate type form **/
  get c() {
    return this.corporateClientForm.controls;
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || +k === 8 || +k === 9;
  }

  onSelect(event): void {
    this.selectedExistedContactList = [];
    this.selectedExistedContactList.push(event);
    if (this.selectedExistedContactList.length) {
      this.existingSelected = false;
    }
  }

  /*** funcrion to emit event whem contact  */
  emitContactDetailsEvent(): void {
    const data: any = {
      formData: this.corporateClientForm,
      vendor: this.corporateContactList
    };
    this.contactInfoDetails.emit({ type: 'corporate', data });
  }

  /*** funcrion to reset Preferred Contact Method and Notification on email value change */
  onEmailChange(): void {
    const emailControl = this.contactDetailsForm.controls.email;
    if (emailControl.errors || !emailControl.value || !this.notDoNotContact) {
      if (this.tref) {
        this.tref.nativeElement.disabled = true;
      }
      this.contactDetailsForm.patchValue({
        preferredContactMethod: null
      });
      this.contactDetailsForm.patchValue({
        notifyEmailCase: false,
        notifyEmailMarketing: false
      });
    } else {
      if (this.tref) {
        this.tref.nativeElement.disabled = false;
      }
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
      this.modalService.dismissAll();
    }
  }

  /***
   * function to check email existence
   */
  async checkEmailExistenceForPotentialClient() {
    this.emailExistenceForPotentialClient = false;
    const email = this.contactDetailsForm.value.email;
    this.sharedService.ClientEmailChange$.next(email);

    if (email && email.trim() != '') {
      if (this.contactDetailsForm.controls.email.valid) {
        this.checkingEmail.next(true);
        this.miscService.v1MiscEmailCheckGet({ email, id: 0 }).subscribe(
          (result: any) => {
            this.emailExistenceForPotentialClient = JSON.parse(result).results;
            this.changesMade.emit();
            this.checkingEmail.next(false);
          },
          () => {
            this.checkingEmail.next(false);
          }
        );
      } else {
        this.emailExistenceForPotentialClient = false;
      }
    }
  }

  checkEmailExistence() {
    this.emailExistence = false;
    const email = this.missingInfoForm.value.email;
    if (email && email.trim() != '') {
      if (this.missingInfoForm.controls.email.valid) {
        this.emailExistence = this.corporateContactList.some(
          corporateContact => {
            return corporateContact.email === email;
          }
        );
        if (this.emailExistence) {
          return;
        } else {
          const id = this.selectedExistedContactList[0]
            ? this.selectedExistedContactList[0].id
            : 0;
          this.miscService
            .v1MiscEmailCheckGet({ email, id })
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

  selectDoNotContactReason() {
    this.contactDetailsForm.controls.doNotContactReason.setValue(
      this.contactDetailsForm.get('doNotContactReason').value
    );
    if (this.contactDetailsForm.value.doNotContactReason == 'Other') {
      this.contactDetailsForm.controls[
        'DoNotContactReasonOther'
      ].setValidators([Validators.required]);
      this.contactDetailsForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
    } else {
      this.contactDetailsForm.get('DoNotContactReasonOther').setValue(null);
      this.contactDetailsForm.get('DoNotContactReasonOther').clearValidators();
      this.contactDetailsForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
    }
  }

  selectDoNotContactReasonCorp() {
    if (this.corporateClientForm.value.doNotContactReason == 'Other') {
      this.corporateClientForm.controls[
        'DoNotContactReasonOther'
      ].setValidators([Validators.required]);
      this.corporateClientForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
    } else {
      this.corporateClientForm.get('DoNotContactReasonOther').setValue(null);
      this.corporateClientForm.get('DoNotContactReasonOther').clearValidators();
      this.corporateClientForm
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
    }
  }

  /******* Resets Vendor Form Flag ***********/
  public clearVendorForm() {
    this.vendorFormSubmitted = false;
    this.existingSelected = false;
  }

  /***
   * primary office drop down
   */
  primaryOfficeChange(event: any): void {
    let officeName = null;
    if (event && event.name) {
      officeName = event.name;
    }
  }

  /***
   * consult attorney drop down
   */
  consultAttorneyChange(event: any): void {
    let name = null;
    if (event && event.name) {
      name = event.name;
    }
  }

  /**
   * function to get primary offices
   */
  getOffices(): void {
    this.miscService.v1MiscOfficesGet$Response({}).subscribe(suc => {
      const res: any = suc;
      this.officeList = JSON.parse(res.body).results;
    });
  }

  /**
   * function to consultation offices
   */
  async getconsultOffices() {
    this.officeService
      .v1OfficeTenantGet$Response({ checkInitialConsultation: true })
      .subscribe(suc => {
        const res: any = suc;
        this.consultofficelist = JSON.parse(res.body).results || [];
        this.consultofficelist = this.consultofficelist.filter(
          a => a['status'] == 'Active' || a['status'] === 'Open'
        );
      });
  }

  /**
   * function to get attorney
   */
  getAttorney(id, patchValue = false) {
    const param = { officeId: +id };
    this.attorneyList = [];
    this.officeService.v1OfficeConsultattroneyGet(param).subscribe(
      suc => {
        const res: any = suc;
        this.attorneyList = JSON.parse(res).results;
      },
      err => {}
    );
  }

  public consultChange(e) {
    if (e) {
      this.getAttorney(+e.id, true);
    } else {
      this.attorneyList = [];
    }
  }

  public emitClientType() {
    let data: any = {
      clientType: this.contactType
    };
    this.clientType.emit(data);
  }

  isBasicInfoInvalid() {
    if (this.form.value.contactType == 'individual') {
      let firstName = this.contactDetailsForm.value.firstName;
      let lastName = this.contactDetailsForm.value.lastName;
      let primaryLawOffice = this.contactDetailsForm.value.primaryLawOffice;

      return (
        this.contactDetailsForm.invalid ||
        !firstName ||
        !lastName ||
        !primaryLawOffice ||
        this.emailExistenceForPotentialClient
      );
    } else {
      let companyName = this.corporateClientForm.value.companyName;
      let primaryLawOffice = this.corporateClientForm.value.primaryLawOffice;

      return (
        this.corporateClientForm.invalid || !companyName || !primaryLawOffice
      );
    }
  }

  private getAssociateType() {
    this.miscService.v1MiscClientassociationtypeGet$Response({}).subscribe(
      res => {
        let assocTypes = JSON.parse(res.body as any).results;
        if (assocTypes && assocTypes.length > 0) {
          this.associateVendor = assocTypes.filter(obj => {
            return obj.name === 'Vendor';
          })[0];
          this.associateSubsidiary = assocTypes.filter(obj => {
            return obj.name === 'Subsidiary';
          })[0];
        }

        this.associationTypeLoading = false;
      },
      () => {
        this.associationTypeLoading = false;
      }
    );
  }

  addSubsidiaryClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.type = 'Subsidiary';
    this.actionMode = 'create';
    this.selectedRecord = null;
    this.addVendorSubsidiary = true;
  }

  addVendorClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.type = 'Vendor';
    this.actionMode = 'create';
    this.selectedRecord = null;
    this.addVendorSubsidiary = true;
  }

  async deleteClientAssociations(row, rowIndex) {
    let messages = '';
    if (row.associationType === 'Vendor') {
      messages = this.errorData.vendor_delete_confirm;
    } else {
      messages = this.errorData.subsidiary_delete_confirm;
    }
    let resp: any = await this.dialogService.confirm(messages, 'Delete');
    if (resp) {
      this.deleteFromArr(row.associationType, rowIndex);
    }
  }

  private deleteFromArr(type: string, index: number) {
    this.clientAssociations.splice(index, 1);
    this.clientAssociations = [...this.clientAssociations];
    this.sendClientAssociation.emit(true);
    switch (type) {
      case 'Vendor':
        this.toastDisplay.showSuccess(this.errorData.vendor_delete);
        break;
      case 'Subsidiary':
        this.toastDisplay.showSuccess(this.errorData.subsidiary_delete);
        break;
    }
    UtilsHelper.aftertableInit();
  }

  closeVendor(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
      this.uniqueNumberChange.emit(this.uniqueNumber);
    }
    this.addVendorSubsidiary = false;

    let listArr = UtilsHelper.clone(this.clientAssociations);
    let associate =
      this.type == 'Vendor' ? this.associateVendor : this.associateSubsidiary;

    if (event.type === 'add') {
      if (event.data.id && listArr && listArr.length > 0) {
        let exist = listArr.some(obj => obj.id === event.data.id);
        if (exist) {
          this.toastDisplay.showError('Record already selcted.');
          return;
        }
      }

      if (event.data.uniqueNumber != this.uniqueNumber) {
        this.uniqueNumber = this.uniqueNumber - 1;
        this.uniqueNumberChange.emit(this.uniqueNumber);
      }
      listArr.push(this.getData(event, associate));
    } else if (event.type === 'edit') {
      let index = listArr.findIndex(
        (item, index) => index === event.data.indexNumber
      );
      if (index > -1) {
        listArr[index] = this.getData(event, associate);
      }
    }

    this.clientAssociations = UtilsHelper.clone(listArr);
    UtilsHelper.aftertableInit();
  }

  private getData(event, associate) {
    this.sendClientAssociation.emit(true);
    return {
      id: event.data.id,
      uniqueNumber: +event.data.uniqueNumber,
      associationId: associate.id,
      associationType: associate.name,
      firstName: event.data.firstName,
      email: event.data.email,
      lastName: event.data.lastName,
      companyName: event.data.companyName,
      primaryPhone: event.data.primaryPhone,
      isCompany: event.data.isCompany,
      isVisible: event.data.isVisible ? event.data.isVisible : true,
      isArchived: event.data.isArchived ? event.data.isArchived : false,
      type: this.type
    };
  }

  onAddAssoc(assoc) {
    this.addVendorSubsidiary = false;
    this.clientAssociations.push(assoc);
    UtilsHelper.aftertableInit();
  }

  //#endregion [Clientassociation]

  checkDocumentPortalEnabled() {
    this.documentSettingService
      .v1DocumentSettingTenantTenantIdGet$Response({
        tenantId: this.userInfo.tenantId
      })
      .subscribe((res: any) => {
        const result: any = JSON.parse(res.body).results;
        this.tenantSetting = result ? result : {};
        this.isDocumentPortalAccess = this.tenantSetting.documentPortalAccess
          ? true
          : false;
        UtilsHelper.aftertableInit();
      });
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, type) {
    const input = (searchString || '').trim();
    if (this.stateCitySubscription)
        this.stateCitySubscription.unsubscribe();
    if (input.length >= 3) {
      this.validZipErr = false;
      this.stateCitySubscription = this.placeService
        .v1PlacesZipcodeInputGet({ input })
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe(res => {
          if (res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if (res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) =>
                this.stateList.push({ name: state, code: res.state[index] })
              );
            if (res.city && res.city.length)
              this.cityList = [...res.city];
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if (this.stateList.length == 1)
              this.singleState = this.stateList[0].name;

            switch (type) {
              case 'corporate':
                this.corporateClientForm.controls.primaryState.setValue(
                  this.stateList.length ? this.stateList[0].code : null
                );
                this.corporateClientForm.controls.primaryCity.setValue(
                  this.cityList.length ? this.cityList[0] : null
                );
                break;

              case 'individual':
                this.contactDetailsForm.controls.primaryState.setValue(
                  this.stateList.length ? this.stateList[0].code : null
                );
                this.contactDetailsForm.controls.primaryCity.setValue(
                  this.cityList.length ? this.cityList[0] : null
                );
                break;
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
    switch (type) {
      case 'corporate':
        this.corporateClientForm.controls.primaryState.setValue(null);
        this.corporateClientForm.controls.primaryCity.setValue(null);
        break;

      case 'individual':
        this.contactDetailsForm.controls.primaryState.setValue(null);
        this.contactDetailsForm.controls.primaryCity.setValue(null);
        break;
    }
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  get footerHeight() {
    if (this.clientAssociations) {
      return this.clientAssociations.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
