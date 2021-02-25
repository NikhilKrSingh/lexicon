import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-warning-message-dialog',
  templateUrl: './warning-message-dialog.component.html',
  styleUrls: ['./warning-message-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WarningMessageDialogComponent implements OnInit {

  @Input() warningMessage: string;
  constructor(private activeModal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  close() {
    this.activeModal.close(false);
  }
}
