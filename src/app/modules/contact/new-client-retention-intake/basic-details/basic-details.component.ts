import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import { IOffice } from 'src/app/modules/models';
import { TenantTier } from 'src/app/modules/models/tenant-tier.enum';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { ClientAssociationService, ClientService, ContactsService, DocumentSettingService, MatterService, MiscService, OfficeService, PlacesService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import * as errors from '../../../shared/error.json';
import { UtilsHelper } from '../../../shared/utils.helper';

@Component({
  selector: 'app-client-retention-basic-details',
  templateUrl: './basic-details.component.html',
  styleUrls: ['./basic-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BasicDetailsComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() formSubmitted: boolean = false;
  @Output() readonly basicInfoDetails = new EventEmitter();
  @Output() readonly uniNumber = new EventEmitter();
  @Input() clientId: number;
  @Input() clientType: string;
  @Input() uniqueNumber: any;
  @Output() readonly initialConsultDate = new EventEmitter();
  public lessThanContactDate = new Date();
  public todayDate = new Date();
  public basicForm: FormGroup;
  public contactForm: FormGroup;
  public associateVendor: IOffice;
  public associateSubsidiary: IOffice;
  public clientDetails: any;
  private currentDate: any = new Date();
  public salutationArr: Array<{ name: string }>;
  public genderList: Array<{
    val: string;
    text: string;
  }> = UtilsHelper.returndoGenderList();
  public officeList: Array<IOffice>;
  public consultofficelist: Array<IOffice> = [];
  public attorneyList: any;
  public stateList: Array<any> = [];
  public preferredContactArr: Array<{ name: string }>;
  public automaticNotificationsArr: Array<{ name }>;
  public associationsVendorList: Array<any> = [];
  public associationsSubsidiaryList: Array<any> = [];
  public error_data = (errors as any).default;
  public doNotContactReasonArr: Array<{ name: string }>;
  public suffix: string;
  public consultofficeSelected = false;
  public primaryPhoneBlur = false;
  isValidEmail = true;

  public exter_doc_email: string;

  public localClientDetails: any = {};
  public associationData: any = {};
  public detailsLoading = true;
  public loading: boolean;
  public isTuckerAllenUser = false;
  public emailExistence = false;
  public tuckerAllenAccountSubscription: Subscription;

  public clientAssociationsList: Array<any> = [];
  public subsidiaryList: Array<any> = [];
  public vendorList: Array<any> = [];
  public deletedSubsidiaryList: Array<any> = [];
  public deletedVendorList: Array<any> = [];

  public errorData: any = (errorData as any).default;
  public addVendor = false;
  public addVendorMode = 'create';
  public selectedVendor: any;

  public addSubsidiary = false;
  public addSubsidiaryMode = 'create';
  public selectedSubsidiary: any;

  // public uniqueNumber: any;
  public localUniqueNumber: any;
  public isDocumentPortalAccess: boolean = false;
  userInfo: any;
  tenantTier = TenantTier;
  validZipErr = false;
  public CorporateContactForm: FormGroup = this.formBuilder.group({
    preferredContactMethod: new FormControl(null),
    doNotContactReason: new FormControl(null),
    DoNotContactReasonOther: new FormControl(),
    doNotContact: new FormControl(false),
    notifyEmail: new FormControl(false),
    notifySmS: new FormControl(false),
    marketingEmail: new FormControl(false),
    marketingSMS: new FormControl(false)
  });

  @ViewChild("customradio_1", {read: ElementRef, static: false}) tref: ElementRef;
  stateCitySubscription: any;
  cityList: any[];
  singleState: any;
  constructor(
    private clientService: ClientService,
    private officeService: OfficeService,
    private formBuilder: FormBuilder,
    private miscService: MiscService,
    private router: Router,
    private indexDbService: IndexDbService,
    private contactsService: ContactsService,
    private toastDisplay: ToastDisplay,
    private matterService: MatterService,
    private sharedService: SharedService,
    private dialogService: DialogService,
    private clientAssociationService: ClientAssociationService,
    private documentSettingsService: DocumentSettingService,
    private placeService: PlacesService
  ) {
    this.salutationArr = [{ name: 'Mr.' }, { name: 'Mrs.' }, { name: 'Ms.' }];
    this.preferredContactArr = [
      { name: 'Call' },
      { name: 'Email' },
      { name: 'Text' }
    ];
    this.automaticNotificationsArr = [{ name: 'Email' }, { name: 'Text' }];
    this.getDoNotContactReasons();
    this.userInfo = UtilsHelper.getLoginUser();

    if (
      this.userInfo &&
      this.userInfo.tenantTier &&
      this.userInfo.tenantTier.tierName === TenantTier.Emerging
    ) {
      this.preferredContactArr = [{ name: 'Call' }, { name: 'Email' }];
      this.automaticNotificationsArr = [{ name: 'Email' }];
    }
  }

  async ngOnInit() {
    this.localUniqueNumber = this.uniqueNumber;
    this.exter_doc_email = this.error_data.external_doc_portal_email;
    this.initializeBasicForm();
    this.initializeContactForm();
    this.getClientDetail();
    await this.getconsultOffices();
    await this.getOffices();
    // await this.getStates();
    await this.getAssociateType();
    this.getClientAssociations();
    this.getDocumentSettings();

    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        this.isTuckerAllenUser = res ? true : false;
      }
    );
    this.CorporateContactForm.valueChanges.subscribe(val => {
      this.sendBasicInfoData();
    });

    this.contactForm.valueChanges.subscribe(val => {
      if (this.clientType == 'individual') {
        this.sendBasicInfoData();
      }
    });

    this.basicForm.valueChanges.subscribe(val => {
      this.sendBasicInfoData();
    });

  }

  ngAfterViewInit() {
    this.enablePrefferedContact();
  }

  get bf() {
    return this.basicForm.controls;
  }

  get bfconsultationLawOffice() {
    return this.basicForm.controls.consultationLawOffice['controls'];
  }

  get bfconsultAttorney() {
    return this.basicForm.controls.consultAttorney['controls'];
  }

  get bfprimaryOffice() {
    return this.basicForm.controls.primaryOffice['controls'];
  }

  get cf() {
    return this.contactForm.controls;
  }

  get cff() {
    return this.CorporateContactForm.controls;
  }

  ngOnDestroy() {
    if (this.tuckerAllenAccountSubscription) {
      this.tuckerAllenAccountSubscription.unsubscribe();
    }
  }

  public getDoNotContactReasons() {
    this.miscService.v1MiscDoNotContactReasonCodesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.doNotContactReasonArr = JSON.parse(res.body).results;
      }
    );
  }

  ngOnChanges(changes){
    this.localUniqueNumber = this.uniqueNumber;
  }
  /**
   * function to initialize basic form
   */
  initializeBasicForm(): void {
    this.basicForm = this.formBuilder.group({
      initialContactDate: [
        {
          value: `${this.currentDate.getMonth() +
            1}/${this.currentDate.getDate()}/${this.currentDate.getFullYear()}`,
          disabled: true
        }
      ],
      uniqueNumber: [],
      salutation: [null],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      suffix: [null],
      formerName: [''],
      gender: [null],
      initialConsultDate: [null, Validators.required],
      consultationLawOffice: this.formBuilder.group({
        id: [null, Validators.required],
        name: ['']
      }),
      primaryOffice: this.formBuilder.group({
        id: [null, Validators.required],
        name: ['']
      }),
      consultAttorney: this.formBuilder.group({
        id: [null, Validators.required],
        name: ['']
      }),
      companyName: ['', Validators.required],
      isDeceased: [false],
      spouseFirstName: [''],
      spouseMiddleName: [''],
      spouseLastName: [''],
      spouseGender: [null],
      spouseIsDeceased: [false],
      prospectFirstName: [''],
      prospectMiddleName: [''],
      prospectLastName: [''],
      prospectRelationship: [''],
      prospectGender: [null],
      prospectIsDeceased: [false]
    });

    this.basicForm.controls.initialConsultDate.valueChanges.subscribe((val) => {
      this.initialConsultDate.emit(val);
    })
  }

  /**
   * function to initialize Contact Form
   */
  initializeContactForm(): void {
    this.contactForm = this.formBuilder.group({
      phones: this.formBuilder.array([this.initPhoneRows()]),
      email: ['', [Validators.email, Validators.pattern(REGEX_DATA.Email)]],
      addresses: this.formBuilder.array([this.initAddressesRows()])
    });

    const control = this.contactForm.controls['phones'] as FormArray;
    control.push(this.initPhoneRows(false, 'cellphone'));

    this.contactForm['controls'].phones['controls'][1].controls[
      'number'
    ].clearValidators();
    this.contactForm['controls'].phones['controls'][1].controls[
      'number'
    ].updateValueAndValidity();

    this.contactForm.controls['email'].valueChanges.subscribe(value => {
      if (value && value.trim() == '') {
        this.CorporateContactForm.controls['preferredContactMethod'].setValue(
          null
        );
      }

      if (!value) {
        this.CorporateContactForm.controls['preferredContactMethod'].setValue(
          null
        );
      }

      this.CorporateContactForm.updateValueAndValidity();
    });
  }

  /*** function to initialize phone first rows */
  initPhoneRows(isPrimary: boolean = true, type: string = 'billing') {
    return this.formBuilder.group({
      id: [0],
      number: ['', Validators.required],
      type: [type],
      isPrimary: [isPrimary],
      personId: [+this.clientId]
    });
  }

  /*** function to initialize Addresses Rows */
  initAddressesRows(addressType: string = 'primary') {
    return this.formBuilder.group({
      id: [0],
      addressTypeId: [4],
      address: ['', Validators.required],
      address2: [''],
      addressTypeName: [addressType],
      city: ['', Validators.required],
      state: [null, Validators.required],
      zip: ['', Validators.required]
    });
  }

  /**
   * function to get client detail
   */
  public getClientDetail() {
    this.detailsLoading = true;
    this.clientService
      .v1ClientClientIdGet({ clientId: this.clientId })
      .subscribe(
        async (res: any) => {
          const resp: any = JSON.parse(res).results;
          if (resp && Object.keys(resp).length) {
            if (this.localClientDetails && this.localClientDetails.client) {
              this.clientDetails = { ...this.localClientDetails.client };
              this.clientDetails['local'] = true;
            } else {
              this.clientDetails = { ...resp };
              this.clientDetails['local'] = false;
            }

            if (this.clientDetails.vendorList) {
              this.associationData[
                'vendorList'
              ] = this.clientDetails.vendorList;
            }
            if (this.clientDetails.subsidiaryList) {
              this.associationData[
                'subsidiaryList'
              ] = this.clientDetails.subsidiaryList;
            }
            const initialContactDate: any = this.clientDetails
              .initialContactDate
              ? new Date(this.clientDetails.initialContactDate)
              : new Date();
            initialContactDate.setHours(0, 0, 0, 0);
            this.lessThanContactDate = initialContactDate
            let checkSalutation: boolean;
            if (this.clientDetails.salutation) {
              checkSalutation = this.salutationArr.some(
                salutation => salutation.name == this.clientDetails.salutation
              );
            }
            let checkGender: boolean;
            if (this.clientDetails.gender) {
              checkGender = this.genderList.some(
                gender => gender.val == this.clientDetails.gender
              );
            }

            if (this.clientDetails.consultationLawOffice) {
              this.detailsLoading = true;
              this.getAttorney(
                this.clientDetails.consultationLawOffice.id,
                true
              );
            } else {
              this.detailsLoading = false;
            }

            /*** set basic form value */
            this.basicForm.patchValue({
              initialContactDate: `${initialContactDate.getMonth() +
                1}/${initialContactDate.getDate()}/${initialContactDate.getFullYear()}`,
              uniqueNumber: +this.clientDetails.uniqueNumber,
              salutation: checkSalutation
                ? this.clientDetails.salutation
                : null,
              firstName: this.clientDetails.firstName
                ? this.clientDetails.firstName
                : '',
              middleName: this.clientDetails.middleName
                ? this.clientDetails.middleName
                : '',
              lastName: this.clientDetails.lastName
                ? this.clientDetails.lastName
                : '',
              suffix: this.clientDetails.suffix
                ? this.clientDetails.suffix
                : null,
              formerName: this.clientDetails.formerName
                ? this.clientDetails.formerName
                : '',
              gender: checkGender ? this.clientDetails.gender : null,
              initialConsultDate: this.clientDetails.initialConsultDate
                ? this.clientDetails.initialConsultDate
                : new Date(),
              consultationLawOffice: {
                id:
                  this.clientDetails.consultationLawOffice &&
                    this.clientDetails.consultationLawOffice.id
                    ? this.clientDetails.consultationLawOffice.id
                    : null,
                name:
                  this.clientDetails.consultationLawOffice &&
                    this.clientDetails.consultationLawOffice.name
                    ? this.clientDetails.consultationLawOffice.name
                    : ''
              },
              primaryOffice: {
                id:
                  this.clientDetails.consultationLawOffice &&
                    this.clientDetails.consultationLawOffice.id
                    ? this.clientDetails.consultationLawOffice.id
                    : null,
                name:
                  this.clientDetails.consultationLawOffice &&
                    this.clientDetails.consultationLawOffice.name
                    ? this.clientDetails.consultationLawOffice.name
                    : ''
              },
              // consultAttorney: { id: (checkExistAttorney) ? this.clientDetails.consultAttorney.id : null, name: (checkExistAttorney) ? this.clientDetails.consultAttorney.name : '' },
              companyName: this.clientDetails.isCompany
                ? this.clientDetails.companyName
                : '',
              isDeceased: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.isDeceased
                : false,
              spouseFirstName: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.spouseFirstName
                : '',
              spouseMiddleName: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.spouseMiddleName
                : '',
              spouseLastName: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.spouseLastName
                : '',
              spouseGender: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.spouseGender
                : null,
              spouseIsDeceased: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.spouseIsDeceased
                : '',
              prospectFirstName: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.prospectFirstName
                : '',
              prospectMiddleName: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.prospectMiddleName
                : '',
              prospectLastName: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.prospectLastName
                : '',
              prospectRelationship: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.prospectRelationship
                : '',
              prospectGender: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.prospectGender
                : null,
              prospectIsDeceased: this.clientDetails.personFormBuilder
                ? this.clientDetails.personFormBuilder.prospectIsDeceased
                : ''
            });
            const FirstName = this.basicForm.get('firstName');
            const LastName = this.basicForm.get('lastName');
            const CompanyName = this.basicForm.get('companyName');
            const primaryOffice = this.basicForm.get(
              'primaryOffice'
            ) as FormGroup;

            if (this.clientDetails.isCompany) {
              FirstName.setValidators([]);
              LastName.setValidators([]);
              CompanyName.setValidators([Validators.required]);

              FirstName.updateValueAndValidity();
              LastName.updateValueAndValidity();
              primaryOffice.updateValueAndValidity();
              CompanyName.updateValueAndValidity();

              this.basicForm.updateValueAndValidity();
            } else {
              FirstName.setValidators([Validators.required]);
              LastName.setValidators([Validators.required]);
              CompanyName.setValidators([]);
              CompanyName.updateValueAndValidity();

              /**** set contact form value */
              this.contactForm.patchValue({
                email: this.clientDetails.email
              });

              this.checkEmailExistence();
            }

            if (this.clientDetails.phones && this.clientDetails.phones.length) {
              this.clientDetails.phones.forEach((element, index, arr) => {
                if (this.contactForm['controls'].phones['controls'][index]) {
                  this.contactForm['controls'].phones['controls'][
                    index
                  ].controls['id'].setValue(element.id);
                  this.contactForm['controls'].phones['controls'][
                    index
                  ].controls['number'].setValue(element.number);
                  this.contactForm['controls'].phones['controls'][
                    index
                  ].controls['type'].setValue(element.type);
                  this.contactForm['controls'].phones['controls'][
                    index
                  ].controls['isPrimary'].setValue(element.isPrimary);
                }
              });
            }

            if (
              this.clientDetails.addresses &&
              this.clientDetails.addresses.length
            ) {
              this.clientDetails.addresses.forEach((element, index, arr) => {
                if (this.contactForm['controls'].addresses['controls'][index]) {
                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['id'].setValue(element.id);

                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['addressTypeId'].setValue(element.addressTypeId);

                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['address'].setValue(element.address);

                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['address2'].setValue(element.address2);

                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['city'].setValue(element.city);

                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['state'].setValue(element.state);

                  this.contactForm['controls'].addresses['controls'][
                    index
                  ].controls['zip'].setValue(element.zip);
                }

                this.getCityState(element.zip, true, index);
              });
            }

            /*** set corporate contact form vale*/
            let checkContactReason: boolean = false;
            if (this.clientDetails.doNotContactReason) {
              checkContactReason = this.doNotContactReasonArr.some(
                contactReason =>
                  contactReason.name == this.clientDetails.doNotContactReason
              );
            }
            this.CorporateContactForm.patchValue({
              doNotContact: this.clientDetails.doNotContact
                ? this.clientDetails.doNotContact
                : false,
              doNotContactReason: checkContactReason
                ? this.clientDetails.doNotContactReason
                : null,
              preferredContactMethod: this.clientDetails.preferredContactMethod,
              notifyEmail: this.clientDetails.notifyEmail
                ? this.clientDetails.notifyEmail
                : false,
              notifySmS: this.clientDetails.notifySmS
                ? this.clientDetails.notifySmS
                : false
            });

            this.CorporateContactForm.controls['doNotContact'].updateValueAndValidity();
            this.CorporateContactForm.controls['doNotContactReason'].updateValueAndValidity();
            this.CorporateContactForm.controls['preferredContactMethod'].updateValueAndValidity();
            this.CorporateContactForm.controls['notifyEmail'].updateValueAndValidity();
            this.CorporateContactForm.controls['notifySmS'].updateValueAndValidity();

            if (this.clientDetails.doNotContact) {
              this.CorporateContactForm.controls[
                'preferredContactMethod'
              ].setValue(null);
              this.CorporateContactForm.controls[
                'preferredContactMethod'
              ].disable();
              this.CorporateContactForm.controls['preferredContactMethod'].updateValueAndValidity();
            }
            this.showHideReason();
          }
          this.detailsLoading = false;
        },
        err => {
          this.detailsLoading = false;
        }
      );
  }

  /**
   * function to get association type
   */
  private getAssociateType(): void {
    this.miscService.v1MiscClientassociationtypeGet$Response({}).subscribe(
      res => {
        const clientAssociates: any = JSON.parse(res.body as any).results;
        if (clientAssociates && clientAssociates.length > 0) {
          this.associateVendor = clientAssociates.filter(obj => {
            return obj.name === 'Vendor';
          })[0];
          this.associateSubsidiary = clientAssociates.filter(obj => {
            return obj.name === 'Subsidiary';
          })[0];
        }
      }
    );
  }
  public validateEmail() {
    this.isValidEmail = UtilsHelper.validateEmail(String(this.contactForm.value.email).toLowerCase()) ? true : false;
  }
  checkEmailExistence() {
    this.emailExistence = false;
    if (this.contactForm.value.email && REGEX_DATA.Email.test(this.contactForm.value.email)) {
      const email: any = this.contactForm.value.email;
      this.miscService.v1MiscEmailCheckGet({ email, id: this.clientId })
        .subscribe((result: any) => {
          this.emailExistence = JSON.parse(result).results;
          this.validateEmail();
        });
    }

    if (!this.contactForm.value.email) {
      this.isValidEmail = true;
      this.emailExistence = false;
      this.sharedService.ClientEmailChange$.next(null);
    } else {
      this.sharedService.ClientEmailChange$.next(this.contactForm.value.email);
    }
  }

  /**
   * function to get primary offices
   */
  getOffices(): void {
    this.miscService.v1MiscOfficesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.officeList = JSON.parse(res.body).results;
      }
    );
  }

  /**
   * function to consultation offices
   */
  async getconsultOffices() {
    this.officeService
      .v1OfficeTenantGet$Response({ checkInitialConsultation: true })
      .subscribe(
        suc => {
          const res: any = suc;
          const listData = JSON.parse(res.body).results;
          if (listData && listData.length > 0) {
            this.consultofficelist = listData.filter(item => item.status === 'Active' || item.status === 'Open');
          }
        }
      );
  }

  /**
   * function to get attorney
   */
  getAttorney(id, patchValue = false) {
    this.detailsLoading = true;
    const param = { officeId: +id };
    this.attorneyList = [];
    this.officeService.v1OfficeConsultattroneyGet(param).subscribe(
      suc => {
        const res: any = suc;
        this.attorneyList = JSON.parse(res).results;
        if (patchValue) {
          let checkExistAttorney: boolean;
          if (
            this.clientDetails.consultAttorney &&
            this.clientDetails.consultAttorney.id
          ) {
            checkExistAttorney = this.attorneyList.some(
              attorney => attorney.id == this.clientDetails.consultAttorney.id
            );
          }
          this.basicForm.patchValue({
            consultAttorney: {
              id: checkExistAttorney
                ? this.clientDetails.consultAttorney.id
                : null,
              name: checkExistAttorney
                ? this.clientDetails.consultAttorney.name
                : ''
            }
          });
        }
        this.detailsLoading = false;
      },
      err => {
        this.detailsLoading = false;
      }
    );
  }

  /*** function for getting all states */
  getStates(): void {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (res: any) => {
        this.stateList = JSON.parse(res.body).results;
      },
      err => { }
    );
  }

  public consultChange(e) {
    if (e) {
      this.getAttorney(+e.id, true);
    } else {
      this.consultofficeSelected = false;
      this.attorneyList = [];
    }
  }

  /***
   * consult drop down
   */
  primaryOfficeChange(event: any): void {
    let officeName = null;
    if (event && event.name) {
      officeName = event.name;
    }
    this.basicForm.patchValue({
      primaryOffice: { name: officeName }
    });
  }

  /***
   * consult drop down
   */
  consultAttorneyChange(event: any): void {
    let name = null;
    if (event && event.name) {
      name = event.name;
    }
    this.basicForm.patchValue({
      consultAttorney: { name: name }
    });
  }

  public getData(data) {
    if (data) {
      this.associationData = data;
    }
  }

  /**
   * function for next step
   */
  next(): void {
    this.loading = true;
    let data: any = this.basicForm.value;
    data = Object.assign(data, this.contactForm.value);
    data = Object.assign(data, this.CorporateContactForm.value);
    data = Object.assign(this.clientDetails, data);
    let personFormBuilder: any;
    if (this.clientType != 'company') {
      personFormBuilder = {
        isDeceased: data.isDeceased,
        spouseFirstName: data.spouseFirstName,
        spouseMiddleName: data.spouseMiddleName,
        spouseLastName: data.spouseLastName,
        spouseGender: data.spouseGender,
        spouseIsDeceased: data.spouseIsDeceased,
        prospectFirstName: data.prospectFirstName,
        prospectMiddleName: data.prospectMiddleName,
        prospectLastName: data.prospectLastName,
        prospectRelationship: data.prospectRelationship,
        prospectGender: data.prospectGender,
        prospectIsDeceased: data.prospectIsDeceased
      };
      data.personFormBuilder = personFormBuilder;
    }
    delete data.isDeceased;
    delete data.spouseFirstName;
    delete data.spouseMiddleName;
    delete data.spouseLastName;
    delete data.spouseGender;
    delete data.spouseIsDeceased;
    delete data.prospectFirstName;
    delete data.prospectMiddleName;
    delete data.prospectLastName;
    delete data.prospectRelationship;
    delete data.prospectGender;
    delete data.prospectIsDeceased;
    if (data.phones && data.phones.length) {
      data.phones.forEach((element, index, arr) => {
        if (element.number) {
          data.phones[index].number = element.number.replace(/[- )(]/g, '');
        }
      });
    }
    if (data.addresses && data.addresses.length) {
      data.addresses.forEach((element, index, arr) => {
        data.addresses[index].state = element.state.toString();
      });
    }
    if (this.associationData) {
      if (this.associationData.vendorList) {
        this.associationData.vendorList.map(obj => {
          obj['associationType'] = 'Vendor';
        });
      }
      if (this.associationData.subsidiaryList) {
        this.associationData.subsidiaryList.map(obj => {
          obj['associationType'] = 'Subsidiary';
        });
      }
      data['subsidiaryList'] = this.associationData.subsidiaryList
        ? this.associationData.subsidiaryList
        : [];
      data['vendorList'] = this.associationData.vendorList
        ? this.associationData.vendorList
        : [];
      data['deletedSubsidiaryList'] = this.associationData.deletedSubsidiaryList
        ? this.associationData.deletedSubsidiaryList
        : [];
      data['deletedVendorList'] = this.associationData.deletedVendorList
        ? this.associationData.deletedVendorList
        : [];
    }
    let clientAssociations = [];
    if (this.vendorList && this.vendorList.length) {
      clientAssociations = clientAssociations.concat(this.vendorList);
    }
    if (this.subsidiaryList && this.subsidiaryList.length) {
      clientAssociations = clientAssociations.concat(this.subsidiaryList);
    }
    if (this.deletedSubsidiaryList && this.deletedSubsidiaryList.length) {
      clientAssociations = clientAssociations.concat(this.deletedSubsidiaryList);
    }
    if (this.deletedVendorList && this.deletedVendorList.length) {
      clientAssociations = clientAssociations.concat(this.deletedVendorList);
    }

    data['clientAssociations'] = clientAssociations;
    data['localUniqueNumber'] = this.localUniqueNumber;
    this.localClientDetails['client'] = data;
    this.checkEmailAndSave(data, () => {
    });
  }

  private checkEmailAndSave(data, saveCallback: () => void) {
    let primaryAddrs;
    if (data && data.addresses) {
      primaryAddrs = data.addresses.find(
        item => item.addressTypeName === 'primary'
      );
    }
    let body = {
      firstName: data.firstName,
      isCompany: this.clientType != 'company' ? false : true,
      lastName: data.lastName,
      primaryAddress: primaryAddrs ? primaryAddrs.address : null,
      primaryAddress2: primaryAddrs ? primaryAddrs.address2 : null,
      primaryCity: primaryAddrs ? primaryAddrs.city : null,
      primaryState: primaryAddrs ? primaryAddrs.state : null,
      primaryZipCode: primaryAddrs ? primaryAddrs.zip : null
    };
    if (this.clientType != 'company') {
      body['email'] = data.email ? data.email : '';
    } else {
      body['companyName'] = data.companyName;
    }
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (this.clientId) {
      body['id'] = +this.clientId;
    }
    this.contactsService
      .v1ContactsPotentialclientCheckPost$Json({ body })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res) {
            saveCallback();
            this.loading = false;
          } else {
            this.toastDisplay.showError(
              this.error_data.email_exists_potential_client
            );
            this.loading = false;
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  get phoneData() {
    return this.contactForm.get('phones') as FormArray;
  }

  phoneDataIndex(i) {
    return (<FormArray>this.contactForm.get('phones')).controls[i]['controls'];
  }

  log(it){
    console.log(it);
  }

  get adderessData() {
    return this.contactForm.get('addresses') as FormArray;
  }

  adderessDataIndex(i) {
    return (<FormArray>this.contactForm.get('addresses')).controls[i]['controls'];
  }

  showHideReason() {
    if (this.CorporateContactForm.value.doNotContact) {
      this.CorporateContactForm.get('preferredContactMethod').setValue(null);
      this.CorporateContactForm.controls['preferredContactMethod'].disable();
      this.CorporateContactForm.get('doNotContactReason').setValidators(
        Validators.required
      );
      this.CorporateContactForm.get('notifySmS').setValue(false);
      this.CorporateContactForm.get('notifyEmail').setValue(false);
      this.CorporateContactForm.controls['doNotContactReason'].enable();
    } else {
      this.CorporateContactForm.controls['preferredContactMethod'].enable();
      this.CorporateContactForm.get('doNotContactReason').clearValidators();
      this.CorporateContactForm.get('doNotContactReason').setValue(null);
      this.CorporateContactForm.get('doNotContactReason').disable();
      this.CorporateContactForm.controls[
        'preferredContactMethod'
      ].setValidators([Validators.required]);
      this.enablePrefferedContact();
    }
    this.CorporateContactForm.controls[
      'preferredContactMethod'
    ].updateValueAndValidity();
    this.CorporateContactForm.updateValueAndValidity();
  }

  get hasEmail() {
    if (
      this.contactForm.value &&
      this.contactForm.value.email &&
      this.contactForm.value.email.trim() != ''
    ) {
      return true;
    } else {
      return false;
    }
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  get isValidForm() {
    if (this.clientType != 'company') {
      return (
        this.basicForm.valid &&
        this.contactForm.valid &&
        this.CorporateContactForm.valid
      );
    } else {
      return this.basicForm.valid && this.CorporateContactForm.valid;
    }
  }
  onBlurMethod(val: any, type: string) {
    type === 'number' ? (this.primaryPhoneBlur = this.isBlur(val)) : '';
  }

  private isBlur(val: string | any[]) {
    return val.length === 10 ? false : val.length === 0 ? false : true;
  }

  redirectToList() {
    this.contactsService
      .v1ContactsFullConversionClientIdDelete({ clientId: +this.clientId })
      .subscribe(res => {
        this.indexDbService.removeObject('localMatterDetails');
        let existEventIds = UtilsHelper.getObject('conversationEventIds');
        if (existEventIds && existEventIds.length > 0) {
          existEventIds.map(obj => {
            this.matterService
              .v1MatterEventsDelete$Response({
                matterEventId: obj,
                isEventCancelled: true
              })
              .subscribe(res => { });
          });
        }
        UtilsHelper.removeObject('conversationEventIds');
        this.router.navigate(['/contact/potential-client']);
      });
  }

  editVendorClick(item: any, index) {
    item.indexNumber = index;
    this.addVendor = true;
    this.addVendorMode = 'edit';
    this.selectedVendor = item;
  }

  addVendorClick() {
    this.localUniqueNumber = this.localUniqueNumber + 1;
    this.addVendorMode = 'create';
    this.selectedVendor = null;
    this.addVendor = true;
  }


  editSubsidiaryClick(item: any, index) {
    item.indexNumber = index;
    this.addSubsidiary = true;
    this.addSubsidiaryMode = 'edit';
    this.selectedSubsidiary = item;
  }

  addSubsidiaryClick() {
    this.localUniqueNumber = this.localUniqueNumber + 1;
    this.addSubsidiaryMode = 'create';
    this.selectedSubsidiary = null;
    this.addSubsidiary = true;
  }


  public closeVendor(event) {
    if (event.type === 'close') {
      this.localUniqueNumber = this.localUniqueNumber - 1;
    }
    this.addVendor = false;
    if (event === 'add' || (event && event.type && event.type === 'add') || (event && event.type && event.type === 'edit')) {
      this.manageMatterAssociate(event, this.clientAssociationsList, this.associateVendor);
    }
  }

  public closeSubsidiary(event) {
    if (event.type === 'close') {
      this.localUniqueNumber = this.localUniqueNumber - 1;
    }
    this.addSubsidiary = false;
    if (event === 'add' || (event && event.type && event.type === 'add') || (event && event.type && event.type === 'edit')) {
      this.manageMatterAssociate(event, this.clientAssociationsList, this.associateSubsidiary);
    }
  }

  private manageMatterAssociate(event, listArr, associate) {
    const isNew = (!event.data.id || event.type === 'add') ? true : false;
    if (event.type === 'add') {
      if (event.data.id && listArr && listArr.length > 0) {
        const exist = listArr.some(obj => obj.id === event.data.id);
        if (exist) {
          this.toastDisplay.showError('Record already selcted.');
          return;
        }
      }
      listArr.push(this.getAssociationData(event, associate, isNew));
    } else if (event.type === 'edit') {
      const index = listArr.findIndex((item, idx) => idx === event.data.indexNumber);
      if (index > -1) {
        listArr[index] = this.getAssociationData(event, associate, isNew);
      }
    }
    this.uniNumber.emit(this.localUniqueNumber);
  }

  getAssociationData(event, associate, isNew) {
    return {
      isNew,
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
      isVisible: (event.data.isVisible) ? event.data.isVisible : true,
      isArchived: (event.data.isArchived) ? event.data.isArchived : false
    };
  }

  getClientAssociations() {
    this.clientAssociationService.v1ClientAssociationAllClientIdGet({ clientId: this.clientId }).subscribe((res: any) => {
      const list = JSON.parse(res).results;
      list.forEach(element => {
        if (element.isActive && (element.associationType == "Vendor" || element.associationType == "Subsidiary")) {
          this.clientAssociationsList.push(element);
        }
      });
    });
  }

  async deleteClientAssociations(type: string, index: number) {
    let mess = type == 'Vendor' ? 'Are you sure you want to delete this Vendor?' : 'Are you sure you want to delete this Subsidiary?'
    let resp: any = await this.dialogService.confirm(mess, 'Delete');
    if (resp) {
      this.deleteFromArr(type, index);
    }
  }

  private deleteFromArr(type: string, index: number) {
    let list = this.clientAssociationsList;
    const deletedList = type === 'Vendor' ? 'deletedVendorList' : 'deletedSubsidiaryList';
    const msg = type === 'Vendor' ? 'vendor_delete' : 'subsidiary_delete';

    if (list && list.length) {
      const data: any = { ...list[index] };
      if (!data.isNew) {
        data.isDelete = true;
        this[deletedList].push(data);
      }
    }

    list.splice(index, 1);
    list = [...list];
    this.toastDisplay.showSuccess(this.errorData[msg]);
  }

  editClientAssociations(item: any, index: number) {
    if (item && item.associationType === 'Vendor') {
      this.editVendorClick(item, index);
    } else {
      this.editSubsidiaryClick(item, index)
    }
  }

  sendBasicInfoData() {
    let data = {
      contactForm: (this.clientType == 'individual') ? this.contactForm : {},
      basicForm: this.basicForm,
      CorporateContactForm: this.CorporateContactForm
    }
    this.basicInfoDetails.emit(data);
  }

  getDocumentSettings() {
    this.documentSettingsService.v1DocumentSettingTenantTenantIdGet({ tenantId: this.userInfo.tenantId }).subscribe(res => {
      this.isDocumentPortalAccess = JSON.parse(res as any).results.documentPortalAccess;
    }, err => {
    })
  }

  /* Parent component shared */
  basicDetailsData() {
    let basicDetails = {
      id: (this.clientDetails.id && this.clientDetails.id > 0) ? this.clientDetails.id : 0,
      initialConsultLawOffice: this.basicForm.value.consultationLawOffice.id,
      primanyLawOffice: this.basicForm.value.primaryOffice.id,
      initialConsultAttoney: this.basicForm.value.consultAttorney.id,
      originatingAttorney: null,
      initialConsultDate: (this.basicForm.value.initialConsultDate) ? moment(this.basicForm.value.initialConsultDate).format('YYYY-MM-DD') : null,
      personFormBuilder: {
        id: this.clientDetails.personFormBuilder.id,
        personId: this.clientDetails.personFormBuilder.personId,
        isDeceased: (this.basicForm.value.isDeceased) ? this.basicForm.value.isDeceased : false,
        spouseFirstName: this.basicForm.value.spouseFirstName,
        spouseMiddleName: this.basicForm.value.spouseMiddleName,
        spouseLastName: this.basicForm.value.spouseLastName,
        spouseGender: this.basicForm.value.spouseGender,
        spouseIsDeceased: (this.basicForm.value.spouseIsDeceased) ? this.basicForm.value.spouseIsDeceased : false,
        prospectFirstName: this.basicForm.value.prospectFirstName,
        prospectMiddleName: this.basicForm.value.prospectMiddleName,
        prospectLastName: this.basicForm.value.prospectLastName,
        prospectRelationship: this.basicForm.value.prospectRelationship,
        prospectGender: this.basicForm.value.prospectGender,
        prospectIsDeceased: (this.basicForm.value.prospectIsDeceased) ? this.basicForm.value.prospectIsDeceased : false,
      },
      contactType: (this.clientDetails.isCompany) ? 'corporate' : 'individual',
      initialContactDate: (this.clientDetails.initialContactDate) ? moment(this.clientDetails.initialContactDate).format('YYYY-MM-DD') : null,
      salutation: this.basicForm.value.salutation,
      firstName: this.basicForm.value.firstName,
      middleName: this.basicForm.value.middleName,
      lastName: this.basicForm.value.lastName,
      gender: this.basicForm.value.gender,
      suffix: this.basicForm.value.suffix,
      formerName: this.basicForm.value.formerName,
      companyName: this.basicForm.value.companyName,
      isCompany: this.clientDetails.isCompany,
      isVisible: this.clientDetails.isVisible,
      isArchived: this.clientDetails.isArchived,
      archiveReason: this.clientDetails.archiveReason,
      nextActionDate: (this.clientDetails.nextActionDate) ? moment(this.clientDetails.nextActionDate).format('YYYY-MM-DD') : null,
      nextActionNote: this.clientDetails.nextActionNote,
      primaryPhoneNumber: (this.contactForm.value.phones.length && this.contactForm.value.phones.length >= 1) ? this.contactForm.value.phones[0].number : '',
      cellPhoneNumber: (this.contactForm.value.phones.length && this.contactForm.value.phones.length >= 2) ? this.contactForm.value.phones[1].number : '',
      email: (this.contactForm.value.email) ? this.contactForm.value.email : null,
      primaryAddress: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 1) ? this.contactForm.value.addresses[0].address : '',
      primaryAddress2: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 1) ? this.contactForm.value.addresses[0].address2 : '',
      primaryCity: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 1) ? this.contactForm.value.addresses[0].city : '',
      primaryState: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 1) ? this.contactForm.value.addresses[0].state : '',
      primaryZipCode: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 1) ? this.contactForm.value.addresses[0].zip : '',
      billingAddress: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 2) ? this.contactForm.value.addresses[1].address : '',
      billingAddress2: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 2) ? this.contactForm.value.addresses[1].address2 : '',
      billingCity: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 2) ? this.contactForm.value.addresses[1].city : '',
      billingState: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 2) ? this.contactForm.value.addresses[1].state : '',
      billingZipCode: (this.contactForm.value.addresses.length && this.contactForm.value.addresses.length >= 2) ? this.contactForm.value.addresses[1].zip : '',
      preferredContactMethod: this.CorporateContactForm.value.hasOwnProperty('preferredContactMethod') ? this.CorporateContactForm.value.preferredContactMethod : '',
      doNotContactReasonOther: this.CorporateContactForm.value.DoNotContactReasonOther,
      doNotContactReason: this.CorporateContactForm.value.hasOwnProperty('doNotContactReason') ? this.CorporateContactForm.value.doNotContactReason : '',
      doNotContact: this.CorporateContactForm.value.doNotContact,
      notifyEmail: this.CorporateContactForm.value.notifyEmail,
      notifySMS: this.CorporateContactForm.value.notifySmS,
      marketingEmail: this.CorporateContactForm.value.marketingEmail,
      marketingSMS: this.CorporateContactForm.value.marketingSMS
    }


    /* Client associations */
    let clientAssociations = [];
    if (this.vendorList && this.vendorList.length) {
      clientAssociations = clientAssociations.concat(this.vendorList);
    }
    if (this.subsidiaryList && this.subsidiaryList.length) {
      clientAssociations = clientAssociations.concat(this.subsidiaryList);
    }
    if (this.deletedSubsidiaryList && this.deletedSubsidiaryList.length) {
      clientAssociations = clientAssociations.concat(this.deletedSubsidiaryList);
    }
    if (this.deletedVendorList && this.deletedVendorList.length) {
      clientAssociations = clientAssociations.concat(this.deletedVendorList);
    }

    return { basicDetails: basicDetails, clientAssociations: clientAssociations, uniqueNumber: this.clientDetails.uniqueNumber };
  }

  isNotBasicInformationValidate() {
      if (this.basicForm.invalid) {
        return true;
      }
      if (this.contactForm.invalid && this.clientType != 'company') {
        return true;
      }
      if (this.CorporateContactForm.invalid) {
        return true;
      }
      if (this.emailExistence) {
        return true;
      }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  /********** Enables/Disables Preferred Contact Method ******/
  public enablePrefferedContact() {
    const ele = document.getElementById('customradio_1') as HTMLInputElement;
    if(!this.contactForm.value.email || this.contactForm.controls.email.errors) {
      ele.disabled = true;
      return;
    }
    if(!this.CorporateContactForm.value.doNotContact) {
      ele.disabled = false;
    }
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, isStateCityExist?:boolean, index?)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription)
      this.stateCitySubscription.unsubscribe();
    if(input.length >= 3) {
        this.validZipErr = false
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

              if(isStateCityExist) {
                this.setStateCity(index);
              } else {
                this.contactForm['controls'].addresses['controls'][index].controls['state'].setValue(this.stateList.length ? this.stateList[0].code : null);
                this.contactForm['controls'].addresses['controls'][index].controls['city'].setValue(this.cityList.length ? this.cityList[0] : null);
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
    this.singleState = null;
    this.validZipErr = false;
    this.contactForm['controls'].addresses['controls'][index].controls['state'].setValue(null);
    this.contactForm['controls'].addresses['controls'][index].controls['city'].setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /******* set State and City  ******/
  public setStateCity(index) {
    const state = this.contactForm['controls'].addresses['controls'][index].controls['state'].value;
    const city = this.contactForm['controls'].addresses['controls'][index].controls['city'].value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.contactForm['controls'].addresses['controls'][index].controls['state'].setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code  ? this.stateList[0].code || '' : '');
    this.contactForm['controls'].addresses['controls'][index].controls['city'].setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList [0] || '');
  }
}
