import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete-fixed-fee-write-down',
  templateUrl: './delete-write-down.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class DeleteFixedFeeWriteDownComponent implements OnInit {
  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {}

  dismiss() {
    this.activeModal.close(false);
  }

  ok() {
    this.activeModal.close(true);
  }
}
