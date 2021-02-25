import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwPracticeAreaList } from 'src/app/modules/models/firm-settinngs.model';
import { vwMatterType } from 'src/common/swagger-providers/models';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-matter-type',
  templateUrl: './matter-type.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterTypeComponent implements OnInit {
  matterType: vwMatterType = {
    id: null,
    name: '',
    practiceId: null,
    practice: null,
    practices: []
  };
  practiceAreas: Array<vwPracticeAreaList>;
  public matterTypeNameErrMsg: '';
  public matterTypePracticeAreasErrMsg = '';

  error_data = (errors as any).default;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay
  ) { }

  ngOnInit() { }

  dismiss() {
    this.activeModal.close(false);
  }

  validateMatterType() {
    let isValid = true;
    this.matterTypeNameErrMsg = '';
    this.matterTypePracticeAreasErrMsg = '';
    if (!this.matterType.practiceId) {
      this.matterTypePracticeAreasErrMsg = this.error_data.associated_practice_area_error;
      isValid = false;
    }

    if (!this.matterType.name) {
      this.matterTypeNameErrMsg = this.error_data.matter_type_name_error;
      isValid = false;
    }
    return isValid;
  }


  ok() {
    let isValid = this.validateMatterType();
    if (isValid) {
      if (this.matterType.name && this.matterType.practiceId) {
        this.activeModal.close(this.matterType);
      }
    }
    else {
      return;
    }
  }
}
