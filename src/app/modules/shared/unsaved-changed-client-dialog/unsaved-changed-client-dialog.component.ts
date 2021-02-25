import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IndexDbService } from 'src/app/index-db.service';
import { ContactsService, MatterService } from 'src/common/swagger-providers/services';
import { RateTableModalComponent } from '../rate-table-modal/rate-table-modal.component';

@Component({
  selector: 'app-unsaved-changed-dialog',
  templateUrl: './unsaved-changed-client-dialog.component.html',
  styleUrls: ['./unsaved-changed-client-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class UnsavedChangedClientDialogComponent implements OnInit {
  @Input() isCustomBillingRate: boolean;
  @Input() rateTables = [];

  public clientId: number;

  constructor(
    private activeModal: NgbActiveModal,
    private matterService: MatterService,
    private indexDbService: IndexDbService,
    private contactsService: ContactsService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.clientId = (params.clientId) ? +params.clientId : null;
    });
  }

  ngOnInit() {}

  setRateTable() {
    const modalRef = this.modalService.open(RateTableModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
      windowClass: 'modal-xlg'
    });
    modalRef.componentInstance.rateTables = this.rateTables;
    modalRef.result.then((result) => {
      this.rateTables = result;
      this.activeModal.close({rateTables: this.rateTables, isCustomBillingRate: true});
    }, () => {});
  }

  useEmployeeBaseRate() {
    this.activeModal.close({isCustomBillingRate: false});
  }

  closeModalWithoutSave() {
    this.activeModal.dismiss();
  }

  closeModal() {
    this.activeModal.close({rateTables: this.rateTables, isCustomBillingRate: this.isCustomBillingRate});
  }
}
