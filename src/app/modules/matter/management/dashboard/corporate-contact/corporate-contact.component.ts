import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ClientAssociationService } from '../../../../../../common/swagger-providers/services/client-association.service';
import { ClientService } from '../../../../../../common/swagger-providers/services/client.service';
import { ContactsService } from '../../../../../../common/swagger-providers/services/contacts.service';
import { MatterService } from '../../../../../../common/swagger-providers/services/matter.service';
import { MiscService } from '../../../../../../common/swagger-providers/services/misc.service';
import { vwMatterResponse } from '../../../../models';
import { ConflictCheckDialogComponent } from '../../../../shared/conflict-check-dialog/conflict-check-dialog.component';
import { REGEX_DATA } from '../../../../shared/const';
import { DialogService } from '../../../../shared/dialog.service';
import * as errorData from '../../../../shared/error.json';
import { UtilsHelper } from '../../../../shared/utils.helper';

@Component({
  selector: 'app-corporate-contact',
  templateUrl: './corporate-contact.component.html',
  styleUrls: ['./corporate-contact.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CorporateContactComponent implements OnInit {

  modalOptions: NgbModalOptions;
  closeResult: string;
  matterId: any;
  matterDetails: any;
  corporateContactList: any;
  addEditAssociation = true;
  public errorData: any = (errorData as any).default;
  primaryContactList: any = [];
  billingContactList: any = [];
  generalContactList: any = [];
  public editDetails = {
    isEdit: false,
    contact: null
  };
  private modalRef: NgbModalRef;
  public vendorForm: FormGroup;
  public roleForm: FormGroup;
  public missingInfoForm: FormGroup;
  userInfo: any;
  public createType = 'create';
  vendorFormSubmitted = false;
  public selectedExistedContactList: Array<any> = [];
  public localEmailExist = false;
  public emailExistence: boolean;
  missingInfoFormSubmitted: boolean;
  uniqueNumber: any;
  corporateContactLoading: boolean;
  conflictPerons: any;
  blockedPersons: any;
  exter_doc_email: any;
  public doNotContactReasonArr: Array<{ name: string }>;
  emailExistenceForCorporateContact: boolean;

  constructor(
    private modalService: NgbModal,
    private builder: FormBuilder,
    private matterService: MatterService,
    private clientAssociationService: ClientAssociationService,
    private clientService: ClientService,
    private contactService: ContactsService,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService,
    private toastrService: ToastDisplay,
    private pageTitle: Title,
    private miscService: MiscService
  ) {}

  ngOnInit() {
    this.userInfo = UtilsHelper.getLoginUser();
    this.exter_doc_email = this.errorData.external_doc_portal_email;
    this.route.queryParams.subscribe((params) => {
      this.matterId = params.matterId;
      this.getMatterDetails();
      this.createVendorForm();
      this.getDoNotContactReasons();
      this.pageTitle.setTitle('Edit Corporate Contacts');
    });
  }

  get v() {
    return this.vendorForm.controls;
  }

/**
 * route to matter dashboard
 */
  onMatterNameClick(){
    this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: this.matterId } });
  }
  createVendorForm(): void {
    this.vendorForm = this.builder.group({
      id: [0],
      personId: [],
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
      generalCounsel: [false],
      status: ['Active'],
      doNotContact: [false],
      doNotContactReason: [],
      changeNotes: []
    });

    this.roleForm = this.builder.group({
      isPrimary: [null],
      isBilling: [null],
      generalCounsel: [null]
    });

    this.missingInfoForm = this.builder.group({
      email: [null, Validators.pattern(REGEX_DATA.Email)],
      primaryPhoneNumber: [null, Validators.required]
    });

    this.clientService.v1ClientGetClientUniqueNumberGet({tenantId: this.userInfo.tenantId}).subscribe((data: any) => {
      this.uniqueNumber = JSON.parse(data).results.uniqueNumber;
    });
  }

  public getDoNotContactReasons() {
    this.miscService.v1MiscDoNotContactReasonCodesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.doNotContactReasonArr = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  editVendorClick(contact, DOM): void {
    this.createType = 'create';
    this.editDetails.isEdit = true;
    this.editDetails.contact = contact;
    this.vendorForm.patchValue({
      id: contact.id,
      personId: contact.personId,
      uniqueNumber: +contact.uniqueNumber,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      jobTitle: contact.jobTitle,
      primaryPhoneNumber: contact.primaryPhone,
      cellPhoneNumber: contact.cellPhoneNumber,
      isPrimary: contact.isPrimary,
      isBilling: contact.isBilling,
      generalCounsel: contact.generalCounsel,
      status: contact.status
    });
    this.disablePrimaryandBilling();
    this.openPersonalinfo(DOM, 'lg', 'modal-lmd', false);
  }


  private getMatterDetails() {
    this.corporateContactLoading = true;
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
        this.matterDetails = res;
        this.getCorporateContact();
      }, () => {
        this.corporateContactLoading = false;
      });
  }

  onSelect(event): void {
    this.selectedExistedContactList = [];
    this.selectedExistedContactList.push(event);
  }

  openPersonalinfo(
    content: any,
    className,
    winClass,
    setEditDetails: boolean = true,
    isNewCorporate?: boolean,
    contactType?: string
  ) {
    if (setEditDetails) {
      this.editDetails.isEdit = false;
      this.editDetails.contact = null;
    }
    if (isNewCorporate) {
      this.vendorForm.reset();
      this.uniqueNumber = this.uniqueNumber + 1;
      this.updateVendorForm();
      this.vendorForm.controls.id.setValue(0);
      this.vendorForm.controls[contactType].setValue(true);
      this.roleForm.reset();
      this.roleForm.controls[contactType].setValue(true);
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

  updateVendorForm(): void {
    this.vendorForm.patchValue({
      status: 'Active',
      uniqueNumber: +this.uniqueNumber
    });
  }

  getDisableStatus(type, caseType: any, email?: any) {
    if (this.corporateContactList.length) {
      let row: any;
      if (type === 'primary') {
        row = this.corporateContactList.filter(obj => obj.isPrimary);
      }
      if (type === 'billing') {
        row = this.corporateContactList.filter(obj => obj.isBilling);
      }
      if (caseType === 'add' && row.length) {
        return true;
      }
      if (caseType === 'edit' && row.length && email && email !== row[0].email) {
        return true;
      }
    }
    return false;
  }


  disablePrimaryandBilling(type?: any) {
    const email = this.vendorForm.value.email;
    const isPrimaryExist =
      type === 'add'
        ? this.getDisableStatus('primary', type)
        : this.getDisableStatus('primary', 'edit', email);
    const isBillingExist =
      type === 'add'
        ? this.getDisableStatus('billing', type)
        : this.getDisableStatus('billing', 'edit', email);
    if (isBillingExist) {
      this.vendorForm.controls.isBilling.disable();
      this.roleForm.controls.isBilling.disable();
    } else {
      this.vendorForm.controls.isBilling.enable();
      this.roleForm.controls.isBilling.enable();
    }
    if (isPrimaryExist) {
      this.vendorForm.controls.isPrimary.disable();
      this.roleForm.controls.isPrimary.disable();
    } else {
      this.vendorForm.controls.isPrimary.enable();
      this.roleForm.controls.isPrimary.enable();
    }
  }


  private getDismissReason(reason: any): string {
    this.vendorFormSubmitted = false;
    this.missingInfoFormSubmitted = false;
    this.missingInfoForm.reset();
    this.createType = 'create';
    this.vendorForm.reset();
    this.uniqueNumber = this.uniqueNumber - 1;
    this.updateVendorForm();
    this.vendorForm.controls.id.setValue(0);
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public getCorporateContact() {
    this.corporateContactList = [];
    this.clientAssociationService
      .v1ClientAssociationClientIdGet({clientId: this.matterDetails.clientName.id})
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          this.corporateContactLoading = false;
          for (let i = 0; i < list.length; i++) {
            list[i].originalPrimary = list[i].isPrimary;
            list[i].originalBilling = list[i].isBilling;
            list[i].originalGeneralCounsel = list[i].generalCounsel;
            if (i === 0) {
              this.corporateContactList.push(list[i]);
            } else {
              const contact = this.corporateContactList.filter(
                (obj: { personId: any }) => obj.personId === list[i].personId
              );
              if (contact.length !== 0) {
                if (list[i].isPrimary) {
                  contact[0].isPrimary = true;
                }
                if (list[i].isBilling) {
                  contact[0].isBilling = true;
                }
                if (list[i].generalCounsel) {
                  contact[0].generalCounsel = true;
                }
              } else {
                this.corporateContactList.push(list[i]);
              }
            }
          }
          this.corporateContactList = [...this.corporateContactList];
          this.setLists();
        },
        err => {
          this.corporateContactLoading = false;
          console.log(err);
        }
      );
  }

  setLists() {
    this.primaryContactList = [];
    this.billingContactList = [];
    this.generalContactList = [];
    this.corporateContactList.forEach((corporateContact) => {
      if (corporateContact.isPrimary && !corporateContact.isDelete) {
        this.primaryContactList.push(corporateContact);
      }
      if (corporateContact.isBilling && !corporateContact.isDelete) {
        this.billingContactList.push(corporateContact);
      }
      if (corporateContact.generalCounsel && !corporateContact.isDelete) {
        this.generalContactList.push(corporateContact);
      }
    });
  }

  deleteContact(contact, type) {
    this.dialogService
      .confirm(
        'Are you sure you want to remove this Corporate Contact from this matter?',
        'Delete',
        'Cancel',
        'Delete Corporate Contact'
      )
      .then(res => {
        if (res) {
          if (type === 'isPrimary') {
            let index = -1;
            this.primaryContactList.forEach((primaryContact, idx) => {
              if (primaryContact.uniqueNumber === contact.uniqueNumber) {
                index = idx;
              }
            });
            if (index > -1) {
              this.primaryContactList.splice(index, 1);
            }
          }
          if (type === 'isBilling') {
            let index = -1;
            this.billingContactList.forEach((billingContact, idx) => {
              if (billingContact.uniqueNumber === contact.uniqueNumber) {
                index = idx;
              }
            });
            if (index > -1) {
              this.billingContactList.splice(index, 1);
            }
          }
          if (type === 'generalCounsel') {
            let index = -1;
            this.generalContactList.forEach((generalContact, idx) => {
              if (generalContact.uniqueNumber === contact.uniqueNumber) {
                index = idx;
              }
            });
            if (index > -1) {
              this.generalContactList.splice(index, 1);
            }
          }
          this.corporateContactList.forEach((corporateContact) => {
            if (corporateContact.uniqueNumber === contact.uniqueNumber) {
              corporateContact[type] = false;
              corporateContact.isDelete = !corporateContact.isPrimary && !corporateContact.isBilling && !corporateContact.generalCounsel;
            }
          });
        }
      });
  }

  isCorporateFormValid(): boolean {
    if (this.createType === 'existing') {
      const data = this.roleForm.getRawValue();
      return !!(data && (data.isBilling || data.generalCounsel || data.isPrimary));
    }
    if (this.createType === 'create') {
      const data = this.vendorForm.value;
      return !!(data &&
        this.vendorForm.valid &&
        (data.isBilling || data.generalCounsel || data.isPrimary));
    }
  }


  public saveCorporateContact(missingInfoDOM) {
    if (this.createType === 'create' && this.emailExistenceForCorporateContact) {
      return;
    }
    this.vendorFormSubmitted = true;
    if (this.isCorporateFormValid()) {
      this.modalRef.close();
      this.vendorFormSubmitted = false;
      if (!this.editDetails.isEdit) {
        if (this.createType === 'create') {
          const data = {...this.vendorForm.value};
          this.vendorForm.reset();
          this.updateVendorForm();
          this.vendorForm.controls.id.setValue(0);
          const contactDetails = UtilsHelper.getObject('contactDetails');
          if (contactDetails && contactDetails.createDetails) {
            data.isNew = true;
          }
          this.corporateContactList.push(data);
        } else {
          if (this.selectedExistedContactList.length) {
            const exitedData = this.selectedExistedContactList[0];
            this.selectedExistedContactList[0].status = 'Active';
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
        const updatedData = this.vendorForm.value;
        let index = -1;
        this.corporateContactList.forEach((corporateContact, idx) => {
          if (corporateContact.uniqueNumber === updatedData.uniqueNumber) {
            index = idx;
          }
        });
        if (index > -1) {
          this.corporateContactList.splice(index, 1);
          this.corporateContactList.push(updatedData);
        }
      }
      this.setLists();
      this.localEmailExist = false;
      this.roleForm.reset();
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

  saveMissingInfo(): void {
    this.missingInfoFormSubmitted = true;
    if (this.missingInfoForm.valid && !this.emailExistence) {
      this.missingInfoFormSubmitted = false;
      const data = this.selectedExistedContactList[0];
      data.email = this.missingInfoForm.value.email;
      data.primaryPhoneNumber = this.missingInfoForm.value.primaryPhoneNumber;
      this.corporateContactList.push(data);
      this.setLists();
      this.modalService.dismissAll();
    }
  }

  navigateToCorporateContact() {
    this.router.navigate(['/matter/dashboard'], {queryParams: {selectedtab: 'corporateContact', matterId: this.matterId}});
  }

  runConflictCheck() {
    if (!this.primaryContactList.length || !this.billingContactList.length) {
      this.toastrService.showError('You must specify a Primary Contact and a Billing Contact.');
    } else {
      const conflictCheckObject: any = {};
      conflictCheckObject.clientId = this.matterDetails.clientName.id;
      conflictCheckObject.matterId = this.matterDetails.id;
      conflictCheckObject.clientCompanyName = this.matterDetails.clientName.company;
      conflictCheckObject.corporatecontacts = [];
      conflictCheckObject.isCompany = true;
      this.corporateContactList.forEach(corporateContact => {
        if (!corporateContact.isDelete) {
          conflictCheckObject.corporatecontacts.push({
            firstName: corporateContact.firstName,
            email: corporateContact.email,
            lastName: corporateContact.lastName,
            companyName: corporateContact.client || corporateContact.companyName,
            primaryPhoneNumber: corporateContact.primaryPhoneNumber,
            isCompany: false,
            id: corporateContact.personId ? corporateContact.personId : 0,
            isNew: corporateContact.isNew || corporateContact.id === 0
          });
        }
      });
      this.corporateContactLoading = true;
      this.contactService.v1ContactsCorporateContactConflictCheckPost$Json({body: conflictCheckObject})
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {})
        )
        .subscribe(conflictCheckResult => {
          if (conflictCheckResult && conflictCheckResult.conflictPersons) {
            this.conflictPerons = conflictCheckResult.conflictPersons;
            this.blockedPersons = conflictCheckResult.blockedPersons;
          } else {
            this.conflictPerons = [];
            this.blockedPersons = [];
          }
          this.corporateContactLoading = true;
          this.openConflictCheckDialog();
        }, () => {
          this.corporateContactLoading = true;
        });
    }
  }

  private openConflictCheckDialog() {
    const modal = this.modalService.open(ConflictCheckDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    const component = modal.componentInstance;

    component.conflicts = this.conflictPerons;
    component.type = 'Corporate Contact';
    component.hasConflicts = this.conflictPerons.length > 0;
    component.blockedUsers = this.blockedPersons;

    component.header = this.errorData.normal_conflict;
    component.message = this.errorData.changes_potential_conflict;
    component.returnButtonText = 'Return to Corporate Contacts';

    modal.result.then(res => {
      if (res === 'save') {
        this.saveData();
      }
    });
  }

  saveData() {
    const corporateContactData = this.corporateContactList.map(corporateContact => Object.assign({}, corporateContact));
    this.corporateContactLoading = true;
    corporateContactData.forEach((corporateContact) => {
      corporateContact.id = corporateContact.personId ? corporateContact.personId : 0;
      corporateContact.status = corporateContact.status === 'Active';
      corporateContact.isVisible = corporateContact.status;
      corporateContact.isGeneralCounsel = corporateContact.generalCounsel;
      corporateContact.isNew = corporateContact.isNew || corporateContact.id === 0;
      corporateContact.isDelete = corporateContact.isDelete ? corporateContact.isDelete : false;
      if (corporateContact.isDelete) {
       corporateContact.isPrimary = corporateContact.originalPrimary;
       corporateContact.isBilling = corporateContact.originalBilling;
       corporateContact.isGeneralCounsel = corporateContact.originalGeneralCounsel;
      }
      corporateContact.primaryPhoneNumber = corporateContact.primaryPhone ? corporateContact.primaryPhone : corporateContact.primaryPhoneNumber;
      delete corporateContact.personId;
      delete corporateContact.generalCounsel;

    });
    const corporateContactsObject = {
      clientId: this.matterDetails.clientName.id,
      corporatecontacts: corporateContactData
    };
    this.contactService.v1ContactsUpdateCorporateContactsOfClientPost$Json({body: corporateContactsObject})
      .subscribe(() => {
        this.toastrService.showSuccess('Corporate contacts updated.');
        this.corporateContactLoading = false;
        this.navigateToCorporateContact();
      }, () => {
        this.corporateContactLoading = false;
      });
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
        this.emailExistenceForCorporateContact = this.corporateContactList.some((corporateContact) => {
          return corporateContact.email === email && this.editDetails.contact.uniqueNumber !== corporateContact.uniqueNumber;
        });
        if (this.emailExistenceForCorporateContact) {
          return;
        } else {
          if (this.vendorForm.controls.email.valid) {
            const id = this.editDetails.contact ? this.editDetails.contact.id : 0;
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
}
