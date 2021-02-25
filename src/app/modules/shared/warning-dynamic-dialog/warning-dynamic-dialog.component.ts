import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-warning-dynamic-dialog',
  templateUrl: './warning-dynamic-dialog.component.html',
  styleUrls: ['./warning-dynamic-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WarningDynamicDialogComponent implements OnInit {

  @Input() warningMessage: string;
  @Input() cancelBtnText:string;
  @Input() title:string;
  @Input() showOkButton :boolean = false;
  @Input() okBtnText:string;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  cancel() {
    this.activeModal.close(false);
  }
  submit(){
    this.activeModal.close(true);
  }
}
