import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import { vwNote } from 'src/common/swagger-providers/models';
import { NoteService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-add-client-note',
  templateUrl: './add-client-note.component.html',
  styleUrls: ['./add-client-note.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddClientNoteComponent implements OnInit {
  public type: string;
  public name: string;
  public noteForm: FormGroup;
  public clientId: number;
  public matterId: number;
  public noteDetails: vwNote;
  public saveToDb = true;
  public formSubmitted = false;

  public placeholder = 'Enter Note Text';
  public loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private noteService: NoteService,
  ) {
    this.noteForm = this.fb.group({
      id: new FormControl(0),
      applicableDate: [null, [Validators.required]],
      content: ['', [Validators.required]],
      isVisibleToClient: false
    });
  }

  get f() {
    return this.noteForm.controls;
  }

  ngOnInit() {
    if (this.noteDetails) {
      this.noteForm.setValue({
        id: this.noteDetails.id,
        applicableDate: this.noteDetails.applicableDate,
        content: this.noteDetails.content,
        isVisibleToClient: this.noteDetails.isVisibleToClient
      });
    }
  }


  public close(item) {
    this.activeModal.close(item);
  }

  public save() {
    this.formSubmitted = true;

    if (this.noteForm.invalid) {
      return;
    }

    const data = {...this.noteForm.value};
    data.name = this.name;
    data.noteType = this.type;

    if (!this.saveToDb) {
      this.close(data);
      this.noteForm.reset();
      return;
    }
    this.loading = true;
    if (data.id === 0) {
      this.noteService
        .v1NotePersonAddPersonIdPost$Json({
          personId: this.clientId,
          body: data
        }).pipe(finalize(() => {
          this.loading = false;
          this.close('add');
        }))
        .subscribe(
          suc => {
            this.noteForm.reset();
          }, err => {
            console.log(err);
          }
        );
    } else {
      this.noteService
        .v1NotePersonUpdatePersonIdPut$Json({
          personId: this.clientId,
          body: data
        }).pipe(finalize(() => {
          this.loading = false;
          this.close('edit');
        }))
        .subscribe(
          suc => {
            this.noteForm.reset();
          },
          err => {
            console.log(err);
          }
        );
    }
  }

}
