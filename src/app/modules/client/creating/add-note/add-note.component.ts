import { Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AddClientNoteComponent } from 'src/app/modules/shared/add-client-note/add-client-note.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as ERROR_DATA from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwNote } from 'src/common/swagger-providers/models';
import { NoteService } from 'src/common/swagger-providers/services';
import * as Constant from '../../../shared/const';

@Component({
  selector: 'app-client-add-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientAddNoteComponent implements OnInit {
  @Output() readonly changesMade = new EventEmitter<any>();
  @ViewChild(DatatableComponent, { static: false }) notesTable: DatatableComponent;

  noteForm: FormGroup;
  originalNotes: Array<vwNote>;
  notes: Array<vwNote>;
  errorData = (ERROR_DATA as any).default;
  public matterId: number;
  private modalRefNote: NgbModalRef;
  public config: any = {
    height: 250,
    menubar: false,
    statusbar: false,
    plugins:
      'image imagetools media  lists link autolink imagetools noneditable',
    toolbar:
      'bold italic underline | alignleft aligncenter alignright alignjustify  | outdent indent bullist numlist | customFileLink',
    content_css: [
      '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
      'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    ],
  };
  public loginUser: any;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public isLoading = false;

  constructor(
    private builder: FormBuilder,
    private toastDisplay: ToastDisplay,
    private dialogService: DialogService,
    private modalService: NgbModal,
    private noteService: NoteService
  ) {
    this.noteForm = this.builder.group({
      id: 0,
      name: '',
      applicableDate: [new Date()],
      content: ['', [Validators.required]],
      isVisibleToClient: false,
    });

    this.notes = [];
    this.originalNotes = [];
  }

  ngOnInit() {
    if (UtilsHelper.getObject('createdMatterId')) {
      this.matterId = UtilsHelper.getObject('createdMatterId');
    }
    this.loginUser = UtilsHelper.getLoginUser();
    this.getnotes();
  }

  getnotes() {
    this.notes = [];
    this.originalNotes = [...this.notes];
  }

  /**
   * add edit note
   * @param row: vwNote
   */
  public addEditNote(row: vwNote, $event = null) {
    if ($event) {
      $event.target.closest('datatable-body-cell').blur();
    }

    this.modalRefNote = this.modalService.open(AddClientNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });

    this.modalRefNote.componentInstance.matterId = 0;
    this.modalRefNote.componentInstance.name = 'Matter Note';
    this.modalRefNote.componentInstance.type = 'Matter';
    this.modalRefNote.componentInstance.saveToDb = false;
    this.modalRefNote.componentInstance.placeholder = 'Enter Text';
    if (row) {
      this.modalRefNote.componentInstance.noteDetails = row;
    }

    this.modalRefNote.result.then(
      (result) => {
        if (result) {
          this.changesMade.emit();
          if (result.applicableDate) {
            result.applicableDate =
              moment(result.applicableDate).format('YYYY-MM-DD') +
              'T00:00:00.000Z';
          }
          if (row) {
            const record = this.notes.findIndex(
              (item) => item.rivisionNumber === row.rivisionNumber
            );
            if (record > -1) {
              this.notes[record].applicableDate = result.applicableDate;
              this.notes[record].lastUpdated = new Date() as any;
              this.notes[record].content = result.content;
              this.notes[record].isVisibleToClient = result.isVisibleToClient;
            }
            this.notes = [...this.notes];
            this.originalNotes = [...this.notes];
          } else {
            result.rivisionNumber = this.notes.length;
            result.createdBy = {
              name: this.loginUser
                ? this.loginUser.lastName + ', ' + this.loginUser.firstName
                : '',
              email: this.loginUser ? this.loginUser.email : '',
            };
            result.lastUpdated = new Date();
            this.notes.unshift(result);
            this.notes = [...this.notes];
            this.originalNotes = [...this.notes];
          }
        }
      },
      (reason) => {}
    );
  }

  /* Parent component shared */
  matterNotesData() {
    return this.notes;
  }

  public async deleteNote(obj, $event) {
    $event.target.closest('datatable-body-cell').blur();

    this.dialogService
      .confirm(this.errorData.delete_note_confirm, 'Delete', 'Cancel','Delete Note')
      .then((response) => {
        if (response) {
          const index = this.notes.findIndex(
            (item) => item.rivisionNumber === obj.rivisionNumber
          );
          this.notes.splice(index, 1);
          this.notes = [...this.notes];
          this.originalNotes = [...this.notes];
        }
      });
  }
}
