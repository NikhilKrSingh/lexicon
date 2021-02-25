import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ContactsService, NoteService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-contact-notes',
  templateUrl: './contact-notes.component.html',
  styleUrls: ['./contact-notes.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ContactNotesComponent implements OnInit {
  @Input() public contactId: number = 0;
  @Output() readonly prevStep = new EventEmitter<string>();
  public errorData: any = (errorData as any).default;
  public showThis: boolean = false;

  public noteForm: FormGroup = this.builder.group({
    id: 0,
    applicableDate: '',
    content: ['', [Validators.required]],
    isVisibleToClient: false
  });

  public noteList: Array<any> = [];
  public addNoteLoading: boolean;
  public getNotesLoading = true;
  public loading: boolean;

  private contactDetails;

  constructor(
    private builder: FormBuilder,
    private noteService: NoteService,
    private dialogService: DialogService,
    private router: Router,
    private contactsService: ContactsService,
    private appConfig: AppConfigService,
  ) {}

  ngOnInit() {
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.createDetails) {
      this.contactId = contactDetails.createDetails.clientId;
      this.contactDetails = contactDetails;
    }
    this.getnotes();
  }

  getnotes() {
    this.getNotesLoading = true;
    this.noteService
      .v1NotePersonListPersonIdGet({ personId: this.contactId })
      .subscribe(
        suc => {
          const res: any = suc;
          this.noteList = JSON.parse(res).results;
          this.getNotesLoading = false;
        },
        err => {
          console.log(err);
          this.getNotesLoading = false;
        }
      );
  }

  public cancel() {
    this.router.navigate(['/contact/potential-client']);
  }

  public prev() {
    this.prevStep.emit('scheduling');
  }

  save() {
    localStorage.setItem('save', 'true')
    this.addNoteLoading = true;
    const data = { ...this.noteForm.value };
    data.name = 'Potential Client note';
    data.noteType = 'Potential Client';
    data.id = data.id ? data.id : 0;
    if (data.applicableDate) {
      data['applicableDate'] =
        moment(data.applicableDate).format('YYYY-MM-DD') + 'T00:00:00.000Z';
    }
    if (data.id === 0) {
      this.noteService
        .v1NotePersonAddPersonIdPost$Json({
          personId: this.contactId,
          body: data
        })
        .subscribe(
          suc => {
            this.noteForm.reset();
            this.showThis = false;
            this.getnotes();
            this.addNoteLoading = false;
          },
          err => {
            console.log(err);
            this.addNoteLoading = false;
          }
        );
    } else {
      this.noteService
        .v1NotePersonUpdatePersonIdPut$Json({
          personId: this.contactId,
          body: data
        })
        .subscribe(
          suc => {
            this.noteForm.reset();
            this.showThis = false;
            this.getnotes();
            this.addNoteLoading = false;
          },
          err => {
            console.log(err);
            this.addNoteLoading = false;
          }
        );
    }
  }

  public async deleteNote(id) {
    const resp: any = await this.dialogService.confirm(
      this.errorData.delete_note_confirm,
      'Delete',
      'Cancel',
      'Delete Note'
    );
    if (resp) {
      this.noteService
        .v1NotePersonRemovePersonIdNoteIdDelete({
          personId: this.contactId,
          noteId: id
        })
        .subscribe(
          suc => {
            this.getnotes();
          },
          err => {
            console.log(err);
          }
        );
    }
  }

  public editNote(obj) {
    this.noteForm.setValue({
      id: obj.id,
      applicableDate: obj.applicableDate,
      content: obj.content,
      isVisibleToClient: obj.isVisibleToClient
    });
    this.showThis = true;
  }

  /*** function to add notes form */
  showNoteForm() {
    this.noteForm.setValue({
      id: 0,
      applicableDate: null,
      content: '',
      isVisibleToClient: false
    });
    this.showThis = true;
  }

  redirectToList() {
    localStorage.setItem('done', 'true')
    this.sendEmailToCosultAttorney();
    this.loading = true;
    localStorage.removeItem('contactDetails');
    localStorage.removeItem('pccreatestep');
    this.router.navigate(['contact/view-potential-client'], {
      queryParams: { clientId: this.contactId, state: 'view' }
    });
    this.loading = false;
  }

  private sendEmailToCosultAttorney() {
    if (this.contactDetails && this.contactDetails.initialConsultAttoney) {
      this.contactsService.v1ContactsSendAssignReassignEmailToAttorneyPost$Json({
        body: {
          appURL: this.appConfig.APP_URL,
          attorneyId: +this.contactDetails.initialConsultAttoney.id,
          oldAttorneyId: 0,
          potentialClientId: +this.contactId
        }
      }).subscribe(() => {})
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
