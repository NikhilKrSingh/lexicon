import { Component, EventEmitter, OnDestroy, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subscription } from 'rxjs';
import { SelectService } from 'src/app/service/select.service';
import { ClockService, TrustAccountService } from 'src/common/swagger-providers/services';
import * as errorData from '../error.json';
import { UtilsHelper } from '../utils.helper.js';
import { fromEvent } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';

@Component({
  selector: 'app-trust-transfer-source',
  templateUrl: './trust-transfer-source.component.html',
  styleUrls: ['./trust-transfer-source.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustTransferSourceComponent implements OnInit, OnDestroy {
  public currentActive: number;

  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  trustTransferObj: any = {};
  transferDetailForm: FormGroup;
  modalOptions: NgbModalOptions;
  closeResult: string;
  isAddedSourceAccount = false;
  currencyOptions = { prefix: '$', allowNegative: false, align: 'left' };
  transferTarget: any = {};
  transferTargetDisplay: any = {};
  transferSourceList = [
    { id: 0, source: null, isBankAccount: true, client: null, matter: null, balance: null, amountTransfer: "0.00", uniqueId: null },
  ];

  transferSourceListPost = []
  selectTransferTypeMainPage = null;
  selectTransferTypeMain = true;  //bank=true and trust=false
  selectBankTypeMain = 1;
  selectedTrustBankAccountMain = null;
  selectedTrustBankAccountModelMain = null;
  trustBankAccountsMain = [];
  selectedCreditBankAccountMain = null;
  selectedCreditBankAccountModelMain = null;
  trustListMain = [];
  selectedTrustMain = null;
  selectedTrustModelMain: any = null;
  creditBankAccountsMain = [];

  selectTransferType = true;  //bank=true and trust=false
  selectBankType = 1;
  selectedTrustBankAccount = null;
  selectedTrustBankAccountModel = null;
  trustBankAccounts = [];
  firmOperatingBankAccountsMain = [];
  firmOperatingBankAccounts = [];
  selectedfirmOperatingBankAccountMain = null;
  selectedfirmOperatingBankAccountModelMain = null;
  selectedfirmOperatingBankAccount = null;
  selectedfirmOperatingBankAccountModel = null;
  selectedCreditBankAccount = null;
  selectedCreditBankAccountModel = null;
  trustList = [];
  selectedTrust = null;
  selectedTrustModel: any = null;
  creditBankAccounts = [];
  contentBankRef: any;
  contentTransferTypeRef: any;
  contentTrustTransferRef: any;
  contentTrustTransferAlertRef: any;
  public clientList: Array<any> = [];
  public matterList: Array<any> = [];
  public clientListPopUp: Array<any> = [];
  public matterListPopUp: Array<any> = [];
  public searchclient: string;
  public searchMatter: string;
  private clientSubscribe: Subscription;
  private matterSubscribe: Subscription;
  public clientDetail: any = null;
  public matterDetail: any = null;
  public clientDetailSource: any = null;
  public matterDetailSource: any = null;
  public clientDetailfilter: any = null;
  public matterDetailfilter: any = null;
  public searchMatterfilter: string;
  public searchclientfilter: string;

  public clientListMain: Array<any> = [];
  public matterListMain: Array<any> = [];
  public clientListPopUpMain: Array<any> = [];
  public matterListPopUpMain: Array<any> = [];
  public searchclientMain: string;
  public searchMatterMain: string;
  private clientSubscribeMain: Subscription;
  private matterSubscribeMain: Subscription;
  public clientDetailSourceMain: any = null;
  public matterDetailSourceMain: any = null;
  public clientDetailfilterMain: any = null;
  public matterDetailfilterMain: any = null;
  public searchMatterfilterMain: string;
  public searchclientfilterMain: string;
  public dateOfTransfer: Date = new Date();
  public description: any = null;
  public isSubmitted = false;
  public errorData: any = (errorData as any).default;
  public maxDateError = false;
  public reviewClick = false;
  public bankTransferFormSubmitted: boolean = false;
  public offsetValue;
  public topbarHeight: number;
  public clientSearchLoading : boolean = false;
  public matterSearchLoading : boolean = false;

  constructor(
    private modalService: NgbModal,
    private clockService: ClockService,
    private trustAccountService: TrustAccountService,
    private builder: FormBuilder,
    private router: Router,
    private selectService: SelectService,
    private pagetitle: Title,
    private el: ElementRef,

  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Transfer Funds");
    this.addConfigs();
    this.loadLocalData();
  }

  public addConfigs() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: false
    };
  }

  ngOnDestroy() {
    if (!this.reviewClick) {
      localStorage.removeItem('trustTransferData');
    }
  }

  loadLocalData() {
    this.trustTransferObj = UtilsHelper.getObject('trustTransferData');

    if (this.trustTransferObj) {
      this.selectService.newSelection('clicked!');
      this.transferSourceList = this.trustTransferObj['transferSourceList'];
      this.transferSourceListPost = this.trustTransferObj['transferSourceListPost'];
      this.transferTarget = this.trustTransferObj['transferTarget'];
      this.transferTargetDisplay = this.trustTransferObj['transferTargetDisplay'];
      this.dateOfTransfer = this.trustTransferObj['dateOfTransfer'];
      this.description = this.trustTransferObj['description'];

      this.reloadTargetTransfer();
    }
  }
  ngAfterViewInit() {
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }
  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.has-error'
    );
    if (firstInvalidControl) {
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });
      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }
  }
  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 100;
    return (
      controlEl.getBoundingClientRect().top +
      window.scrollY -
      ( this.topbarHeight + labelOffset)
    );
  }

  review() {
    this.selectService.newSelection('remove data');
    this.isSubmitted = true;
    this.maxDateError = false;
    let isValid = true;
    if (!this.dateOfTransfer || (!this.description || !(this.description && this.description.trim()))) {
      isValid = false;
    }
    if (this.dateOfTransfer) {
      let todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      let transferDate = new Date(this.dateOfTransfer);
      transferDate.setHours(0, 0, 0, 0);
      if (!(todayDate.getTime() >= transferDate.getTime())) {
        this.maxDateError = true;
        isValid = false;
      }
    }
    this.transferSourceList.filter(item =>{
        if(parseFloat(item.amountTransfer) <= 0){
          isValid = false;
        }
    });

    if (!isValid) {
      setTimeout(() =>{
        this.scrollToFirstInvalidControl();
      },1000 )
      return;
    }

    this.fillTransfer();

    let trustTransferData: any = {};
    trustTransferData.transferSourceList = this.transferSourceList;
    trustTransferData.transferSourceListPost = this.transferSourceListPost;
    trustTransferData.transferTarget = this.transferTarget;
    trustTransferData.transferTargetDisplay = this.transferTargetDisplay;
    trustTransferData.dateOfTransfer = this.dateOfTransfer;
    trustTransferData.description = this.description;
    UtilsHelper.setObject('trustTransferData', trustTransferData);
    this.reviewClick = true;
    this.router.navigate(['/accounting/review-trust-transfer']);
  }

  fillTransfer() {
    let transferTargetDisplay: any = { id: 0, source: {}, isBankAccount: true, client: {}, matter: {}, balance: null };

    let transferTargetPost: any = {
      "isFirmOperatingAccount": false,
      "isTrustBankAccount": false,
      "isCreditCardTrustBankAccount": false,
      "isPrimaryRetainerTrustAccount": false,
      "isTrustOnlyAccount": false,
      "targetAccountId": 0,
      "matterId": 0,
      "clientId": 0,
      "officeId":0,
      "firmTrustBankAccountId":0,
      "firmTrustCreditCardAccountId":0
    };

    if (this.selectTransferTypeMainPage) {
      transferTargetDisplay.isBankAccount = true;
      if (this.selectBankTypeMain == 1) {
        transferTargetPost.isFirmOperatingAccount = true;
        transferTargetPost.targetAccountId = this.selectedfirmOperatingBankAccountMain;
        transferTargetDisplay.source['name'] = this.selectedfirmOperatingBankAccountModelMain['accountName'];
        transferTargetDisplay.source['id'] = this.selectedfirmOperatingBankAccountModelMain['id'];
      } else if (this.selectBankTypeMain == 2) {
        transferTargetPost.isTrustBankAccount = true;
        transferTargetPost.targetAccountId = this.selectedTrustBankAccountMain;

        transferTargetDisplay.source['name'] = this.selectedTrustBankAccountModelMain['accountName'];
        transferTargetDisplay.source['id'] = this.selectedTrustBankAccountModelMain['id'];
      } else if (this.selectBankTypeMain == 3) {
        transferTargetPost.isCreditCardTrustBankAccount = true;
        transferTargetPost.targetAccountId = this.selectedCreditBankAccountMain;

        transferTargetDisplay.source['name'] = this.selectedCreditBankAccountModelMain['accountName'];
        transferTargetDisplay.source['id'] = this.selectedCreditBankAccountModelMain['id'];
      }
    } else {
      transferTargetDisplay.isBankAccount = false;
      transferTargetPost.officeId = 0;

      this.trustListMain.forEach(item=>{
        if(item.id == this.selectedTrustMain){
          transferTargetPost.officeId = item.officeId;        
        }
        });      

      if (this.selectedTrustMain == 0) {
        transferTargetPost.isPrimaryRetainerTrustAccount = true;
      } else {
        transferTargetPost.isTrustOnlyAccount = true;
      }
      transferTargetPost.targetAccountId = this.selectedTrustMain;

      let nameList = this.selectedTrustModelMain['name'].split(" - Balance :");
      let nameListNew = nameList.length ? nameList[0].split(" - ") : [""];
      if(nameListNew.length>1){
        nameListNew.shift();
      }
      transferTargetDisplay.source['name'] = nameListNew.length ? nameListNew.join(" - ") : "";
      transferTargetDisplay.source['id'] = this.selectedTrustModelMain['id'];
      transferTargetDisplay.balance = this.selectedTrustModelMain['amount'] ? this.selectedTrustModelMain['amount'] : 0;
      if (this.clientDetailSourceMain) {
        transferTargetPost.clientId = this.clientDetailSourceMain.id;

        transferTargetDisplay.client = {
          id: this.clientDetailSourceMain.id,
          name: this.clientDetailSourceMain.isCompany ? this.clientDetailSourceMain.companyName : this.clientDetailSourceMain.lastName + ', ' + this.clientDetailSourceMain.firstName,
        }
      }

      if (this.matterDetailSourceMain) {
        transferTargetPost.matterId = this.matterDetailSourceMain.id;

        transferTargetDisplay.matter = {
          id: this.matterDetailSourceMain.id,
          name: this.matterDetailSourceMain.matterName + ' (' + this.matterDetailSourceMain.matterNumber + ')',
        }
      }
    }

    let modifyTransferSourceList = [];
    this.transferSourceList.forEach(record => {

      for (let i = 0; i < this.transferSourceListPost.length; i++) {
        if (record['uniqueId'] === this.transferSourceListPost[i]['uniqueId']) {
          let value = record['amountTransfer'] ? record['amountTransfer'] : 0;
          if (value) {
            if (typeof value == "string") {
              value = parseFloat(value);
            } else {
              value = value.toFixed(2);
            }
          }
          this.transferSourceListPost[i]['amountToTransfer'] = value;
          break;
        }
      }

      record['amountTransfer'] = record['amountTransfer'] ? record['amountTransfer'] : "0.00";
      modifyTransferSourceList.push(record);
    });
    this.transferSourceList = modifyTransferSourceList;
    this.transferTarget = transferTargetPost;
    this.transferTargetDisplay = transferTargetDisplay;
  }

  clearValue(index) {
    let value;
    value = (this.transferSourceList[index].amountTransfer !== '0.00') ? this.transferSourceList[index].amountTransfer : '';
    this.transferSourceList[index].amountTransfer = value;
  }

  modifyLineItemVal(index) {
    let value;
    value = this.transferSourceList[index].amountTransfer ? this.transferSourceList[index].amountTransfer : "0.00";
    if (value) {
      if (typeof value == "string") {
        value = parseFloat(value);
        value = value.toFixed(2)
      } else {
        value = value.toFixed(2)
      }
    }
    this.transferSourceList[index].amountTransfer = value;
  }

  reloadTargetTransfer() {
    if (this.transferTarget) {
      if (this.transferTargetDisplay.isBankAccount) {
        this.selectTransferTypeMainPage = true;
        if (this.transferTarget.isFirmOperatingAccount) {
          this.selectBankTypeMain = 1;
          this.selectedfirmOperatingBankAccountMain = this.transferTarget.targetAccountId;
          this.selectedfirmOperatingBankAccountModelMain = {};
          this.selectedfirmOperatingBankAccountModelMain['accountName'] = this.transferTargetDisplay.source['name'];
          this.selectedfirmOperatingBankAccountModelMain['id'] = this.transferTargetDisplay.source['id'];
          this.getBankAccountListMain(1);
        } else if (this.transferTarget.isTrustBankAccount) {
          this.selectBankTypeMain = 2;

          this.selectedTrustBankAccountMain = this.transferTarget.targetAccountId;
          this.selectedTrustBankAccountModelMain = {};
          this.selectedTrustBankAccountModelMain['accountName'] = this.transferTargetDisplay.source['name'];
          this.selectedTrustBankAccountModelMain['id'] = this.transferTargetDisplay.source['id'];

          this.getBankAccountListMain(2);

        } else if (this.transferTarget.isCreditCardTrustBankAccount) {
          this.selectBankTypeMain = 3;

          this.selectedCreditBankAccountMain = this.transferTarget.targetAccountId;
          this.selectedCreditBankAccountModelMain = {};
          this.selectedCreditBankAccountModelMain['accountName'] = this.transferTargetDisplay.source['name'];
          this.selectedCreditBankAccountModelMain['id'] = this.transferTargetDisplay.source['id'];

          this.getBankAccountListMain(3);
        }
      } else {
        this.selectTransferTypeMainPage = false;
        this.selectedTrustMain = this.transferTarget.targetAccountId;
        this.selectedTrustModelMain = {};
        this.selectedTrustModelMain['name'] = this.transferTargetDisplay.source['name'];
        this.selectedTrustModelMain['id'] = this.transferTargetDisplay.source['id'];
        this.selectedTrustModelMain['amount'] = this.transferTargetDisplay['balance'];
        this.selectedTrustModelMain['matterId'] = this.transferTargetDisplay.matter.id;

        this.clientDetailSourceMain = {};
        this.searchclientMain = this.transferTargetDisplay.client.name;
        this.clientDetailSourceMain['id'] = this.transferTargetDisplay.client.id;
        this.clientDetailSourceMain['isCompany'] = true;
        this.clientDetailSourceMain['companyName'] = this.transferTargetDisplay.client.name;

        this.matterDetailSourceMain = {};
        this.matterDetailSourceMain['id'] = this.transferTargetDisplay.matter.id;
        this.matterDetailSourceMain['matterNumber'] = this.transferTargetDisplay.matter.id;
        this.searchMatterMain = this.transferTargetDisplay.matter.name;
        let nameList = this.transferTargetDisplay.matter.name.split(" - ");
        this.matterDetailSourceMain['matterName'] = nameList.length == 2 ? nameList[1] : "";

        this.loadTrustListMain();
      }
    }
  }

  getFormattedPhoneNumber(phone: any) {
    let formattedPhone;
    if (phone && phone != '--' && phone != '') {
      formattedPhone = '(' + phone.substr(0, 3) + ') ' + phone.substr(3, 3) + '-' + phone.substr(6, 4);
    } else {
      formattedPhone = (phone) ? phone : '--';
    }
    return formattedPhone;
  }

  get getTotal() {
    let total = 0;

    this.transferSourceList.forEach(record => {
      let amount = record['amountTransfer'] ? parseFloat(record['amountTransfer'].toString()) : 0;
      total = total + amount;
    });

    return total;
  }

  get checkValidDate() {
    if (this.dateOfTransfer) {
      let todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      let transferDate = new Date(this.dateOfTransfer);
      transferDate.setHours(0, 0, 0, 0);
      if (!(todayDate.getTime() >= transferDate.getTime())) {
        return true;
      } else {
        return false;
      }
    }
  }

  clickClient(item, i) {
    item.showGrid = !item.showGrid;
    let clientListPopUp = JSON.parse(JSON.stringify(this.clientListPopUp));
    clientListPopUp[i] = item;
    this.clientListPopUp = JSON.parse(JSON.stringify(clientListPopUp));
  }

  clickMatter(item, i) {
    item.showGrid = !item.showGrid;
    let matterListPopUp = JSON.parse(JSON.stringify(this.matterListPopUp));
    matterListPopUp[i] = item;
    this.matterListPopUp = JSON.parse(JSON.stringify(matterListPopUp));
  }

  clickClientMain(item, i) {
    item.showGrid = !item.showGrid;
    let clientListPopUpMain = JSON.parse(JSON.stringify(this.clientListPopUpMain));
    clientListPopUpMain[i] = item;
    this.clientListPopUpMain = JSON.parse(JSON.stringify(clientListPopUpMain));
  }

  clickMatterMain(item, i) {
    item.showGrid = !item.showGrid;
    let matterListPopUpMain = JSON.parse(JSON.stringify(this.matterListPopUpMain));
    matterListPopUpMain[i] = item;
    this.matterListPopUpMain = JSON.parse(JSON.stringify(matterListPopUpMain));
  }

  selectTransferTypeClick(event, type) {
    if (type == 'bank' && event) {
      this.selectTransferType = true;
      this.getBankAccountList(1);
    } else {
      this.selectTransferType = false;
    }
  }

  selectTransferTypeMainPageClick(event, type) {
    this.clearData();
    if (type == 'bank' && event) {
      this.selectTransferTypeMainPage = true;
      this.getBankAccountListMain(1);
    } else {
      this.selectTransferTypeMainPage = false;
    }
  }

  clearData() {
    this.selectBankTypeMain = 1;
    this.selectedfirmOperatingBankAccountMain = null;
    this.firmOperatingBankAccountsMain = [];
    this.selectedTrustBankAccountMain = null;
    this.trustBankAccountsMain = [];
    this.selectedCreditBankAccountMain = null;
    this.creditBankAccountsMain = [];

    this.searchMatterMain = null;
    this.matterDetailSourceMain = null;
    this.matterListPopUpMain = [];

    this.searchclientMain = null;
    this.clientDetailSourceMain = null;
    this.clientListPopUpMain = [];

    this.selectedTrustMain = null;
    this.selectedTrustModelMain = null;
    this.trustListMain = [];
  }

  get isReviewEnabled() {
    let isValid = true;
    if (this.selectTransferTypeMainPage == null) {
      isValid = false;
    } else if (this.selectTransferTypeMainPage == true) {
      if (!this.isValidSourceMain()) {
        isValid = false;
      }
    } else if (this.selectTransferTypeMainPage == false) {
      if (!this.searchclientMain || !this.searchMatterMain || !this.matterDetailSourceMain || !this.clientDetailSourceMain || !this.selectedTrustModelMain) {
        isValid = false;
      }
    }

    if (!(this.transferSourceList.length && this.transferSourceList[0].source)) {
      isValid = false;
    }
    return isValid;
  }

  selectBankTypeClick(event, type) {
    if (type == 'operating' && event) {
      this.selectBankType = 1;
      this.getBankAccountList(this.selectBankType);
    } else if (type == 'trust' && event) {
      this.selectBankType = 2;
      this.getBankAccountList(this.selectBankType);
    } else if (type == 'credit' && event) {
      this.selectBankType = 3;
      this.getBankAccountList(this.selectBankType);
    }
    this.bankTransferFormSubmitted = false;
  }

  selectBankTypeClickMain(event, type) {
    if (type == 'operating' && event) {
      this.selectBankTypeMain = 1;
      this.getBankAccountListMain(1);
    } else if (type == 'trust' && event) {
      this.selectBankTypeMain = 2;
      this.getBankAccountListMain(2);
    } else if (type == 'credit' && event) {
      this.selectBankTypeMain = 3;
      this.getBankAccountListMain(3);
    }
  }

  get isValidSource() {
    if (this.selectBankType == 1) {
      if (this.selectedfirmOperatingBankAccount) {
        return true;
      } else {
        return false;
      }
    } else if (this.selectBankType == 2) {
      if (this.selectedTrustBankAccount) {
        return true;
      } else {
        return false;
      }
    } else if (this.selectBankType == 3) {
      if (this.selectedCreditBankAccount) {
        return true;
      } else {
        return false;
      }
    }
  }

  isValidSourceMain() {
    if (this.selectBankTypeMain == 1) {
      if (this.selectedfirmOperatingBankAccountMain) {
        return true;
      } else {
        return false;
      }
    } else if (this.selectBankTypeMain == 2) {
      if (this.selectedTrustBankAccountMain) {
        return true;
      } else {
        return false;
      }
    } else if (this.selectBankTypeMain == 3) {
      if (this.selectedCreditBankAccountMain) {
        return true;
      } else {
        return false;
      }
    }
  }

  getBankAccountList(accountTypeId) {
    this.trustAccountService
      .v1TrustAccountGetUsioFirmTrustAccountListGet$Response({ accountTypeId }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let newList = parsedRes.results;
            if (accountTypeId == 1) {
              this.firmOperatingBankAccounts = newList;
            } else if (accountTypeId == 2) {
              this.trustBankAccounts = newList;
            } else if (accountTypeId == 3) {
              this.creditBankAccounts = newList;
            }
          }
        }
      });

  }

  getBankAccountListMain(accountTypeId) {
    this.trustAccountService
      .v1TrustAccountGetUsioFirmTrustAccountListGet$Response({ accountTypeId }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let newList = parsedRes.results;
            if (accountTypeId == 1) {
              this.firmOperatingBankAccountsMain = newList;
            } else if (accountTypeId == 2) {
              this.trustBankAccountsMain = newList;
            } else if (accountTypeId == 3) {
              this.creditBankAccountsMain = newList;
            }
          }
        }
      });

  }

  loadTrustList() {
    let flagToCheckIfCreditCardOrNot = true;
    this.trustAccountService
      .v1TrustAccountGetTrustBankAccountListAccountingQueueGet$Response({ matterId: this.matterDetailSource.id }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let newList = parsedRes.results.filter(function (el) {
              return el.status = true;
            });
            if (!flagToCheckIfCreditCardOrNot) {
              this.trustList = newList;
            } else {
              this.trustList = newList;
            }

            this.trustList.forEach(item=>{
              if(item.trustNumber){
                item.name = item.trustNumber + ' - ' + item.name;
              }else if(item.id == 0){
                item.name = 1 + ' - ' + item.name;
              }
            })
          }
        }
      });
  }

  loadTrustListMain() {
    let flagToCheckIfCreditCardOrNot = true;
    this.trustAccountService
      .v1TrustAccountGetTrustBankAccountListAccountingQueueGet$Response({ matterId: this.matterDetailSourceMain.id }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let newList = parsedRes.results.filter(function (el) {
              return el.status = true;
            });
            if (!flagToCheckIfCreditCardOrNot) {
              this.trustListMain = newList;
            } else {
              this.trustListMain = newList;

              this.trustListMain.forEach(item=>{
                if(item.trustNumber){
                  item.name = item.trustNumber + ' - ' + item.name;
                }else if(item.id == 0){
                  item.name = 1 + ' - ' + item.name;
                }
              })
            }
          }
        }
      });
  }
  firmAccountChange(model) {
    this.selectedfirmOperatingBankAccountModel = model;
  }
  trustAccountChange(model) {
    this.selectedTrustBankAccountModel = model;
  }

  creditCardAccountChange(model) {
    this.selectedCreditBankAccountModel = model;
  }

  trustChange(model) {
    this.selectedTrustModel = model;
    this.selectedTrustModel['matterId'] = this.matterDetailSource ? this.matterDetailSource['id'] : 0;
  }

  firmOperatingAccountChangeMain(model) {
    this.selectedfirmOperatingBankAccountModelMain = model;
    this.selectService.newSelection('clicked!');
  }

  trustAccountChangeMain(model) {
    this.selectedTrustBankAccountModelMain = model;
    this.selectService.newSelection('clicked!');
  }

  creditCardAccountChangeMain(model) {
    this.selectedCreditBankAccountModelMain = model;
    this.selectService.newSelection('clicked!');
  }

  trustChangeMain(model) {
    this.selectedTrustModelMain = model;
    this.selectedTrustModelMain['matterId'] = this.matterDetailSourceMain ? this.matterDetailSourceMain['id'] : 0;
    this.selectService.newSelection('clicked!');
  }

  next() {
  }

  saveSource(type?) {
    this.bankTransferFormSubmitted = true;
    if(!this.isValidSource && (type == 'bankTransfer')) {
      return;
    }
    let uniqueId = new Date().getTime();
    let sourcedDisplay: any = { id: 0, source: {}, isBankAccount: true, client: {}, matter: {}, balance: 0, amountTransfer: "0.00", uniqueId: uniqueId };
    let sourcedPost: any = {
      "isFirmOperatingAccount": false,
      "isTrustBankAccount": false,
      "isCreditCardTrustBankAccount": false,
      "isPrimaryRetainerTrustAccount": false,
      "isTrustOnlyAccount": false,
      "sourceAccountId": 0,
      "balance": 0,
      "amountToTransfer": 0,
      "matterId": 0,
      "clientId": 0,
      "officeId": 0,
      "firmTrustBankAccountId":0,
      "firmTrustCreditCardAccountId":0,
      "uniqueId": uniqueId
    };

    if (this.selectTransferType) {
      sourcedDisplay.isBankAccount = true;
      this.getBankAccountList(1);
      if (this.selectBankType == 1) {
        sourcedPost.isFirmOperatingAccount = true;
        sourcedPost.sourceAccountId = this.selectedfirmOperatingBankAccount;
        sourcedDisplay.source['name'] = this.selectedfirmOperatingBankAccountModel['accountName'];
        sourcedDisplay.source['id'] = this.selectedfirmOperatingBankAccountModel['id'];
      } else if (this.selectBankType == 2) {
        sourcedPost.isTrustBankAccount = true;
        sourcedPost.sourceAccountId = this.selectedTrustBankAccount;

        sourcedDisplay.source['name'] = this.selectedTrustBankAccountModel['accountName'];
        sourcedDisplay.source['id'] = this.selectedTrustBankAccountModel['id'];
      } else if (this.selectBankType == 3) {
        sourcedPost.isCreditCardTrustBankAccount = true;
        sourcedPost.sourceAccountId = this.selectedCreditBankAccount;

        sourcedDisplay.source['name'] = this.selectedCreditBankAccountModel['accountName'];
        sourcedDisplay.source['id'] = this.selectedCreditBankAccountModel['id'];
      }
    } else {
      sourcedDisplay.isBankAccount = false;
      sourcedPost.miltonId = 0;
      sourcedPost.firmTrustBankAccountId = 0;
      sourcedPost.firmTrustCreditCardAccountId = 0;

      this.trustList.forEach(item=>{
        if(item.id == this.selectedTrust){
          sourcedPost.officeId = item.officeId;
        }
        });      

      if (this.selectedTrust == 0) {
        sourcedPost.isPrimaryRetainerTrustAccount = true;
      } else {
        sourcedPost.isTrustOnlyAccount = true;
      }
      sourcedPost.sourceAccountId = this.selectedTrust;
      sourcedPost.balance = this.selectedTrustModel.amount ? this.selectedTrustModel.amount : 0;

      let nameList = this.selectedTrustModel['name'].split(" - Balance :");
      let nameListNew = nameList.length ? nameList[0].split(" - ") : [""];
      if(nameListNew.length>1){
        nameListNew.shift();
      }
      sourcedDisplay.source['name'] = nameListNew.length ? nameListNew.join(" - ") : "";
      sourcedDisplay.source['id'] = this.selectedTrustModel['id'];
      sourcedDisplay.amount = this.selectedTrustModel['amount'] ? this.selectedTrustModel['amount'] : 0;
      sourcedDisplay.balance = this.selectedTrustModel['amount'] ? this.selectedTrustModel['amount'] : 0;

      if (this.clientDetailSource) {
        sourcedPost.clientId = this.clientDetailSource.id;
        sourcedDisplay.client = {
          id: this.clientDetailSource.id,
          name: this.clientDetailSource.isCompany ? this.clientDetailSource.companyName : this.clientDetailSource.lastName + ', ' + this.clientDetailSource.firstName,
        }
      }

      if (this.matterDetailSource) {
        sourcedPost.matterId = this.matterDetailSource.id;
        sourcedDisplay.matter = {
          id: this.matterDetailSource.id,
          name: this.matterDetailSource.matterName + ' (' + this.matterDetailSource.matterNumber + ')',
        }
      }

    }

    if (this.transferSourceList[0].source) {
      this.transferSourceList.push(sourcedDisplay);
    } else {
      this.transferSourceList[0] = sourcedDisplay;
    }
    this.bankTransferFormSubmitted = false;
    this.transferSourceListPost.push(sourcedPost);
    this.closeModal();

    this.transferSourceList.sort(this.compare);
    this.selectService.newSelection('clicked!');
  }

  compare(a, b) {
    if (a.source.name.toLowerCase() < b.source.name.toLowerCase()) {
      return -1;
    }
    if (a.source.name.toLowerCase() > b.source.name.toLowerCase()) {
      return 1;
    }
    return 0;
  }

  openModal(content: any, className, winClass, modalType) {
    this.selectedfirmOperatingBankAccount = null;
    if (modalType == 'transfer') {
      this.contentTransferTypeRef = this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static'
        })
        .result.then(
          result => {
            this.closeResult = `Closed with: ${result}`;
          },
          reason => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          }
        );
    } else if (modalType == 'bank') {
      this.getBankAccountList(1);
      this.contentBankRef = this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static'
        })
        .result.then(
          result => {
            this.closeResult = `Closed with: ${result}`;
          },
          reason => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          }
        );
    } else if (modalType == 'trust') {
      this.contentTrustTransferRef = this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static'
        })
        .result.then(
          result => {
            this.closeResult = `Closed with: ${result}`;
          },
          reason => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          }
        );
    } else if (modalType == 'alert') {
      this.contentTrustTransferAlertRef = this.modalService
        .open(content, {
          size: className,
          windowClass: winClass,
          centered: true,
          backdrop: 'static'
        })
        .result.then(
          result => {
            this.closeResult = `Closed with: ${result}`;
          },
          reason => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          }
        );
    }
  }

  closeModal() {
    this.selectTransferType = true;
    this.selectBankType = 1;
    this.selectedTrustBankAccount = null;
    this.trustBankAccounts = [];
    this.selectedCreditBankAccount = null;
    this.creditBankAccounts = [];

    this.searchMatter = null;
    this.matterDetail = null;
    this.matterDetailSource = null;
    this.matterListPopUp = [];

    this.searchclient = null;
    this.clientDetail = null;
    this.clientDetailSource = null;
    this.clientListPopUp = [];

    this.selectedTrust = null;
    this.selectedTrustModel = null;
    this.trustList = [];

    this.modalService.dismissAll();
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  public updateClientFilter(event, type) {
    this.clientSearchLoading = true;
    this.clientListPopUp = [];
    let val = this.searchclient.length > 0 ? this.searchclient : null;
    val = val || '';
    val = val.trim();

    if (val !== '') {
      if (this.clientSubscribe) {
        this.clientSubscribe.unsubscribe();
      }
      this.clientSubscribe = this.clockService.v1ClockClientsSearchGet({ search: val }).subscribe(suc => {
        this.clientSearchLoading = false;
        const res: any = suc;
        const list = JSON.parse(res).results;
        if (type === '1') {
          this.clientList = list;
        } else {
          this.clientListPopUp = list.filter(item => item.role.toLowerCase() === "client");
        }

        this.clientListPopUp = this.searchclient.length > 0 ? this.clientListPopUp : [];

      }, err => {
        console.log(err);
      });

    } else {
      this.clientSearchLoading = false;
      this.clientList = [];
      this.clientListPopUp = [];
      this.clientDetail = null;
      this.clientDetailSource = null;
      this.clientDetailfilter = null;
    }
  }

  public updateMatterFilter(event, type, onClientSelect = false) {
    this.matterSearchLoading = true;
    let val = event ? event.target.value : "";
    val = val || '';
    val = val.trim();

    if (val !== '' || onClientSelect) {
      if (this.matterSubscribe) {
        this.matterSubscribe.unsubscribe();
      }
      let param = {};
      if (this.clientDetailfilter !== null && type === '1') {
        param = { search: val, clientId: this.searchclient ? +this.clientDetailfilter.id : 0 }
      } else if (this.clientDetail !== null && type === '2') {
        param = { search: val, clientId: this.searchclient ? +this.clientDetail.id : 0 }
      } else {
        param = { search: val }
      }
      this.matterSubscribe =
        this.clockService.v1ClockMattersByClientIdSearchGet(param).subscribe(suc => {
          this.matterSearchLoading = false;
          const res: any = suc;
          const list = JSON.parse(res).results;
          let newList = [];
          list.forEach(matter => {
            let matterName = matter.matterName.trim();
            matter.matterName = matterName;
            newList.push(matter);
          });
          const sortedList = newList.sort((a, b) =>
            a.matterName.localeCompare(b.matterName)
          );
          if (type === '1') {
            this.matterList = sortedList;
          } else {
            this.matterListPopUp = sortedList;
          }
          
        }, err => {
          console.log(err);
        });

    } else {
      this.matterSearchLoading = false;
      this.matterList = [];
      this.matterListPopUp = [];
      this.matterDetail = null;
      this.matterDetailSource = null;
      this.matterDetailfilter = null;
    }
  }

  public selectClient(item) {
    if (!this.clientDetailSource || (this.clientDetailSource && item.id != this.clientDetailSource.id)) {
      this.searchMatter = null;
      this.matterDetail = null;
      this.matterListPopUp = [];
      this.selectedTrust = null;
      this.selectedTrustModel = null;
      this.trustList = [];
    }
    this.searchclient = item.isCompany ? item.companyName : (item.lastName + ', ' + item.firstName);
    this.clientDetail = item;
    this.clientDetailSource = item;
    this.clientListPopUp = [];
    this.updateMatterFilter(null, '2', true);
  }

  public selectClientFilter(item) {
    this.searchclientfilter = item.isCompany ? item.companyName : (item.lastName + ', ' + item.firstName);
    this.clientDetailfilter = item;
    this.clientList = [];
  }

  public selectMatter(item) {
    this.searchMatter = item.matterName + ' (' + item.matterNumber + ')';
    this.matterDetail = item;
    this.matterDetailSource = item;
    this.matterListPopUp = [];
    if (item.client) {
      this.searchclient = item.client.isCompany ? item.client.companyName : (item.client.lastName + ', ' + item.client.firstName);
      this.clientDetail = item.client;
      this.clientDetailSource = item.client;
    }
    if (!this.selectedTrustModel || item.id != this.selectedTrustModel['matterId']) {
      this.selectedTrustModel = null;
      this.selectedTrust = null;
      this.trustList = [];
      this.loadTrustList();
    }
  }

  public selectMatterFilter(item) {
    this.searchMatterfilter = item.matterName + ' (' + item.matterNumber + ')';
    this.matterDetailfilter = item;
    this.matterList = [];
  }

  public updateClientFilterMain(event, type) {
    let val = this.searchclientMain ? this.searchclientMain : '';
    val = val || '';
    val = val.trim();

    if (val !== '') {
      if (this.clientSubscribeMain) {
        this.clientSubscribeMain.unsubscribe();
      }
      this.clientSearchLoading = true;
      this.clientSubscribeMain = this.clockService.v1ClockClientsSearchGet({ search: val }).subscribe(suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        this.clientSearchLoading = false;
        if (type === '1') {
          this.clientListMain = list;
        } else {
          this.clientListPopUpMain = list.filter(item => item.role.toLowerCase() === "client");
        }
        this.clientListPopUpMain = this.searchclientMain.length > 0 ? this.clientListPopUpMain : [];
      }, err => {
        console.log(err);
        this.clientSearchLoading = false;
      });

    } else {
      this.clientSearchLoading = false;
      this.clientListMain = [];
      this.clientListPopUpMain = [];
      this.clientDetailSourceMain = null;
      this.clientDetailfilterMain = null;
    }
  }

  public updateMatterFilterMain(event, type, onClientSelect = false) {
    let val = this.searchMatterMain ? this.searchMatterMain : "";
    val = val || '';
    val = val.trim();

    if (val !== '' || onClientSelect) {
      if (this.matterSubscribeMain) {
        this.matterSubscribeMain.unsubscribe();
      }
      let param = {};
      if (this.clientDetailfilterMain !== null && type === '1') {
        param = { search: val, clientId: this.searchclientMain ? +this.clientDetailfilterMain.id : 0 }
      } else if (this.clientDetailSourceMain !== null && type === '2') {
        param = { search: val, clientId: this.searchclientMain ? +this.clientDetailSourceMain.id : 0 }
      } else {
        param = { search: val }
      }
      this.matterSearchLoading = true;
      this.matterSubscribeMain =
        this.clockService.v1ClockMattersByClientIdSearchGet(param).subscribe(suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          this.matterSearchLoading = false;
          let newList = [];
          list.forEach(matter => {
            let matterName = matter.matterName.trim();
            matter.matterName = matterName;
            newList.push(matter);
          });
          const sortedList = newList.sort((a, b) =>
            a.matterName.localeCompare(b.matterName)
          );
          if (type === '1') {
            this.matterListMain = sortedList;
          } else {
            this.matterListPopUpMain = sortedList;
          }
        }, err => {
          console.log(err);
          this.matterSearchLoading = false;
        });

    } else {
      this.matterSearchLoading = false;
      this.matterListMain = [];
      this.matterListPopUpMain = [];
      this.matterDetailSourceMain = null;
      this.matterDetailfilterMain = null;
    }
  }

  public selectClientMain(item) {
    if (!this.clientDetailSourceMain || (this.clientDetailSourceMain && item.id != this.clientDetailSourceMain.id)) {
      this.searchMatterMain = null;
      this.matterDetailSourceMain = null;
      this.matterListPopUpMain = [];
      this.selectedTrustMain = null;
      this.selectedTrustModelMain = null;
      this.trustListMain = [];
    }
    this.searchclientMain = item.isCompany ? item.companyName : (item.lastName + ', ' + item.firstName);
    this.clientDetailSourceMain = item;
    this.clientListPopUpMain = [];
    this.updateMatterFilterMain(null, '2', true);

  }

  public selectClientFilterMain(item) {
    this.searchclientfilterMain = item.isCompany ? item.companyName : (item.lastName + ', ' + item.firstName);
    this.clientDetailfilterMain = item;
    this.clientListMain = [];
  }

  public selectMatterMain(item) {
    this.searchMatterMain = item.matterName + ' (' + item.matterNumber + ')';
    this.matterDetailSourceMain = item;
    this.matterListPopUpMain = [];
    if (item.client) {
      this.searchclientMain = item.client.isCompany ? item.client.companyName : (item.client.lastName + ', ' + item.client.firstName);
      this.clientDetailSourceMain = item.client;
    }
    if (!this.selectedTrustModelMain || item.id != this.selectedTrustModelMain['matterId']) {
      this.selectedTrustModelMain = null;
      this.selectedTrustMain = null;
      this.trustListMain = [];
      this.loadTrustListMain();
    }
  }

  public selectMatterFilterMain(item) {
    this.searchMatterfilterMain = item.matterName + ' (' + item.matterNumber + ')';
    this.matterDetailfilterMain = item;
    this.matterListMain = [];
  }


  delete(item, index) {
    let deletedItem = this.transferSourceList.splice(index, 1);

    let deletePostIndex = null;
    for (let i = 0; i < this.transferSourceListPost.length; i++) {
      if (item['uniqueId'] === this.transferSourceListPost[i]['uniqueId']) {
        deletePostIndex = i;
        break;
      }
    }

    let deletedPostItem = this.transferSourceListPost.splice(deletePostIndex, 1);
    if (!this.transferSourceList.length) {
      this.transferSourceList.push({ id: 0, source: null, isBankAccount: true, client: null, matter: null, balance: null, amountTransfer: "0.00", uniqueId: null });
    }
  }

  selectTransfer() {
    this.selectService.newSelection('clicked!');
  }

  pickDate() {
    this.selectService.newSelection('clicked!');
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  clearDropDown(actionOn: string) {
    switch (actionOn) {
      case 'matterListPopUpMain': {
        this.matterListPopUpMain = [];
        break;
      }

      case 'clientListPopUpMain': {
        this.clientListPopUpMain = [];
        break;
      }
      case 'clientListPopUp': {
        this.clientListPopUp = [];
        break;
      }
      case 'matterListPopUp': {
        this.matterListPopUp = [];
        break;
      }
    }
  }

}
