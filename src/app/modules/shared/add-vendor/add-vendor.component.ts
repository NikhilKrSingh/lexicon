import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AssociationVendorError } from 'src/app/modules/models/fillable-form.model';
import * as errorData from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { ClientAssociationService, MatterService, PersonService } from 'src/common/swagger-providers/services';
import { IOffice, VMIuserDetails } from '../../models';
import { REGEX_DATA } from '../const';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-add-vendor',
  templateUrl: './add-vendor.component.html',
  styleUrls: ['./add-vendor.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddVendorComponent implements OnInit, OnDestroy {
  @Output() readonly closeModel = new EventEmitter<{ type: string, data: VMIuserDetails }>();
  @Output() readonly added = new EventEmitter();

  @Input() mode = 'create';
  @Input() associateFlag: string;
  @Input() matterId: number;
  @Input() uniqueNumber: any;
  @Input() associateVendor: IOffice;
  @Input() vendorDetails: any;
  @Input() type: string;
  @Input() addToDb = true;
  @Input() clientId: any;
  @Input() pageType: string;

  public callFlag = true;
  public error_data: any = (errorData as any).default;
  public selectOppPartType = 'create';

  public vendorForm: FormGroup;
  public selectedAssociation: any;
  public primaryPhoneBlur = false;
  public formSubmitted = false;
  associationVendorError: AssociationVendorError;

  loading = false;

  constructor(
    private builder: FormBuilder,
    private personService: PersonService,
    private toastDisplay: ToastDisplay,
    private matterService: MatterService,
    private renderer: Renderer2,
    private clientAssociationService: ClientAssociationService
  ) {
    this.renderer.addClass(document.body, 'modal-open');
    this.associationVendorError = new AssociationVendorError();
  }

  ngOnInit() {
    if (this.vendorDetails) {
      this.vendorForm = this.builder.group({
        uniqueNumber: [+this.vendorDetails.uniqueNumber],
        FirstName: [this.vendorDetails.firstName, [Validators.required, PreventInject]],
        LastName: [this.vendorDetails.lastName, [Validators.required, PreventInject]],
        Email: [
          this.vendorDetails.email,
          [Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]
        ],
        isVisible: this.vendorDetails.isActive,
        isActive: this.vendorDetails.isActive,
        CompanyName: [this.vendorDetails.companyName, [PreventInject]],
        PrimaryPhone: (this.vendorDetails.primaryPhone && this.vendorDetails.primaryPhone.name) ?
          this.vendorDetails.primaryPhone.name : (this.vendorDetails.primaryPhone) ? this.vendorDetails.primaryPhone : ''
      });
    } else {
      this.vendorForm = this.builder.group({
        uniqueNumber: [+this.uniqueNumber],
        FirstName: ['', [Validators.required, PreventInject]],
        LastName: ['', [Validators.required, PreventInject]],
        Email: ['', [Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
        CompanyName: ['', [PreventInject]],
        PrimaryPhone: ''
      });
    }
  }


  public close() {
    this.closeModel.emit({ type: 'close', data: null });
  }

  get f() {
    return this.vendorForm.controls;
  }

  public save() {
    this.formSubmitted = true;
    let data = { ...this.vendorForm.value };

    if (!data.FirstName) {
      this.associationVendorError.firstName = true;
      this.associationVendorError.firstNameMessage = this.error_data.first_name_error
    } else if (data.FirstName && this.vendorForm.controls.FirstName.invalid) {
      this.associationVendorError.firstName = true;
      this.associationVendorError.firstNameMessage = this.error_data.insecure_input
    } else {
      this.associationVendorError.firstName = false;
    }

    if (!data.LastName) {
      this.associationVendorError.lastName = true;
      this.associationVendorError.lastNameMessage = this.error_data.last_name_error
    } else if (data.LastName && this.vendorForm.controls.LastName.invalid) {
      this.associationVendorError.lastName = true;
      this.associationVendorError.lastNameMessage = this.error_data.insecure_input
    } else {
      this.associationVendorError.lastName = false;
    }

    if (!data.Email || (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.required) || (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.pattern)) {
      this.associationVendorError.email = true;
      this.associationVendorError.emailMessage = this.error_data.email_error
    } else if (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.PreventInject === undefined) {
      this.associationVendorError.email = true;
      this.associationVendorError.emailMessage = this.error_data.insecure_input
    } else {
      this.associationVendorError.email = false;
    }

    if (data.CompanyName && this.vendorForm.controls.CompanyName.invalid) {
      this.associationVendorError.companyName = true;
      this.associationVendorError.companyNameMessage = this.error_data.insecure_input
    } else {
      this.associationVendorError.companyName = false;
    }

    if (this.associationVendorError.hasError()) {
      return;
    }

    if (!this.addToDb) {
      const formData = { ...this.vendorForm.value };
      if (this.mode == 'create') {
        formData.role = this.type;
        formData.userName = UtilsHelper.getAssociationUsername(formData);
        formData.password = 'password';
        formData.JobTitle = this.type;
        formData.isVisible = true;
      }
      const data = {
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
        id: this.vendorDetails && this.vendorDetails.personId ? this.vendorDetails.personId :
          this.vendorDetails && this.vendorDetails.id ? this.vendorDetails.id : null,
        indexNumber: (this.mode == 'create') ? null : this.vendorDetails.indexNumber
      };
      this.closeModel.emit({ type: (this.mode == 'create') ? 'add' : 'edit', data, });
    } else {
      if (this.mode == 'create') {
        this.create();
      } else {
        this.edit();
      }
    }
  }

  private create() {
    const data = { ...this.vendorForm.value };

    data.role = this.type;
    data.userName = UtilsHelper.getAssociationUsername(data);
    data.password = 'password';
    data.JobTitle = this.type;
    data.isVisible = true;

    this.loading = true;

    this.personService.v1PersonPost$Json$Response({ body: data }).subscribe(
      response => {
        const res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.loading = false;
          this.toastDisplay.showError(this.error_data.email_exist);
        }

        if (this.associateFlag === 'add') {
          this.savedExistingAssociations(res.results);
        } else {
          this.loading = false;
        }
      },
      err => {
        this.loading = false;
      }
    );
  }

  private edit() {
    const data = { ...this.vendorForm.value };
    data.Id = this.vendorDetails.personId ? this.vendorDetails.personId : this.vendorDetails.id ? this.vendorDetails.id : null;

    if (this.callFlag) {
      this.callFlag = false;
      this.loading = true;

      this.personService.v1PersonPut$Json$Response({ body: data })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        response => {
          const res = JSON.parse(response.body as any);
          this.callFlag = true;
          if (res.results === 0) {
            this.toastDisplay.showError(this.error_data.email_exist);
          } else {
            if (this.type == 'Subsidiary') {
              this.toastDisplay.showSuccess(this.error_data.update_subsidiary);
            } else {
              this.toastDisplay.showSuccess(this.error_data.update_vendor);
            }
            this.closeModel.emit({ type: 'add', data });
          }
        },
        err => {
          this.callFlag = true;
        }
      );
    }
  }

  /****
   * saved existing Associations v1/Matter/association
   */
  savedExistingAssociations(personId: any, mode?: string) {
    if (!this.addToDb) {
      this.closeModel.emit({ type: 'add', data: this.selectedAssociation });
      this.loading = false;
      return;
    }

    const data: any = {
      associationTypeId: this.associateVendor.id,
      matterId: Number(this.matterId),
      personId
    };

    this.callFlag = false;
    let url: any;

    this.loading = true;

    if (this.pageType == "potentialclient") {
      data.clientId = +this.clientId;
      url = this.clientAssociationService.v1ClientAssociationPost$Json$Response({ body: data });
    } else {
      data.matterId = +this.matterId;
      url = this.matterService.v1MatterAssociationPost$Json$Response({ body: data });
    }

    url.subscribe(
      response => {
        this.callFlag = true;
        this.showSuccess(mode);
        this.closeModel.emit({ type: 'add', data });
        this.added.emit(data);
        this.loading = false;
      },
      err => {
        this.callFlag = true;
        this.loading = false;
      }
    );
  }

  onAssociationSelect(row: any) {
    this.selectedAssociation = row;
  }

  associate() {
    if (this.selectedAssociation) {
      this.savedExistingAssociations(this.selectedAssociation.id, 'associate');
    } else {
      this.toastDisplay.showError(this.error_data.select_an_association);
    }
  }

  private showSuccess(mode: string) {
    if (this.type == 'Subsidiary') {
      if (mode === 'edit') {
        this.toastDisplay.showSuccess(this.error_data.update_subsidiary);
      } else if (mode === 'associate') {
        this.toastDisplay.showSuccess(this.error_data.associate_subsidiary);
      } else {
        this.toastDisplay.showSuccess(this.error_data.add_subsidiary);
      }
    } else {
      if (mode === 'edit') {
        this.toastDisplay.showSuccess(this.error_data.update_vendor);
      } else if (mode === 'associate') {
        this.toastDisplay.showSuccess(this.error_data.associate_vendor);
      } else {
        this.toastDisplay.showSuccess(this.error_data.add_vendor);
      }
    }
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
