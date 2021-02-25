import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  styleUrls: ['./warning-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WarningDialogComponent implements OnInit {

  constructor(private activeModal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  close() {
    this.activeModal.close(false);
  }

  save() {
    this.activeModal.close(true);
  }

}
