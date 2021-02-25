import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwBillNowModel } from 'src/common/swagger-providers/models';
import { BillingService, MatterService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-ready-to-bill-preview-invoice',
  templateUrl: './preview-invoice.component.html',
  styleUrls: ['./preview-invoice.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReadyToBillPreviewInvoiceComponent implements OnInit {
  public matterId: number;
  public preBillId: string;
  public matterDetails: vwMatterResponse;
  public billNowModel: vwBillNowModel;

  loader = true;

  constructor(
    private route: ActivatedRoute,
    private matterService: MatterService,
    private toastr: ToastDisplay,
    private billingService: BillingService,
    private router: Router
  ) {}

  loaderCallback = () => {
    this.loader = false;
  };

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.preBillId = params['readyTobillId'];
      let matterId = params['matterId'];
      this.matterId = +matterId;

      this.billingService
        .v1BillingPrebillingPreBillIdGet({ preBillId: this.preBillId as any })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((response) => {
          this.billNowModel = {
            timeEntries: [],
            disbursements: [],
            addOnIds: [],
            fixedFeeMappingIds: [],
            writeOffs: [],
          };

          response.forEach((res) => {
            this.billNowModel.timeEntries = res['timeEntries'].map(
              (list) => list.id
            );

            this.billNowModel.disbursements = res['recordDisbursement'].map(
              (list) => list.id
            );

            this.billNowModel.addOnIds = res['addOnServices'].map(
              (list) => list.id
            );

            if (res['fixedFeeService']) {
              this.billNowModel.fixedFeeMappingIds = res['fixedFeeService'].id;
            }
          });
        });

      if (matterId) {
        this.getMatterDetails();
      } else {
        this.toastr.showError('Please select a matter');
      }
    });
  }

  public getMatterDetails() {
    this.matterService
      .v1MatterMatterIdGet({ matterId: this.matterId })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.matterDetails = res;
      });
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    localStorage.setItem('Billing_SelectedTab', 'Ready to Bill');
  }

  goToReadyToBill() {
    localStorage.setItem('Billing_SelectedTab', 'Ready to Bill');
    this.router.navigate(['/billing']);
  }
}
