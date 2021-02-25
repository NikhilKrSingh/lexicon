import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IndexDbService } from 'src/app/index-db.service';
import { ContactsService, MatterService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-unsaved-changed-dialog',
  templateUrl: './unsaved-changed-dialog.component.html',
  styleUrls: ['./unsaved-changed-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class UnsavedChangedDialogComponent implements OnInit {
  @Input() isEditChargeDialog: boolean;

  public clientId: number;

  constructor(
    private activeModal: NgbActiveModal,
    private matterService: MatterService,
    private indexDbService: IndexDbService,
    private contactsService: ContactsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.clientId = (params.clientId) ? +params.clientId : null;
    });
  }

  ngOnInit() {}

  close() {
    this.activeModal.close(false);
  }

  continueWithoutSaving() {
    this.activeModal.close(true);
  }
}
