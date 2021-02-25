import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ColumnMode,
  DatatableComponent,
  SelectionType,
} from '@swimlane/ngx-datatable';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwTrustTransaction } from 'src/app/modules/models/vw-trust-transaction';
import * as errors from 'src/app/modules/shared/error.json';
import { removeAllBorders, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ReverseTransactionService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-charge-back-trust-transaction',
  templateUrl: './charge-back-trust-transaction.component.html',
  styleUrls: ['./charge-back-trust-transaction.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ChargeBackTrustTransactionComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public chargeForm: FormGroup;
  public chargeDetails: Array<vwTrustTransaction> = [];
  public selectedRow: vwTrustTransaction;
  public viewMode: string = 'view';
  error_data = (errors as any).default;

  chargeBackLoading = false;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private reverseTransactionService: ReverseTransactionService,
    private toastr: ToastDisplay
  ) {}

  ngOnInit() {
    this.chargeForm = this.fb.group({
      chargeBackReason: [null, Validators.required],
    });
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    if (
      this.chargeForm.valid &&
      this.chargeDetails &&
      this.chargeDetails.length > 0
    ) {
      this.chargeBackLoading = true;
      this.reverseTransactionService
        .v1ReverseTransactionChargebackPost$Json({
          body: {
            trustTransactionHistoryId: this.chargeDetails[0].id,
            chargeBackReason: this.chargeForm.value.chargeBackReason,
          },
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (res) => {
            if (res > 0) {
              this.toastr.showSuccess(this.error_data.success_issue_chargeback);
              this.activeModal.close(true);
            } else {
              this.toastr.showError(this.error_data.failed_issue_chargeback);
              this.chargeBackLoading = false;
            }
          },
          () => {
            this.chargeBackLoading = false;
          }
        );
    }
  }

  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  /**
   *
   * @param row Display
   */
  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-charge-back-trust-transaction');
    }
    this.table.rowDetail.toggleExpandRow(row);
    row.isExpanded1 = !row.isExpanded1;
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpanded1) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }
}
