import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs/Rx';
import { vwBillNowModel } from 'src/common/swagger-providers/models';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';

@Component({
  selector: 'app-bill-now-preview-invoice',
  templateUrl: './bill-now-preview-invoice.component.html',
  styleUrls: ['./bill-now-preview-invoice.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillNowPreviewInvoiceComponent implements OnInit, OnDestroy {

  public matterId: number;
  public clientId: any;

  public billNowModel: vwBillNowModel;
  public invoiceDetails: vwInvoice;

  loader = true;

  loaderCallback = () => {
    this.loader = false;
  };

  isWorkCompleteFlow: any;
  public isPCBilling: number;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  state: string;

  constructor(
    private route: ActivatedRoute,
    private pagetitle: Title,
    private store: Store<fromRoot.AppState>
  ) {
    this.pagetitle.setTitle('Preview Invoice');
    this.billNowModel = {};
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.billNowModel = {
        timeEntries: this.toNumberArray(params['timeEntries']),
        disbursements: this.toNumberArray(params['disbursements']),
        addOnIds: this.toNumberArray(params['addOns']),
        fixedFeeMappingIds: this.toNumberArray(params['fixedFees']),
        writeOffs: this.toNumberArray(params['writeOffs']),
        consultationFees: this.toNumberArray(params['consultationFeesId']),
      };
      this.isPCBilling =
        this.billNowModel &&
        this.billNowModel.consultationFees &&
        this.billNowModel.consultationFees.length;
      this.matterId = params['matterId'];
      this.clientId = +params['clientId'];
      this.isWorkCompleteFlow = params.isWorkCompleteFlow == 'true';
    });

    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin
          ) {
            this.state = 'edit';
          } else {
            this.state = 'view';
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private toNumberArray(str: string) {
    if (str) {
      let arr = str.split(',').map((a) => +a);
      return arr;
    } else {
      return [];
    }
  }

  getInvoiceDetails($event) {
    this.invoiceDetails = $event;
  }

}
