import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-close-matter',
  templateUrl: './close-matter.component.html'
})
export class CloseMatterComponent implements OnInit {
  isPaid = true;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {}

  dismiss() {
    this.activeModal.close(false);
  }

  close() {
    this.activeModal.close(true);
  }
}
