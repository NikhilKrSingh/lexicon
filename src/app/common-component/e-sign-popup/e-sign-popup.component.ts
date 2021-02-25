import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DmsService } from 'src/common/swagger-providers/services';

import HelloSign from 'hellosign-embedded';
import { map, finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';

@Component({
  selector: 'app-e-sign-popup',
  templateUrl: './e-sign-popup.component.html',
  styleUrls: ['./e-sign-popup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ESignPopupComponent implements OnInit {
  public signId: any = '';
  public client = new HelloSign();
  public signUrl: string = '';
  public clientId: any;
  public loading = false;

  constructor(
    private activateRoute: ActivatedRoute,
    private dmsService: DmsService,
    private toasterService: ToastDisplay
  ) {}

  ngOnInit() {
    this.loading = true;
    this.signId = this.activateRoute.snapshot.paramMap.get('id');
    this.getUrlDetails();
  }

  getUrlDetails() {
    this.dmsService
      .v1DmsSignIdGet({ id: this.signId })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res) {
            this.clientId = res.key;
            this.signUrl = res.url;
            this.loading = false;
            this.openEsignWindow();
          } else {
            this.loading = false;
            this.toasterService.showError('Signature not found. Please try again!');
          }
        },
        err => {
          this.loading = false;
          if (err && err.msg) {
            this.toasterService.showError(err.msg);
          }
        }
      );
  }

  openEsignWindow() {
    this.client.open(this.signUrl, {
      clientId: this.clientId,
      skipDomainVerification: true
    });
  }
}
