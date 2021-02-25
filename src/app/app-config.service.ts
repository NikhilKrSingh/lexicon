import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';

export interface IAppSettings {
  API_URL: string;
  SWAGGER_PATH: string;
  SWAGGER_SUB_PATH: string;
  calendar_key?: string;
  brand: string;
  cpmg_domain: string;
  default_logo?: string;
  Common_Logout: string;
  Common_Login: string;
  Common_API: string;
  intervalTime: number;
  timerSyncInterval: number;
  logRocketEnabled?: string;
  logRocketAppId?: string;
  environment?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private webConfigUrl = 'assets/web.config.json';

  appConfig: IAppSettings = <IAppSettings>{};

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];

  constructor(
    private httpClient: HttpClient,
    private swaggerApiConfig: ApiConfiguration
  ) {}

  loadCofig() {
    return new Promise<boolean>((resolve, reject) => {
      this.httpClient
        .get<IAppSettings>(this.webConfigUrl)
        .toPromise()
        .then(
          (res) => {
            this.appConfig = res;
            this.swaggerApiConfig.rootUrl = this.appConfig.API_URL;
            resolve(true);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }
}
