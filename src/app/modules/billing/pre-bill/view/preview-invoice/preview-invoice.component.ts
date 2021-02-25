import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwBillNowModel } from 'src/common/swagger-providers/models';
import { MatterService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-preview-pre-bill-invoice',
  templateUrl: './preview-invoice.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class PreviewPreBillInvoiceComponent implements OnInit {
  public matterId: number;
  public preBillId: string;
  public billNowModel: vwBillNowModel;
  public matterDetails: vwMatterResponse;

  loading = true;

  loaderCallback = () => {
    this.loading = false;
  };

  constructor(
    private route: ActivatedRoute,
    private matterService: MatterService,
    private toastr: ToastDisplay,
    private pagetitle: Title
  ) {
    this.billNowModel = {};
  }

  ngOnInit() {
    this.pagetitle.setTitle("Preview Invoice");
    this.route.queryParams.subscribe((params) => {
      this.billNowModel = {
        timeEntries: this.toNumberArray(params['timeEntries']),
        disbursements: this.toNumberArray(params['disbursements']),
        addOnIds: this.toNumberArray(params['addOns']),
        fixedFeeMappingIds: this.toNumberArray(params['fixedFees']),
        writeOffs: this.toNumberArray(params['writeOffs']),
      };

      this.preBillId = params['preBillId'];
      let matterId = params['matterId'];
      this.matterId = +matterId;
      if (matterId) {
        this.getMatterDetails();
      } else {
        this.toastr.showError('Please select a matter');
      }
    });
  }

  private toNumberArray(str: string) {
    if (str) {
      let arr = str.split(',').map((a) => +a);
      return arr;
    } else {
      return [];
    }
  }
  public getMatterDetails() {
    this.matterService
      .v1MatterMatterIdGet({ matterId: this.matterId })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.matterDetails = res;
      });
  }
}
