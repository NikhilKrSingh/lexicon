import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { AddClientNoteComponent } from 'src/app/modules/shared/add-client-note/add-client-note.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as ERROR_DATA from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwNote } from 'src/common/swagger-providers/models';
import { NoteService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-client-view-notes',
  templateUrl: './notes.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientViewNotesComponent implements OnInit {
  @Input() clientId: number;
  closeResult: string;
  notes: Array<vwNote> = [];
  originalNotes: Array<vwNote> = [];

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected: number = 1;
  public counter = Array;
  private modalRef: NgbModalRef;
  private modalOptions: NgbModalOptions;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  error_data = (ERROR_DATA as any).default;

  showForm = false;
  public loading = true;
  constructor(
    private modalService: NgbModal,
    private noteService: NoteService,
    private toastr: ToastDisplay,
    private fb: FormBuilder,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    if (this.clientId) {
      this.getNotes();
    }
  }

  private getNotes() {

    this.noteService
      .v1NotePersonListPersonIdGet({ personId: this.clientId })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwNote>;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.originalNotes = res;
            this.notes = [...this.originalNotes];

            this.page.totalElements = this.originalNotes.length;
            this.page.totalPages = Math.ceil(
              this.originalNotes.length / this.page.size
            );
          }
          this.loading = false;
        },
        err => {
          this.loading = false;
        }
      );
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(this.notes.length / this.page.size);
    this.table.offset = 0;
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

  /**
   * add edit note
   * @param content
   */
  public addEditNote(row: vwNote, $event) {
    if (row && $event) {
      $event.target.closest('datatable-body-cell').blur();
    }
    let modalRef = this.modalService.open(AddClientNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });

    modalRef.componentInstance.clientId = this.clientId;
    modalRef.componentInstance.type = 'Client';
    modalRef.componentInstance.name = 'Client Note';

    if (row) {
      modalRef.componentInstance.noteDetails = row;
    }
    modalRef.result.then(result => {
      if (result === 'add') {
        this.toastr.showSuccess(this.error_data.add_note_success);
      }
      if (result === 'edit') {
        this.toastr.showSuccess(this.error_data.update_note_success);
      }
      if (result) {
        this.getNotes();
      }
    }, reason => {
    });
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
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  deleteNote(row: vwNote, $event) {
    $event.target.closest('datatable-body-cell').blur();

    this.dialogService
      .confirm(this.error_data.delete_note_confirm, 'Delete', 'Cancel','Delete Note')
      .then(res => {
        if (res) {
          this.deleteClientNote(row);
        }
      });
  }

  private deleteClientNote(note: vwNote) {
    this.noteService
      .v1NotePersonRemovePersonIdNoteIdDelete({
        personId: this.clientId,
        noteId: note.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.delete_note_success);
            this.getNotes();
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {}
      );
  }

  cancel() {
    this.showForm = false;
    this.modalRef.close();
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
