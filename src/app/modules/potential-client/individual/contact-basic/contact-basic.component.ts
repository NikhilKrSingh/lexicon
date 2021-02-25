import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { TenantTier } from 'src/app/modules/models/tenant-tier.enum';
import * as Constant from 'src/app/modules/shared/const';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwCreateContact } from 'src/common/swagger-providers/models.js';
import { ContactsService, MatterService, MiscService, PersonService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-contact-basic',
  templateUrl: './contact-basic.component.html',
  styleUrls: ['./contact-basic.component.scss']
})
export class ContactBasicComponent implements OnInit, OnDestroy {
  @Output() readonly nextStep = new EventEmitter<{ next?: string; current?: string }>();

  constructor(
    private router: Router,
    private builder: FormBuilder,
    private contactsService: ContactsService,
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private modalService: NgbModal,
    private personService: PersonService,
    private matterService: MatterService,
    private sharedService: SharedService
  ) {}
  public salutation = new FormControl(null);
  public firstName = new FormControl('', [Validators.required]);
  public middleName = new FormControl('');
  public lastName = new FormControl('', [Validators.required]);
  public suffix = new FormControl(null);
  public formerName = new FormControl('');
  public gender = new FormControl(null);
  public initialContactDate = new FormControl(new Date(), [
    Validators.required
  ]);
  public companyName = new FormControl('', [Validators.required]);
  public nextActionDate = new FormControl(null);
  public nextActionNote = new FormControl(null);
  public primaryPhoneNumber = new FormControl('', [Validators.required]);
  public cellPhoneNumber = new FormControl('');
  public email = new FormControl('', [
    Validators.email,
    Validators.pattern(REGEX_DATA.Email)
  ]);
  public primaryAddress = new FormControl('', [Validators.required]);
  public primaryAddress2 = new FormControl('');
  public primaryCity = new FormControl('', [Validators.required]);
  public primaryState = new FormControl(null, [Validators.required]);
  public primaryZipCode = new FormControl('', [Validators.required]);
  public preferredContactMethod = new FormControl('');
  public doNotContactReason = new FormControl();
  public DoNotContactReasonOther = new FormControl();
  public doNotContact = new FormControl(false);
  public notifyEmail = new FormControl(false);
  public notifySMS = new FormControl(false);
  public initialConsultDate = new FormControl(new Date());
  public changeNotes = new FormControl('');
  public showPersonFormBuilder: boolean = false;
  public subscription: Subscription;
  public IndividualContactForm: FormGroup = this.builder.group({
    salutation: this.salutation,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    suffix: this.suffix,
    formerName: this.formerName,
    gender: this.gender,
    initialContactDate: this.initialContactDate,
    nextActionDate: this.nextActionDate,
    primaryPhoneNumber: this.primaryPhoneNumber,
    cellPhoneNumber: this.cellPhoneNumber,
    email: this.email,
    primaryAddress: this.primaryAddress,
    primaryAddress2: this.primaryAddress2,
    primaryCity: this.primaryCity,
    primaryState: this.primaryState,
    primaryZipCode: this.primaryZipCode,
    preferredContactMethod: this.preferredContactMethod,
    doNotContactReason: this.doNotContactReason,
    DoNotContactReasonOther: this.DoNotContactReasonOther,
    doNotContact: this.doNotContact,
    notifyEmail: this.notifyEmail,
    notifySMS: this.notifySMS,
    initialConsultDate: this.initialConsultDate,
    changeNotes: this.changeNotes,
    nextActionNote: new FormControl(''),
    isDeceased: new FormControl(false),
    spouseFirstName: new FormControl(''),
    spouseMiddleName: new FormControl(''),
    spouseLastName: new FormControl(''),
    spouseGender: new FormControl(null),
    spouseIsDeceased: new FormControl(false),
    prospectFirstName: new FormControl(''),
    prospectMiddleName: new FormControl(''),
    prospectLastName: new FormControl(''),
    prospectRelationship: new FormControl(''),
    prospectGender: new FormControl(null),
    prospectIsDeceased: new FormControl(false)
  });

  public CorporateContactForm: FormGroup = this.builder.group({
    companyName: this.companyName,
    initialContactDate: new FormControl(new Date(), [Validators.required]),
    nextActionDate: new FormControl(null),
    primaryAddress: new FormControl('', [Validators.required]),
    primaryAddress2: new FormControl(''),
    primaryCity: new FormControl('', [Validators.required]),
    primaryState: new FormControl(null, [Validators.required]),
    primaryZipCode: new FormControl('', [Validators.required]),
    preferredContactMethod: new FormControl(''),
    doNotContactReason: new FormControl(),
    DoNotContactReasonOther: new FormControl(),
    doNotContact: new FormControl(false),
    notifyEmail: new FormControl(false),
    notifySMS: new FormControl(false),
    initialConsultDate: new FormControl(null),
    changeNotes: new FormControl(''),
    nextActionNote: new FormControl('')
  });
  public corporateContactList: Array<any> = [];
  public vendorForm: FormGroup = this.builder.group({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [
      Validators.email,
      Validators.pattern(REGEX_DATA.Email)
    ]),
    jobTitle: new FormControl(''),
    primaryPhoneNumber: new FormControl(''),
    cellPhone: new FormControl(''),
    isPrimary: new FormControl(false),
    isBilling: new FormControl(false),
    isGeneral: new FormControl(false),
    isVisible: new FormControl(true, [Validators.required])
  });
  public isPrimary = false;
  public isBilling = false;
  public isGeneral = false;
  public disEmail: boolean = true;
  private modalRef: NgbModalRef;
  public doNotContactReasonArr: Array<{ name: string }>;
  public genderList: Array<{
    val: string;
    text: string;
  }> = UtilsHelper.returndoGenderList();
  public errorData: any = (errorData as any).default;
  public clientDetail: any;
  public isIndividual: string;
  public stateList: Array<any> = [];
  public initialconsultations: string = 'no';
  public modalOptions: NgbModalOptions;
  public closeResult: string;
  public salutationArr: Array<{ name: string }>;
  public primaryPhoneNumberBlur: boolean = false;
  public cellPhoneNumberBlur: boolean = false;
  public primaryPhoneBlur: boolean = false;
  public cellPhoneBlur: boolean = false;
  public loading: boolean;
  public currentDate: Date;

  userInfo: any;
  tenantTier = TenantTier;

  ngOnInit() {
    this.currentDate = new Date();
    this.salutationArr = [{ name: 'Mr.' }, { name: 'Mrs.' }, { name: 'Ms.' }];
    this.getDoNotContactReasons();
    this.getState();
    this.userInfo = UtilsHelper.getLoginUser();

    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.client) {
      this.clientDetail = contactDetails.client;
      this.getClientDetail();
    }

    this.IndividualContactForm.controls['email'].valueChanges.subscribe(
      value => {
        if (value && this.IndividualContactForm.controls['email'].valid) {
          this.disEmail = null;
        } else {
          this.disEmail = true;
          if (
            this.IndividualContactForm.controls['preferredContactMethod']
              .value == 'Email'
          ) {
            this.IndividualContactForm.controls[
              'preferredContactMethod'
            ].setValue('');
          }
        }
      }
    );
    this.subscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        this.showPersonFormBuilder = res ? true : false;
      }
    );
    this.changeDonotContact();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private getDoNotContactReasons() {
    this.misc.v1MiscDoNotContactReasonCodesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.doNotContactReasonArr = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  private getState() {
    this.misc.v1MiscStatesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.stateList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public async insertClient(type: string) {
    const data =
      type === 'individual'
        ? { ...this.IndividualContactForm.value }
        : { ...this.CorporateContactForm.value };
    if (data.initialContactDate) {
      data.initialContactDate =
        moment(data.initialContactDate).format(
          Constant.SharedConstant.DateFormat
        ) + Constant.SharedConstant.TimeFormat;
    }
    if (data.nextActionDate) {
      data['nextActionDate'] =
        moment(data.nextActionDate).format('YYYY-MM-DD') + 'T00:00:00.000Z';
    }
    const basicInfo =
      type === 'individual'
        ? {
            contactType: type,
            firstName: data.firstName ? data.firstName.trim() : data.firstName,
            formerName: data.formerName
              ? data.formerName.trim()
              : data.formerName,
            gender: data.gender,
            initialContactDate: data.initialContactDate,
            nextActionDate:
              this.initialconsultations === 'yes' ? data.nextActionDate : null,
            nextActionNote:
              this.initialconsultations === 'yes' ? data.nextActionNote : null,
            initialconsultations: this.initialconsultations,
            lastName: data.lastName ? data.lastName.trim() : data.lastName,
            middleName: data.middleName
              ? data.middleName.trim()
              : data.middleName,
            salutation: data.salutation,
            suffix: data.suffix
          }
        : {
            contactType: type,
            companyName: data.companyName
              ? data.companyName.trim()
              : data.companyName,
            initialContactDate: data.initialContactDate,
            nextActionDate:
              this.initialconsultations === 'yes' ? data.nextActionDate : null,
            nextActionNote:
              this.initialconsultations === 'yes' ? data.nextActionNote : null,
            initialconsultations: this.initialconsultations
          };
    const body = {
      basicInformation: basicInfo,
      changeNotes: data.changeNotes,
      consultation: { initialConsultDate: data.initialConsultDate },
      contactInformation: {
        cellPhoneNumber: data.cellPhoneNumber,
        email: data.email,
        primaryAddress: data.primaryAddress,
        primaryAddress2: data.primaryAddress2,
        primaryCity: data.primaryCity,
        primaryPhoneNumber: data.primaryPhoneNumber,
        primaryState: data.primaryState,
        primaryZipCode: data.primaryZipCode
      },
      contactPreference: {
        doNotContact: data.doNotContact,
        doNotContactReason: data.doNotContact ? data.doNotContactReason : null,
        DoNotContactReasonOther: data.DoNotContactReasonOther,
        notifyEmail: data.doNotContact ? false : data.notifyEmail,
        notifySMS: data.doNotContact ? false : data.notifySMS,
        preferredContactMethod: data.doNotContact
          ? null
          : data.preferredContactMethod
      },
      corporateContactList: this.corporateContactList,
      personFormBuilder: {
        id: 0,
        personId: 0,
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
        prospectIsDeceased: data.prospectIsDeceased,
        changeNotes: ''
      }
    };
    if (!this.showPersonFormBuilder) {
      delete body.personFormBuilder;
    }
    if (type === 'corporate') {
      let exist = this.corporateContactList.some(e => e.isPrimary);
      if (!exist) {
        this.toastDisplay.showError(
          this.errorData.validation_corporate_contacts_required
        );
        return;
      }
      let existb = this.corporateContactList.some(e => e.isBilling);
      if (!existb) {
        this.toastDisplay.showError(
          this.errorData.validation_corporate_contacts_billing_required
        );
        return;
      }
    }
    this.checkEmailAndSave(body, () => {
      this.insertIndividualOrCorpClient(body);
    });
  }

  private checkEmailAndSave(data: vwCreateContact, saveCallback: () => void) {
    this.loading = true;
    let body = {
      firstName: data.basicInformation.firstName,
      isCompany:
        data.basicInformation.contactType === 'individual' ? false : true,
      lastName: data.basicInformation.lastName,
      primaryAddress: data.contactInformation.primaryAddress,
      primaryAddress2: data.contactInformation.primaryAddress2,
      primaryCity: data.contactInformation.primaryCity,
      primaryState: data.contactInformation.primaryState,
      primaryZipCode: data.contactInformation.primaryZipCode
    };
    if (data.basicInformation.contactType === 'individual') {
      body['email'] = data.contactInformation.email;
    } else {
      body['companyName'] = data.basicInformation.companyName;
    }
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.createDetails) {
      body['id'] = contactDetails.createDetails.clientId;
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
              this.errorData.email_exists_potential_client
            );
            this.loading = false;
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  public insertIndividualOrCorpClient(body) {
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails) {
      contactDetails['client'] = body;
      UtilsHelper.setObject('contactDetails', contactDetails);
    } else {
      UtilsHelper.setObject('contactDetails', { client: body });
    }
    this.nextStep.emit({ next: 'matter', current: 'basic' });
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
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

  public saveCorporateContact() {
    if (
      !this.vendorForm.value.isPrimary &&
      !this.vendorForm.value.isBilling &&
      !this.vendorForm.value.isGeneral
    ) {
      this.toastDisplay.showError(this.errorData.conatct_type_required);
      return;
    }
    let data = { ...this.vendorForm.value };
    if (data.isPrimary) {
      if (this.isContactExist('Primary')) {
        return;
      }
    }
    if (data.isBilling) {
      if (this.isContactExist('Billing')) {
        return;
      }
    }
    data.person = data.firstName + ',' + data.lastName;
    data.status = data.isVisible;
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.createDetails) {
      data['isNew'] = true;
    }
    data['isGeneralCounsel'] = data.isGeneral;
    this.corporateContactList.push(data);
    this.vendorForm.reset();
    this.vendorForm.patchValue({
      email: '',
      isVisible: true
    });
    this.modalRef.close();
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  private isContactExist(type) {
    let exist = this.isExist(type);
    if (exist) {
      this.toastDisplay.showError(
        type + ' Contact is already exists for this client.'
      );
    }
    if (type === 'Primary') {
      const data = { ...this.vendorForm.value };
      if (!data.email) {
        exist = true;
        this.toastDisplay.showError('Please enter Email address.');
      }
      if (!data.primaryPhoneNumber) {
        exist = true;
        this.toastDisplay.showError('Please enter Phone number.');
      }
    }
    return exist;
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

  isExistPrimary() {
    let exist = false;
    exist = this.corporateContactList.some(e => e.isPrimary);
    return exist;
  }

  isExistBilling() {
    let exist = false;
    exist = this.corporateContactList.some(e => e.isBilling);
    return exist;
  }

  public getClientDetail() {
    if (this.clientDetail.basicInformation.initialconsultations) {
      this.initialconsultations = this.clientDetail.basicInformation.initialconsultations;
    }
    if (this.clientDetail.basicInformation.contactType === 'individual') {
      this.IndividualContactForm.patchValue({
        salutation: this.clientDetail.basicInformation.salutation,
        firstName: this.clientDetail.basicInformation.firstName,
        middleName: this.clientDetail.basicInformation.middleName,
        lastName: this.clientDetail.basicInformation.lastName,
        suffix: this.clientDetail.basicInformation.suffix,
        formerName: this.clientDetail.basicInformation.formerName,
        gender: this.clientDetail.basicInformation.gender,
        initialContactDate: this.clientDetail.basicInformation
          .initialContactDate
          ? new Date(this.clientDetail.basicInformation.initialContactDate)
          : new Date(),
        nextActionDate: this.clientDetail.basicInformation.nextActionDate
          ? new Date(this.clientDetail.basicInformation.nextActionDate)
          : null,
        primaryPhoneNumber: this.clientDetail.contactInformation
          .primaryPhoneNumber
          ? this.clientDetail.contactInformation.primaryPhoneNumber
          : null,
        cellPhoneNumber: this.clientDetail.contactInformation.cellPhoneNumber
          ? this.clientDetail.contactInformation.cellPhoneNumber
          : null,
        email: this.clientDetail.contactInformation.email,
        primaryAddress: this.clientDetail.contactInformation.primaryAddress,
        primaryAddress2: this.clientDetail.contactInformation.primaryAddress2,
        primaryCity: this.clientDetail.contactInformation.primaryCity,
        primaryState: this.clientDetail.contactInformation.primaryState,
        primaryZipCode: this.clientDetail.contactInformation.primaryZipCode,
        preferredContactMethod: this.clientDetail.contactPreference
          .preferredContactMethod,
        doNotContactReason: this.clientDetail.contactPreference
          .doNotContactReason,
        DoNotContactReasonOther: this.clientDetail.contactPreference
          .DoNotContactReasonOther,
        doNotContact: this.clientDetail.contactPreference.doNotContact,
        notifyEmail: this.clientDetail.contactPreference.notifyEmail,
        notifySMS: this.clientDetail.contactPreference.notifySMS,
        initialConsultDate: this.clientDetail.initialConsultDate,
        changeNotes: this.clientDetail.changeNotes,
        nextActionNote: this.clientDetail.basicInformation.nextActionNote,
        isDeceased: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.isDeceased
          : false,
        spouseFirstName: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.spouseFirstName
          : '',
        spouseMiddleName: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.spouseMiddleName
          : '',
        spouseLastName: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.spouseLastName
          : '',
        spouseGender: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.spouseGender
          : null,
        spouseIsDeceased: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.spouseIsDeceased
          : false,
        prospectFirstName: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.prospectFirstName
          : '',
        prospectMiddleName: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.prospectMiddleName
          : '',
        prospectLastName: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.prospectLastName
          : '',
        prospectRelationship: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.prospectRelationship
          : '',
        prospectGender: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.prospectGender
          : null,
        prospectIsDeceased: this.clientDetail.personFormBuilder
          ? this.clientDetail.personFormBuilder.prospectIsDeceased
          : false
      });
      this.isIndividual = 'individual';
      if (
        this.clientDetail.contactInformation.email &&
        this.IndividualContactForm.controls['email'].valid
      ) {
        this.disEmail = null;
      } else {
        this.disEmail = true;
        if (
          this.IndividualContactForm.controls['preferredContactMethod'].value ==
          'Email'
        ) {
          this.IndividualContactForm.controls[
            'preferredContactMethod'
          ].setValue('');
        }
      }
    } else {
      this.CorporateContactForm.patchValue({
        companyName: this.clientDetail.basicInformation.companyName,
        initialContactDate: this.clientDetail.basicInformation
          .initialContactDate
          ? new Date(this.clientDetail.basicInformation.initialContactDate)
          : new Date(),
        nextActionDate: this.clientDetail.basicInformation.nextActionDate
          ? new Date(this.clientDetail.basicInformation.nextActionDate)
          : null,
        primaryAddress: this.clientDetail.contactInformation.primaryAddress,
        primaryAddress2: this.clientDetail.contactInformation.primaryAddress2,
        primaryCity: this.clientDetail.contactInformation.primaryCity,
        primaryState: this.clientDetail.contactInformation.primaryState,
        primaryZipCode: this.clientDetail.contactInformation.primaryZipCode,
        preferredContactMethod: this.clientDetail.contactPreference
          .preferredContactMethod,
        doNotContactReason: this.clientDetail.contactPreference
          .doNotContactReason,
        DoNotContactReasonOther: this.clientDetail.contactPreference
          .DoNotContactReasonOther,
        doNotContact: this.clientDetail.contactPreference.doNotContact,
        notifyEmail: this.clientDetail.contactPreference.notifyEmail,
        notifySMS: this.clientDetail.contactPreference.notifySMS,
        initialConsultDate: this.clientDetail.contactPreference
          .initialConsultDate,
        changeNotes: this.clientDetail.changeNotes,
        nextActionNote: this.clientDetail.basicInformation.nextActionNote
      });
      if (
        this.clientDetail &&
        this.clientDetail.corporateContactList &&
        this.clientDetail.corporateContactList.length > 0
      ) {
        this.corporateContactList = this.clientDetail.corporateContactList;
      }
      this.isIndividual = 'corporate';
    }
  }

  redirectToList() {
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.createDetails) {
      this.personService
        .v1PersonPersonIdDelete$Response({
          personId: +contactDetails.createDetails.clientId
        })
        .subscribe(res => {
          this.router.navigate(['/contact/potential-client']);
        });
      if (contactDetails && contactDetails.eventDetails) {
        contactDetails.eventDetails.map(obj => {
          this.matterService
            .v1MatterEventsDelete$Response({
              matterEventId: obj,
              isEventCancelled: true
            })
            .subscribe(res => {});
        });
      }
    } else {
      this.router.navigate(['/contact/potential-client']);
    }
  }

  onBlurMethod(val: any, type: string) {
    type === 'primaryPhoneNumber'
      ? (this.primaryPhoneNumberBlur = this.isBlur(val))
      : type === 'cellPhoneNumber'
      ? (this.cellPhoneNumberBlur = this.isBlur(val))
      : type === 'primaryPhone'
      ? (this.primaryPhoneBlur = this.isBlur(val))
      : type === 'cellPhone'
      ? (this.cellPhoneBlur = this.isBlur(val))
      : '';
  }

  private isBlur(val: string | any[]) {
    return val.length === 10 ? false : val.length === 0 ? false : true;
  }

  changeDonotContact() {
    if (this.IndividualContactForm.value.doNotContact) {
      this.IndividualContactForm.get('preferredContactMethod').setValue(null);
      this.IndividualContactForm.get('preferredContactMethod').disable();
      this.IndividualContactForm.get('notifySMS').disable();
      this.IndividualContactForm.get('notifySMS').setValue(false);
      this.IndividualContactForm.get('notifyEmail').setValue(false);
      this.IndividualContactForm.get('notifyEmail').disable();
      this.IndividualContactForm.controls['doNotContactReason'].enable();
      this.IndividualContactForm.controls['doNotContactReason'].setValidators([
        Validators.required
      ]);
    } else {
      this.IndividualContactForm.get('preferredContactMethod').enable();
      this.IndividualContactForm.get('notifySMS').enable();
      this.IndividualContactForm.get('notifyEmail').enable();
      this.IndividualContactForm.get('doNotContactReason').setValue(null);
      this.IndividualContactForm.get('doNotContactReason').disable();
      this.IndividualContactForm.controls[
        'preferredContactMethod'
      ].setValidators([Validators.required]);
    }

    if (this.CorporateContactForm.value.doNotContact) {
      this.CorporateContactForm.get('preferredContactMethod').setValue(null);
      this.CorporateContactForm.get('preferredContactMethod').disable();
      this.CorporateContactForm.get('notifySMS').disable();
      this.CorporateContactForm.get('notifySMS').setValue(false);
      this.CorporateContactForm.get('notifyEmail').setValue(false);
      this.CorporateContactForm.get('notifyEmail').disable();
      this.CorporateContactForm.controls['doNotContactReason'].enable();
      this.CorporateContactForm.controls['doNotContactReason'].setValidators([
        Validators.required
      ]);
    } else {
      this.CorporateContactForm.get('preferredContactMethod').enable();
      this.CorporateContactForm.get('notifySMS').enable();
      this.CorporateContactForm.get('notifyEmail').enable();
      this.CorporateContactForm.get('doNotContactReason').setValue(null);
      this.CorporateContactForm.get('doNotContactReason').disable();
      this.CorporateContactForm.controls[
        'preferredContactMethod'
      ].setValidators([Validators.required]);
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
