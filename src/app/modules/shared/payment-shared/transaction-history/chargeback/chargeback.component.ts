import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ILedgerHistory } from 'src/app/modules/models/ledger-history.model';
import * as errors from 'src/app/modules/shared/error.json';
import { removeAllBorders, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { MatterService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-chargeback',
  templateUrl: './chargeback.component.html',
  styleUrls: ['./chargeback.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ChargebackComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public chargeForm: FormGroup;
  public chargeDetails: Array<ILedgerHistory> = [];
  public selectedRow: ILedgerHistory;
  public viewMode: string = 'view';
  error_data = (errors as any).default;

  chargeBackLoading = false;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private matterService: MatterService,
    private toastr: ToastDisplay,
  ) { }

  ngOnInit() {
    this.chargeForm = this.fb.group({
      chargeBackReason: [null, Validators.required]
    })
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    if (this.chargeForm.valid && this.chargeDetails && this.chargeDetails.length > 0) {
      this.chargeBackLoading = true;
      this.matterService
      .v1MatterIssueChargebackPost$Json({body:
        {paymentId: this.chargeDetails[0].id, chargeBackReason: this.chargeForm.value.chargeBackReason}})
      .pipe(
        map(UtilsHelper.mapData)
      )
      .subscribe(res => {
        if (res > 0) {
          this.toastr.showSuccess(this.error_data.success_issue_chargeback);
          this.activeModal.close(true);
        } else {
          this.chargeBackLoading = false;
          this.toastr.showError(this.error_data.failed_issue_chargeback);
        }
      }, () => {
        this.chargeBackLoading = false;
      });
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
      removeAllBorders('app-chargeback');
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
