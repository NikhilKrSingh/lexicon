import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { UsioService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-owner-confirmation',
  templateUrl: './owner-confirmation.component.html',
  styleUrls: ['./owner-confirmation.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class OwnerConfirmationComponent implements OnInit {
  public loading:boolean = false;
  public params: { bankAccountId?: number; guid?: string; tenantId?: number; } = null;

  constructor(
    private usioService: UsioService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(DOCUMENT) readonly document: Document,
    private toast: ToastDisplay
  ) { }

  ngOnInit() {
    this.loading = true;
    this.route.queryParams.subscribe(parameter => {
      this.params = {
        bankAccountId: +parameter.Id,
        guid: parameter.guid,
        tenantId: +parameter.tenantId
      };
      this.updateEsignStatus();
    });
  }

  /**** Updates Esign status *****/
  public async updateEsignStatus() {
    try {
      const resp:any = await this.usioService
        .v1UsioUpdateEsignStatusPost(this.params)
        .toPromise();
        if(JSON.parse(resp as any).results == 'success') {
          this.loading = false;
          this.redirect(`https://devenroll.securepds.com/click_to_agree.aspx?id=${this.params.guid}`);
        } else {
          this.toast.showError('Something went wrong');
          this.loading = false;
        }
    } catch (error) {
      this.loading = false;
    }
  }

  /** Redirects to the specified external link **/
  public redirect(url: string): Promise<boolean> {
    return new Promise<boolean>( (resolve, reject) => {
     try { resolve(!!this.document.defaultView.window.open(url, '_self')); }
     catch(e) { reject(e); }
    });
  }
}
