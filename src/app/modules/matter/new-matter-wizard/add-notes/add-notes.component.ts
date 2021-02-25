import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from "lodash";
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
  selector: 'app-add-notes',
  templateUrl: './add-notes.component.html',
  styleUrls: ['./add-notes.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddNotesComponent implements OnInit {
  @Input() pageType = 'matter';
  @Input() clientId = 0;
  @Output() readonly changesMade = new EventEmitter();
  @ViewChild(DatatableComponent, {static: false}) notesTable: DatatableComponent;

  noteForm: FormGroup;
  originalNotes: Array<vwNote>;
  notes: Array<vwNote>;
  errorData = (ERROR_DATA as any).default;
  searchForm: FormGroup;
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
      'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
    ]
  };
  public loginUser: any;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public isLoading = false;
  authorList: any;

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
      isVisibleToClient: false
    });

    this.notes = [];
    this.originalNotes = [];
    this.searchForm = this.builder.group({
      author: new FormControl(null),
      createdStartDate: new FormControl(null),
      createdEndDate: new FormControl(null),
      isVisibleToClient: new FormControl(null),
    });
    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  ngOnInit() {
    if (UtilsHelper.getObject('createdMatterId')) {
      this.matterId = UtilsHelper.getObject('createdMatterId');
    }
    this.loginUser = UtilsHelper.getLoginUser();
    this.getnotes();
  }

  getnotes() {
    if (this.pageType === 'client') {
      this.isLoading = true;
      this.noteService.v1NotePersonListPersonIdGet({ personId: this.clientId })
        .subscribe(suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          this.notes = (this.notes && this.notes.length) ? [...this.notes, ...list] : list;
          this.originalNotes = [...this.notes];
          this.getAuthorList();
          this.isLoading = false;
        }, err => {
          console.log(err);
          this.isLoading = false;
        });
    }
  }

  /**
   * add edit note
   * @param row: vwNote
   */
  public addEditNote(row: vwNote, $event) {
    $event.stopPropagation();
    if (row && $event && $event.target) {
      $event.target.closest('datatable-body-cell').blur();
    }
    this.modalRefNote = this.modalService.open(AddClientNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });

    this.modalRefNote.componentInstance.matterId = this.matterId;
    this.modalRefNote.componentInstance.name = 'Matter Note';
    this.modalRefNote.componentInstance.type = 'Matter';
    this.modalRefNote.componentInstance.saveToDb = false;
    if (row) {
      this.modalRefNote.componentInstance.noteDetails = row;
    }
    this.modalRefNote.result.then(
      result => {
        if (result) {
          this.changesMade.emit();
          if (result.applicableDate) {
            result.applicableDate = moment(result.applicableDate).format('YYYY-MM-DD') + 'T00:00:00.000Z';
          }
          if (row) {
            const record = this.notes.findIndex(item => item.rivisionNumber === row.rivisionNumber);
            if (record > -1) {
              this.notes[record].applicableDate = result.applicableDate;
              this.notes[record].lastUpdated = new Date().toDateString();
              this.notes[record].content = result.content;
              this.notes[record].isVisibleToClient = result.isVisibleToClient;
            }
            this.notes = [...this.notes];
            this.originalNotes = [...this.notes];
            this.getAuthorList();
            this.toastDisplay.showSuccess(this.errorData.update_note_success);
          } else {
            result.rivisionNumber = this.notes.length;
            result.createdBy = {
              name : (this.loginUser) ? (this.loginUser.lastName + ', ' + this.loginUser.firstName) : '',
              email: (this.loginUser) ? this.loginUser.email : ''
            };
            result.lastUpdated = new Date();
            this.notes.unshift(result);
            this.notes = [...this.notes];
            this.originalNotes = [...this.notes];
            this.getAuthorList();
            this.toastDisplay.showSuccess(this.errorData.add_note_success);
          }
        }
      },
      reason => {
      }
    );
  }

  /* Parent component shared */
  matterNotesData() {
    return this.notes;
  }

  public async deleteNote(obj,$event) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    this.dialogService.confirm(
      this.errorData.delete_note_confirm,
      'Delete',
      'Cancel',
      'Delete Note'
    ).then(response => {
      if (response) {
        const index = this.notes.findIndex(item => item.rivisionNumber === obj.rivisionNumber);
        this.notes.splice(index, 1);
        this.notes = [...this.notes];
        this.originalNotes = [...this.notes];
        this.getAuthorList();
      }
    });
  }

  searchFilter($event) {
    const val = $event.target.value;
    // update the rows
    this.notes = this.originalNotes.filter(
      item =>
        UtilsHelper.matchName(item.createdBy, val, 'name') ||
        UtilsHelper.matchName(item, val, 'content')
    );
    // Whenever the filter changes, always go back to the first page
    this.notesTable.offset = 0;
  }

  getAuthorList() {
    this.authorList = this.notes
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
    this.notes = rows;
    // Whenever the filter changes, always go back to the first page
    this.notesTable.offset = 0;
  }

}
