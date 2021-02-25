import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-reopen-matter',
  templateUrl: './reopen-matter.component.html',
  styleUrls: ['./reopen-matter.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReopenMatterComponent implements OnInit {
  changeNotes: string;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {}

  dismiss() {
    this.activeModal.close({
      reopen: false
    });
  }

  close() {
    this.activeModal.close({
      reopen: true,
      changeNotes: this.changeNotes
    });
  }
}
