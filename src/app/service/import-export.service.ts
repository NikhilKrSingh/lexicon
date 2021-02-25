import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';
import { vwResultImportArr } from '../modules/models/vwResultImport';

@Injectable({
  providedIn: 'root'
})
export class ImportExportService extends BaseService {
  public V1importOfficePath = '/v1/Import/';

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  v1ImportOfficePost(file: File) {
    const formdata = new FormData();
    if (file) {
      formdata.append('', file);
    }
    let url = this.config.rootUrl + this.V1importOfficePath + "office";
    return this.http.post<vwResultImportArr<any>>(url, formdata);
  }

  v1ImportEmployeePost(file: File) {
    const formdata = new FormData();
    if (file) {
      formdata.append('', file);
    }
    let url = this.config.rootUrl + this.V1importOfficePath + "employee";
    return this.http.post<vwResultImportArr<any>>(url, formdata);
  }

  v1ImportClientPost(file: File) {
    const formdata = new FormData();
    if (file) {
      formdata.append('', file);
    }
    let url = this.config.rootUrl + this.V1importOfficePath + "client";
    return this.http.post<vwResultImportArr<any>>(url, formdata);
  }

  v1ImportTrustPost(file: File) {
    const formdata = new FormData();
    if (file) {
      formdata.append('', file);
    }
    let url = this.config.rootUrl + this.V1importOfficePath + "trust";
    return this.http.post<vwResultImportArr<any>>(url, formdata);
  }
}

