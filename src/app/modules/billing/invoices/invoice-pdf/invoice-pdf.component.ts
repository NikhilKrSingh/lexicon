import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';

@Component({
  selector: 'app-invoice-pdf',
  templateUrl: './invoice-pdf.component.html',
  styleUrls: ['./invoice-pdf.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class InvoicePdfComponent implements OnInit, OnDestroy {
  public invoiceId: number;
  public matterId: number;
  public print: number;
  public email: number;
  public pClientId: number;
  public state: string = '';

  invoiceDetails: vwInvoice;
  loader = true;

  downloadInvoiceCompleteSub: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};
  constructor(
    private activateRoute: ActivatedRoute,
    private invoiceService: InvoiceService,
    private router: Router,
    private pagetitle: Title,
    private store: Store<fromRoot.AppState>,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.downloadInvoiceCompleteSub = this.invoiceService.downloadInvoiceComplete$.subscribe(() => {
      this.loader = false;
    });
  }

  loaderCallback = () => {
    this.loader = false;
  };

  ngOnInit() {
    this.pagetitle.setTitle('Print Invoice');
    this.activateRoute.queryParams.subscribe((params) => {
      this.invoiceId = +params['invoiceId'];
      this.matterId = +params['matterId'];
      this.print = +params['print'];
      this.email = +params['email'];
      this.pClientId = +params['pClientId'];
    });
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (!this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit && !this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin) {
            this.state = 'view';
          }
          if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit || this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin) {
            this.state = 'edit';
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.downloadInvoiceCompleteSub) {
      this.downloadInvoiceCompleteSub.unsubscribe();
    }
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    localStorage.setItem('Billing_SelectedTab', 'Invoices');
  }

  getInvoiceDetails($event) {
    this.invoiceDetails = $event;
  }

  printInvoice() {
    this.loader = true;
    this.invoiceService.printInvoice$.next(true);
  }

  goToInvoices() {
    localStorage.setItem('Billing_SelectedTab', 'Invoices');
    this.router.navigate(['/billing']);
  }

  gotoMatter() {
    this.router.navigate(['/matter/dashboard'], {
      queryParams: {
        matterId: this.matterId,
      },
    });
  }

  gotoPotentialClientProfile() {
    this.router.navigate(['/contact/view-potential-client'], {
      queryParams: {
        clientId: this.pClientId,
        state: this.state
      },
    });
  }
}
