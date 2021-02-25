import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { vwIntegrationDetails } from 'src/common/swagger-providers/models';
import { IntegrationsService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-accounting-integrations',
  templateUrl: './accounting-integrations.component.html',
  styleUrls: ['./accounting-integrations.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AccountingIntegrationsComponent implements OnInit {
  @ViewChild('calendarDisconnectWarning', {static: false}) calendarDisconnectWarning: TemplateRef<any>;

public IntegrationDetails= {} as vwIntegrationDetails;
public Loading: boolean;
public ConnectionDisabledSuccess = false;



  constructor(
    private activatedRoute: ActivatedRoute,
    private IntegrationsService: IntegrationsService,
    private pagetitle: Title,
    private modalService: NgbModal,
    private router: Router,


  ) { }

  ngOnInit() {
    this.pagetitle.setTitle('Accounting Integrations');
    this.Loading=true;
    let code = this.activatedRoute.snapshot.queryParams.code;
    let realmId = this.activatedRoute.snapshot.queryParams.realmId;
    let state = this.activatedRoute.snapshot.queryParams.state;
    if(code!=undefined)
    {
      this.GetAuthTokensAsync(code,realmId,state);
    }
else
{
this.GetIntegrationStatus();
}

}
public GetIntegrationStatus()
{
  this.IntegrationsService.v1IntegrationsGetIntegrationStatusGet$Response({}).subscribe(value => {
    
    const res: any = value;
    const response = JSON.parse(res.body);
    this.IntegrationDetails = response.results;
this.Loading=false;
  
  }, () => {
    this.Loading=false;
  });
  

}
  public EnableConnection(item: boolean) {
    if(item==true)
    {
      this.Loading=true;
      this.IntegrationDetails.isEnabled=false;
    this.IntegrationsService.v1IntegrationsInitiateAuthPost$Json({body: this.IntegrationDetails}).subscribe(suc => {
    
      const res: any = suc;
      const response = JSON.parse(res);
      location.href=response.results;
      this.Loading=false;
    }, () => {
      this.Loading=false;
    });

  }
  else
  {
    const modalRef = this.modalService.open(this.calendarDisconnectWarning, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'md'
    });
    modalRef.result.then(() => {
      this.Loading=true;

      this.RevokeTokenAsync();
    }, () => {
      this.IntegrationDetails.isEnabled=true;
    });
  }
  }
  public GetAuthTokensAsync(code:string,realmId:string,state:string) {
    this.IntegrationsService.v1IntegrationsGetAuthTokensAsyncPost$Response({code: code,realmId:realmId,state:state}).subscribe(suc => {

      const res: any = suc;
      const response = JSON.parse(res.body);
      if(response.results.isEnabled!=undefined)
      {
      this.IntegrationDetails = response.results;
      this.Loading=false;
      }
     else
     { 
this.GetIntegrationStatus();
     }


    }, () => {
      this.Loading=false;
    });
  }
  public RevokeTokenAsync()
  {
    
    this.IntegrationsService.v1IntegrationsRevokeTokenAsyncPost$Json({body: this.IntegrationDetails}).subscribe(suc => {
      
      const res: any = suc;
      const response = JSON.parse(res);
      if(response.results.isEnabled!=undefined)
      {
      this.IntegrationDetails = response.results;
      this.ConnectionDisabledSuccess=true;
      }
      else
      {
        this.IntegrationDetails.isEnabled=true;
      }
      this.Loading=false;

    }, () => {
      this.Loading=false;

    });
  }
}
