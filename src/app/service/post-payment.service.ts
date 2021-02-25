import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { vwResultSet } from 'src/common/models/vwResultSet';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';
import { vwPaymentToMatterResponse } from '../modules/models/post-payment-response';
import { vwPartialPaymentSuccess } from '../modules/models/vw-invoice-compact';

@Injectable({
  providedIn: 'root',
})
export class PostPaymentService extends BaseService {
  public readonly V1postPaymentPath = '/v1/Billing/postPayment';
  public readonly V1postEventFile = '/v1/Calendar/upload/';
  public readonly v1PartialPaymentCheckPath = '/v1/Billing/partialPaymentCheck';
  public readonly V1BillingPostPaymentToMatterBalancePostPath = '/v1/Billing/PostPaymentToMatterBalance';

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  v1PostPaymentPost(formdata: FormData) {
    let url = this.config.rootUrl + this.V1postPaymentPath;
    return this.http.post<vwResultSet<number>>(url, formdata);
  }

  v1PostPaymentPostToMatterBalance(formdata: FormData) {
    let url = this.config.rootUrl + this.V1BillingPostPaymentToMatterBalancePostPath;
    return this.http.post<vwResultSet<vwPaymentToMatterResponse>>(url, formdata);
  }

  v1BillingPartialPaymentCheckPost(formdata: FormData) {
    let url = this.config.rootUrl + this.v1PartialPaymentCheckPath;
    return this.http.post<vwPartialPaymentSuccess>(url, formdata);
  }

  v1EventFilePost(formdata: FormData, eventId) {
    let url = this.config.rootUrl + this.V1postEventFile + eventId;
    return this.http.post<vwResultSet<number>>(url, formdata);
  }
}
