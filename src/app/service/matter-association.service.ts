import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';

@Injectable({
  providedIn: 'root'
})
export class MatterAssociationService extends BaseService {
  /**
   * Path part for operation v1MatterGetassociationsMatterIdGet
   */
  static readonly path = '/v1/Matter/getassociations/';

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /**
   * This method provides access to only to the response body.
   * To access the full response (for headers, for example), `v1MatterGetassociationsMatterIdGet$Response()` instead.
   *
   * This method doesn't expect any response body
   */
  v1MatterGetassociationsMatterIdGet(params: {
    matterid: number;
    association?: string;
  }) {
    let url = this.config.rootUrl + MatterAssociationService.path + params.matterid + '?association=' + params.association;
    return this.http.get(url);
  }
}
