import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models/page.js';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as ERROR_DATA from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper.js';
import { vwEmployee, vwNote } from 'src/common/swagger-providers/models';
import { NoteService } from 'src/common/swagger-providers/services';


@Component({
  selector: 'app-employee-profile-notes',
  templateUrl: './notes.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeNotesComponent implements OnInit {
  @Input() employee: vwEmployee;
  closeResult: string;
  notes: Array<vwNote> = [];
  originalNotes: Array<vwNote> = [];

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  private modalRef: NgbModalRef;
  public isLoading = false;
  public disableSaveButton = false;

  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;

  error_data = (ERROR_DATA as any).default;

  public noteForm: FormGroup;

  showForm = false;
  public formSubmitted = false;

  constructor(
    private modalService: NgbModal,
    private noteService: NoteService,
    private toastr: ToastDisplay,
    private fb: FormBuilder,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.noteForm = this.fb.group({
      id: new FormControl(0),
      applicableDate: null,
      content: ['', [Validators.required]],
      isVisibleToClient: false
    });
  }

  ngOnInit() {
    this.getNotes();
  }

  /***** function to get all notes */
  /*** function to get notes  */
  private getNotes() {
    this.isLoading = true;
    this.noteService
      .v1NotePersonListPersonIdGet({personId: this.employee.id})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwNote>;
        }),
        finalize(() => {})
      )
      .subscribe(res => {
        if (res && res.length >= 0) {
          this.originalNotes = res;
          this.notes = [...this.originalNotes];
          this.page.totalElements = this.originalNotes.length;
          this.page.totalPages = Math.ceil(
            this.originalNotes.length / this.page.size
          );
          this.updateDatatableFooterPage();
          this.isLoading = false;
        }
      },err => {
        this.isLoading = false;
      });
  }

  public addNote(content) {
    this.noteForm.patchValue({
      id: 0,
      applicableDate: null,
      content: null,
      isVisibleToClient: false
    });
    this.open(content, 'lg');
    this.showForm = true;
  }

  open(content: any, className, winClass = '') {
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
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

  saveNotes() {
    this.formSubmitted = true;
    if (this.noteForm.valid) {
      this.disableSaveButton = true;
      const data = {...this.noteForm.value};
      data.name = 'potential contact note';
      if (data.id === 0) {
        this.noteService
          .v1NotePersonAddPersonIdPost$Json({
            personId: this.employee.id,
            body: data
          })
          .pipe(finalize(() => {}))
          .subscribe(
            suc => {
              this.noteForm.reset();
              this.modalRef.close();
              this.formSubmitted = false;
              this.showForm = false;
              this.disableSaveButton = false;
              this.getNotes();
              this.toastr.showSuccess(this.error_data.add_note_success);
            },
            err => {
              this.disableSaveButton = false;
              console.log(err);
            }
          );
      } else {
        this.noteService
          .v1NotePersonUpdatePersonIdPut$Json({
            personId: this.employee.id,
            body: data
          })
          .pipe(finalize(() => {}))
          .subscribe(
            suc => {
              this.noteForm.reset();
              this.modalRef.close();
              this.formSubmitted = false;
              this.showForm = false;
              this.disableSaveButton = false;
              this.getNotes();
              this.toastr.showSuccess(
                this.error_data.update_note_success,
              );
            },
            err => {
              this.disableSaveButton = false;
              console.log(err);
            }
          );
      }
    }
  }

  /** function to delete notes */
  deleteNote(row: vwNote, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }

    this.dialogService
      .confirm(this.error_data.delete_note_confirm, 'Delete', 'Cancel', 'Delete Note')
      .then(res => {
        if (res) {
          this.deleteClientNote(row);
        }
      });
  }

  private deleteClientNote(note: vwNote) {
    this.isLoading = true;
    this.noteService
      .v1NotePersonRemovePersonIdNoteIdDelete({
        personId: this.employee.id,
        noteId: note.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.delete_note_success);
            this.getNotes();
          } else {
            this.isLoading = false;
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.isLoading = false;
        }
      );
  }

  /**** function to update notes */
  editNote(row: vwNote, $event, content) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }

    this.noteForm.setValue({
      id: row.id,
      applicableDate: row.applicableDate,
      content: row.content,
      isVisibleToClient: row.isVisibleToClient
    });
    this.open(content, 'lg');
    this.showForm = true;
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  /**
   * Change per page size
   */

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.notes.length;
    this.page.totalPages = Math.ceil(this.notes.length / this.page.size);
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  public updateFilter(event) {
    const val = event.target.value;
    if (val !== '') {
      this.notes = this.originalNotes.filter(
        item =>
          UtilsHelper.matchName(item, val, 'content') ||
          UtilsHelper.matchName(item, val, 'createdBy')
      );
    } else {
      this.notes = this.originalNotes;
    }
  }

  cancel() {
    this.noteForm.reset();
    this.showForm = false;
    this.modalRef.close();
  }

  onSelectNotes($event, content) {
    if ($event.type === 'click') {
      this.editNote($event.row, $event.event, content);
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.notes) {
      return this.notes.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
