import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-practice-area',
  templateUrl: './practice-area.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.Emulated
})
export class PracticeAreaComponent implements OnInit {
  practieArea: any = {
    name: '',
    createdBy: '',
    createdDate: '',
    id: null
  };
  error_data = (errors as any).default;
  public practieAreaNameErrMsg = '';

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay
  ) { }

  ngOnInit() { }

  dismiss() {
    this.activeModal.close(false);
  }

  validatePracticeArea() {
    this.practieAreaNameErrMsg = '';
    if (!this.practieArea.name) {
      this.practieAreaNameErrMsg = this.error_data.practice_area_name_error;
      return
    }
  }

  ok() {
    if (this.practieArea.name) {
      this.activeModal.close(this.practieArea);
    } else {
      this.validatePracticeArea();
    }
  }
}
