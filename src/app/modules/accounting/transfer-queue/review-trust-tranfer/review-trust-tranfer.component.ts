import { Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { TrustAccountService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-review-trust-tranfer',
  templateUrl: './review-trust-tranfer.component.html',
  styleUrls: ['./review-trust-tranfer.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ReviewTrustTranferComponent implements OnInit, IBackButtonGuard, OnDestroy {

  backClick = false;
  trustTransferObj: any = null;
  transferSourceList: any = [];
  transferSourceListPost: any = null;
  transferTargetPost: any = null;
  transferTargetDisplay: any = null;
  dateOfTransfer: any = null;
  description: any = null;
  newTargetBalance = 0;
  clientDifferentError = "The transfer cannot be completed as selected, because transferring funds between different clients is not permitted.";
  sourceTargetSameError = "The transfer cannot be completed as selected, because the Transfer Source and Transfer Target cannot be the same.";
  sourceFundError = "The transfer cannot be completed as selected, because the Transfer Source has insufficient funds.";
  isDifferentClientError = false;
  isSameSourceTargetError = false;
  isSourceFundError = false;
  trasferErrorMsg = "";
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  isBankAccount =false;
  isTargetBankAccount=false;
  transferFundClick = false;
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private trustAccountService: TrustAccountService,
    private toaster: ToastDisplay,
    private pagetitle: Title
  ) {
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle("Review Trust Transfer");
    this.loadLocalData();
    this.dataEntered = true;
  }

  ngOnDestroy() {
    if (!this.backClick) {
      localStorage.removeItem('trustTransferData');
    }
  }

  loadLocalData() {
    this.trustTransferObj = UtilsHelper.getObject('trustTransferData');

    if (this.trustTransferObj) {
      this.transferSourceList = this.trustTransferObj['transferSourceList'];
      this.transferSourceListPost = this.trustTransferObj['transferSourceListPost'];
      this.transferTargetPost = this.trustTransferObj['transferTarget'];
      this.transferTargetDisplay = this.trustTransferObj['transferTargetDisplay'];
      this.dateOfTransfer = this.trustTransferObj['dateOfTransfer'];
      this.description = this.trustTransferObj['description'];
      this.isBankAccount = this.transferSourceList[0].isBankAccount;
      this.isTargetBankAccount=this.transferTargetDisplay.isBankAccount;
    }
    this.newTargetBalance = this.transferTargetDisplay.balance ? this.transferTargetDisplay.balance : 0;
    let index = 0;
    this.transferSourceList.forEach(transferSource => {
      let sourcePostObj;
      for (let i = 0; i < this.transferSourceListPost.length; i++) {
        if (transferSource['uniqueId'] === this.transferSourceListPost[i]['uniqueId']) {
          sourcePostObj = this.transferSourceListPost[i];
          break;
        }
      }
      let value = transferSource['amountTransfer'] ? transferSource['amountTransfer'] : 0;
      if (value && typeof value == "string") {
        value = parseFloat(value);
      }
      this.newTargetBalance = this.newTargetBalance + value;
      if (sourcePostObj) {
        if (this.transferTargetPost['isFirmOperatingAccount'] == true && sourcePostObj['isFirmOperatingAccount'] == true &&
          this.transferTargetPost['targetAccountId'] == sourcePostObj['sourceAccountId']) {
          this.isSameSourceTargetError = true;
        }

        if (this.transferTargetPost['isTrustBankAccount'] == true && sourcePostObj['isTrustBankAccount'] == true &&
          this.transferTargetPost['targetAccountId'] == sourcePostObj['sourceAccountId']) {
          this.isSameSourceTargetError = true;
        }

        if (this.transferTargetPost['isCreditCardTrustBankAccount'] == true && sourcePostObj['isCreditCardTrustBankAccount'] == true &&
          this.transferTargetPost['targetAccountId'] == sourcePostObj['sourceAccountId']) {
          this.isSameSourceTargetError = true;
        }

        if (this.transferTargetPost['isPrimaryRetainerTrustAccount'] == true &&
            sourcePostObj['isPrimaryRetainerTrustAccount'] == true &&
          this.transferTargetPost['officeId'] == sourcePostObj['officeId']
          ) {
          this.isSameSourceTargetError = true;
        }

        if (this.transferTargetPost['isTrustOnlyAccount'] == true && sourcePostObj['isTrustOnlyAccount'] == true &&
          this.transferTargetPost['targetAccountId'] == sourcePostObj['sourceAccountId']) {
          this.isSameSourceTargetError = true;
        }

        if (!transferSource['isBankAccount'] && this.transferTargetPost['clientId'] && (this.transferTargetPost['clientId'] != sourcePostObj['clientId'])) {
          this.isDifferentClientError = true;
        }

        if (!transferSource['isBankAccount'] && transferSource['amountTransfer'] > transferSource['balance']) {
          this.isSourceFundError = true;
        }
      }


      index = index + 1;
    });
  }

  transferFund(content: any, className, winClass) {
    this.transferFundClick = true;
    if (this.isDifferentClientError || this.isSameSourceTargetError || this.isSourceFundError) {
      if (this.isDifferentClientError) {
        this.trasferErrorMsg = this.clientDifferentError;
      } else if (this.isSameSourceTargetError) {
        this.trasferErrorMsg = this.sourceTargetSameError;
      } else if (this.isSourceFundError) {
        this.trasferErrorMsg = this.sourceFundError;
      }

      this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static',
        })
        .result.then(
          result => {
          },
          reason => {
          }
        );
      this.transferFundClick = false;
    } else {
      this.dataEntered = false;
      let modifyTransferSource = [];

      this.transferSourceListPost.forEach(record => {
        if (record['uniqueId']) {
          delete record['uniqueId'];
        }
        modifyTransferSource.push(record);
      });

      let dumpData = {
        transferSourceAccounts: modifyTransferSource,
        transferTargetAccount: this.transferTargetPost,
        dateOfTransfer: this.dateOfTransfer,
        description: this.description,
        isManual: true
      };
      this.trustAccountService
        .v1TrustAccountAddTrustTransferQueuePost$Json$Response({ body: dumpData }).subscribe((data: {}) => {
          const res: any = data;
          if (res && res.body) {
            var parsedRes = JSON.parse(res.body);
            if (parsedRes != null && parsedRes.results) {
              this.toaster.showSuccess('Transfers added to queue.');
              this.router.navigate(['/accounting/transfer-queue']);
            }
          }
          this.transferFundClick = false;
        },
          () => {
            this.toaster.showError('Other than 200 status code returned');
            this.dataEntered = true;
            this.transferFundClick = false;
          });
    }
  }

  back() {
    this.backClick = true;
    this.dataEntered = false;
    this.router.navigate(['/accounting/new-trust-transfer']);
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    this.back();
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
