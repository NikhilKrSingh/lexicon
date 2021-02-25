import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';

@Injectable({
  providedIn: 'root'
})
export class DownloadFileService extends BaseService {

  public v1DmsPath = '/v1/DMS/';
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  v1DownloadLatestFile(fileId: number): Observable<HttpResponse<Blob>> {
    const url = this.config.rootUrl + '/v1/DMS/file/download/latest/' + fileId;
    return this.http.get<Blob>(url, {
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }

  v1DownloadSettingLatestFile(fileId: number): Observable<HttpResponse<Blob>> {
    const url = this.config.rootUrl + '/v1/DocumentSetting/document/download/' + fileId;
    return this.http.get<Blob>(url, {
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }

  v1DownloadClientFile(fileId: number): Observable<HttpResponse<Blob>> {
    const url = this.config.rootUrl + '/v1/DMS/file/Download/clientfile/' + fileId;
    return this.http.get<Blob>(url, {
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }

  v1DmsFolderZipDmsFolderIdGet(folderId: number): Observable<HttpResponse<Blob>> {
    const url = this.config.rootUrl + '/v1/DMS/folder/zip/' + folderId;
    return this.http.get<Blob>(url, {
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }

  v1DmsFileDownloadVersionGet(fileFullPath: string): Observable<HttpResponse<Blob>> {
    const url = this.config.rootUrl + '/v1/DMS/file/download/version?fileFullPath=' + fileFullPath;
    return this.http.get<Blob>(url, {
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }

  v1DmsBulkDownloadPost(body: any): Observable<HttpResponse<Blob>> {
    const url = this.config.rootUrl + '/v1/DMS/bulkDownload';
    return this.http.post<Blob>(url, body, {
      observe: 'response',
      responseType: 'blob' as 'json'
    });
  }
}
