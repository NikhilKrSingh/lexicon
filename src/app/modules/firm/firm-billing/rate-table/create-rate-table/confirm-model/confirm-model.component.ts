import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-model',
  templateUrl: './confirm-model.component.html',
  styleUrls: ['./confirm-model.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ConfirmModelComponent implements OnInit {

  public effectiveDate: string = '';
  constructor(
    private activeModal: NgbActiveModal,
  ) { }

  ngOnInit() {
  }

  public close() {
    this.activeModal.close(null);
  }
  public editRateTable(item: string) {
    this.activeModal.close(item);
  }

}
