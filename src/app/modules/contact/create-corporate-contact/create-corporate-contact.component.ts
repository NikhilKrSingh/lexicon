import { Component, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import * as _ from "lodash";
import * as moment from "moment";
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import {
  ClientAssociationService,
  ClientService,
  MiscService,
  NoteService,
  PersonService
} from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import { REGEX_DATA } from '../../shared/const';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';
import { AddCompanyComponent } from './add-company/add-company.component';

@Component({
  selector: 'app-create-corporate-contact',
  templateUrl: './create-corporate-contact.component.html',
  styleUrls: ['./create-corporate-contact.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateCorporateContactComponent implements OnInit, OnDestroy, IBackButtonGuard {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  public errorData: any = (errorData as any).default;
  public callFlag = false;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public companyList: Array<any> = [];
  public popupcompanyList: Array<any> = [];
  public contactType: Array<any> = [];
  public filterName = 'Apply Filter';
  public searchStringPopup: any = '';
  public vendorForm: FormGroup;
  public showThis = false;
  public applicableDate = new FormControl(null, [Validators.required]);
  public content = new FormControl('', [Validators.required, PreventInject]);
  public noteForm: FormGroup = this.builder.group({
    id: new FormControl(0),
    applicableDate: this.applicableDate,
    content: this.content,
    isVisibleToClient: new FormControl(false)
  });
  public noteList: Array<any> = [];
  public contactId = 0;
  public clientDetail: any;
  private modalRef: NgbModalRef;
  private tempCompanyArr: Array<any> = [];
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public searchText = new FormControl();
  public isViewOnly = true;
  public primaryPhoneBlur = false;
  public cellPhoneBlur = false;
  public editIndex: number;
  public isEdit = false;
  public notesLoading = false;
  public companyLoading: boolean;
  public detailsLoading: boolean;
  public loading: boolean;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  private clientSearchSubscribe: Subscription;
  public formSubmitted = false;
  public noteFormSubmitted = false;
  emailExistence: boolean;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected = [];
  public pangeSelected = 1;
  public messages = {emptyMessage: Constant.SharedConstant.NoDataFound};
  public counter = Array;

  @ViewChild(DatatableComponent, {static: false}) notesTable: DatatableComponent;
  @ViewChild(DatatableComponent, {static: false}) tableAddCompany: DatatableComponent;
  originalNotes: any = [];
  searchForm: FormGroup;
  authorList: any;

  public addSelectedCompanyList: any[] = [];
  public addCompanypage = new Page();
  public pageSelectorAddComapany = new FormControl('10');
  public pageSelected = 1;
  public selectedCompanyIds: any[];
  public origPopupcompanyList: Array<any> = [];
  public currentActive: number;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private personService: PersonService,
    private clientService: ClientService,
    private misc: MiscService,
    private builder: FormBuilder,
    private toastDisplay: ToastDisplay,
    private noteService: NoteService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private clientAssociationService: ClientAssociationService,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.addCompanypage.pageNumber = 0;
    this.addCompanypage.size = 10;
    this.route.queryParams.subscribe(params => {
      const state = params.state;
      if (params.contactId) {
        this.contactId = params.contactId;
      }
      this.isViewOnly = state === 'view';
    });
    this.permissionList$ = this.store.select('permissions');
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart)) {
        this.navigateAwayPressed = true;
      }
    });
  }

  get vendorControls() {
    return this.vendorForm.controls;
  }

  ngOnInit() {
    this.pagetitle.setTitle('New Corporate Contact');
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.contactId) {
            if (this.isViewOnly) {
              this.pagetitle.setTitle('View Corporate Contact');
              if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisNoVisibility) {
                this.gotoAccessDeniedPage();
              }
            } else {
              this.pagetitle.setTitle('Edit Corporate Contact');
              if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisNoVisibility || this.permissionList.CLIENT_CONTACT_MANAGEMENTisViewOnly) {
                this.gotoAccessDeniedPage();
              }
            }
          } else {
            if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisNoVisibility || this.permissionList.CLIENT_CONTACT_MANAGEMENTisViewOnly) {
              this.gotoAccessDeniedPage();
            }
          }
        }
      }
    });
    this.vendorForm = this.builder.group({
      uniqueNumber: [],
      firstName: ['', [Validators.required, PreventInject]],
      lastName: ['', [Validators.required, PreventInject]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email), PreventInject]],
      companyName: '',
      jobTitle: ['', [PreventInject]],
      primaryPhone: '',
      cellPhone: ''
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


    const userInfo = UtilsHelper.getLoginUser();
    this.clientService.v1ClientGetClientUniqueNumberGet({tenantId: userInfo.tenantId}).subscribe((data: any) => {
      const uniqueNumber = JSON.parse(data).results.uniqueNumber;
      this.vendorForm.patchValue({uniqueNumber});
    });

    if (this.contactId !== 0) {
      this.getClientDetail();
      this.getnotes(this.contactId);
    }

    this.getContactType();
    this.initSearchText();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
    if (this.clientSearchSubscribe) {
      this.clientSearchSubscribe.unsubscribe();
    }
  }

  /**
   * function to redirect to access deined page
   */
  gotoAccessDeniedPage(): void {
    this.toastDisplay.showPermissionError();
  }

  public getClientDetail() {
    this.detailsLoading = true;
    this.companyLoading = true;
    this.clientService
      .v1ClientClientIdGet({clientId: this.contactId})
      .subscribe(
        suc => {
          const res: any = suc;
          this.clientDetail = JSON.parse(res).results;

          const primaryPhone = this.clientDetail.phones.filter(
            (obj: { isPrimary: any }) => obj.isPrimary
          );

          const cellPhone = this.clientDetail.phones.filter(
            (obj: { isPrimary: any }) => !obj.isPrimary
          );

          if (this.clientDetail != null) {
            this.vendorForm.setValue({
              uniqueNumber: +this.clientDetail.uniqueNumber,
              firstName: this.clientDetail.firstName,
              lastName: this.clientDetail.lastName,
              email: this.clientDetail.email,
              companyName: this.clientDetail.companyName,
              jobTitle: this.clientDetail.jobTitle,
              primaryPhone:
                primaryPhone.length !== 0 ? primaryPhone[0].number : '',
              cellPhone: cellPhone.length !== 0 ? cellPhone[0].number : ''
            });
            this.getCompany(this.contactId);
          } else {
            this.companyLoading = false;
          }
          this.detailsLoading = false;
        },
        err => {
          console.log(err);
          this.detailsLoading = false;
          this.companyLoading = false;
        }
      );
  }

  public getCompany(contactID: any) {
    if (contactID && contactID > 0) {
      this.companyLoading = true;
      this.clientService
        .v1ClientSearchClientsByAssociationPersonIdGet({personId: contactID})
        .pipe(
          finalize(() => {
          })
        )
        .subscribe(
          suc => {
            const res: any = suc;
            this.companyList = JSON.parse(res).results;
            // this.tempCompanyArr = JSON.parse(JSON.stringify(this.companyList));
            this.companyList.forEach(obj => {
              if(obj.associations && obj.associations.length) {
                _.sortBy(obj.associations);
                obj.contactType = obj.associations.map(x => x.name).join(', ');
              }
            });
            this.companyLoading = false;
            this.getTotalPages();
          },
          err => {
            console.log(err);
            this.companyLoading = false;
          }
        );
    }
  }

  async checkEmailExistence() {
    this.emailExistence = false;
    const email = this.vendorForm.value.email;
    if (email && email.trim() != '') {
      if (this.vendorForm.controls.email.valid) {
        this.misc.v1MiscEmailCheckGet({
          email,
          id: this.clientDetail && this.clientDetail.id ? +this.clientDetail.id : 0
        })
          .subscribe((result: any) => {
            this.emailExistence = JSON.parse(result).results;
          });
      }
    }
  }

  public getContactType() {
    this.misc.v1MiscCorporatecontactassociationsGet({}).subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        for (let i = 0; i < list.length; i++) {
          const element = list[i];
          const item = {
            id: element.id,
            name: element.name,
            checked: false
          };
          this.contactType.push(item);
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  private initSearchText() {
    this.searchText.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(1000))
      .subscribe((text: string) => {
        if (text && text.trim() !== '') {
          this.filterCompany(text, 'create');
        } else {
          this.companyList = [];
        }
      });
  }

  openPersonalinfo(content: any, className, winClass) {
    this.searchStringPopup = '';
    this.selectedCompanyIds = this.companyList.map( x => x.id);
    this.filterCompany(this.searchStringPopup, 'update');
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      windowClass: winClass,
      backdrop: 'static'
    });
    this.popupcompanyList = [];

    this.modalRef.result.then(result => {
      this.closeResult = `Closed with: ${result}`;
    });
  }

  public selectDropdwnOffice(event: any, item, index: number, type: string): void {
    console.log('Event ==>', event);
    console.log('item ==>', item);
    if (type === 'create') {
      if (event.length > 0) {
        this.companyList[index].title = event.length;
      } else {
        this.companyList[index].title = 'All';
      }
    } else {
      if (event.length > 0) {
        this.popupcompanyList[index].title = event.length;
        item.title = event.length;
        item.seletedIds = event;
      } else {
        this.popupcompanyList[index].title = 'All';
      }
    }
    // this.tempCompanyArr[index] = item;
  }

  public save() {
    this.formSubmitted = true;
    if (this.emailExistence || this.vendorForm.invalid || (this.noteForm.invalid && this.showThis)) {
      return;
    }
    this.loading = true;
    this.callFlag = true;
    this.dataEntered = false;
    const data: any = {...this.vendorForm.value};

    data.uniqueNumber = data.uniqueNumber ? +data.uniqueNumber : 0;
    if (this.contactId === 0) {
      const listRole = this.companyList
        .filter((obj: { isSelectd: any }) => obj.isSelectd)
        .map(({contactType}) => contactType);

      const roles = this.getUnique(listRole);
      data.role = roles.join(',');
      data.userName = data.email;
      data.password = 'password';
      data.isVisible = true;

      this.personService.v1PersonPost$Json$Response({body: data}).subscribe(
        response => {
          const res = JSON.parse(response.body as any);

          this.contactId = res.results;
          if (res.results === 0) {
            this.loading = false;
            this.callFlag = false;
            this.toastDisplay.showError(this.errorData.server_error);
          } else {
            this.saveCompanyList(this.companyList, res.results);
            this.toastDisplay.showSuccess(
              'Corporate contact added.'
            );
            if (this.noteList.length > 0) {
              for (let i = 0; i <= this.noteList.length - 1; i++) {
                this.noteList[i].name = 'corporate contact note';
                this.saveNotes(true, this.noteList[i]);
              }
            } else {
              this.vendorForm.reset();
              this.searchText.setValue('');
              this.loading = false;
              this.callFlag = false;
              this.dataEntered = false;
              this.router.navigate(['contact/corporate-contact']);
            }
          }
        },
        err => {
          this.callFlag = false;
          this.searchText.setValue('');
          this.loading = false;
        }
      );
    } else {
      data.Id = +this.contactId;
      data.isVisible = this.clientDetail.isVisible;
      this.personService.v1PersonPut$Json({body: data}).subscribe(
        response => {
          const res = JSON.parse(response as any);
          if (res.results === 0) {
            this.loading = false;
            this.callFlag = false;
            this.toastDisplay.showError(this.errorData.server_error);
          } else {
            this.loading = false;
            this.callFlag = false;
            if (this.noteList.length > 0) {
              for (let i = 0; i <= this.noteList.length - 1; i++) {
                this.noteList[i].name = 'corporate contact note';
                this.saveNotes(true, this.noteList[i]);
              }
            }
            this.toastDisplay.showSuccess('Corporate contact updated.');
            this.router.navigate(['contact/corporate-contact']);
          }
        },
        () => {
          this.callFlag = false;
          this.loading = false;
        }
      );
    }
  }

  public saveCompanyList(companyList: any = [], id = 0) {
    this.dataEntered = true;
    const arr = [];
    companyList =
      companyList.length === 0 ? this.addSelectedCompanyList : companyList;
    let associateIds = [];
    if (companyList && companyList.length > 0) {
      associateIds = companyList[0].contactType ? companyList[0].contactType.map(item => item.id) : companyList[0].associations ? companyList[0].associations.map(item => item.id): [];
    }
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < companyList.length; i++) {
      const element = companyList[i];
      if (element.isSelectd) {
        arr.push({
          personId: id === 0 ? +this.contactId : +id,
          clientId: element.id,
          associationTypeId: (element.title === 'All') ? associateIds : element.seletedIds
        });
      }
    }

    this.addCompanyForcorporate(arr, id);
  }

  public addCompanyForcorporate(arr, id) {
    this.clientAssociationService
      .v1ClientAssociationBulkPost$Json({body: arr})
      .subscribe(
        suc => {
          this.companyList = [];
          this.addSelectedCompanyList = [];
          if (this.modalRef) {
            this.modalRef.close();
          }
          this.getCompany(this.contactId);
        },
        err => {
          console.log(err);
        }
      );
  }

  getnotes(contactId) {
    this.notesLoading = true;
    this.noteService
      .v1NotePersonListPersonIdGet({personId: contactId})
      .subscribe(
        suc => {
          const res: any = suc;
          this.noteList = JSON.parse(res).results;
          this.originalNotes = JSON.parse(res).results;
          this.getAuthorList();
          this.notesLoading = false;
        },
        err => {
          console.log(err);
          this.notesLoading = false;
        }
      );
  }

  saveNotes(redirect?: boolean, noteData = null) {
    this.noteFormSubmitted = true;
    if (!this.noteForm.valid && !noteData) {
      return;
    }
    this.callFlag = true;
    this.noteForm.value.isVisibleToClient = !this.noteForm.value.isVisibleToClient ? false : this.noteForm.value.isVisibleToClient;
    const data = noteData ? noteData : {...this.noteForm.value};
    data.name = 'corporate contact note';
    if (this.contactId) {
      if (!data.id) {
        data.id = 0;
        this.noteService
          .v1NotePersonAddPersonIdPost$Json({
            personId: this.contactId,
            body: data
          })
          .subscribe(
            () => {
              if (redirect) {
                this.vendorForm.reset();
                this.searchText.setValue('');
                this.loading = false;
                this.dataEntered = false;
                this.router.navigate(['contact/corporate-contact']);
              } else {
                this.noteFormSubmitted = false;
                this.modalService.dismissAll();
                this.noteForm.reset();
                this.noteForm.patchValue({isVisibleToClient: false});
                this.getnotes(this.contactId);
                this.loading = false;
              }
              this.callFlag = false;
            },
            () => {
              this.loading = false;
              this.callFlag = false;
              this.noteFormSubmitted = false;
            }
          );
      } else {
        this.noteService
          .v1NotePersonUpdatePersonIdPut$Json({
            personId: this.contactId,
            body: data
          })
          .subscribe(
            () => {
              if (redirect) {
                this.router.navigate(['/contact/corporate-contact']);
              } else {
                this.noteFormSubmitted = false;
                this.modalService.dismissAll();
                this.noteForm.reset();
                this.noteForm.patchValue({isVisibleToClient: false});
                this.getnotes(this.contactId);
              }
              this.callFlag = false;
            },
            err => {
              console.log(err);
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
      this.modalService.dismissAll();
      this.noteList = [...this.noteList];
      this.originalNotes = [...this.noteList];
      if (this.notesTable) {
        this.notesTable.offset = 0;
      }
      this.noteForm.reset();
      this.noteForm.patchValue({isVisibleToClient: false});
      this.getAuthorList();
    }
  }

  public async deleteNote(id, index: number, $event) {
    $event.stopPropagation();
    const resp: any = await this.dialogService.confirm(
      this.errorData.delete_note_confirm,
      'Delete',
      'Cancel',
      'Delete Note'
    );
    if (resp) {
      if (this.contactId) {
        this.noteService
          .v1NotePersonRemovePersonIdNoteIdDelete({
            personId: this.contactId,
            noteId: id
          })
          .subscribe(
            suc => {
              this.getnotes(this.contactId);
            },
            err => {
              console.log(err);
            }
          );
      } else {
        this.noteList.splice(index, 1);
      }
    }
  }

  public editNote(obj, index: number, modalContent, event) {
    event.stopPropagation();
    this.noteForm.setValue({
      id: obj.id ? obj.id : '',
      applicableDate: obj.applicableDate,
      content: obj.content,
      isVisibleToClient: obj.isVisibleToClient
    });
    this.isEdit = true;
    this.editIndex = index;
    this.openModal(modalContent, 'lg', 'lg');
  }

  public UpdateNotes() {
    this.noteFormSubmitted = true;
    if (!this.noteForm.valid) {
      return;
    }
    this.noteList[this.editIndex].content = this.noteForm.value.content;
    this.noteList[this.editIndex].applicableDate = this.noteForm.value.applicableDate;
    this.noteList[this.editIndex].lastUpdated = new Date();
    this.noteList[this.editIndex].isVisibleToClient = this.noteForm.value.isVisibleToClient;
    this.isEdit = false;
    this.noteList = [...this.noteList];
    this.originalNotes = [...this.noteList];
    this.noteFormSubmitted = false;
    this.modalService.dismissAll();
    this.noteForm.reset();
    this.noteForm.patchValue({isVisibleToClient: false});
    this.getAuthorList();
  }

  public async updateFilterPopup(event) {
    this.searchStringPopup = event.target.value;
    if (this.searchStringPopup !== '') {
      this.filterCompany(this.searchStringPopup, 'update');
    } else {
    }
  }

  public filterCompany(searchString, type) {
    const companyList = [];
    if (this.clientSearchSubscribe) {
      this.clientSearchSubscribe.unsubscribe();
    }
    this.companyLoading = true;
    this.clientSearchSubscribe = this.clientService.v1ClientCorporateGet({search: searchString})
    .subscribe(suc => {
        this.companyLoading = false;
        const res: any = suc;
        const list = JSON.parse(res).results;
        list.map((obj) => {
          const item = {
            id: obj.id,
            isSelectd: false,
            companyName: obj.companyName,
            clientFlag: obj.clientFlag,
            isVisible: obj.isVisible,
            seletedIds: [],
            title: 'All',
            contactType: clone(this.contactType)
          };
          companyList.push(item);
          // if (type === 'create') {
          //   companyList.push(item);
          // } else {
          //   let exist = this.companyList.find(item => item.id === obj.id);
          //   if (!exist) {
          //     companyList.push(item);
          //   }
          // }
        });
        if (type === 'create') {
          this.companyList = clone(companyList);
        } else {
          this.origPopupcompanyList =  clone(companyList);
          this.origPopupcompanyList.forEach( item => {
            item.isSelectd = this.selectedCompanyIds.includes(item.id);
            // item.seletedIds = item.associations.map(x => x.id);
          });
          this.popupcompanyList = [...this.origPopupcompanyList];
          console.log('List ==>', this.popupcompanyList);
          this.getTotalPagesAddCompany();
        }
        this.tempCompanyArr = JSON.parse(JSON.stringify(companyList));
        this.getTotalPages();
      },
      err => {
        console.log(err);
        this.companyLoading = false;
      }
    );
    return companyList;
  }

  checkboxChange(event: any, index: number): void {
    this.tempCompanyArr[index].isSelectd = this.companyList[index].isSelectd;
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   * @memberof ListComponent
   */
  public onSelect(event, item) {
    const index = this.companyList.findIndex(obj => obj.id === item.id);
    this.companyList[index].isSelectd = event.target.checked;
  }

  public getUnique(array) {
    const roleString = [];
    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        roleString.push(item.name);
      }
    }

    const uniqueArray = [];

    // Loop through array values
    for (const value of roleString) {
      if (uniqueArray.indexOf(value) === -1) {
        uniqueArray.push(value);
      }
    }
    uniqueArray.push('Corporate Contact');
    return uniqueArray;
  }

  onBlurMethod(val: any, type: string) {
    type === 'primaryPhone' ? this.primaryPhoneBlur = this.isBlur(val) : type === 'cellPhone' ? this.cellPhoneBlur = this.isBlur(val) : '';
  }

  private isBlur(val: string | any[]) {
    return (val.length === 10) ? false : (val.length === 0) ? false : true;
  }

  /***
   * function to open add note form
   */
  addNote(): void {
    this.showThis = true;
    this.isEdit = false;
    this.editIndex = 0;
    this.noteForm.patchValue({
      applicableDate: new Date()
    });
  }

  /**
   * function to clear company filters
   */
  public clearFilter(item: any, index: number, type: string) {
    console.log('Item ==>', item);
    item.seletedIds = [];
    item.contactType.map((type, i) => {
      item.contactType[i].checked = false;
    });
    this.tempCompanyArr[index] = item;
    if (type === 'create') {
      this.companyList = this.tempCompanyArr;
    }
    item.title = 'All';
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isViewOnly) {
      this.dataEntered = true;
    }
  }

  cancel() {
    this.router.navigate(['/contact/corporate-contact']);
  }


  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.getTotalPages();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.getTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public getTotalPages() {
    this.page.totalElements = this.companyList.length;
    this.page.totalPages = Math.ceil(
      this.companyList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
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

  cancelNotes() {
    this.noteFormSubmitted = false;
    this.modalService.dismissAll();
    this.noteForm.reset();
    this.noteForm.patchValue({isVisibleToClient: false});
  }

  cancelComp(type?) {
    this.addSelectedCompanyList = [];
    this.modalService.dismissAll(null);
  }

  findIndex(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
      if (array[i][attr] === value) {
        return i;
      }
    }
    return -1;
  }

  public restrictNoteLength(event?: any) {
    if(event.target.value.length >= 1000) {
      this.noteForm.get('content').setValue(this.noteForm.get('content').value.substring(0, 1000));
      return false;
    }

    return true;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  public onSelectAddCompany(event) {
    this.addSelectedCompanyList = [...event.selected];
  }
  /**** Changes Rows Per Page *****/
  public changeAddComapanyPageSize() {
    this.addCompanypage.size = +this.pageSelectorAddComapany.value;
    this.getTotalPagesAddCompany()
  }
  /***** Change Page Dropdown ***/
  public changePageAddCompany() {
    this.addCompanypage.pageNumber = this.pageSelected-1;
    if(this.pageSelected == 1) {
      this.getTotalPagesAddCompany()      
    }
    UtilsHelper.aftertableInit();
  }
  /****** Page Change Data table Pager */
  public pageChangeAddCompany(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }
  public getTotalPagesAddCompany() {
    this.addCompanypage.totalElements = this.popupcompanyList.length;
    this.addCompanypage.totalPages = Math.ceil(
      this.popupcompanyList.length / this.addCompanypage.size
    );
    this.addCompanypage.pageNumber = 0;
    this.pageSelected = 1;
    this.tableAddCompany.offset = 0;
    UtilsHelper.aftertableInit();
  }
  public applyAddFilter() {
    let rows = [...this.origPopupcompanyList];
    if (this.searchStringPopup) {
      rows = this.origPopupcompanyList.filter(f => {
        return (f.companyName || '').toLowerCase().includes(this.searchStringPopup.toLowerCase());
      });
    }
    this.popupcompanyList = rows;
    this.getTotalPagesAddCompany();
  }

  openMenu(index: number, event): void {
    console.log('----index---', index);
    console.log('----event---', event);
    console.log('----this.currentActive---', this.currentActive);
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        if (event.target.closest('.datatable-row-wrapper')) {
          event.target.closest('.datatable-row-wrapper').classList.add('datatable-row-hover');
        }
      } else {
        this.currentActive = null;
        if (event.target.closest('.datatable-row-wrapper')) {
          event.target.closest('.datatable-row-wrapper').classList.remove('datatable-row-hover');
        }
      }
    }, 50);
  }
  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) { this.currentActive = null; }
  }

  /***** function to reset current active index */
  resetCurrentActive() {
    setTimeout(() => {
      this.currentActive = null;
      console.log('-----reset----', this.currentActive);
    },100)
  }

  openAddCompany() {
    let modalRef = this.modalService.open(AddCompanyComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modalRef.componentInstance.contactId = {
      id: this.contactId
    };
    modalRef.componentInstance.contactType = {
      type: this.contactType
    };
    modalRef.componentInstance.alreadyCompanyList = {
      list: this.companyList
    }
    modalRef.result.then(
      result => {
        if (result) {
          this.getCompany(this.contactId);
        }
      },
      reason => {
      }
    );
  }

  get footerHeight() {
    if (this.companyList) {
      return this.companyList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
