import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsioService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-bank-account',
  templateUrl: './bank-account.component.html',
  styleUrls: ['./bank-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BankAccountComponent implements OnInit {
  public loading: boolean = false;
  public accountDetails: any = null;

  constructor(
    private usioService: UsioService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(parameter => {
      if(parameter && parameter.bankAccountId) {
        this.getAccountDetails(+parameter.bankAccountId);
      }
    });
  }

  private async getAccountDetails(usioBankAccountId: number) {
    this.loading = true;
    try {
      let resp: any = await this.usioService
        .v1UsioGetUsioBankAccountDetailsGet({usioBankAccountId})
        .toPromise();
        resp = JSON.parse(resp as any).results;
        if(resp) {
          this.accountDetails = resp;
        }
        this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

}
