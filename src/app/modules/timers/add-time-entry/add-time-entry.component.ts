import { Component, ComponentRef, EventEmitter, OnInit, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as errors from 'src/app/modules/shared/error.json';
import { CommonValidationService } from 'src/app/service/common-validation.service';
import { vwBillingSettings, vwChargeCodeEntry, vwSubmitTimer } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, MatterService, TimersService } from 'src/common/swagger-providers/services';
import { vwChargeCodeItem, vwTimer } from '../../models/timer.model';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-add-time-entry',
  templateUrl: './add-time-entry.component.html',
  styleUrls: ['./add-time-entry.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AddTimeEntryComponent implements OnInit {
  @ViewChild('chargecodeHere', { static: false, read: ViewContainerRef }) target: ViewContainerRef;
  public componentRef: ComponentRef<any>;
  public clientType: any = { key: 0, value: 'All' };
  public searchFilterList: Array<any> = [
    { key: 0, value: 'All' },
    { key: 1, value: 'Clients' },
    { key: 2, value: 'Potential Clients' },
  ];
  public originalSearchResultList: Array<any> = [];
  public currentActive = false;
  public addClassFlag = false;

  timer: vwTimer;
  error_data = (errors as any).default;
  public loading = false;

  public clientDetail: any = null;
  public searchclient: string;
  public clientListPopUp: Array<any> = [];
  public clientListCopyPopUp: Array<any> = [];
  private clientSubscribe: Subscription;

  public matterDetail: any = null;
  public searchMatter: string;
  public matterListPopUp: Array<any> = [];
  public matterListCopyPopUp: Array<any> = [];
  private matterSubscribe: Subscription;
  public onlyOneMatter = false;

  public originalChargeCodes: Array<any> = [];
  public filterChargeCodeListPopUP: Array<any> = [];
  public loginUser: any;
  public disbursementTypeList: Array<any> = [];
  public remainingTime: number;
  public totalTimeWorked = 0;
  public searchclientMsg = '';
  public searchMatterMsg = '';
  public timerObj: vwSubmitTimer;
  public baseRate = 0;
  chargeCodeItems: Array<vwChargeCodeItem>;
  disabledMatterSearch = false;
  showMatterList = false;

  totalSeconds: number;
  initialSuggestedTimeEntry: number;
  secondsInADay = 86400;
  debounceTimer: any;
  billingSettings: vwBillingSettings;

  scrollEvents: EventEmitter<SlimScrollEvent>;
  mainScrollEvents: EventEmitter<SlimScrollEvent>;
  scollOpts: ISlimScrollOptions;
  public isSearchLoading = false;
  public isMatterSearchLoading = false;
  constructor(
    private activeModal: NgbActiveModal,
    private matterService: MatterService,
    private billingService: BillingService,
    private clockService: ClockService,
    private commonValidationService: CommonValidationService,
    private timersService: TimersService
  ) {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.mainScrollEvents = new EventEmitter<SlimScrollEvent>();
    this.scollOpts = {
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
      alwaysVisible: true,
    };
  }

  ngOnInit() {
    this.getTimerEntryData();
    this.loginUser = UtilsHelper.getLoginUser();
    this.getChargeCode();
  }

  /*
   *To initialize the data of page with timer obj
   */
  getTimerEntryData() {
    this.totalSeconds = this.timer.totalSeconds;
    this.timer.totalSeconds = Math.min(
      this.timer.totalSeconds,
      this.secondsInADay
    );

    if (this.timer.client) {
      this.searchclient = this.timer.client.name;
      this.clientDetail = {
        id: this.timer.client.id,
        name: this.timer.client.name,
        role: 'Client',
        firstName: this.timer.client.firstName,
        lastName: this.timer.client.lastName,
        isCompany: this.timer.client.isCompany,
        companyName: this.timer.client.companyName,
      };

      if (this.timer.matter && this.timer.matter.id > 0) {
        this.searchMatter =
          this.timer.matter.id + ' - ' + this.timer.matter.name;

        this.matterDetail = {
          id: this.timer.matter.id,
          name: this.timer.matter.name,
          isFixedFee: this.timer.matter.isFixedFee,
        };
      } else {
        this.searchMatter = null;
        this.disabledMatterSearch = true;

        this.clientDetail.role = 'Potential Client';
      }
    }

    let minutes = this.timer.totalSeconds / 60;

    if (this.billingSettings && this.billingSettings.timeRoundingInterval) {
      minutes =
        Math.ceil(minutes / this.billingSettings.timeRoundingInterval) *
        this.billingSettings.timeRoundingInterval;
    }

    if (this.timer.previousTotalTimeWorked > 0) {
      minutes = minutes - this.timer.previousTotalTimeWorked;
    }

    this.initialSuggestedTimeEntry = minutes;
    this.remainingTime = this.initialSuggestedTimeEntry;

    this.chargeCodeItems = [
      new vwChargeCodeItem(this.timer.createdOn, minutes),
    ];
  }

  addChargeCodeComponent() {
    let totalTimerWorked = 0;

    if (this.chargeCodeItems && this.chargeCodeItems.length) {
      this.chargeCodeItems.forEach((a) => {
        if (a.timerWorked) {
          if (a.timerWorked.hour >= 0 && a.timerWorked.minutes >= 0) {
            const timeWorked = +a.timerWorked.hour * 60 + a.timerWorked.minutes;
            totalTimerWorked += timeWorked;
          }
        }
      });
    }

    let suggestedTimerEntry = this.initialSuggestedTimeEntry - totalTimerWorked;

    if (suggestedTimerEntry < 0) {
      suggestedTimerEntry = 0;
    }

    const chargeCode = new vwChargeCodeItem(
      this.timer.createdOn,
      suggestedTimerEntry
    );

    this.chargeCodeItems.push(chargeCode);
  }

  public adjustSuggestedTimeEntry() {
    if (this.chargeCodeItems && this.chargeCodeItems.length) {
      let totalTimerWorked = 0;

      this.chargeCodeItems.forEach((a) => {
        let suggestedTimerEntry =
          this.initialSuggestedTimeEntry - totalTimerWorked;
        if (suggestedTimerEntry < 0) {
          suggestedTimerEntry = 0;
        }

        a.suggestedTimerEntry = suggestedTimerEntry;

        if (a.timerWorked) {
          if (a.timerWorked.hour >= 0 && a.timerWorked.minutes >= 0) {
            const timeWorked = +a.timerWorked.hour * 60 + a.timerWorked.minutes;
            totalTimerWorked += timeWorked;
          }
        }
      });

      this.totalTimeWorked = totalTimerWorked;

      this.remainingTime =
        this.initialSuggestedTimeEntry - this.totalTimeWorked;

      if (this.remainingTime < 0) {
        this.remainingTime = 0;
      }
    }
  }

  deleteChargeCodeItem(index: number) {
    this.chargeCodeItems.splice(index, 1);
    this.adjustSuggestedTimeEntry();
  }

  validationAddTimeEntry() {
    let isValid = true;
    this.searchclientMsg = '';
    this.searchMatterMsg = '';

    if (!this.clientDetail) {
      this.searchclientMsg = this.error_data.client_error;
      isValid = false;
    }

    if (this.clientDetail) {
      if (this.clientDetail.role == 'Client' && !this.matterDetail) {
        this.searchMatterMsg = this.error_data.matter_error;
        isValid = false;
      }
    } else {
      if (!this.matterDetail) {
        this.searchMatterMsg = this.error_data.matter_error;
        isValid = false;
      }
    }

    for (let i = 0; i < this.chargeCodeItems.length; i++) {
      const item = this.chargeCodeItems[i];
      if (item.isInvalid(this.clientDetail)) {
        this.commonValidationService.validateChargeCode$.next(i);
        isValid = false;
      }
    }

    return isValid;
  }

  save() {
    const isValidate = this.validationAddTimeEntry();
    if (isValidate) {
      let timerDetails = {
        client: this.clientDetail,
        matter: this.matterDetail || null,
        id: this.timer.id,
        totalSeconds: this.timer.totalSeconds,
        previousTotalTimeWorked:
          (this.timer.previousTotalTimeWorked || 0) + this.totalTimeWorked,
        isRemainingTimer: true,
        createdOn: this.timer.createdOn,
      };

      if (!timerDetails.client.name) {
        timerDetails.client.name = timerDetails.client.isCompany
          ? timerDetails.client.companyName
          : timerDetails.client.lastName + ', ' + timerDetails.client.firstName;
      }

      if (!timerDetails.matter) {
        timerDetails.client.role = 'Potential Client';
      } else {
        timerDetails.client.role = 'Client';
        if (!timerDetails.matter.name) {
          timerDetails.matter.name = timerDetails.matter.matterName;
        }
      }

      this.timerObj = {};
      this.timerObj.matterId = !!this.matterDetail ? this.matterDetail.id : 0;
      this.timerObj.clientId = !!this.clientDetail ? this.clientDetail.id : 0;
      this.timerObj.timerId = this.timer.id;

      this.timerObj.chargeCodeEntries = this.chargeCodeItems.map((a) => {
        let chargeCode = {
          billingNarrative: a.billingNarrative,
          dateOfService: a.dateOfService,
          hours: a.timerWorked.hour,
          minutes: a.timerWorked.minutes,
          isVisibleToClient: a.visibleToClient,
          notes: a.notes,
        } as vwChargeCodeEntry;

        if (this.matterDetail && this.matterDetail.isFixedFee) {
          if (a.chargeCodeType == 'FIXED_FEE') {
            chargeCode.fixedFeeId = a.chargeCodeId;
          } else if (a.chargeCodeType == 'FIXED_FEE_ADD_ON') {
            chargeCode.fixedFeeAddOnId = a.chargeCodeId;
          } else {
            chargeCode.chargeCodeId = a.chargeCodeId;
          }
        } else {
          chargeCode.chargeCodeId = a.chargeCodeId;
        }

        return chargeCode;
      });

      if (this.clientDetail.id == 0) {
        this.timerObj.isOverhead = true;
      }

      let result: any = {
        submitTimer: this.timerObj,
      };

      if (this.remainingTime > 0) {
        result.remainingTimer = timerDetails;
      }

      this.activeModal.close(result);
    } else {
      setTimeout(() => {
        const timeEntry = document.querySelector('app-add-time-entry');
        if (timeEntry) {
          let fieldMessage: HTMLSpanElement = timeEntry.querySelector(
            '.field-message'
          );
          if (fieldMessage) {
            let elementToScrol = fieldMessage.parentElement || fieldMessage;

            elementToScrol.scrollIntoView({
              behavior: 'smooth',
            });

            let event = new SlimScrollEvent({
              type: 'scrollTo',
              y: elementToScrol.offsetTop,
              duration: 100,
              easing: 'linear',
            });

            this.mainScrollEvents.emit(event);
          }
        }
      }, 100);
      return;
    }
  }

  /**
   *
   * Fetch searchResult
   */
  public getClientSearchResult(search, isNewReq: boolean = false) {
    search = search.trim();

    if (this.clientSubscribe) {
      this.clientSubscribe.unsubscribe();
    }

    if (search && search != '' && search.length > 2) {
      this.isSearchLoading = true;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.clientSubscribe = this.clockService
          .v1ClockClientsSearchusingindexGet({ search: search })
          .subscribe(
            (suc) => {
              const res: any = suc;
              if (res) {
                const list = JSON.parse(res as any).results;
                this.clientListPopUp = list;
                this.clientListCopyPopUp = [...this.clientListPopUp];
                this.clientListPopUp =
                  this.clientListCopyPopUp && this.clientListCopyPopUp.length
                    ? this.clientListCopyPopUp.filter((v) => v.role == 'Client')
                    : [];
                this.clientListPopUp = _.orderBy(this.clientListPopUp, ['lastName', 'firstName'], ['asc']);
                this.addoverhead('client', search, this.clientListPopUp);
              }
              this.isSearchLoading = false;
            },
            (err) => {
              this.isSearchLoading = false;
            }
          );
      }, 500);
    } else {
      this.clientListPopUp = [];
      this.clientListCopyPopUp = [];
      this.isSearchLoading = false;
    }
  }

  private addoverhead(type: string, value: string, arr) {
    const v = value ? value.toLowerCase() : '';
    if (type === 'client') {
      if ('overhead'.match(v)) {
        return arr.push({ id: 0, lastName: 'Overhead' });
      }
    } else {
      if ('overhead'.match(v)) {
        return arr.push({ id: 0, matterName: 'Overhead' });
      }
    }
  }

  public selectClient(item) {
    this.matterListPopUp = [];
    this.matterListCopyPopUp = [];

    this.searchclient = item.isCompany
      ? item.companyName
      : item.name
        ? item.name
        : item.lastName + ', ' + item.firstName;
    this.clientDetail = item;

    this.searchclientMsg = null;

    this.clientListPopUp = [];

    if (item.id == 0) {
      this.clientDetail = {
        id: 0,
        lastName: 'Overhead',
      };
    }

    if (this.matterDetail) {
      if (this.matterDetail.client && this.matterDetail.client.id != item.id) {
        this.searchMatter = null;
        this.matterDetail = null;
      }

      if (
        this.clientDetail.id > 0 &&
        this.matterDetail &&
        this.matterDetail.id == 0
      ) {
        this.searchMatter = null;
        this.matterDetail = null;
      }
    } else {
      this.searchMatter = null;
      this.matterDetail = null;
    }

    this.loading = true;

    this.onlyOneMatter = false;

    if (item.id === 0) {
      this.disabledMatterSearch = true;
      this.loading = false;
      this.selectMatter({ id: 0, matterName: 'Overhead' }, 'overhead');
    } else {
      this.disabledMatterSearch = false;
      this.matterBasedOnClients({ clientId: item.id });
    }
  }

  public updateMatterFilter(event, isNewReq: boolean = false) {
    this.loading = false;
    this.showMatterList = true;
    let searchValue =  (this.searchMatter) ? this.searchMatter.trim() : '';
    if (this.matterSubscribe) {
      this.matterSubscribe.unsubscribe();
    }

    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowRight' ||
      event.code === 'ArrowLeft' ||
      this.searchMatter === 'Overhead'
    ) {
      return;
    }
    if (searchValue && searchValue != '' && searchValue.length > 2) {
      let param = {};
      if (!!this.clientDetail && this.clientDetail.id) {
        param = { search: searchValue, clientId: +this.clientDetail.id };
      } else {
        param = { search: searchValue };
      }
      this.isMatterSearchLoading = true;
      this.matterSubscribe = this.clockService
        .v1ClockMattersSearchGet(param)
        .subscribe(
          (suc) => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            let newList = [];
            list.forEach((matter) => {
              let matterName = matter.matterName.trim();
              matter.matterName = matterName;
              newList.push(matter);
            });
            const sortedList = newList.sort((a, b) =>
              a.matterName.localeCompare(b.matterName)
            );
            this.addoverhead('matter', searchValue, sortedList);
            this.matterListPopUp = sortedList;
            this.isMatterSearchLoading = false;
          },
          (err) => {
            console.log(err);
            this.isMatterSearchLoading = false;
          }
        );
    } else {
      if (this.clientDetail) {
        this.matterListPopUp = UtilsHelper.clone(this.matterListCopyPopUp);
      } else {
        this.matterListPopUp = [];
        this.matterListCopyPopUp = [];
      }

      this.showMatterList = true;
      this.matterDetail = null;

      this.isMatterSearchLoading = false;
    }

    this.resetChargeHourCode();
  }

  public onMatterFocus() {
    this.showMatterList = true;
    if (!!this.searchMatter) {
      if (this.clientDetail) {
        this.matterListPopUp = this.matterListCopyPopUp.filter((a) => {
          a.matterName == this.searchMatter ||
            a.matterNumber == this.searchMatter;
        });
      }
    } else {
      if (this.clientDetail) {
        this.matterListPopUp = UtilsHelper.clone(this.matterListCopyPopUp);
      } else {
        this.matterListPopUp = [];
      }
    }
  }

  public selectMatter(item, type?) {
    if (item.id == 0) {
      this.searchMatter = item.matterName;
    } else {
      this.searchMatter = item.matterNumber + ' - ' + item.matterName;
    }

    this.showMatterList = false;
    this.matterDetail = item;
    this.searchMatterMsg = null;

    if (item.id === 0) {
      this.disabledMatterSearch = true;
      this.searchclient = 'Overhead';
      this.clientDetail = { id: 0, lastName: 'Overhead' };
      this.searchclientMsg = null;
    } else if (item['client'] != null) {
      this.disabledMatterSearch = false;
      this.searchclient = item['client'].isCompany
        ? item['client'].companyName
        : item.name
          ? item.name
          : item['client'].lastName + ', ' + item['client'].firstName;
      this.clientDetail = item['client'];
      this.searchclientMsg = null;
    } else {
      this.disabledMatterSearch = false;
      if (this.clientDetail) {
        this.matterDetail.client = this.clientDetail;
      }
    }

    this.getChargeCode(() => { }, type);
  }

  public getChargeCode(onSuccess = () => { }, type = null) {
    if (this.matterDetail && this.matterDetail.id) {
      this.getMatterLevelChargeCode(onSuccess, type);
    } else {
      this.getTenantLevelChargeCode(onSuccess, type);
    }
  }

  private getTenantLevelChargeCode(onSuccess = () => { }, type) {
    if (this.loginUser) {
      this.loading = true;
      this.billingService
        .v1BillingRateTenantTenantIdGet({ tenantId: this.loginUser.tenantId })
        .subscribe(
          (suc) => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            if (list && list.length > 0) {
              this.disbursementTypeList = list;
              if (this.matterDetail && this.matterDetail.id === 0) {
                this.disbursementTypeList = this.disbursementTypeList.filter(
                  (a) => a.billingTo && a.billingTo.code == 'OVERHEAD'
                );
              } else {
                this.disbursementTypeList = this.disbursementTypeList.filter(
                  (a) =>
                    a.billingTo &&
                    (a.billingTo.code == 'BOTH' ||
                      a.billingTo.code == 'CLIENT' ||
                      a.billingTo.code == 'OVERHEAD')
                );
              }

              this.disbursementTypeList = this.disbursementTypeList.filter(
                (a) => a.status == 'Active'
              );
              this.originalChargeCodes = UtilsHelper.clone([
                ...this.disbursementTypeList,
              ]);
              this.setClientFilterOnChargeCode();
            }
            onSuccess();
            this.loading = false;
          },
          (err) => {
            this.loading = false;
            console.log(err);
          }
        );
    }
  }

  private getMatterLevelChargeCode(onSuccess = () => { }, type) {
    this.loading = true;
    this.filterChargeCodeListPopUP = [];
        this.billingService
      .v1BillingChargecodesMatterMatterIdGet({
        matterId: this.matterDetail.id
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list && list.length > 0) {
            this.disbursementTypeList = list || [];
            this.disbursementTypeList.forEach(code => {
              code.number = Number(code.code);
            })
            this.disbursementTypeList = this.disbursementTypeList.sort(
              (a, b) => {
                return a.number - b.number;
              }
            );
            this.disbursementTypeList = this.disbursementTypeList.filter(
              a => a.status == 'Active'
            );
            this.originalChargeCodes = UtilsHelper.clone([
              ...this.disbursementTypeList,
            ]);
            this.setClientFilterOnChargeCode();
          }
          onSuccess();
        },
        err => {
          this.loading = false;
          console.log(err);
        }
      );
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  /**
   * fetch matter list associated with client.
   * @param clientId
   */
  public async matterBasedOnClients(clientId: any) {
    try {
      let resp: any = await this.matterService
        .v1MatterClientClientIdGet(clientId)
        .toPromise();
      if (resp != null) {
        this.onlyOneMatter = false;
        let response = [...(JSON.parse(resp).results as Array<any>)];

        response = response || [];
        response = response.filter(a => a.status && a.status.name == 'Open');

        this.matterListPopUp = [...response];
        this.matterListCopyPopUp = [...this.matterListPopUp];

        if (this.matterListPopUp && this.matterListPopUp.length == 1) {
          this.selectMatter(this.matterListPopUp[0], '');
          this.onlyOneMatter = true;
        } else {
          this.loading = false;
        }
      } else {
        this.loading = false;
      }
    } catch (error) {
      console.log(error);
      this.loading = false;
    }
  }

  /**
   * Function Of DropDown Actions
   */
  public actionDropDown(event?, type?: string) {
    if (this.loading) {
      return;
    }

    if (this.clientListPopUp.length) {
      this.selectClient(this.clientListPopUp[0]);
      if (this.searchclient === 'Overhead') {
        this.clientListPopUp = [];
        this.clientSubscribe.unsubscribe();
        return;
      }
      this.clientListPopUp = [];
      this.clientSubscribe.unsubscribe();
    }

    if (this.matterListPopUp.length) {
      this.selectMatter(this.matterListPopUp[0]);
      this.showMatterList = false;
      if (this.matterSubscribe != null) {
        this.matterSubscribe.unsubscribe();
      }
    }

    if (event) {
      event.focus();
    }
  }

  /**
   *  clears search list dropdown
   */
  clearDropDown(actionOn: string) {
    switch (actionOn) {
      case 'clientListPopUp': {
        this.clientListPopUp = [];

        if (!this.searchclient) {
          this.clientDetail = null;
          this.searchMatter = null;
          this.matterDetail = null;
          this.matterListCopyPopUp = [];
          this.disabledMatterSearch = false;
          this.onlyOneMatter = false;

          this.resetChargeHourCode();
        }
        break;
      }
      case 'matterListPopUp': {
        this.showMatterList = false;
        break;
      }
    }
  }

  openMenu(): void {
    setTimeout(() => {
      this.currentActive = !this.currentActive;
    }, 50);
  }

  public changeFilter(type: any) {
    this.clientType = type;
    this.setClientFilterOnChargeCode();
    this.filterChargeCodeListPopUP = [...this.disbursementTypeList];
    this.commonValidationService.newChargeCodeList.next(
      this.filterChargeCodeListPopUP
    );

    switch (this.clientType.key) {
      case 0: {
        this.disabledMatterSearch = false;
        this.clientListPopUp = [...this.clientListCopyPopUp];
        break;
      }
      case 1: {
        this.disabledMatterSearch = false;
        this.clientListPopUp =
          this.clientListCopyPopUp && this.clientListCopyPopUp.length
            ? this.clientListCopyPopUp.filter((v) => v.role == 'Client')
            : [];

        if (!this.clientDetail) {
          this.onlyOneMatter = false;
          this.searchMatter = null;
          this.matterDetail = null;
          this.matterListPopUp = [];
          this.matterListCopyPopUp = [];
        }
        if (this.clientDetail && this.clientDetail.role != 'Client') {
          this.clientDetail = null;
          this.searchclient = '';
          this.onlyOneMatter = false;
          this.searchMatter = null;
          this.matterDetail = null;
          this.matterListPopUp = [];
          this.matterListCopyPopUp = [];
        }

        break;
      }
      case 2: {
        this.searchMatter = null;
        this.disabledMatterSearch = true;
        this.matterDetail = null;
        this.matterListPopUp = [];
        this.matterListCopyPopUp = [];

        if (this.clientDetail && this.clientDetail.role != 'Potential Client') {
          this.clientDetail = null;
          this.searchclient = '';
          this.onlyOneMatter = false;
        }

        this.clientListPopUp =
          this.clientListCopyPopUp && this.clientListCopyPopUp.length
            ? this.clientListCopyPopUp.filter(
              (v) => v.role == 'Potential Client'
            )
            : [];
        break;
      }
    }
  }

  onClickedOutside(event?: any) {
    this.currentActive = false;
  }

  close(message = null) {
    this.activeModal.close(message);
  }

  secondsToHms(time: number) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - hours * 3600) / 60);
    let seconds = Math.floor(time - hours * 3600 - minutes * 60);

    let hr;
    let min;
    let sec;

    hr = hours < 10 ? '0' + hours.toString() : hours.toString();
    min = minutes < 10 ? '0' + minutes.toString() : minutes.toString();
    sec = seconds < 10 ? '0' + seconds.toString() : seconds.toString();

    return `${hr}:${min}:${sec}`;
  }

  getTimeString(hour: string | number, min: string | number) {
    if (min >= 60) {
      hour = +hour + 1;
      min = +min - 60;
    }
    return hour + 'h' + ' ' + min + 'm';
  }
  public resetChargeHourCode() {
    if (this.chargeCodeItems && this.chargeCodeItems.length) {
      this.chargeCodeItems.forEach((ele) => {
        ele.resetChargeCode();
        ele.rate = 0;
      });
    }
  }

  setClientFilterOnChargeCode() {
    this.disbursementTypeList = UtilsHelper.clone(this.originalChargeCodes);

    if (this.clientDetail && this.matterDetail) {
      if (this.clientDetail.id == 0 && this.matterDetail.id == 0) {
        this.disbursementTypeList = this.disbursementTypeList.filter(
          (a) => a.billingTo && a.billingTo.code == 'OVERHEAD'
        );
      } else {
        this.disbursementTypeList = this.disbursementTypeList.filter(
          (a) =>
            a.billingTo &&
            (a.billingTo.code == 'BOTH' || a.billingTo.code == 'CLIENT')
        );
      }
    }

    this.filterChargeCodeListPopUP = UtilsHelper.clone([
      ...this.disbursementTypeList,
    ]);
    this.commonValidationService.newChargeCodeList.next(
      this.filterChargeCodeListPopUP
    );
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

}
