import { Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { vwINotes } from 'src/app/modules/models';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as Constant from '../../../shared/const';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NotesComponent implements OnInit {
  @Output() readonly getNotes = new EventEmitter<Array<vwINotes>>();
  public errorData: any = (errorData as any).default;
  public noteForm: FormGroup = this.builder.group({
    applicableDate: ['', Validators.required],
    content: ['', [Validators.required]],
    isVisibleToClient: false
  });
  public showThis = false;
  public editRecord = false;
  public noteList: any = [];
  public originalNotes: any = [];
  public loginUser: any;
  public editObj: vwINotes;
  public currentActive: number = null;
  @ViewChild(DatatableComponent, {static: false}) notesTable: DatatableComponent;
  closeResult: string;
  public ColumnMode = ColumnMode;
  public messages = {emptyMessage: Constant.SharedConstant.NoDataFound};
  searchForm: FormGroup;
  authorList: any[];
  notesLoading = false;
  noteFormSubmitted = false;

  constructor(
    private builder: FormBuilder,
    private dialogService: DialogService,
    private modalService: NgbModal
  ) {
  }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
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

  getAuthorList() {
    this.authorList = this.noteList
      .filter(a => a.createdBy)
      .map(a => {
        return a.createdBy;
      });

    this.authorList = _.uniqBy(this.authorList, (a: any) => a.id);
  }

  /**
   * Add/Edit notes
   */
  save() {
    const data = {...this.noteForm.value};
    this.noteFormSubmitted = true;
    if (!this.noteForm.valid) {
      return;
    }
    this.noteFormSubmitted = false;
    if (data.applicableDate) {
      data.applicableDate =
        moment(data.applicableDate).format('YYYY-MM-DD') + 'T00:00:00.000Z';
    }
    if (this.editRecord) {
      this.noteForm.reset();
      this.noteForm.patchValue({isVisibleToClient: false});
      const record = this.noteList.findIndex(item => item.indexNumber === this.editObj.indexNumber);
      if (record > -1) {
        this.noteList[record].applicableDate = data.applicableDate;
        this.noteList[record].lastUpdated = new Date();
        this.noteList[record].content = data.content;
        this.noteList[record].isVisibleToClient = data.isVisibleToClient;
      }
      this.showThis = false;
      this.editRecord = false;
      this.noteList = [...this.noteList];
      this.originalNotes = [...this.noteList];
    } else {
      this.noteForm.reset();
      this.noteForm.patchValue({isVisibleToClient: false});
      data.name = 'Potential Client note';
      data.noteType = 'Potential Client';
      data.indexNumber = this.noteList.length;
      data.createdByName = (this.loginUser) ? (this.loginUser.lastName + ', ' + this.loginUser.firstName) : '';
      data.createdByEmail = (this.loginUser) ? this.loginUser.email : '';
      data.createdBy = {
        name: (this.loginUser) ? (this.loginUser.lastName + ', ' + this.loginUser.firstName) : '',
        email: (this.loginUser) ? this.loginUser.email : ''
      };
      data.lastUpdated = new Date();
      this.noteList.push(data);
      this.noteList = [...this.noteList];
      this.originalNotes = [...this.noteList];
    }
    this.modalService.dismissAll();
    this.getAuthorList();
    this.getNotes.emit(this.noteList);
  }

  public deleteNote(obj,$event = null) {
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
        const index = this.noteList.findIndex(item => item.indexNumber === obj.indexNumber);
        this.noteList.splice(index, 1);
        this.noteList = [...this.noteList];
        this.originalNotes = [...this.noteList];
        this.getNotes.emit(this.noteList);
        this.getAuthorList();
      }
    });
  }

  public editNote(obj, modalContent) {
    this.editObj = obj;
    this.editRecord = true;
    this.noteForm.patchValue({
      applicableDate: obj.applicableDate,
      content: obj.content,
      isVisibleToClient: obj.isVisibleToClient
    });
    this.openModal(modalContent, 'lg', 'modal-lmd');
  }

  cancelNote() {
    this.noteFormSubmitted = false;
    this.noteForm.reset();
    this.noteForm.patchValue({isVisibleToClient: false});
    this.modalService.dismissAll();
  }

}
