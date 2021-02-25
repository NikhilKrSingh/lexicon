import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent implements OnInit {
  message: string;
  okButtonText = 'Ok';
  cancelButtonText = 'Cancel';
  title = 'Confirm';
  icon = true;
  dispConfirmBtn = true;
  bulletList: Array<string> = null;
  btnLight = false;

  constructor(private activeModal: NgbActiveModal) {
    this.message = 'Are you sure?';
  }

  ngOnInit() {}

  dismiss() {
    this.activeModal.close(false);
  }

  ok() {
    this.activeModal.close(true);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
