import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateNoteError } from 'src/app/modules/models/fillable-form.model';
import { vwNote } from 'src/common/swagger-providers/models';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-add-matter-note',
  templateUrl: './add-note.component.html',
  styleUrls: ['./add-note.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddMatterNoteComponent implements OnInit {
  note: vwNote;
  isEdit: boolean;
  noteDataChanged = false;
  showWarning = false;
  createNoteError: CreateNoteError;
  public errorData: any = (errorData as any).default;
  public formSubmitted = false;

  constructor(
    private activeModal: NgbActiveModal,
  ) {
    this.note = {
      isVisibleToClient: false,
      applicableDate: null,
      content: null,
      id: 0
    } as vwNote;
    this.createNoteError = new CreateNoteError();
  }

  ngOnInit() {
  }

  dismiss() {
    this.activeModal.close(null);
  }

  close() {
    this.formSubmitted = true;
    if (!this.note.content || !this.note.applicableDate) {
      return;
    }
    let firstChar: string;
    if (this.note.content) {
      firstChar = this.note.content.charAt(0);
    }
    const pattern = '[a-zA-Z0-9_]';
    if (!firstChar.match(pattern)) {
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.errorData.insecure_input;
    } else {
      if (!this.note.id) {
        this.note.name = 'Matter Note';
        this.note.noteType = 'Matter';
      }
      this.activeModal.close(this.note);
    }
    this.formSubmitted = false;
  }

  onChange(event?: any) {
    this.noteDataChanged = true;
  }
}
