import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AssociationVendorError } from 'src/app/modules/models/fillable-form.model';
import * as errorData from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { MatterService, PersonService } from 'src/common/swagger-providers/services';
import { IOffice, VMIuserDetails, vwMatterResponse } from '../../models';
import { REGEX_DATA } from '../const';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-add-expert-witnesses',
  templateUrl: './add-expert-witnesses.component.html',
  styleUrls: ['./add-expert-witnesses.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddExpertWitnessesComponent implements OnInit, OnDestroy {
  @Output() readonly closeModel = new EventEmitter<{ type: string, data: VMIuserDetails }>();
  @Output() readonly added = new EventEmitter();

  @Input() mode: string = 'create';
  @Input() association: any;
  @Input() matterId: number;
  @Input() uniqueNumber: number;
  @Input() associateExpertWitness: IOffice;
  @Input() addToDb: boolean = true;
  @Input() matterList: Array<vwMatterResponse>;

  public callFlag: boolean = true;
  public errorData: any = (errorData as any).default;
  public createType: string = 'create';

  public addExpertWitness: FormGroup;
  public selectedAssociation: any;
  public primaryPhoneBlur: boolean = false;
  public formSubmitted: boolean = false;
  associationVendorError: AssociationVendorError;

  loading = false;

  constructor(
    private builder: FormBuilder,
    private personService: PersonService,
    private toastDisplay: ToastDisplay,
    private matterService: MatterService,
    private renderer: Renderer2
  ) {
    this.addExpertWitness = this.builder.group({
      uniqueNumber: [],
      FirstName: ['', [Validators.required, PreventInject]],
      LastName: ['', [Validators.required, PreventInject]],
      Email: ['', [Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
      PrimaryPhone: '',
      CompanyName: ['', PreventInject]
    });
    this.renderer.addClass(document.body, 'modal-open');
    this.associationVendorError = new AssociationVendorError();
  }

  get f() {
    return this.addExpertWitness.controls;
  }
  ngOnInit() {
    if (this.mode == 'edit' && this.association) {
      this.addExpertWitness.patchValue({
        uniqueNumber: (+this.association.uniqueNumber === 0) ? +this.association.id : +this.association.uniqueNumber,
        FirstName: this.association.firstName,
        LastName: this.association.lastName,
        Email: this.association.email,
        PrimaryPhone: (this.association.primaryPhone && this.association.primaryPhone.name) ? this.association.primaryPhone.name : (this.association.primaryPhone) ? this.association.primaryPhone : null,
        CompanyName: this.association.companyName
      });
    } else {
      this.addExpertWitness.patchValue({
        uniqueNumber: +this.uniqueNumber
      });
    }
  }

  public close() {
    this.closeModel.emit({ type: 'close', data: null });
  }

  public save() {
    this.formSubmitted = true;
    let data = { ...this.addExpertWitness.value };

    if (!data.FirstName) {
      this.associationVendorError.firstName = true;
      this.associationVendorError.firstNameMessage = this.errorData.first_name_error
    } else if (data.FirstName && this.addExpertWitness.controls.FirstName.invalid) {
      this.associationVendorError.firstName = true;
      this.associationVendorError.firstNameMessage = this.errorData.insecure_input
    } else {
      this.associationVendorError.firstName = false;
    }

    if (!data.LastName) {
      this.associationVendorError.lastName = true;
      this.associationVendorError.lastNameMessage = this.errorData.last_name_error
    } else if (data.LastName && this.addExpertWitness.controls.LastName.invalid) {
      this.associationVendorError.lastName = true;
      this.associationVendorError.lastNameMessage = this.errorData.insecure_input
    } else {
      this.associationVendorError.lastName = false;
    }

    if (!data.Email || (this.addExpertWitness.controls.Email.errors && this.addExpertWitness.controls.Email.errors.required) || (this.addExpertWitness.controls.Email.errors && this.addExpertWitness.controls.Email.errors.pattern)) {
      this.associationVendorError.email = true;
      this.associationVendorError.emailMessage = this.errorData.email_error
    } else if (this.addExpertWitness.controls.Email.errors && this.addExpertWitness.controls.Email.errors.PreventInject === undefined) {
      this.associationVendorError.email = true;
      this.associationVendorError.emailMessage = this.errorData.insecure_input
    } else {
      this.associationVendorError.email = false;
    }

    if (data.CompanyName && this.addExpertWitness.controls.CompanyName.invalid) {
      this.associationVendorError.companyName = true;
      this.associationVendorError.companyNameMessage = this.errorData.insecure_input
    } else {
      this.associationVendorError.companyName = false;
    }

    if (this.associationVendorError.hasError()) {
      return;
    }

    if (this.addExpertWitness.valid) {
      if (!this.addToDb) {
        let formData = this.getFormData();
        let body = { email: formData.Email };
        if (this.association) {
          body['id'] = this.association.id;
        }
        let data = {
          uniqueNumber: +formData.uniqueNumber,
          jobTitle: formData.JobTitle,
          firstName: formData.FirstName,
          lastName: formData.LastName,
          companyName: formData.CompanyName,
          email: formData.Email,
          primaryPhone: formData.PrimaryPhone,
          isVisible: true,
          isCompany: formData.IsCompany,
          password: formData.password,
          userName: formData.userName,
          role: formData.role,
          id: (this.association) ? this.association.id : null,
          indexNumber: (this.mode == 'create') ? null : this.association.indexNumber
        };
        this.closeModel.emit({ type: (this.mode == 'create') ? 'add' : 'edit', data, });
      } else {
        if (this.matterList && !this.matterId) {
          this.toastDisplay.showError('Please select Matter');
        } else {
          if (this.mode == 'create') {
            this.create();
          } else {
            this.edit();
          }
        }
      }
    }
  }

  private create() {
    let data: any = this.getFormData();

    this.loading = true;
    this.personService.v1PersonPost$Json$Response({ body: data }).subscribe(
      response => {
        let res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
          this.loading = false;
        } else {
          this.savedExistingAssociations(res.results, null);
        }
      },
      err => {
        this.loading = false;
      }
    );
  }

  private edit() {
    let data: any = this.getFormData();
    data.Id = this.association.id;

    this.loading = true;

    this.personService.v1PersonPut$Json$Response({ body: data }).subscribe(
      response => {
        let res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
          this.loading = false;
        } else {
          this.toastDisplay.showSuccess(this.errorData.update_expert_witnesses);
          this.closeModel.emit({ type: 'add', data });
          this.loading = false;
        }
      }, err => {
        this.loading = false;
      }
    )
  }

  onAssociationSelect(row: any) {
    this.selectedAssociation = row;
  }

  /***
   * function to return form data
   *
   */
  getFormData() {
    let data: any;

    if (this.createType == 'create') {
      data = { ...this.addExpertWitness.value };
      data.role = 'Expert Witness';
      data.username = UtilsHelper.getAssociationUsername(data);
      data.password = 'password';
      data.JobTitle = 'Expert Witness';
      data.IsCompany = false;
      data.isVisible = true;
    } else {
      data = this.selectedAssociation;
    }
    if (data.PrimaryPhone && data.PrimaryPhone != '') { data.PrimaryPhone = data.PrimaryPhone.replace(/[- )(]/g, '') }

    return data;
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
      associationTypeId: this.associateExpertWitness.id,
      matterId: Number(this.matterId),
      personId
    };

    this.callFlag = false;
    this.loading = true;

    this.matterService.v1MatterAssociationPost$Json$Response({ body: data }).subscribe(
      response => {
        this.toastDisplay.showSuccess(this.errorData.add_expert_witnesses);
        this.closeModel.emit({ type: 'add', data });
        this.added.emit(data);
        this.loading = false;
      }, err => {
        this.loading = false;
      }
    );
  }
  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57 || k == 8 || k == 9);
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
