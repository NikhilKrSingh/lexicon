import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { vwHierarchy, vwIdName } from 'src/common/swagger-providers/models';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-custom-level',
  templateUrl: './custom-level.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateCustomHierarchyLevelComponent implements OnInit {
  firmHierarchy: vwHierarchy[];
  firmDetails: Tenant;
  hierarchy: vwHierarchy;
  error_data = (errors as any).default;
  level: number;
  parentLevelEchelons: Array<vwIdName>;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay
  ) {
    this.hierarchy = {};
    this.parentLevelEchelons = [];
  }

  ngOnInit() {
    this.parentLevelEchelons = [];
    this.level = this.hierarchy.level - 1;
    if (this.firmDetails) {
      this.parentLevelEchelons.push({
        id: 0,
        name: this.firmDetails.name
      });
    }

    if (this.firmHierarchy) {
      this.firmHierarchy.forEach(h => {
        this.parentLevelEchelons.push({
          id: h.level,
          name: h.name
        });
      });
    }
  }

  cancel() {
    this.activeModal.close(false);
  }

  ok() {
    if (this.hierarchy.name) {
      this.activeModal.close(this.hierarchy);
    } else {
      this.toastr.showError(this.error_data.validation_required_fields);
    }
  }
}
