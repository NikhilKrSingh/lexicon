import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { TrustAccountService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-accounting-transfer-queue',
  templateUrl: './accounting-transfer-queue.component.html',
  styleUrls: ['./accounting-transfer-queue.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AccountingTransferQueueComponent implements OnInit {

  allTabs: string[];
  selectTabs: string;
  isTrustAccountEnabled = false;
  loading: boolean = false;
  trustAccountTime: string;
  public firmAccountList: any
  public statusIdList = [{ id: 0, name: "All" }];

  constructor(private trustAccountService: TrustAccountService) { }

  ngOnInit() {
    this.allTabs = ['Bank Transfers', 'Cash/Paper Check Transactions', 'Credit Card Transactions', 'E-Check Transactions']
    this.getTrustAccountTimeStatusFirmAccountsAndStatusList();
    // this.getTenantTrustAccountStatus();
    // this.getTrustAccountTime();
  }

  // private async getTenantTrustAccountStatus() {
  //   this.loading = true;
  //   try {
  //     let resp: any = await this.trustAccountService
  //       .v1TrustAccountGetTrustAccountStatusGet$Response()
  //       .toPromise();

  //     resp = JSON.parse(resp.body as any).results as boolean;
  //     if (resp) {
  //       this.isTrustAccountEnabled = true;
  //       this.selectTabs = this.allTabs[0];
  //       UtilsHelper.setObject('isTrustAccountEnabled', true);
  //       this.loading = false;
  //     } else {
  //       this.selectTabs = this.allTabs[1];
  //       this.isTrustAccountEnabled = false;
  //       UtilsHelper.setObject('isTrustAccountEnabled', false);
  //       this.loading = false;
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     this.loading = false;
  //   }
  // }

  // getTrustAccountTime() {
  //   this.trustAccountService
  //     .v1TrustAccountGetTrustAccountTimeGet$Response({}).subscribe((data: {}) => {
  //       const res: any = data;
  //       if (res && res.body) {
  //         var parsedRes = JSON.parse(res.body);
  //         if (parsedRes != null && parsedRes.results) {
  //           this.trustAccountTime = parsedRes.results;
  //         }
  //         if (!this.trustAccountTime) {
  //           this.trustAccountTime = '6:00 pm'
  //         }
  //       }
  //     });
  // }

  changeTab() {
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  getTrustAccountTimeStatusFirmAccountsAndStatusList() {
    this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusTimeFirmAccountsListAccountStatusGet$Response({}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.trustAccountTime = parsedRes.results.trustAccountTime;
            if (parsedRes.results.trustAccountStatus) {
              this.isTrustAccountEnabled = true;
              this.selectTabs = this.allTabs[0];
              UtilsHelper.setObject('isTrustAccountEnabled', true);
              this.loading = false;
            } else {
              this.selectTabs = this.allTabs[1];
              this.isTrustAccountEnabled = false;
              UtilsHelper.setObject('isTrustAccountEnabled', false);
              this.loading = false;
            }
            this.firmAccountList = parsedRes.results.firmAccountInfoList;
            let modifyList = [{ id: 0, name: "All" }];

            parsedRes.results.trustAccountStatuses.forEach(record => {
              let newRecord = record;
              if (record['name'] == 'Pending') {
                newRecord['name'] = 'Pending Approval';
              }
              modifyList.push(newRecord);
            });
            this.statusIdList = modifyList;
          }
          if (!this.trustAccountTime) {
            this.trustAccountTime = '6:00 pm'
          }
        }
      });
  }
}
