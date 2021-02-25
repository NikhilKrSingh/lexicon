import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice, Page, vwAttorneyViewModel, vwBlockedUsersResponse, vwMatterPerson, vwMatterResponse } from 'src/app/modules/models';
import { MatterFormError } from 'src/app/modules/models/fillable-form.model';
import { ConflictCheckDialogComponent } from 'src/app/modules/shared/conflict-check-dialog/conflict-check-dialog.component';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as ERROR_DATA from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { PCConflictCheckRequest, vwBlock, vwIdName, vwMatterBasics } from 'src/common/swagger-providers/models';
import { BlockService, ContactsService, MatterService, MiscService, NoteService, SecurityGroupService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import { AddBlockedEmployeeComponent } from './blocked-employee/blocked-employee.component';

@Component({
  selector: 'app-matter-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit, IBackButtonGuard {
  isShow1: boolean = false;
  isShow2: boolean = false;
  error_data = (ERROR_DATA as any).default;

  matterId: number;
  matterDetails: vwMatterResponse;
  matterForm: FormGroup;
  matterCoprorateType: vwIdName;
  corporateContacts: Array<vwMatterPerson>;
  opposingCounselList: Array<vwMatterPerson>;
  _opposingCounselList: Array<vwMatterPerson>;
  opposingPartyList: Array<vwMatterPerson>;
  _opposingPartyList: Array<vwMatterPerson>;
  expertWitnessList: Array<vwMatterPerson>;
  _expertWitnessList: Array<vwMatterPerson>;
  matterTypes: Array<vwIdName>;
  originalBlockedUserList: Array<vwAttorneyViewModel>;
  blockedUserList: Array<vwAttorneyViewModel>;
  public addOpposingParty: boolean = false;
  public addOpposingPartyMode: string = 'create';
  public selectedOpposingParty: any;
  public addExpertWitness: boolean = false;
  public addExpertWitnessMode: string = 'create';
  public selectedExpertWitness: any;
  public addOpposingCouncel: boolean = false;
  public addOpposingCouncelMode: string = 'create';
  public selectedOpposingCounsel: any;
  public associateExpertWitness: IOffice;
  public associateOpposingParty: IOffice;
  public associateOpposingCouncil: IOffice;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectedAttorny: Array<number> = [];
  public pageSelected = 1;
  public counter = Array;
  @ViewChild(DatatableComponent, { static: false }) public blockedUsersTable: DatatableComponent;
  public runConflicts = false;
  public conflictArr: Array<any> = [];
  public blockedPersonsArr: Array<any> = [];
  public practiceList: Array<IOffice> = [];
  public selectedPracticeArea: number;
  public practiceAreaSelected: boolean = false;
  public errorData: any = (errorData as any).default;
  public loading = true;
  public matterAssocLoading = true;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public sameAsOpposingParty: boolean = false;
  matterFormError: MatterFormError;

  constructor(
    private matterService: MatterService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private miscService: MiscService,
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private blockService: BlockService,
    private contactsService: ContactsService,
    private router: Router,
    private pagetitle: Title,
    private securityGroupService: SecurityGroupService,
    private notesService: NoteService
  ) {
    this.corporateContacts = [];
    this.opposingCounselList = [];
    this.opposingPartyList = [];
    this.expertWitnessList = [];
    this.matterTypes = [];

    this.page.pageNumber = 0;
    this.page.size = 10;
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
    this.matterFormError = new MatterFormError();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let matterId = params['matterId'];
      this.matterId = +matterId;
      if (matterId > 0) {
        this.getMatterDetails();
        this.getAssociateType();
      } else {
        this.loading = false;
        this.toastDisplay.showError('Please select a matter');
      }
    });
  }

  private getAssociateType() {
    this.miscService.v1MiscClientassociationtypeGet$Response({}).subscribe(
      res => {
        let clientAssociates = JSON.parse(res.body as any).results;
        if (clientAssociates && clientAssociates.length > 0) {
          this.associateOpposingParty = clientAssociates.filter(obj => {
            return obj.name === 'Opposing Party';
          })[0];
          this.associateOpposingCouncil = clientAssociates.filter(obj => {
            return obj.name === 'Opposing Counsel';
          })[0];
          this.associateExpertWitness = clientAssociates.filter(obj => {
            return obj.name === 'Expert Witness';
          })[0];
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  private getMatterDetails(loadOtherDetails = true) {
    this.loading = true;
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.matterDetails = res;
          this.pagetitle.setTitle("Edit Matter - "+this.matterDetails.matterName);
          this.createForm();
          if (loadOtherDetails) {
            this.getMatterOtherDetails();
          }
          this.loading = false;
        },
        err => {
          console.log(err);
          this.loading = false;
        }
      );
  }

  private createForm() {
    if (this.matterDetails) {
      this.matterForm = this.fb.group({
        matterNumber: this.matterDetails.matterNumber,
        matterName: [this.matterDetails.matterName, [Validators.required, PreventInject]],
        matterOpenDate: [this.matterDetails.matterOpenDate, [Validators.required]],
        caseNumber: '',
        isContingentCase: this.matterDetails.isContingentCase,
        practiceArea:
          this.matterDetails.practiceArea &&
          this.matterDetails.practiceArea.length > 0
            ? this.matterDetails.practiceArea[0].id
            : null,
        matterType: this.matterDetails.matterType
          ? this.matterDetails.matterType.id
          : '',
          changeNotes: [null],
        caseNumbers: [(this.matterDetails.caseNumbers
          ? this.matterDetails.caseNumbers.map(a => a.name).join(',')
          : ''), [PreventInject]]
      });
    } else {
      this.matterForm = this.fb.group({
        matterNumber: '',
        matterName: ['', [Validators.required, PreventInject]],
        matterOpenDate: [null, [Validators.required]],
        caseNumber: [null, [PreventInject]],
        practiceArea: null,
        matterType: null,
        isContingentCase: 0,
        caseNumbers: ''
      });
    }

    this.matterForm.controls['matterNumber'].disable();
  }

  private getMatterOtherDetails() {
    forkJoin([
      this.matterService.v1MatterOpposingcounselListMatterIdGet({
        matterId: this.matterId
      }),
      this.matterService.v1MatterExpertwitnessListMatterIdGet({
        matterId: this.matterId
      }),
      this.matterService.v1MatterOpposingpartyListMatterIdGet({
        matterId: this.matterId
      }),
      this.matterService.v1MatterContactListMatterIdGet({
        matterId: this.matterId
      }),
      this.matterService.v1MatterBlockUsersMatterIdGet({
        matterId: this.matterId
      })
    ])
      .pipe(
        map(res => {
          return {
            OpposingcounselList: JSON.parse(res[0] as any).results,
            ExpertwitnessList: JSON.parse(res[1] as any).results,
            OpposingpartyList: JSON.parse(res[2] as any).results,
            ContactList: JSON.parse(res[3] as any).results,
            BlockedUsers: JSON.parse(res[4] as any).results
          };
        }),
        finalize(() => {})
      )
      .subscribe(res => {
        this.opposingCounselList = res.OpposingcounselList;
        this._opposingCounselList = [...res.OpposingcounselList];

        this.opposingPartyList = res.OpposingpartyList;
        this._opposingPartyList = [...res.OpposingpartyList];

        this.expertWitnessList = res.ExpertwitnessList;
        this._expertWitnessList = [...res.ExpertwitnessList];

        this.corporateContacts = res.ContactList;

        this.matterCoprorateType = this.matterTypes.find(
          a => a.name == 'Corporate'
        );

        this.originalBlockedUserList = res.BlockedUsers || [];
        this.blockedUserList = [...this.originalBlockedUserList];

        this.page.totalElements = this.originalBlockedUserList.length;
        this.page.totalPages = Math.ceil(
          this.originalBlockedUserList.length / this.page.size
        );
        if (this.opposingCounselList && this.opposingPartyList && this.opposingPartyList.length === this.opposingCounselList.length) {
          let ids = this.opposingCounselList.map(item => item.id);
          this.sameAsOpposingParty = true;
          this.opposingPartyList.map((obj) => {
            if (ids.indexOf(obj.id) === -1) {
              this.sameAsOpposingParty = false;
            }
          });
        } else {
          this.sameAsOpposingParty = false;
        }
        this.matterAssocLoading = false;
      });
  }

  get isCorporateType() {
    if (this.matterCoprorateType) {
      return (
        this.matterForm.controls['matterType'].value ==
        this.matterCoprorateType.id
      );
    } else {
      return false;
    }
  }

  addCorporateContact() {}

  addOpposingPartyClick() {
    this.addOpposingPartyMode = 'create';
    this.selectedOpposingParty = null;
    this.addOpposingParty = true;
  }

  editOpposingPartyClick(item: any) {
    this.addOpposingPartyMode = 'edit';
    this.selectedOpposingParty = item;
    this.addOpposingParty = true;
  }

  public closeOpposingParty(event) {
    this.addOpposingParty = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getOpposignParty();
    }
  }

  private getOpposignParty() {
    this.matterService
      .v1MatterOpposingpartyListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.opposingPartyList = res;
        },
        err => {
          console.log(err);
        }
      );
  }

  addOpposingCounselClick() {
    this.addOpposingCouncelMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
  }

  editOpposingCounselClick(item: any) {
    this.addOpposingCouncelMode = 'edit';
    this.selectedOpposingCounsel = item;
    this.addOpposingCouncel = true;
  }

  closeOpposingCounsel(event) {
    this.addOpposingCouncel = false;
    if (event == 'add' || (event && event.type && event.type === 'add')) {
      this.getOpposingCounselList();
    }
  }

  private getOpposingCounselList() {
    this.matterService
      .v1MatterOpposingcounselListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.opposingCounselList = res;
        },
        err => {
          console.log(err);
        }
      );
  }

  addExpertWitnessClick() {
    this.addExpertWitnessMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
  }

  editExpertWitnessClick(item: any) {
    this.addExpertWitness = true;
    this.addExpertWitnessMode = 'edit';
    this.selectedExpertWitness = item;
  }

  closeExpertWitness(event) {
    this.addExpertWitness = false;

    if (event == 'add' || (event && event.type && event.type === 'add')) {
      this.getExpertWitnessList();
    }
  }

  private getExpertWitnessList() {
    this.matterService
      .v1MatterExpertwitnessListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.expertWitnessList = res;
        },
        err => {
          console.log(err);
        }
      );
  }

  /***
   * common function to delete matter associations
   */
  async deleteMatterAssociations(
    messages: string,
    personId: any,
    type: string
  ) {
    try {
      let resp: any = await this.dialogService.confirm(messages, 'Delete');
      if (resp) {
        let data: any = {
          body: {
            associationTypeId:
              type == 'Opposing Party'
                ? this.associateOpposingParty.id
                : type == 'Opposing Counsel'
                ? this.associateOpposingCouncil.id
                : this.associateExpertWitness.id,
            matterId: this.matterId,
            personId: personId
          }
        };
        this.matterService
          .v1MatterPersonDisassociateDelete$Json(data)
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as number;
            }),
            finalize(() => {})
          )
          .subscribe(
            res => {
              if (res > 0) {
                let index: any;
                switch (type) {
                  case 'Opposing Party':
                    index = this.opposingPartyList.findIndex(
                      x => x.id === personId
                    );
                    this.opposingPartyList.splice(index, 1);
                    this.opposingPartyList = [...this.opposingPartyList];
                    this.toastDisplay.showSuccess(
                      this.error_data.opposingparty_delete
                    );
                    break;
                  case 'Opposing Counsel':
                    index = this.opposingCounselList.findIndex(
                      x => x.id === personId
                    );
                    this.opposingCounselList.splice(index, 1);
                    this.opposingCounselList = [...this.opposingCounselList];
                    this.toastDisplay.showSuccess(
                      this.error_data.opposingcounsel_delete
                    );
                    break;
                  case 'Expert Witnesses':
                    index = this.expertWitnessList.findIndex(
                      x => x.id === personId
                    );
                    this.expertWitnessList.splice(index, 1);
                    this.expertWitnessList = [...this.expertWitnessList];
                    this.toastDisplay.showSuccess(
                      this.error_data.expert_witnesses_delete
                    );
                    break;
                }
              } else {
                this.toastDisplay.showError(this.error_data.server_error);
              }
            },
            () => {
              this.toastDisplay.showError(this.error_data.server_error);
            }
          );
      }
    } catch (err) {}
  }

 async update() {
    const form = this.matterForm.value;
    const matterType = this.matterTypes.find(a => a.id == form.matterType);

    if (!form.matterName) {
      this.matterFormError.matterName = true;
      this.matterFormError.matterNameMessage = this.errorData.matter_name_error;
    } else if (form.matterName && this.matterForm.controls.matterName.invalid) {
      console.log(1)
      this.matterFormError.matterName = true;
      this.matterFormError.matterNameMessage = this.errorData.insecure_input;
    } else {
      this.matterFormError.matterName = false;
    }

    if (!form.matterOpenDate) {
      this.matterFormError.matterDate = true;
      this.matterFormError.matterDateMessage = this.errorData.date_error;
    } else {
      this.matterFormError.matterDate = false;
    }

    if (form.caseNumbers && this.matterForm.controls.caseNumbers.invalid) {
      this.matterFormError.caseNumbers = true;
      this.matterFormError.caseNumbersMessage = this.errorData.insecure_input;
    } else {
      this.matterFormError.caseNumbers = false;

    }
    if (this.matterFormError.hasError()) {
      window.scrollTo(0, 0);
      return;
    }

    const data: vwMatterBasics = {
      id: this.matterDetails.id,
      name: form.matterName,
      clientId: this.matterDetails.clientName
        ? this.matterDetails.clientName.id
        : null,
      matterTypeId: matterType ? matterType.id : null,
      officeId: this.matterDetails.matterPrimaryOffice
        ? this.matterDetails.matterPrimaryOffice.id
        : null,
      openDate: form.matterOpenDate,
      contingentCase: form.isContingentCase,
      caseNumbers: form.caseNumbers,
      isPlaintiff: this.matterDetails.isPlainTiff,
      jurisdictionStateId: this.matterDetails.jurisdictionStateId,
      jurisdictionCounty: this.matterDetails.jurisdictionCounty
    };

    this.matterService
      .v1MatterBasicsPut$Json({
        body: data
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {})
      )
      .subscribe(
        async (res) => {
          this.dataEntered = false;
          if (res > 0) {
            if(this.matterForm.value.changeNotes && this.matterForm.value.changeNotes!=''){
              let data ={
                applicableDate: moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss'),
                content: this.matterForm.value.changeNotes,
                id: 0,
                isVisibleToClient: false,
                name: "Edit Matter Note",
                noteType: "Matter"
              }
              await this.notesService.v1NoteMatterAddMatterIdPost$Json({matterId:this.matterId, body: data}).toPromise();
            }
            if (this.sameAsOpposingParty && this.opposingPartyList && this.opposingPartyList.length > 0) {
              let ids = this.opposingCounselList.map(item => item.id);
              this.savedExistingAssociations(0, ids);
            }
            this.toastDisplay.showSuccess(
              this.error_data.edit_matter_success
            );
            this.router.navigate(['/matter/dashboard'], {
              queryParams: {
                matterId: this.matterId
              }
            })
          } else {
            this.toastDisplay.showError(this.error_data.server_error);
          }
        },
        () => {
          this.toastDisplay.showError(this.error_data.server_error);
        }
      );
  }

  addBlockedEmployee() {
    let modalRef = this.modalService.open(AddBlockedEmployeeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl',
      windowClass: 'modal-xlg'
    });

    modalRef.componentInstance.matterId = this.matterId;
    modalRef.componentInstance.alreadyBlockedEmployees = this.blockedUserList.map(
      (a: any) => a.personId
    );

    modalRef.result.then(res => {
      if (res) {
        let selectedID: Array<vwBlock> = res.map(value => {
          return {
            personId: value['id'],
            targetMatterId: this.matterId,
            description: value['description']
          } as vwBlock;
        });

        this.blockService
          .v1BlockPost$Json({
            body: selectedID
          })
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as any;
            })
          )
          .subscribe(
            res => {
              console.log(res);
              this.reloadBlockedEmployeeList();
            },
            () => {
              this.toastDisplay.showError(this.error_data.error_occured);
            }
          );
      }
    });
  }

  private reloadBlockedEmployeeList() {
    this.matterService
      .v1MatterBlockUsersMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {})
      )
      .subscribe(response => {
        this.originalBlockedUserList = response || [];

        this.blockedUserList = [...this.originalBlockedUserList];

        this.page.totalElements = this.originalBlockedUserList.length;
        this.page.totalPages = Math.ceil(
          this.originalBlockedUserList.length / this.page.size
        );
      });
  }

  deleteBlockedEmployee(emp: vwBlockedUsersResponse, $event) {
    $event.target.closest('datatable-body-cell').blur();

    if (emp.blockId) {
      this.dialogService
        .confirm(
          this.error_data.delete_blocked_employee_confirm,
          'Yes',
          'No',
          'Remove Blocked Employee'
        )
        .then(res => {
          if (res) {
            this.blockService
              .v1BlockDelete$Json({
                body: {
                  id: emp.blockId
                }
              })
              .pipe(
                map(res => {
                  return JSON.parse(res as any).results as any;
                }),
                finalize(() => {})
              )
              .subscribe(() => {
                this.reloadBlockedEmployeeList();
              });
          }
        });
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.blockedUserList.length / this.page.size
    );

    this.blockedUsersTable.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /*** function to check conflicts */
  runConflictsCheck(): void {
    let associations = [
      ...this.opposingPartyList,
      ...this.opposingCounselList,
      ...this.expertWitnessList
    ];

    associations.forEach(a => {
      if (a.primaryPhone && (a.primaryPhone as any).name) {
        a.primaryPhone = (a.primaryPhone as any).name;
      }

      delete a.email;
    });

    const request: PCConflictCheckRequest = {
      clientId: this.matterDetails.clientName.id,
      matterId: +this.matterId,
      associations: associations,
      clientCompanyName: this.matterDetails.clientName.company,
      clientFirstName: this.matterDetails.clientName.firstName,
      clientLastName: this.matterDetails.clientName.lastName,
      isCompany: this.matterDetails.clientName.isCompany
    };

    this.contactsService
      .v1ContactsConflictPost$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(response => {
        if (response && response.conflictPersons) {
          this.conflictArr = response.conflictPersons;
          this.blockedPersonsArr = response.blockedPersons;
        } else {
          this.conflictArr = [];
          this.blockedPersonsArr = [];
        }

        this.openConflictCheckDialog();
      });
  }

  private openConflictCheckDialog() {
    let modal = this.modalService.open(ConflictCheckDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    let component = modal.componentInstance;

    component.conflicts = this.conflictArr;
    component.hasConflicts = this.conflictArr.length > 0;
    component.blockedUsers = this.blockedPersonsArr;

    component.header = this.errorData.normal_conflict;
    component.message = this.errorData.changes_potential_conflict;
    component.returnButtonText = 'Return to Matter';

    modal.result.then(res => {
      if (res == 'save') {
        this.save();
      }

      if (res == 'discard') {
        this.discard();
      }
    });
  }

  private save() {
    this._opposingCounselList = [...this.opposingCounselList];
    this._opposingPartyList = [...this.opposingPartyList];
    this._expertWitnessList = [...this.expertWitnessList];
    this.update();
  }

  private discard() {
    let newlyAddedAssociations = [
      ...this.addedItems(this._opposingPartyList, this.opposingPartyList),
      ...this.addedItems(this._opposingCounselList, this.opposingCounselList),
      ...this.addedItems(this._expertWitnessList, this.expertWitnessList)
    ];

    if (newlyAddedAssociations.length > 0) {
      const Observables = newlyAddedAssociations.map(a => {
        const data: any = {
          body: {
            associationTypeId: a.associationTypeId,
            matterId: a.matterId,
            personId: a.id
          }
        };
        return this.matterService.v1MatterPersonDisassociateDelete$Json$Response(
          data
        );
      });

      forkJoin(Observables)
        .pipe(finalize(() => {}))
        .subscribe(() => {
          this.getMatterDetails(true);
        });
    } else {
      this.getMatterDetails(false);
    }
  }

  private addedItems(originalArray: any[], items: any[]) {
    let arr: any[] = [];

    items.forEach(a => {
      let index = originalArray.findIndex(i => i.id == a.id);
      if (index == -1) {
        arr.push(a);
      }
    });

    return arr;
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  cancel() {
    this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: this.matterId } });
  }

  /**
   * associateion
   * @param personId
   * @param item
   */
  private  savedExistingAssociations(index, ids) {
    if (index >= this.opposingPartyList.length) {
      return;
    }
    if (ids.indexOf(this.opposingPartyList[index].id) === -1) {
      let data:any = {
        associationTypeId: this.associateOpposingCouncil.id,
        matterId: this.matterId,
        personId: this.opposingPartyList[index].id
      }
      this.securityGroupService.v1SecurityGroupUserPost$Json({body: {groupIds: [this.associateOpposingCouncil.id], personId: this.opposingPartyList[index].id}})
      .pipe(map(UtilsHelper.mapData),finalize(() => {}))
      .subscribe(res => {
        this.matterService.v1MatterAssociationPost$Json$Response({ body: data })
          .subscribe(response => {
            index = index + 1;
            this.savedExistingAssociations(index, ids);
          }, err => {});
      }, err => {
        console.log(err);
        this.loading = false;
      });
    } else {
      index = index + 1;
      this.savedExistingAssociations(index, ids);
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
