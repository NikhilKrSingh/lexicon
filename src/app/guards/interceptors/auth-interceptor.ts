import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { ToastDisplay } from '../toast-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private toaster: ToastDisplay,
    private commonService: CommonService
  ) {}
  private returnUrl: string;

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    const token = UtilsHelper.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    // return next.handle(request);
    return next.handle(request).pipe(
      tap(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // do stuff with response if you want
          }
        },
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              this.modalService.dismissAll();
              this.commonService.isLogOutRequest.next('401');
            } else if (err.status == 400) {
              if (request.url.match('/v1/Billing/postPayment')) {
                return;
              }
              if (request.url.match('/v1/Billing/partialPaymentCheck')) {
                return;
              }
              if (request.url.match('/v1/Billing/PostPaymentToMatterBalance')) {
                return;
              }
              if (request.url.match('/v1/Billing/PostPaymentForTrust')) {
                return;
              }
              if (request.url.match('/v1/Billing/RefundFromTrust')) {
                return;
              }
              if (request.url.match('/v1/Matter/BulkCloseMatter')) {
                return;
              }
              if (request.url.match('/v1/Auth')) {
                return;
              }
              if (request.url.match('/v1/Import/trust')) {
                return;
              }

              let message: string = '';
              if (err && err.error) {
                try {
                  let error = JSON.parse(err.error);
                  let invalidField: any = Object.keys(error.errors);
                  if (invalidField && invalidField.length > 0) {
                    invalidField.map(obj => {
                      message = message + error.errors[obj].join(', ');
                    });
                  } else {
                    message = 'Something went wrong on server side.';
                  }
                } catch (error) {
                  message = err.error;
                }
              } else {
                message = 'Something went wrong on server side.';
              }
              this.toaster.showError(message);
            } else if (err.status == 500) {
              if (request.url.includes('Office/UpdateStatus')) {
                return;
              }
              if (request.url.match('/v1/Billing/partialPaymentCheck')) {
                return;
              }
              if (request.url.match('/v1/Billing/PostPaymentToMatterBalance')) {
                return;
              }
              if (request.url.match('/v1/Billing/PostPaymentForTrust')) {
                return;
              }
              if (request.url.match('/v1/Billing/RefundFromTrust')) {
                return;
              }
              if (request.url.match('/v1/Import/trust')) {
                return;
              }

              let error: string = err.error || 'Something went wrong on server side.';

              if (error.split(';').length > 1) {
                error = error.split(';')[1] ? error.split(';')[1] : error.split(';')[0];
              }

              if (!error) {
                error = 'Something went wrong. Please try again.';
              }

              this.toaster.showError(error);
            }
          }
        }
      )
    );
  }
}
