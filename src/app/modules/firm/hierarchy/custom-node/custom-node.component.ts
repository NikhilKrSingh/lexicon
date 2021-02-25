import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { vwPracticeAreaList } from 'src/common/models/vwPracticeAreaList';
import { vwEchelon, vwHierarchy } from 'src/common/swagger-providers/models';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-custom-node',
  templateUrl: './custom-node.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateCustomHierarchyNodeComponent implements OnInit {
  firmHierarchy: vwHierarchy[];
  firmDetails: Tenant;
  hierarchy : vwHierarchy[];
  parentLevelEchelons: Array<vwEchelon>;
  echelon: vwEchelon;
  practiceAreaList: vwPracticeAreaList[];
  error_data = (errors as any).default;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay
  ) {
    this.echelon = {};
    this.parentLevelEchelons = [];
  }

  ngOnInit() {
    this.firmHierarchy = _.sortBy(this.firmHierarchy, a => a.level);
    this.hierarchy = [...this.firmHierarchy];
    this.hierarchy = this.hierarchy.filter(a => a.id);
    this.setParentLevelEchelons();
  }

  cancel() {
    this.activeModal.close(false);
  }

  ok() {
    if (
      this.echelon.name &&
      this.echelon.hierarchyId &&
      this.echelon.parentId
    ) {
      this.activeModal.close(this.echelon);
    } else {
      this.toastr.showError(this.error_data.validation_required_fields);
    }
  }

  setParentLevelEchelons($event = null) {
    if (this.echelon.hierarchyId) {
      this.firmHierarchy.forEach((h, i) => {
        if (h.id == this.echelon.hierarchyId) {
          this.echelon.level = h.level;
          if (i > 0) {
            this.parentLevelEchelons = _.sortBy(
              this.firmHierarchy[i - 1].echelons,
              'name'
            );
            if($event) {
              this.echelon.parentId = null;
            }
          } else {
            this.echelon.parentId = this.firmDetails.id;
            this.parentLevelEchelons = [
              {
                id: this.firmDetails.id,
                name: this.firmDetails.name
              }
            ];
          }
        }
      });
    } else {
      this.echelon.parentId = null;
      this.parentLevelEchelons = [
        {
          id: this.firmDetails.id,
          name: this.firmDetails.name
        }
      ];
    }
  }
}
