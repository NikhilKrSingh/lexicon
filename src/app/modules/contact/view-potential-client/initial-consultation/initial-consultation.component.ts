import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { vwClient } from 'src/common/swagger-providers/models';
import { ClientService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-initial-consultation',
  templateUrl: './initial-consultation.component.html',
  styleUrls: ['./initial-consultation.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class InitialConsultationComponent implements OnInit, IBackButtonGuard {

  public clientId: number;
  public state: string;
  public clientDetail: vwClient;
  public initialConsultation: string= null;
  public loading = true;

  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private pagetitle: Title
  ) { 
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
      this.state = params['state'];
      if (!this.clientId) {
        this.loading = false;
        this.router.navigate(['/contact/potential-client']);
      } else {
        this.getList();
      }
    });
  }

  private getList() {
    forkJoin([
      this.clientService.v1ClientClientIdGet({ clientId: this.clientId })
    ])
      .pipe(
        map(
          res => {
            return {
              clientDetail: JSON.parse(res[0] as any).results as vwClient
            };
          },
          err => {
            this.loading = false;
          }
        ),
        finalize(() => {})
      )
      .subscribe(suc => {
        this.clientDetail = suc.clientDetail;
        this.loading = false;
        if(this.clientDetail.isCompany){
        this.pagetitle.setTitle(this.clientDetail.companyName);
      }
      else{
        this.pagetitle.setTitle(this.clientDetail.firstName+" "+this.clientDetail.lastName);
      }
      }, () => {
        this.loading = false;
      });
  }

  public next() {
    this.dataEntered = false;
    if (this.initialConsultation === 'record-initial-consultation') {
      this.router.navigate(['/contact/'+this.initialConsultation], {queryParams: {clientId: this.clientId, state: this.state}})
    }
  }

  select() {
    this.dataEntered = true;
  }

}
