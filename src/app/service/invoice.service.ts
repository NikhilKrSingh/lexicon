import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';
import { vwSuccessBillToClient } from '../modules/models/bill-to-client.model';
import { SendEmailEvent, vwMessage } from '../modules/models/vw-invoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends BaseService {
  public V1postPaymentPath = '/v1/Billing/postPayment';
  public sendEmail$ = new EventEmitter<SendEmailEvent>();
  public downloadInvoice$ = new EventEmitter<number>();
  public downloadInvoiceComplete$ = new EventEmitter<boolean>();
  public refreshInvoiceList$ = new EventEmitter<boolean>();

  public saveInvoice = new EventEmitter<vwSuccessBillToClient>();
  public filter = new EventEmitter<string>();
  public printInvoice$ = new EventEmitter<boolean>();
  public message$ = new BehaviorSubject<vwMessage>(null);

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  getInvoicePDFHTML() {
    let url = 'assets/reports/invoice.html';
    return this.http.get(url, {
      headers: {
        'Content-Type': 'text/html',
      },
      responseType: 'text',
    });
  }

  printPDF(pdf: string, header = '') {
    let V1BillingPrintPdfPostPath = '/v1/Billing/printPDF?headerText=' + header;
    let url = this.config.rootUrl + V1BillingPrintPdfPostPath;

    return this.http.post<any>(url, pdf);
  }

  loadImage(path: string) {
    return this.http.get(path, { responseType: 'blob' });
  }
}
