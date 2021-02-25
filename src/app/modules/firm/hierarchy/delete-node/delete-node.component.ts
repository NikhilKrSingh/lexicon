import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete-node',
  templateUrl: './delete-node.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class DeleteHierarchyNodeComponent implements OnInit {
  canDelete = false;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {}

  cancel() {
    this.activeModal.close(false);
  }

  ok() {
    this.activeModal.close(true);
  }
}
