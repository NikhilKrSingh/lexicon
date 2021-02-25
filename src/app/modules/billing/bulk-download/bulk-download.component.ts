import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import * as JSZip from 'jszip';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { BillingService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-bulk-download',
  templateUrl: './bulk-download.component.html',
  styleUrls: ['./bulk-download.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BulkDownloadComponent implements OnInit {
  error_data = (errors as any).default;
  loading = true;

  timeToCloseWarningMessage = 6000;

  constructor(
    private activatedRoute: ActivatedRoute,
    private billingService: BillingService,
    private pagetitle: Title,
    private toastr: ToastDisplay
  ) {
    this.pagetitle.setTitle('Bulk Download Invoices');

    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['token']) {
        this.downloadInvoices(params['token']);
      } else {
        this.toastr.showError('Please supply valid token.');
      }
    });
  }

  ngOnInit() {}

  private downloadInvoices(guid: any) {
    this.billingService
      .v1BillingBulkDownloadFromLinkGet({
        downloadGuid: guid,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res: Array<any>) => {
          if (res) {
            let files = res.map((invoice) => {
              return UtilsHelper.base64toFile(
                invoice.data,
                `invoice_${invoice.invoiceId}_${moment(new Date()).format(
                  'MMDDYYYYHHMMSS'
                )}.pdf`,
                'application/pdf'
              );
            });

            if (files.length > 1) {
              const zip = new JSZip();
              const name = 'Invoices.zip';

              files.forEach((f) => {
                zip.file(f.name, f);
              });

              zip.generateAsync({ type: 'blob' }).then((content) => {
                if (content) {
                  this.toastr.showSuccess(this.error_data.download_bulk_success);
                  saveAs(content, name);
                  setTimeout(() => {
                    window.open('', '_parent', '');
                    window.close();
                  }, this.timeToCloseWarningMessage);
                }
              });
            } else {
              saveAs(files[0]);
              this.toastr.showSuccess(this.error_data.download_single_success);
              setTimeout(() => {
                window.open('', '_parent', '');
                window.close();
              }, this.timeToCloseWarningMessage);
            }
          } else {
            this.toastr.showError(this.error_data.server_error);
          }
        },
        () => {
          setTimeout(() => {
            window.open('', '_parent', '');
            window.close();
          }, this.timeToCloseWarningMessage);
        }
      );
  }
}
