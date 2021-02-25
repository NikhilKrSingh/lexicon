import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';
import { RequestBuilder } from 'src/common/swagger-providers/request-builder';
import { StrictHttpResponse } from 'src/common/swagger-providers/strict-http-response';
import { FirmTrustAccountModel } from '../modules/models/firm-trust-bank-account-model';
import { MatterTrustAccountModel } from '../modules/models/matter-trust-account.model';
import { PropertyHeldInTrustModel } from '../modules/models/propert-held-in-trust.model';
import { TrustOnlyAccountsModel } from '../modules/models/trust-only-account.model';

@Injectable({
  providedIn: 'root'
})
export class TrustAccountService extends BaseService {
  readonly V1TrustOnlyAccountGetPath = '/v1/TrustAccount/AddTrustOnlyAccount';
  readonly V1DeleteTrustOnlyAccountGetPath = '/v1/TrustAccount/DeleteTrustOnlyAccount/{Id}';
  readonly V1UpdateTrustOnlyAccountPutPath = '/v1/TrustAccount/UpdateTrustOnlyAccount';
  readonly V1TrustAccountsAllGetPath = '/v1/TrustAccount/GetAllTrustAccounts';
  readonly V1PropertyHeldInTrustPath = '/v1/TrustAccount/AddPropertyHeldInTrust';
  readonly V1UpdatePropertyHeldInHeldPutPath = '/v1/TrustAccount/UpdatePropertyHeldInTrust';
  readonly V1PropertyHeldInTrustGetPath = '/v1/TrustAccount/GetAllPropertyHeldInTrust';
  readonly V1DeletePropertyHeldInTrustGetPath = '/v1/TrustAccount/DeletePropertyHeldInTrust/{Id}';
  readonly V1MatterTrustAccountInfoGetPath = '/v1/TrustAccount/GetMatterTrustAccountInfo';
  readonly V1GetTrustAccountStatusPath = '/v1/TrustAccount/GetTrustAccountStatus';
  readonly V1AddMatterTrustAccountInfoGetPath = '/v1/TrustAccount/AddMatterTrustAccount';
  readonly V1UpdateMatterTrustAccountInfoGetPath = '/v1/TrustAccount/UpdateMatterTrustAccount';
  readonly V1GetAllFirmTrustBankAccountsPath = '/v1/TrustAccount/GetAllFirmTrustBankAccounts';
  readonly V1DeleteFirmTrustBankAccountPath = '/v1/TrustAccount/DeleteFirmTrustBankAccount/{Id}';
  readonly V1GetOfficeListFirmTrustBankAccountPath = '/v1/TrustAccount/GetOfficeListFirmTrustBankAccount';
  readonly V1DeleteFirmCreditBankAccountPath = '/v1/TrustAccount/DeleteFirmCreditBankAccount/{Id}';
  readonly V1GetOfficeListFirmCreditBankAccountPath = '/v1/TrustAccount/GetOfficeListFirmCreditBankAccount';
  readonly V1GetAllFirmCreditCardAccountsPath = '/v1/TrustAccount/GetAllFirmCreditCardAccounts';
  readonly V1UpdateTrustAccountingStatusPath = '/v1/TrustAccount/UpdateTrustAccountingStatus';
  readonly V1AddFirmTrustBankAccountPath = '/v1/TrustAccount/AddFirmTrustBankAccount';
  readonly V1UpdateFirmTrustBankAccountPath = '/v1/TrustAccount/UpdateFirmTrustBankAccount';
  readonly V1AddFirmCreditCardTrustAccountGetPath = '/v1/TrustAccount/AddFirmCreditCardTrustAccount';
  readonly V1UpdateFirmCreditCardTrustAccountGetPath = '/v1/TrustAccount/UpdateFirmCreditCardTrustAccount';

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  AddTrustOnlyAccount(model: TrustOnlyAccountsModel): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1TrustOnlyAccountGetPath, 'post');
    if (model) {
      rb.body(model, 'application/json');
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

  UpdateTrustOnlyAccounts$Json$Response(params?: {

    body?: TrustOnlyAccountsModel
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1UpdateTrustOnlyAccountPutPath, 'put');
    if (params) {
      rb.body(params.body, 'application/json');
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

  DeleteTrustOnlyAccountDelete$Response(params: {
    id: number;
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1DeleteTrustOnlyAccountGetPath, 'delete');
    if (params) {
      rb.path('Id', params.id);
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

  getAllTrustAccounts(params?: {
    matterId?: number;
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.config.rootUrl, this.V1TrustAccountsAllGetPath, 'get');
    if (params) {
      rb.query('matterId', params.matterId);
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

  deletePropertyHeldInTrust$Response(params: {
    id: number;
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1DeletePropertyHeldInTrustGetPath, 'delete');
    if (params) {
      rb.path('Id', params.id);
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

  AddPropertyHeldInTrust(model: PropertyHeldInTrustModel): Observable<StrictHttpResponse<void>> {
    var data: any = model;
    const rb = new RequestBuilder(this.config.rootUrl, this.V1PropertyHeldInTrustPath, 'post');
    if (data) {
      rb.body(data, 'application/json');
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

  updatePropertyHeldInTrust$Json$Response(params?: {

    body?: PropertyHeldInTrustModel
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1UpdatePropertyHeldInHeldPutPath, 'put');
    if (params) {
      rb.body(params.body, 'application/json');
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

  getAllPropertyHeldInTrust$Response(params?: {
    matterId?: number;

  }): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1PropertyHeldInTrustGetPath, 'get');
    if (params) {
      rb.query('matterId', params.matterId);
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

  getMatterTrustAccountDetails$Response(params?: {
    matterId?: number;
    clientId?: number;
  }): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1MatterTrustAccountInfoGetPath, 'get');
    if (params) {
      rb.query('matterId', params.matterId);
      rb.query('clientId', params.clientId);
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

  getTrustAccountStatus(): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1GetTrustAccountStatusPath, 'get');
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

  createMatterTrustAccountDetails$Response(model: MatterTrustAccountModel): Observable<StrictHttpResponse<void>> {
    var data: any = {
      MinimumTrustBalance: model.minimumTrustBalance,
      TrustBalanceGracePeriod: model.trustBalanceGracePeriod,
      TargetAccountForOverPayment: model.targetAccountForOverPayment,
      MatterId: model.MatterId,
      ClientId: model.ClientId
    };
    const rb = new RequestBuilder(this.config.rootUrl, this.V1AddMatterTrustAccountInfoGetPath, 'post');
    if (data) {
      rb.body(data, 'application/json');
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

  updateMatterTrustInfo$Json$Response(params?: {
    body?: any
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1UpdateMatterTrustAccountInfoGetPath, 'put');
    if (params) {
      rb.body(params.body, 'application/json');
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

  updateTrustAccountingStatus(params?: {
    body?: any
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1UpdateTrustAccountingStatusPath, 'put');
    if (params) {
      rb.body(params.body, 'application/json');
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

  addFirmTrustBankAccount(model): Observable<StrictHttpResponse<void>> {
    var data: any = model;
    const rb = new RequestBuilder(this.config.rootUrl, this.V1AddFirmTrustBankAccountPath, 'post');
    if (data) {
      rb.body(data, 'application/json');
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

  updateFirmTrustBankAccount(params?: {

    body?: any
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1UpdateFirmTrustBankAccountPath, 'put');
    if (params) {
      rb.body(params.body, 'application/json');
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


  getAllFirmTrustBankAccounts(params?: {
    matterId?: number;

  }): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1GetAllFirmTrustBankAccountsPath, 'get');
    if (params) {
      rb.query('matterId', params.matterId);
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

  getOfficeListFirmTrustBankAccount(params?: {
    firmTrustBankAccountId?: number;

  }): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1GetOfficeListFirmTrustBankAccountPath, 'get');
    if (params) {
      rb.query('firmTrustBankAccountId', params.firmTrustBankAccountId);
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

  deleteFirmTrustBankAccount(params: {
    id: number;
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1DeleteFirmTrustBankAccountPath, 'delete');
    if (params) {
      rb.path('Id', params.id);
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

  
  getAllFirmCreditCardAccounts(params?: {
    matterId?: number;

  }): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1GetAllFirmTrustBankAccountsPath, 'get');
    if (params) {
      rb.query('matterId', params.matterId);
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

  createFirmCreditCard$Response(model: FirmTrustAccountModel): Observable<StrictHttpResponse<void>> {
    var data: any = {
      isCreditCardBankAccount: model.isCreditCardBankAccount,
      AccountName: model.accountName,
      AccountNumber: model.accountNumber,
      RoutingNumber: model.routingNumber,
    };
    const rb = new RequestBuilder(this.config.rootUrl, this.V1AddMatterTrustAccountInfoGetPath, 'post');
    if (data) {
      rb.body(data, 'application/json');
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

  updateFirmCreditCard$Reponse(params?: {
    body?: FirmTrustAccountModel
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1UpdateTrustAccountingStatusPath, 'put');
    if (params) {
      rb.body(params.body, 'application/json');
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

  getOfficeListFirmCreditBankAccount(params?: {
    firmCreditBankAccountId?: number;

  }): Observable<StrictHttpResponse<void>> {

    const rb = new RequestBuilder(this.rootUrl, this.V1GetOfficeListFirmCreditBankAccountPath, 'get');
    if (params) {
      rb.query('firmCreditBankAccountId', params.firmCreditBankAccountId);
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

  deleteFirmCreditBankAccount(params: {
    id: number;
  }): Observable<StrictHttpResponse<void>> {
    const rb = new RequestBuilder(this.rootUrl, this.V1DeleteFirmCreditBankAccountPath, 'delete');
    if (params) {
      rb.path('Id', params.id);
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
}