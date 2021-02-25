import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/app-config.service';
import { StrictHttpResponse } from '../swagger-providers/strict-http-response';

@Injectable({
  providedIn: 'root'
})
export class jwtValidation {
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'bearer '
    })
  }
  constructor(private http: HttpClient,private appConfigService: AppConfigService) {
    
  }
  loadHeader(token) {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'bearer ' + token
      })
    }
  }
 
  getAll(token): Observable<StrictHttpResponse<void>> {
    this.loadHeader(token);
    return this.http.get<HttpResponse<any>>(this.appConfigService.appConfig.Common_API+'/v1/Auth/ValidateJWT', this.httpOptions);
  }

  getAllTenant(token,email):Observable<StrictHttpResponse<void>> {
    this.loadHeader(token);
    return this.http.get<HttpResponse<any>>(this.appConfigService.appConfig.Common_API+'/v1/Users/getUserByEmailId/'+email, this.httpOptions);
  }

  getUserTenantCount(token,email):Observable<StrictHttpResponse<void>> {
    this.loadHeader(token);
    return this.http.get<HttpResponse<any>>(this.appConfigService.appConfig.Common_API+'/v1/Users/getUserTenantCount/'+email, this.httpOptions);
  }

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `v1UsersChangeStatusPost()` instead.
   *
   * This method doesn't expect any response body
   */
  v1UsersChangeStatusPost$Response(
    id?: number,
    uid?:string,
    tenantId?:number,

  ): Observable<StrictHttpResponse<void>> {
    return this.http.post<HttpResponse<any>>(this.appConfigService.appConfig.Common_API+'/v1/Users/ChangeStatusOfActivationMail/'+id + '/' + uid + '/' + tenantId, this.httpOptions);
      }
}
