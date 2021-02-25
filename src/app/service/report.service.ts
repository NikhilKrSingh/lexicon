import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';
import { RequestBuilder } from 'src/common/swagger-providers/request-builder';
import { StrictHttpResponse } from 'src/common/swagger-providers/strict-http-response';
import { arByCriteriaReportModels } from '../modules/models/ar-criteria.model';
import { ArLedgerReportModels } from '../modules/models/ar-ledger.model';
import { ArAgingModels } from '../modules/models/araging.model';
import { BaseHourModels } from '../modules/models/base-hours.model';
import { BillableHoursRollUpModels } from '../modules/models/billable-hours-rollup.model';
import { BilledHoursModels } from '../modules/models/billed-hours.model';
import { BillingActivityReportModels } from '../modules/models/billing-activity.model';
import { ConsultationActivityModels } from '../modules/models/consultation-activity.model';
import { CreditCardTransactionModels } from '../modules/models/creditcard-transaction.model';
import { MatterPaidVsTotalDetailsReport } from '../modules/models/matter-paid-total-detail.model';
import { MatterPaidVsTotalRollUpModels } from '../modules/models/matter-paid-vs-total-rollup.model';
import { MatterStatusModels } from '../modules/models/matter-status.model';
import { NetCreditBalanceModels } from '../modules/models/net-credit-balance.model';
import { PaymentHistoryModels } from '../modules/models/payment-history.model';
import { PotentialClientModels } from '../modules/models/potential-client.model';
import { TimeEntriesAttorneyModels } from '../modules/models/time-entry-attorney.model';
import { TotalAmountBilledModel } from '../modules/models/total-amount-billed.model';
import { TotalRealizationModels } from '../modules/models/totalrealization.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService extends BaseService {
  readonly V1BillingActivityGetPath = '/v1/Report/BillingActivityReport';
  readonly V1ReportingGetPathNetBalanceReport = '/v1/Report/NetCreditBalanceReport';
  readonly V1ReportingGetPath = '/v1/Report/CreditCardTransactionReport';
  readonly V1ArAgingGetPath = '/v1/Report/ArAgingReport';
  readonly V1TotoalAmountBilledGetPath = '/v1/Report/TotalAmountBilledWIPReport';
  readonly V1BilledHoursReportingGetPath = '/v1/Report/BilledHours';
  readonly V1TototalAmountBilledGetPath = '/v1/Report/TotalAmountBilledWIPReport';
  readonly V1PaymentHistoryGetPath = '/v1/Report/PaymentHistoryReport';
  readonly V1ArLedgerReportingGetPath = '/v1/Report/ArLedgerReport';
  readonly V1MatterPaidVsTotalDetailGetPath = '/v1/Report/MatterPaidVsTotalDetailReport';
  readonly V1BaseHourGetPath = '/v1/Report/BaseHoursReport';
  readonly V1MatterPaidVsTotalRollUpReportingGetPath = '/v1/Report/MatterPaidTotalRollUp';
  readonly V1BillableHoursRollUpReportingGetPath = '/v1/Report/BilledHoursRollUp';
  readonly V1TimeEntriesAttorneyGetPath = '/v1/Report/TimeEntryByAttorneyReport';
  readonly V1TimeKeeperInfoGetPath = '/v1/Report/GetAllTimeKeepers';
  readonly V1ConsultationActivityGetPath = '/v1/Report/ConsultationActivityReport';
  readonly V1PotentialClientGetPath = '/v1/Report/PotentialClientStatusRetentionReport';
  readonly V1TotalRealizationGetPath = '/v1/Report/TotalRealizationReport';
  readonly V1MatterStatusReportGetPath = '/v1/Report/MatterStatusReport';
  readonly V1ArByCriteriaGetPath = '/v1/Report/ArByCriteria';
  readonly V1MatterInfoGetPath = '/v1/Report/GetAllMatters';
  readonly V1OfficeInfoGetPath = '/v1/Report/GetAllOffices';
  readonly V1PracticeAreaInfoGetPath = '/v1/Report/GetAllPracticeAreas';
  readonly V1MatterTypeInfoGetPath = '/v1/Report/GetAllMatterTypes';
  readonly V1ResponsibleAttorneyInfoGetPath = '/v1/Report/GetResponsibleAttorney';
  readonly V1BillingAttorneyInfoGetPath = '/v1/Report/GetBillingAttorney';
  readonly V1TimeKeepersArByCriteriaReportGetPath = '/v1/Report/GetAllTimeKeepersArByCriteria';
  readonly V1GetBillingOrReposponsibleAttorneyGetPath = '/v1/Report/GetBillingOrReposponsibleAttorney';
  readonly V1GetConsultAttorneyGetPath = '/v1/Report/GetConsultAttorney';


  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  generateCreditCardTransactionReport(creditCardTransaction: CreditCardTransactionModels): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1ReportingGetPath, 'post');
    if (creditCardTransaction) {
      rb.body(creditCardTransaction, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }

  generateArAgingReport(arAging: ArAgingModels): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1ArAgingGetPath, 'post');
    if (arAging) {
      rb.body(arAging, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }

  generateTotalAmountBilledReport(totalAmountBilled: TotalAmountBilledModel): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1TototalAmountBilledGetPath, 'post');
    if (totalAmountBilled) {
      rb.body(totalAmountBilled, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }

  generatePaymentHistoryReport(paymentHistory: PaymentHistoryModels): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1PaymentHistoryGetPath, 'post');
    if (paymentHistory) {
      rb.body(paymentHistory, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateBilledHoursReport(billedHours: BilledHoursModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1BilledHoursReportingGetPath, 'post');
    if (billedHours) {
      rb.body(billedHours, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateArLedgerReport(arLedger: ArLedgerReportModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1ArLedgerReportingGetPath, 'post');
    if (arLedger) {
      rb.body(arLedger, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateNetCreditBalanceReport(netCreditBalance: NetCreditBalanceModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1ReportingGetPathNetBalanceReport, 'post');
    if (netCreditBalance) {
      rb.body(netCreditBalance, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateBillingActivityReport(billingActivity: BillingActivityReportModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1BillingActivityGetPath, 'post');
    if (billingActivity) {
      rb.body(billingActivity, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateMatterPaidVsTotalRollUpReport(MatterPaidVsTotalRollUpModels: MatterPaidVsTotalRollUpModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1MatterPaidVsTotalRollUpReportingGetPath, 'post');
    if (MatterPaidVsTotalRollUpModels) {
      rb.body(MatterPaidVsTotalRollUpModels, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateBillableHoursRollupReport(BillableHoursRollUpModels: BillableHoursRollUpModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1BillableHoursRollUpReportingGetPath, 'post');
    if (BillableHoursRollUpModels) {
      rb.body(BillableHoursRollUpModels, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateMatterPaidVsTotalDetailReport(matterPaidVsTotalDetail: MatterPaidVsTotalDetailsReport): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1MatterPaidVsTotalDetailGetPath, 'post');
    if (matterPaidVsTotalDetail) {
      rb.body(matterPaidVsTotalDetail, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateBaseHourReport(baseHour: BaseHourModels): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1BaseHourGetPath, 'post');
    if (baseHour) {
      rb.body(baseHour, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateTimeEntriesAttorneyReport(timeEntriesAttorney: TimeEntriesAttorneyModels): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1TimeEntriesAttorneyGetPath, 'post');
    if (timeEntriesAttorney) {
      rb.body(timeEntriesAttorney, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getTimekeepers():Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1TimeKeeperInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }

  generateConsultationActivityReport(consultationActivity: ConsultationActivityModels): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.config.rootUrl, this.V1ConsultationActivityGetPath, 'post');
    if (consultationActivity) {
      rb.body(consultationActivity, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }

  generatePotentialClientReport(potentialClient: PotentialClientModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1PotentialClientGetPath, 'post');
    if (potentialClient) {
      rb.body(potentialClient, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateTotalRealizationReport(totalrealization: TotalRealizationModels): Observable<StrictHttpResponse<void>> {   
    const rb = new RequestBuilder(this.config.rootUrl, this.V1TotalRealizationGetPath, 'post');
    if (totalrealization) {
      rb.body(totalrealization, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateMatterStatusReport(MatterStatusModels: MatterStatusModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1MatterStatusReportGetPath, 'post');
    if (MatterStatusModels) {
      rb.body(MatterStatusModels, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  generateArByCriteriaReport(arByCriteriaReportModels: arByCriteriaReportModels): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1ArByCriteriaGetPath, 'post');
    if (arByCriteriaReportModels) {
      rb.body(arByCriteriaReportModels, 'application/json');
    }
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getMatterList(isRAorBA: boolean):Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1MatterInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getOfficeList():Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1OfficeInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getPracticeAreaList():Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1PracticeAreaInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getMatterTypeList():Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1MatterTypeInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getResponsibleAttorneyList(isRAorBA: boolean):Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1ResponsibleAttorneyInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getBillingAttorneyList(isRAorBA: boolean):Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1BillingAttorneyInfoGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  getTimekeepersArbyCriteria(isRAorBA: boolean):Observable<StrictHttpResponse<void>>{
    const rb = new RequestBuilder(this.config.rootUrl, this.V1TimeKeepersArByCriteriaReportGetPath, 'get');
    return this.http.request(rb.build({
      responseType: 'text',
      accept: '*/*'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: undefined }) as StrictHttpResponse<void>;
      })
    );
  }
  async getBillingOrResponsibleAttorneyInfo(){
    return this.http.get(this.config.rootUrl + this.V1GetBillingOrReposponsibleAttorneyGetPath).toPromise();
  }
  async getConsultAttorneyInfo(){
    return this.http.get(this.config.rootUrl + this.V1GetConsultAttorneyGetPath).toPromise();
  }
}
