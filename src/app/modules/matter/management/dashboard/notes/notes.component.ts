import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as ERROR_DATA from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwIdName, vwNote } from 'src/common/swagger-providers/models';
import { NoteService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../../store';
import * as fromPermissions from '../../../../../store/reducers/permission.reducer';
import { AddMatterNoteComponent } from '../add-note/add-note.component';

@Component({
  selector: 'app-matter-dashboard-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterDashboardNotesComponent implements OnInit, OnDestroy {
  @Input() matterId: number;

  notes: Array<vwNote> = [];
  originalNotes: Array<vwNote> = [];

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  searchForm: FormGroup;
  expanded = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  error_data = (ERROR_DATA as any).default;

  visibleToClientList: vwIdName[];
  authorList: vwIdName[] = [];

  public loading = false;

  constructor(
    private modalService: NgbModal,
    private noteService: NoteService,
    private toastr: ToastDisplay,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.searchForm = this.fb.group({
      author: null,
      isVisibleToClient: null,
      createdStartDate: null,
      createdEndDate: null
    });

    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });

    this.permissionList$ = this.store.select('permissions');

    this.visibleToClientList = [
      {
        id: 1,
        name: 'Yes'
      },
      {
        id: 2,
        name: 'No'
      }
    ];
  }

  ngOnInit() {
    if (this.matterId) {
      this.getNotes();
    }
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getNotes() {
    this.loading = true;
    this.noteService
      .v1NoteMatterListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwNote>;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(res => {
        this.loading = false;
        if (res && res.length >= 0) {
          res.forEach(a => {
            if (a.lastUpdated) {
              a.lastUpdated = a.lastUpdated + 'Z';
            }
          });
          this.originalNotes = res;
          this.notes = [...this.originalNotes];

          this.authorList = this.notes
            .filter(a => a.createdBy)
            .map(a => {
              return a.createdBy;
            });

          this.authorList = _.uniqBy(this.authorList, a => a.id);

          this.page.totalElements = this.originalNotes.length;
          this.page.totalPages = Math.ceil(
            this.originalNotes.length / this.page.size
          );
          this.updateDatatableFooterPage();
        }
      });
  }

  toggleExpandRow(row: vwNote) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  toggleMaster() {
    this.expanded = !this.expanded;
    if (this.expanded) {
      this.table.rowDetail.expandAllRows();
    } else {
      this.table.rowDetail.collapseAllRows();
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
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

  updateDatatableFooterPage() {
    this.page.totalElements = this.originalNotes.length;
    this.page.totalPages = Math.ceil(
      this.originalNotes.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
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
    this.updateDatatableFooterPage();
  }

  addNote() {
    const modalRef = this.modalService.open(AddMatterNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
      windowClass: 'modal-lmd'
    });

    modalRef.result.then(res => {
      if (res) {
        this.addMatterNote(res);
      }
    });
  }

  private addMatterNote(note: vwNote) {
    this.loading = true;
    this.noteService
      .v1NoteMatterAddMatterIdPost$Json({
        matterId: this.matterId,
        body: note
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.loading = false;
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.add_note_success);
            this.getNotes();
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  hasValue(key: string) {
    return !!this.searchForm.controls[key].value;
  }

  clearDate(key: string) {
    if (key == 'lastUpdated') {
      this.searchForm.patchValue({ lastUpdated: null });
    } else {
      this.searchForm.patchValue({ applicableDate: null });
    }
  }

  public searchFilter($event) {
    const val = $event.target.value;
    const temp = this.originalNotes.filter(
      item =>
        UtilsHelper.matchName(item.createdBy, val, 'name') ||
        UtilsHelper.matchName(item, val, 'content')
    );
    // update the rows
    this.notes = temp;
    // Whenever the filter changes, always go back to the first page
    this.page.totalElements = this.notes.length;
    this.page.totalPages = Math.ceil(
      this.notes.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  editNote(row: vwNote, $event) {
    $event.target.closest('datatable-body-cell').blur();

    const modalRef = this.modalService.open(AddMatterNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
      windowClass: 'modal-lmd'
    });

    const component: AddMatterNoteComponent = modalRef.componentInstance;
    component.note = { ...row };

    modalRef.result.then(res => {
      if (res) {
        this.updateMatterNote(res);
      }
    });
  }

  private updateMatterNote(note: vwNote) {
    this.loading = true;
    this.noteService
      .v1NoteMatterUpdateMatterIdPut$Json({
        matterId: this.matterId,
        body: note
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.loading = false;
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.update_note_success);
            this.getNotes();
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  deleteNote(row: vwNote, $event) {
    $event.target.closest('datatable-body-cell').blur();

    this.dialogService
      .confirm(this.error_data.delete_note_confirm, 'Delete', 'Cancel','Delete Note')
      .then(res => {
        if (res) {
          this.deleteMatterNote(row);
        }
      });
  }

  private deleteMatterNote(note: vwNote) {
    this.loading = true;
    this.noteService
      .v1NoteMatterRemoveMatterIdNoteIdDelete({
        matterId: this.matterId,
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
          this.loading = false;
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.delete_note_success);
            this.getNotes();
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
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
