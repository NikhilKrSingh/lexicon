import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice, VMIuserDetails } from 'src/app/modules/models';
import { AssociationVendorError } from 'src/app/modules/models/fillable-form.model';
import * as errorData from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { MatterService, PersonService } from 'src/common/swagger-providers/services';
import { REGEX_DATA } from '../const';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-add-opposing-party',
  templateUrl: './add-opposing-party.component.html',
  styleUrls: ['./add-opposing-party.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddOpposingPartyComponent implements OnInit, OnDestroy {
  @Output() readonly closeModel = new EventEmitter<{ type: string, data: VMIuserDetails }>();
  @Output() readonly added = new EventEmitter();

  @Input() mode = 'create';
  @Input() association: any;
  @Input() associateFlag: string;
  @Input() uniqueNumber: any;
  @Input() matterId: number;
  @Input() associateOpposingParty: IOffice;
  @Input() addToDb = true;
  @Input() opposingPartyList: any[] = [];

  public errorData: any = (errorData as any).default;
  public selectOppPartType = 'create';
  public opposingType = 'individual';

  public individualForm: FormGroup;
  public corporateForm: FormGroup;
  public selectedAssociation: any;
  public primaryPhoneBlur = false;
  public individualFormSubmitted = false;
  public corporateFormSubmitted = false;

  associationVendorError: AssociationVendorError;
  loading = false;

  constructor(
    private builder: FormBuilder,
    private personService: PersonService,
    private matterService: MatterService,
    private toastDisplay: ToastDisplay,
    private renderer: Renderer2
  ) {
    this.individualForm = this.builder.group({
      uniqueNumber: [],
      FirstName: ['', [Validators.required, PreventInject]],
      LastName: ['', [Validators.required, PreventInject]],
      Email: ['', [Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
      PrimaryPhone: ''
    });

    this.corporateForm = this.builder.group({
      uniqueNumber: [],
      CompanyName: ['', [Validators.required, PreventInject]],
      Email: ['', [Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
      PrimaryPhone: ''
    });
    this.renderer.addClass(document.body, 'modal-open');
    this.associationVendorError = new AssociationVendorError();
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.association) {
      if (this.association.isCompany) {
        this.opposingType = 'corporate';
        this.corporateForm.patchValue({
          uniqueNumber: (+this.association.uniqueNumber === 0) ? +this.association.id : +this.association.uniqueNumber,
          CompanyName: this.association.companyName,
          Email: this.association.email,
          PrimaryPhone: (this.association.primaryPhone && this.association.primaryPhone.name) ? this.association.primaryPhone.name : (this.association.primaryPhone) ? this.association.primaryPhone : null
        });
      } else {
        this.individualForm.patchValue({
          uniqueNumber: (+this.association.uniqueNumber === 0) ? +this.association.id : +this.association.uniqueNumber,
          FirstName: this.association.firstName,
          LastName: this.association.lastName,
          Email: this.association.email,
          PrimaryPhone: (this.association.primaryPhone && this.association.primaryPhone.name) ? this.association.primaryPhone.name : (this.association.primaryPhone) ? this.association.primaryPhone : null
        });
      }
    } else {
      this.corporateForm.patchValue({
        uniqueNumber: +this.uniqueNumber
      });
      this.individualForm.patchValue({
        uniqueNumber: +this.uniqueNumber
      });
    }
  }

  get f() {
    return this.individualForm.controls;
  }
  get cf() {
    return this.corporateForm.controls;
  }

  public close() {
    this.closeModel.emit({ type: 'close', data: null });
  }

  public save() {
    let data: any;
    if (this.opposingType === 'individual') {
      this.individualFormSubmitted = true;
      this.corporateFormSubmitted = false;
      data = { ...this.individualForm.value };
      if (!data.FirstName) {
        this.associationVendorError.firstName = true;
        this.associationVendorError.firstNameMessage = this.errorData.first_name_error
      } else if (data.FirstName && this.individualForm.controls.FirstName.invalid) {
        this.associationVendorError.firstName = true;
        this.associationVendorError.firstNameMessage = this.errorData.insecure_input
      } else {
        this.associationVendorError.firstName = false;
      }

      if (!data.LastName) {
        this.associationVendorError.lastName = true;
        this.associationVendorError.lastNameMessage = this.errorData.last_name_error
      } else if (data.LastName && this.individualForm.controls.LastName.invalid) {
        this.associationVendorError.lastName = true;
        this.associationVendorError.lastNameMessage = this.errorData.insecure_input
      } else {
        this.associationVendorError.lastName = false;
      }

      if ((this.individualForm.controls.Email.errors && this.individualForm.controls.Email.errors.required) || (this.individualForm.controls.Email.errors && this.individualForm.controls.Email.errors.pattern)) {
        this.associationVendorError.email = true;
        this.associationVendorError.emailMessage = this.errorData.email_error
      } else if (this.individualForm.controls.Email.errors && this.individualForm.controls.Email.errors.PreventInject === undefined) {
        this.associationVendorError.email = true;
        this.associationVendorError.emailMessage = this.errorData.insecure_input
      } else {
        this.associationVendorError.email = false;
      }
    } else {
      this.individualFormSubmitted = false;
      this.corporateFormSubmitted = true;
      data = { ...this.corporateForm.value };
      if (!data.CompanyName) {
        this.associationVendorError.companyName = true;
        this.associationVendorError.companyNameMessage = this.errorData.company_name_error
      } else if (data.CompanyName && this.corporateForm.controls.CompanyName.invalid) {
        this.associationVendorError.companyName = true;
        this.associationVendorError.companyNameMessage = this.errorData.insecure_input
      } else {
        this.associationVendorError.companyName = false;
      }

      if ((this.corporateForm.controls.Email.errors && this.corporateForm.controls.Email.errors.required) || (this.corporateForm.controls.Email.errors && this.corporateForm.controls.Email.errors.pattern)) {
        this.associationVendorError.email = true;
        this.associationVendorError.emailMessage = this.errorData.email_error
      } else if (this.corporateForm.controls.Email.errors && this.corporateForm.controls.Email.errors.PreventInject === undefined) {
        this.associationVendorError.email = true;
        this.associationVendorError.emailMessage = this.errorData.insecure_input
      } else {
        this.associationVendorError.email = false;
      }
    }

    if (this.associationVendorError.hasError()) {
      return;
    }

    if (!this.addToDb) {
      const data1 = this.getFormData();
      this.sendData(data1);
    } else {
      if (this.mode === 'create') {
        this.create();
      } else {
        this.edit();
      }
    }
  }

  private sendData(data1) {
    const data = {
      uniqueNumber: +data1.uniqueNumber,
      jobTitle: data1.JobTitle,
      firstName: data1.FirstName,
      lastName: data1.LastName,
      companyName: data1.CompanyName,
      email: data1.Email,
      primaryPhone: data1.PrimaryPhone,
      isVisible: true,
      isCompany: data1.IsCompany,
      password: data1.password,
      userName: data1.userName,
      role: data1.role,
      id: (this.association) ? this.association.id : null,
      indexNumber: (this.mode === 'create') ? null : this.association.indexNumber,
      isOpposingPartyRepresentThemselves: (this.mode === 'create') ? false : this.association.isOpposingPartyRepresentThemselves,
    };
    this.closeModel.emit({ type: (this.mode === 'create') ? 'add' : 'edit', data, });
  }

  private create() {
    const data: any = this.getFormData();
    this.loading = true;

    this.personService.v1PersonPost$Json$Response({ body: data }).subscribe(
      response => {
        const res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
          this.loading = false;
        }
        if (this.associateFlag === 'add') {
          this.savedExistingAssociations(res.results, null);
        } else {
          this.loading = false;
        }
      }, err => {
        this.loading = false;
      }
    );
  }

  /***
   * function to return form data
   *
   */
  getFormData() {
    let data: any;
    if (this.selectOppPartType === 'create') {
      if (this.opposingType === 'individual') {
        data = { ...this.individualForm.value };
        data.IsCompany = false;
      } else {
        data = { ...this.corporateForm.value };
        data.IsCompany = true;
      }
      data.role = 'Opposing Party';
      data.userName = UtilsHelper.getAssociationUsername(data);
      data.password = 'password';
      data.JobTitle = 'Opposing Party';
      data.isVisible = true;
    } else {
      data = this.selectedAssociation;
      data.IsCompany = this.opposingType !== 'individual';
    }

    if (data.PrimaryPhone && data.PrimaryPhone != '') { data.PrimaryPhone = data.PrimaryPhone.replace(/[- )(]/g, ''); }
    return data;
  }


  private edit() {
    const data: any = this.getFormData();
    data.Id = this.association.id;

    this.loading = true;

    this.personService.v1PersonPut$Json$Response({ body: data }).subscribe(
      response => {
        const res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
          this.loading = false;
        } else {
          this.toastDisplay.showSuccess(this.errorData.update_opposingparty);
          this.closeModel.emit({ type: 'add', data });
          this.loading = false;
        }
      }, err => {
        this.loading = false;
      }
    );
  }

  onAssociationSelect(row: any) {
    this.selectedAssociation = row;
  }

  /****
   * saved existing Associations v1/Matter/association
  */
  savedExistingAssociations(personId: any, item) {
    if (!this.addToDb) {
      this.closeModel.emit({ type: 'add', data: item });
      this.loading = false;
      return;
    }

    const data: any = {
      associationTypeId: this.associateOpposingParty.id,
      matterId: Number(this.matterId),
      personId
    };

    this.loading = true;

    this.matterService.v1MatterAssociationPost$Json$Response({ body: data }).subscribe(
      response => {
        this.toastDisplay.showSuccess(this.errorData.add_opposingparty);
        this.closeModel.emit({ type: 'add', data });
        this.added.emit(data);
        this.loading = false;
      }, err => {
        this.loading = false;
      }
    );
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'modal-open');
  }

  onBlurMethod(val: any, type: string) {
    type === 'PrimaryPhone' ? this.primaryPhoneBlur = this.isBlur(val) : '';

  }

  private isBlur(val: string | any[]) {
    return (val && val.length === 10) ? false : (val.length === 0) ? false : true;
  }


}
