import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IEmployeeCreateStepEvent } from 'src/app/modules/models';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwUsioBankAccountsBasicInfo } from 'src/common/swagger-providers/models';
import { OfficeService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-law-office-notes',
  templateUrl: './law-office-notes.component.html',
  styleUrls: ['./law-office-notes.component.scss']
})
export class LawOfficeNotesComponent implements OnInit {
  @Output() readonly prevStep = new EventEmitter<IEmployeeCreateStepEvent>();
  @Input() public officeId = 0;
  @Input() isTrustAccountEnabled: boolean;
  public officeNotes = '';
  public showThis: boolean;
  public submitButton: boolean;
  public selectedTrustAccountList: any[] = [];
  public loading:boolean = false;
  public trustAccountingFlag: boolean = false;

  constructor(
    public usioService: UsioService,
    private officeService: OfficeService,
    private trustAccountService: TrustAccountService,
    private router: Router,
    private toast: ToastDisplay
  ) { }

  ngOnInit() {
    const obj = UtilsHelper.getObject('office');
    if (obj && obj.lawofficenotes) {
      this.officeNotes = obj.lawofficenotes;
    }
    this.submitButton = false;
  }

  next() {
    localStorage.setItem('save', 'true')
    this.submitButton = true;
    this.loading = true;
    const data = this.officeNotes;
    const tmp: any = UtilsHelper.getObject('office') ? UtilsHelper.getObject('office') : {};
    var opratingDetails = tmp ? tmp.settings.opratingAccounts:'';
    delete tmp.settings.defaultFirmBillingFreq
    delete tmp.settings.billFrequencyDurationType
    delete tmp.settings.opratingAccounts
    tmp.lawofficenotes = data;
    UtilsHelper.setObject('office', tmp);
    const body = Object.assign({}, tmp);
    body.notes = data;
    if (body.lawofficenotes) {
      delete body.lawofficenotes;
    }
      this.officeService.v1OfficeFullPost$Json({ body }).subscribe((res: any) => {
      let data = JSON.parse(res);
      if (data) {
        this.officeId = data.results;
        this.addTrustAccount();
        this.addOpratingAccounts(opratingDetails);
      }

    }, err => {
      this.submitButton = false;
      this.loading = false;
    });
  }

addOpratingAccounts(opratingDetails){
  let body = [];
     opratingDetails.filter(acc => {
           body.push({'id':0,'usioOperatingBankAccountId':acc.usioBankAccountId});
    })
    console.log(body)
  this.usioService.v1UsioAddEditUsioOperatingeBankAccountsOfficePost$Json$Response({officeId:this.officeId,body:body}).subscribe((res: any) => {
  }, err => {
  });
}


  addTrustAccount() {
    const tmp: any = UtilsHelper.getObject('officeSetTrustAccount') ? UtilsHelper.getObject('officeSetTrustAccount') : {};
    let basicSettings
    if (UtilsHelper.getObject('officeSetTrustAccount')) {
      basicSettings = tmp.basicSettings;
    } else {
      basicSettings = {}
    }
    basicSettings.officeId = this.officeId;
    this.trustAccountService.v1TrustAccountSetUpdateOfficeTrustAccountSettingsPost$Json$Response({ body: basicSettings }).subscribe((data: {}) => {
      this.addTrustAccountBank();
    }, err => {
      this.submitButton = false;
    });
  }

  async addTrustAccountBank() {
    const tmp: any = UtilsHelper.getObject('officeSetTrustAccount') ? UtilsHelper.getObject('officeSetTrustAccount') : {};
    let bankAccountData
    if (UtilsHelper.getObject('officeSetTrustAccount')) {
      bankAccountData = tmp.bankAccountData;
      this.selectedTrustAccountList = tmp.selectedTrustAccountList;
      this.trustAccountingFlag = tmp.trustAccountingFlag;
    } else {
      bankAccountData = {}
    }
    bankAccountData.officeId = this.officeId;
    this.creditCardBankToTrustBank();
  }

  prev() {
    if (this.isTrustAccountEnabled) {
      this.prevStep.emit({
        currentStep: 'lawofficenotes',
        prevStep: 'trustaccount',
      });
    } else {
      this.prevStep.emit({
        currentStep: 'lawofficenotes',
        prevStep: 'settings',
      });
    }
  }

  public async creditCardBankToTrustBank() {
    let body: vwUsioBankAccountsBasicInfo[] = [];
    if(this.selectedTrustAccountList.length) {
      this.selectedTrustAccountList.forEach(item => {
        body.push({
          id: 0,
          trustBankAccountId: item && +item.usioBankAccountId ? +item.usioBankAccountId : 0,
          isCreditCardAccountSelected: this.trustAccountingFlag,
          usioCreditCardAccountId: item && +item.creditCardTrustBankId ? +item.creditCardTrustBankId : 0
        });
      });
    }
    try {
      const resp = await this.usioService
        .v1UsioAddEditUsioOfficeBankAccountsPost$Json({ officeId: this.officeId, body })
        .toPromise();
      this.toast.showSuccess('Office created.');
      this.router.navigate(['/office/list']);
      localStorage.removeItem('office');
      localStorage.removeItem('officeSetTrustAccount');
    } catch (error) {}
  }
}
