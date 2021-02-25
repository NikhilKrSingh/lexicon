import { Component, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AssociationVendorError, CreateNoteError } from 'src/app/modules/models/fillable-form.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { ClientService, ContactsService, NoteService, PersonService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import * as Constant from '../../shared/const';
import { REGEX_DATA } from '../../shared/const.js';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-create-client-association',
  templateUrl: './create-client-association.component.html',
  styleUrls: ['./create-client-association.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateClientAssociationComponent implements OnInit, IBackButtonGuard, OnDestroy {
  public errorData: any = (errorData as any).default;
  public vendorForm: FormGroup;
  public opposingPartyForm: FormGroup;
  public clientId: number;
  public isEditMode = false;
  public isViewMode = false;
  public statusId = new FormControl('', [Validators.required]);
  public clientAssociationtype = 'Vendor';
  public opposingPartyType = '';
  public noteForm: FormGroup;
  public showThis = false;
  public noteEditMode = false;
  public noteList: Array<any> = [];
  public clientDetail: any;
  public changeStatusNotes = '';
  public primaryPhoneBlur = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public displayAddNotes = false;
  public loading: boolean;
  public contactLoading: boolean;
  public detailsLoading: boolean;
  public notesLoading: boolean;
  public changeNotesLoading: boolean;
  public associatedContacts: any = [];
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  noteFormSubmitted = false;
  public uniqueNumber: any;
  userInfo: any;
  createNoteError: CreateNoteError;
  associationVendorError: AssociationVendorError;
  public changeNotesError = false;
  public notesError = false;
  closeResult: string;
  notePresent = false;

  public ColumnMode = ColumnMode;
  public page = new Page();
  public messages = {emptyMessage: Constant.SharedConstant.NoDataFound};
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, {static: false}) notesTable: DatatableComponent;
  originalNotes: any = [];
  searchForm: FormGroup;
  authorList: any;
  formSubmitted: boolean = false;
  callFlag: boolean = false;
  
  constructor(
    private builder: FormBuilder,
    private personService: PersonService,
    private toastDisplay: ToastDisplay,
    private route: ActivatedRoute,
    private clientService: ClientService,
    private contactsService: ContactsService,
    private noteService: NoteService,
    private router: Router,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title,
    private modalService: NgbModal
  ) {
    this.route.queryParams.subscribe(params => {
      this.isEditMode = params.isEditMode == 1;
      this.isViewMode = params.isViewMode == 1;
      this.clientId = +params.clientId;
      this.clientAssociationtype = params.associationType;
    });
    this.permissionList$ = this.store.select('permissions');
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart)) {
        this.navigateAwayPressed = true;
      }
    });
    this.createNoteError = new CreateNoteError();
    this.associationVendorError = new AssociationVendorError();
  }

  ngOnInit() {
    if(!this.clientAssociationtype){
      this.clientAssociationtype = 'Vendor';
    }
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (!this.isViewMode && !this.isEditMode) {
            this.pagetitle.setTitle('New Matter Association');
            this.displayAddNotes = true;
          } else if (this.isViewMode) {
            this.pagetitle.setTitle('View Matter Association');
            this.displayAddNotes = false;
          } else if (
            this.isEditMode &&
            (this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit ||
              this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin)
          ) {
            this.pagetitle.setTitle('Edit Matter Association');
            this.displayAddNotes = true;
          }
        }
      }
    });
    this.userInfo = JSON.parse(localStorage.getItem('profile'));
    this.vendorForm = this.builder.group({
      uniqueNumber: [],
      FirstName: ['', [Validators.required, PreventInject]],
      LastName: ['', [Validators.required, PreventInject]],
      Email: ['', [Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
      CompanyName: ['', [PreventInject]],
      PrimaryPhone: ''
    });

    this.opposingPartyForm = this.builder.group({
      uniqueNumber: [],
      FirstName: ['', [PreventInject]],
      LastName: ['', [PreventInject]],
      Email: ['', [Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
      CompanyName: ['', [PreventInject]],
      PrimaryPhone: ''
    });

    this.noteForm = this.builder.group({
      id: new FormControl(null),
      applicableDate: new FormControl(null, [Validators.required]),
      content: new FormControl('', [Validators.required, PreventInject]),
      isVisibleToClient: new FormControl(false),
      index: new FormControl(null)
    });

    this.searchForm = this.builder.group({
      author: new FormControl(null),
      createdStartDate: new FormControl(null),
      createdEndDate: new FormControl(null),
      isVisibleToClient: new FormControl(null),
    });

    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });

    if (this.clientId) {
      this.getClientDetail();
      this.getnotes();
    } else {
      this.getUniqueNumber();
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  getUniqueNumber() {
    this.clientService
      .v1ClientGetClientUniqueNumberGet({tenantId: this.userInfo.tenantId})
      .subscribe((data: any) => {
        this.uniqueNumber = JSON.parse(data).results.uniqueNumber;
        this.vendorForm.patchValue({uniqueNumber: +this.uniqueNumber});
        this.opposingPartyForm.patchValue({uniqueNumber: +this.uniqueNumber});
      });
  }

  /*** function to get client detail */
  getClientDetail() {
    this.contactLoading = true;
    this.detailsLoading = true;
    this.changeNotesLoading = true;
    this.clientService
      .v1ClientClientIdGet({
        clientId: this.clientId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
        })
      )
      .subscribe((res: any) => {
        this.clientDetail = res;
        this.clientAssociationtype = this.clientAssociationtype || this.clientDetail.groups[0].name;
        const primaryPhone = this.clientDetail.phones.filter(
          (obj: { isPrimary: any }) => obj.isPrimary
        );
        this.vendorForm.patchValue({
          FirstName: this.clientDetail.firstName
            ? this.clientDetail.firstName
            : '',
          LastName: this.clientDetail.lastName
            ? this.clientDetail.lastName
            : '',
          Email: this.clientDetail.email ? this.clientDetail.email : '',
          CompanyName: this.clientDetail.companyName
            ? this.clientDetail.companyName
            : '',
          PrimaryPhone: primaryPhone.length !== 0 ? primaryPhone[0].number : '',
          uniqueNumber: +this.clientDetail.uniqueNumber
        });
        this.opposingPartyForm.patchValue({
          FirstName: this.clientDetail.firstName
            ? this.clientDetail.firstName
            : '',
          LastName: this.clientDetail.lastName
            ? this.clientDetail.lastName
            : '',
          Email: this.clientDetail.email ? this.clientDetail.email : '',
          CompanyName: this.clientDetail.companyName
            ? this.clientDetail.companyName
            : '',
          PrimaryPhone: primaryPhone.length !== 0 ? primaryPhone[0].number : '',
          uniqueNumber: +this.clientDetail.uniqueNumber
        });
        this.changeStatusNotes = this.clientDetail.changeStatusNotes;
        this.opposingPartyType = this.clientDetail.companyName
          ? 'Corporate'
          : 'Individual';
        this.detailsLoading = false;
        this.contactLoading = false;
        this.changeNotesLoading = false;
      }, () => {
        this.contactLoading = false;
        this.detailsLoading = false;

      });
    this.contactsService.v1ContactsAssociatedContactsAndClientsGet({personId: this.clientId}).subscribe((data: any) => {
      this.associatedContacts = JSON.parse(data).results.persons;
    });
  }

  /*** function to get notes  */
  getnotes() {
    this.notesLoading = true;
    this.noteService
      .v1NotePersonListPersonIdGet({personId: this.clientId})
      .subscribe(
        suc => {
          const res: any = suc;
          this.noteList = JSON.parse(res).results;
          this.originalNotes = JSON.parse(res).results;
          this.notesLoading = false;
          this.getAuthorList();
          this.noteList = [...this.noteList];
          if (this.originalNotes.length) {
            this.notePresent = true;
          }
        },
        err => {
          console.log(err);
          this.notesLoading = false;
        }
      );
  }
  changeFirstName(){
    if (this.formSubmitted) {
      if (this.clientAssociationtype != 'Opposing Party') {
        if (! this.vendorForm.controls.FirstName.value) {
          this.associationVendorError.firstName = true;
          this.associationVendorError.firstNameMessage = this.errorData.first_name_error;
        } else if (this.vendorForm.controls.FirstName.value && this.vendorForm.controls.FirstName.invalid) {
          this.associationVendorError.firstName = true;
          this.associationVendorError.firstNameMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.firstName = false;
        }
      }
      if (this.clientAssociationtype == 'Opposing Party') {
        if (this.opposingPartyType !== 'Corporate') {
          if (!this.opposingPartyForm.controls.FirstName.value) {
            this.associationVendorError.firstName = true;
            this.associationVendorError.firstNameMessage = this.errorData.first_name_error;
          } else if (this.opposingPartyForm.controls.FirstName.value && this.opposingPartyForm.controls.FirstName.invalid) {
            this.associationVendorError.firstName = true;
            this.associationVendorError.firstNameMessage = this.errorData.insecure_input;
          } else {
            this.associationVendorError.firstName = false;
          }
        }
      }
    }
  }
  changeLastName() {
    if (this.formSubmitted) {
      if (this.clientAssociationtype != 'Opposing Party') {
        if (!this.vendorForm.controls.LastName.value) {
          this.associationVendorError.lastName = true;
          this.associationVendorError.lastNameMessage = this.errorData.last_name_error;
        } else if (this.vendorForm.controls.LastName.value && this.vendorForm.controls.LastName.invalid) {
          this.associationVendorError.lastName = true;
          this.associationVendorError.lastNameMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.lastName = false;
        }
      }
      if (this.clientAssociationtype == 'Opposing Party') {
        if (this.opposingPartyType !== 'Corporate') {
          if (!this.opposingPartyForm.controls.LastName.value) {
            this.associationVendorError.lastName = true;
            this.associationVendorError.lastNameMessage = this.errorData.last_name_error;
          } else if (this.opposingPartyForm.controls.LastName.value && this.opposingPartyForm.controls.LastName.invalid) {
            this.associationVendorError.lastName = true;
            this.associationVendorError.lastNameMessage = this.errorData.insecure_input;
          } else {
            this.associationVendorError.lastName = false;
          }
        }
      }
    }
  }

  changeCompanyName() {
    if (this.formSubmitted) {
      if (this.clientAssociationtype != 'Opposing Party') {
        if (this.vendorForm.controls.CompanyName.value && this.vendorForm.controls.CompanyName.invalid) {
          this.associationVendorError.companyName = true;
          this.associationVendorError.companyNameMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.companyName = false;
        }
      }
      if (this.clientAssociationtype == 'Opposing Party') {
        if (this.opposingPartyType == 'Corporate') {
          if (!this.opposingPartyForm.controls.CompanyName.value) {
            this.associationVendorError.companyName = true;
            this.associationVendorError.companyNameMessage = this.errorData.company_name_error;
          } else if (this.opposingPartyForm.controls.CompanyName.value && this.opposingPartyForm.controls.CompanyName.invalid) {
            this.associationVendorError.companyName = true;
            this.associationVendorError.companyNameMessage = this.errorData.insecure_input;
          } else {
            this.associationVendorError.companyName = false;
          }
        }
      }
    }
  }

  changeEmail(){
    if (this.formSubmitted) {
      if (this.clientAssociationtype != 'Opposing Party') {
        if ((this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.required) || (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.pattern)) {
          this.associationVendorError.email = true;
          this.associationVendorError.emailMessage = this.errorData.email_error;
        } else if (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.PreventInject === undefined) {
          this.associationVendorError.email = true;
          this.associationVendorError.emailMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.email = false;
        }
      }
      if (this.clientAssociationtype == 'Opposing Party') {
        if ((this.opposingPartyForm.controls.Email.errors && this.opposingPartyForm.controls.Email.errors.required)) {
        } else if ((this.opposingPartyForm.controls.Email.errors && this.opposingPartyForm.controls.Email.errors.pattern)) {
          this.associationVendorError.email = true;
          this.associationVendorError.emailMessage = this.errorData.email_not_valid;
        } else if (this.opposingPartyForm.controls.Email.errors && this.opposingPartyForm.controls.Email.errors.PreventInject === undefined) {
          this.associationVendorError.email = true;
          this.associationVendorError.emailMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.email = false;
        }
      }
    }
  }
  public checkAndSave(first = null) {
    this.formSubmitted = true;
    this.loading = true;
    this.callFlag = true;
    let data: any;
    if (this.clientAssociationtype != 'Opposing Party') {
      data = {...this.vendorForm.value};
      if (!data.FirstName) {
        this.associationVendorError.firstName = true;
        this.associationVendorError.firstNameMessage = this.errorData.first_name_error;
      } else if (data.FirstName && this.vendorForm.controls.FirstName.invalid) {
        this.associationVendorError.firstName = true;
        this.associationVendorError.firstNameMessage = this.errorData.insecure_input;
      } else {
        this.associationVendorError.firstName = false;
      }

      if (!data.LastName) {
        this.associationVendorError.lastName = true;
        this.associationVendorError.lastNameMessage = this.errorData.last_name_error;
      } else if (data.LastName && this.vendorForm.controls.LastName.invalid) {
        this.associationVendorError.lastName = true;
        this.associationVendorError.lastNameMessage = this.errorData.insecure_input;
      } else {
        this.associationVendorError.lastName = false;
      }

      if (data.CompanyName && this.vendorForm.controls.CompanyName.invalid) {
        this.associationVendorError.companyName = true;
        this.associationVendorError.companyNameMessage = this.errorData.insecure_input;
      } else {
        this.associationVendorError.companyName = false;
      }

      if ((this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.required) || (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.pattern)) {
        this.associationVendorError.email = true;
        this.associationVendorError.emailMessage = this.errorData.email_error;
      } else if (this.vendorForm.controls.Email.errors && this.vendorForm.controls.Email.errors.PreventInject === undefined) {
        this.associationVendorError.email = true;
        this.associationVendorError.emailMessage = this.errorData.insecure_input;
      } else {
        this.associationVendorError.email = false;
      }

      if (this.associationVendorError.hasError()) {
        this.loading = false;
        this.callFlag = false;
        return;
      }
    }

    if (this.clientAssociationtype == 'Opposing Party') {
      data = {...this.opposingPartyForm.value};

        if ((this.opposingPartyForm.controls.Email.errors && this.opposingPartyForm.controls.Email.errors.required)) {
        } else if ((this.opposingPartyForm.controls.Email.errors && this.opposingPartyForm.controls.Email.errors.pattern)) {
          this.associationVendorError.email = true;
          this.associationVendorError.emailMessage = this.errorData.email_not_valid;
        } else if (this.opposingPartyForm.controls.Email.errors && this.opposingPartyForm.controls.Email.errors.PreventInject === undefined) {
          this.associationVendorError.email = true;
          this.associationVendorError.emailMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.email = false;
        }

      if (this.opposingPartyType == 'Corporate') {
        if (!data.CompanyName) {
          this.associationVendorError.companyName = true;
          this.associationVendorError.companyNameMessage = this.errorData.company_name_error;
        } else if (data.CompanyName && this.opposingPartyForm.controls.CompanyName.invalid) {
          this.associationVendorError.companyName = true;
          this.associationVendorError.companyNameMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.companyName = false;
        }
      } else {
        if (!data.FirstName) {
          this.associationVendorError.firstName = true;
          this.associationVendorError.firstNameMessage = this.errorData.first_name_error;
        } else if (data.FirstName && this.opposingPartyForm.controls.FirstName.invalid) {
          this.associationVendorError.firstName = true;
          this.associationVendorError.firstNameMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.firstName = false;
        }

        if (!data.LastName) {
          this.associationVendorError.lastName = true;
          this.associationVendorError.lastNameMessage = this.errorData.last_name_error;
        } else if (data.LastName && this.opposingPartyForm.controls.LastName.invalid) {
          this.associationVendorError.lastName = true;
          this.associationVendorError.lastNameMessage = this.errorData.insecure_input;
        } else {
          this.associationVendorError.lastName = false;
        }
      }
    }
    let firstChar: string;
    if (this.changeStatusNotes) {
      firstChar = this.changeStatusNotes.charAt(0);
    }
    const pattern = '[a-zA-Z0-9_]';
    if (this.changeStatusNotes && !firstChar.match(pattern)) {
      this.changeNotesError = true;
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.errorData.insecure_input;
    } else {
      this.changeNotesError = false;
      this.createNoteError.note = false;
    }
    if (this.associationVendorError.hasError() || this.createNoteError.hasError()) {
      // window.scrollTo(0, 0);
      this.loading = false;
      this.callFlag = false;
      return;
    }


    if (this.isEditMode) {
      this.edit();
    } else {
      this.create();
    }
  }

  public create() {
    this.dataEntered = false;
    const formData = this.getFormData();
    this.personService.v1PersonPost$Json$Response({body: formData}).subscribe(
      response => {
        const res = JSON.parse(response.body as any);
        this.clientId = res.results;

        if (res.results === 0) {
          this.loading = false;
          this.callFlag = false;
          this.toastDisplay.showError(this.errorData.server_error);
        } else {
          this.toastDisplay.showSuccess(
            this.errorData.client_association_added
          );
          if (this.noteList.length > 0) {
            for (let i = 0; i <= this.noteList.length - 1; i++) {
              this.noteList[i]['name'] = 'potential contact note';
              this.saveNotes(true, this.noteList[i],false);
            }
          } else {
            this.router.navigate(['/contact/client-associations']);
          }
        }
        this.loading = false;
        this.callFlag = false;
        this.opposingPartyForm.reset();
        this.vendorForm.reset();
      },
      () => {
        this.callFlag = false;
        this.loading = false;
      }
    );
  }

  public edit() {
    this.dataEntered = false;
    const formData = this.getFormData();
    formData.id = this.clientId;
    formData.changeStatusNotes = this.changeStatusNotes;

    this.personService.v1PersonPut$Json$Response({body: formData}).subscribe(
      response => {
        const res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.loading = false;
          this.callFlag = false;
          this.toastDisplay.showError(this.errorData.server_error);
        } else {
          this.toastDisplay.showSuccess(
            this.errorData.client_association_updated
          );
          if (this.noteList.length > 0) {
            for (let i = 0; i <= this.noteList.length - 1; i++) {
              this.noteList[i]['name'] = 'potential contact note';
              this.saveNotes(true, this.noteList[i],false);
            }
          } else {
            this.router.navigate(['/contact/client-associations']);
          }
        }
        this.loading = false;
        this.callFlag = false;
      },
      () => {
        this.loading = false;
        this.callFlag = false;
      }
    );
  }

  /*** common function to get form data */
  getFormData() {
    const data: any =
      this.clientAssociationtype === 'Opposing Party'
        ? {...this.opposingPartyForm.value}
        : {...this.vendorForm.value};
    data.role = this.clientAssociationtype;
    data.userName = data.Email;
    data.password = 'password';
    data.JobTitle = this.clientAssociationtype;
    data.isVisible = true;

    if (this.clientAssociationtype === 'Opposing Party') {
      data.IsCompany = this.opposingPartyType !== 'Individual';
    }
    return data;
  }

  onChange() {
    this.dataEntered = true;
    if (this.associationVendorError.hasError()) {
      this.associationVendorError.firstName = false;
      this.associationVendorError.lastName = false;
      this.associationVendorError.email = false;
      this.associationVendorError.companyName = false;
    }
    this.opposingPartyForm.reset();
    const FirstName = this.opposingPartyForm.get('FirstName');
    const LastName = this.opposingPartyForm.get('LastName');
    const CompanyName = this.opposingPartyForm.get('CompanyName');
    const Email = this.opposingPartyForm.get('Email');
    if (this.opposingPartyType === 'Individual') {
      FirstName.setValidators([Validators.required, PreventInject]);
      LastName.setValidators([Validators.required, PreventInject]);
      Email.setValidators([Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]),

      CompanyName.setValidators([]);
      CompanyName.updateValueAndValidity();
    } else {
      CompanyName.setValidators([Validators.required, PreventInject]);
      Email.setValidators([Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]),
      FirstName.setValidators([]);
      FirstName.updateValueAndValidity();
      LastName.setValidators([]);
      LastName.updateValueAndValidity();
      CompanyName.updateValueAndValidity();
    }
    this.opposingPartyForm.patchValue({uniqueNumber: +this.uniqueNumber});
    console.log(this.opposingPartyForm);
  }

  saveNotes(redirect?: boolean, noteData = null, form = true) {
    this.noteFormSubmitted = true;
    if (!this.noteForm.valid && form) {
      return;
    }
    this.callFlag = true;
    this.noteForm.value.isVisibleToClient = !this.noteForm.value.isVisibleToClient ? false : this.noteForm.value.isVisibleToClient;
    const data = noteData ? noteData : {...this.noteForm.value};
    data.name = 'potential contact note';
    if (this.clientId) {
      if (!data.id) {
        data.id = 0;
        this.noteService
          .v1NotePersonAddPersonIdPost$Json({
            personId: this.clientId,
            body: data
          })
          .subscribe(
            () => {
              if (redirect) {
                this.router.navigate(['/contact/client-associations']);
              } else {
                this.noteFormSubmitted = false;
                this.modalService.dismissAll();
                this.noteForm.reset();
                this.noteForm.patchValue({isVisibleToClient: false});
                this.getnotes();
              }
              this.callFlag = false;
            },
            () => {
              this.noteFormSubmitted = false;
              this.callFlag = false;
            }
          );
      } else {
        this.noteService
          .v1NotePersonUpdatePersonIdPut$Json({
            personId: this.clientId,
            body: data
          })
          .subscribe(
            () => {
              if (redirect) {
                this.router.navigate(['/contact/client-associations']);
              } else {
                this.noteFormSubmitted = false;
                this.modalService.dismissAll();
                this.noteForm.reset();
                this.noteForm.patchValue({isVisibleToClient: false});
                this.getnotes();
              }
              this.callFlag = false;
            },
            err => {
              this.callFlag = false;
              this.noteFormSubmitted = false;
            }
          );
      }
    } else {
      this.callFlag = false;
      const loginUser = JSON.parse(localStorage.getItem('profile'));
      this.noteList.push({
        content: this.noteForm.value.content,
        createdBy: {
          name: loginUser.lastName + ', ' + loginUser.firstName,
          email: loginUser.email
        },
        applicableDate: this.noteForm.value.applicableDate,
        lastUpdated: new Date(),
        isVisibleToClient: this.noteForm.value.isVisibleToClient
      });
      this.noteFormSubmitted = false;
      this.noteList = [...this.noteList];
      this.originalNotes = [...this.noteList];
      if (this.notesTable) {
        this.notesTable.offset = 0;
      }
      if (this.noteList.length) {
        this.notePresent = true;
      }
      this.noteForm.reset();
      this.noteForm.patchValue({isVisibleToClient: false});
      this.getAuthorList();
      this.modalService.dismissAll();
    }
  }

  /** function to delete notes */
  public async deleteNote(event, id, index = null) {
    if (event && event.target) {
      event.target.closest('datatable-body-cell').blur();
    }
    const resp: any = await this.dialogService.confirm(
      this.errorData.delete_note_confirm,
      'Delete',
      'Cancel',
      'Delete Note'
    );
    if (resp && id) {
      this.noteService
        .v1NotePersonRemovePersonIdNoteIdDelete({
          personId: this.clientId,
          noteId: id
        })
        .subscribe(
          () => {
            this.toastDisplay.showSuccess(
              this.errorData.delete_note_success
            );
            this.getnotes();
          },
          err => {
            console.log(err);
          }
        );
    }
    if (resp && index >= 0) {
      this.noteList.splice(index, 1);
      this.noteList = [...this.noteList];
      this.originalNotes = [...this.noteList];
      this.getAuthorList();
    }
  }

  /**** function to update notes */
  public editNote(event, obj, index = null, modalContent) {
    if (event && event.target) {
      event.target.closest('datatable-body-cell').blur();
    }
    this.noteForm.setValue({
      id: obj.id ? obj.id : '',
      applicableDate: obj.applicableDate,
      content: obj.content,
      isVisibleToClient: !obj.isVisibleToClient ? false : obj.isVisibleToClient,
      index
    });
    this.noteEditMode = true;
    this.openModal(modalContent, 'lg', 'lg');
  }

  public UpdateNotes() {
    this.noteFormSubmitted = true;
    if (!this.noteForm.valid) {
      return;
    }
    const index = this.noteForm.value.index;
    this.noteList[index].content = this.noteForm.value.content;
    this.noteList[index].applicableDate = this.noteForm.value.applicableDate;
    this.noteList[index].lastUpdated = new Date();
    this.noteList[index].isVisibleToClient = this.noteForm.value.isVisibleToClient;
    this.noteEditMode = false;
    this.showThis = false;
    this.noteList = [...this.noteList];
    this.originalNotes = [...this.noteList];
    this.noteFormSubmitted = false;
    this.modalService.dismissAll();
    this.noteForm.reset();
    this.noteForm.patchValue({isVisibleToClient: false});
    this.getAuthorList();
  }

  onBlurMethod(val: any, type: string) {
    type === 'PrimaryPhone' ? (this.primaryPhoneBlur = this.isBlur(val)) : '';
  }

  private isBlur(val: string | any[]) {
    return val.length === 10 ? false : val.length !== 0;
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  cancel() {
    this.router.navigate(['/contact/client-associations']);
  }

  changeContactType() {
    this.formSubmitted = false;
    this.dataEntered = true;
  }

  openModal(content, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(result => {
      this.closeResult = `Closed with: ${result}`;
    }, reason => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  getDismissReason(reason) {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public searchFilter($event) {
    const val = $event.target.value;
    // update the rows
    this.noteList = this.originalNotes.filter(
      item =>
        UtilsHelper.matchName(item.createdBy, val, 'name') ||
        UtilsHelper.matchName(item, val, 'content')
    );
    // Whenever the filter changes, always go back to the first page
    this.notesTable.offset = 0;
  }

  getAuthorList() {
    this.authorList = this.noteList
      .filter(a => a.createdBy)
      .map(a => {
        return a.createdBy;
      });

    this.authorList = _.uniqBy(this.authorList, (a: any) => a.id);
  }

  applyFilter() {
    const data = {
      ...this.searchForm.value
    };

    let rows = [...this.originalNotes];

    if (data.isVisibleToClient) {
      rows = rows.filter(a => {
        if (data.isVisibleToClient == 1) {
          return a.isVisibleToClient;
        } else {
          return !a.isVisibleToClient;
        }
      });
    }

    if (data.author) {
      rows = rows.filter(a => {
        if (a.createdBy) {
          return a.createdBy.id == data.author;
        } else {
          return false;
        }
      });
    }

    if (data.createdStartDate) {
      rows = rows.filter(a => {
        const date = moment(data.createdStartDate).format('YYYY-MM-DD');
        const lastUpdate = moment(a.lastUpdated).format('YYYY-MM-DD');
        return date <= lastUpdate;
      });
    }

    if (data.createdEndDate) {
      rows = rows.filter(a => {
        const date = moment(data.createdEndDate).format('YYYY-MM-DD');
        const applicableDate = moment(a.lastUpdated).format('YYYY-MM-DD');
        return date >= applicableDate;
      });
    }

    // update the rows
    this.noteList = rows;
    // Whenever the filter changes, always go back to the first page
    this.notesTable.offset = 0;
  }

  cancelNote() {
    this.noteFormSubmitted = false;
    this.modalService.dismissAll();
    this.noteForm.reset();
    this.noteForm.patchValue({isVisibleToClient: false});
  }
  trackByFn(index: number,obj: any) {
    // obj ? obj['uniqueNumber'] || obj :
    return index ;
  }
}
