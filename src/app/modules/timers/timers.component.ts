import { Component, EventEmitter, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { interval, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { vwBillingSettings, vwUpdateTimer } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, MatterService, TimersService } from 'src/common/swagger-providers/services';
import { vwAddTimeEntryResponse, vwTimer } from '../models/timer.model';
import { SharedService } from '../shared/sharedService';
import { padNumber, UtilsHelper } from '../shared/utils.helper';
import { AddTimeEntryComponent } from './add-time-entry/add-time-entry.component';

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class TimersComponent implements OnInit, OnDestroy {
  public displayTimersView = false;
  public runningTimers: number = 0;
  public displayTimersTab = false;
  public stoppedTimers: number = 0;
  public today: any;
  public totalTimeInSeconds: number = 0;
  public timeFormat: string;
  public totalTime: string;
  public listOfTimers: vwTimer[];
  public interval;

  private updateTimersSub: Subscription;

  public editTimer: vwTimer;
  public selectedClient: any;
  public searchFilter: string = 'All';
  public originalSearchResultList: Array<any> = [];
  public currentActive: boolean = false;
  public addClassFlag: boolean = false;
  public isPotentialClient = false;
  timer: vwTimer;
  public searchedClient: any;
  public noResultFound: boolean = false;
  public searchResultList: Array<any> = [];
  public showSearchBox: boolean = false;
  public pageIndex: number = 0;
  public totalResultCount: any;
  public clientPermission: boolean = true;
  public contactPermission: boolean = true;
  public clientListPopUp: Array<any> = [];
  public clientListCopyPopUp: Array<any> = [];
  public matterListPopUp: Array<any> = [];
  public loading = false;
  public searchMatter: string;
  public matterDetail: any = null;
  private matterSubscribe: Subscription;
  public clientDetailfilter: any = null;
  public matterList: Array<any> = [];
  public matterDetailfilter: any = null;
  public selectedSearchClient: any;
  public loginUser: any;
  private clientSubscribe: Subscription;
  public displayTimers: boolean = true;

  error_data = (errors as any).default;

  clientError: string;
  matterError: string;

  timerScollOpts: ISlimScrollOptions;
  timerScrollEvents: EventEmitter<SlimScrollEvent>;
  public searchClientLoading: boolean = false;
  public disabled = false;
  public clientType: any = { key: 0, value: 'All' };
  public searchFilterList: Array<any> = [
    { key: 0, value: 'All' },
    { key: 1, value: 'Clients' },
    { key: 2, value: 'Potential Clients' },
  ];
  public showMatterList = false;
  billingSettings: vwBillingSettings;

  showWarning = false;
  showSuccess = false;
  showDiscardSuccess = false;

  remainingTimer: vwTimer;

  timeDisplayFormatUpdateSub: Subscription;
  timerSyncSub: Subscription;
  public isSearchLoading = false;
  public isMatterSearchLoading=false;
  constructor(
    private timersService: TimersService,
    private matterService: MatterService,
    private clockService: ClockService,
    private configService: AppConfigService,
    private modalService: NgbModal,
    private router: Router,
    private toastr: ToastDisplay,
    private billingService: BillingService,
    private sharedService: SharedService
  ) {
    this.startUpdateTimer();
    this.timeDisplayFormatUpdateSub = this.sharedService.timeDisplayFormatUpdate$.subscribe(
      (res) => {
        if (res) {
          let format = localStorage.getItem('timeformat');
          if (format != this.timeFormat) {
            this.timeFormat = format;
            this.getTimeString(this.totalTimeInSeconds);
          }
        }
      }
    );
  }

  ngOnInit() {
    this.timerScrollEvents = new EventEmitter<SlimScrollEvent>();
    this.timerScollOpts = {
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
    this.getTimers(true);
    this.timeFormat = localStorage.getItem('timeformat');
    this.today = new Date();
    this.searchFilterList = [
      { key: 0, value: 'All' },
      { key: 1, value: 'Clients' },
      { key: 2, value: 'Potential Clients' },
    ];
    this.loginUser = UtilsHelper.getLoginUser();
    this.getBillingSettings();
    this.disabled = false;
  }

  ngOnDestroy() {
    if (this.timeDisplayFormatUpdateSub) {
      this.timeDisplayFormatUpdateSub.unsubscribe();
    }

    if (this.timerSyncSub) {
      this.timerSyncSub.unsubscribe();
    }
  }

  private getBillingSettings() {
    if (this.loginUser) {
      this.billingService
        .v1BillingSettingsTenantTenantIdGet({
          tenantId: this.loginUser.tenantId,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (billingSettings) => {
            this.billingSettings = billingSettings[0] || {};
          },
          () => {}
        );
    }
  }

  getTimers(start: boolean) {
    this.timersService.v1TimersGet().subscribe((res) => {
      let r: any = res;
      this.listOfTimers = JSON.parse(r).results.reverse();
      this.runningTimers = this.listOfTimers.filter((a) => a.isRunning).length;
      this.stoppedTimers = this.listOfTimers.filter((a) => !a.isRunning).length;

      this.getTotalSeconds(start);
      this.displayTimersTab = true;
    });
  }

  getTotalSeconds(start: boolean) {
    if (start) {
      this.listOfTimers.forEach((timer) => {
        this.totalTimeInSeconds += timer.totalSeconds;
      });
      this.startTimer();
    } else {
      this.totalTimeInSeconds = 0;
      this.listOfTimers.forEach((timer) => {
        this.totalTimeInSeconds += timer.totalSeconds;
      });
      this.getTotalTime();
    }
  }

  startNewTimer() {
    this.displayTimersView = true;

    let timers = this.listOfTimers;

    this.loading = true;

    if (this.updateTimersSub) {
      this.updateTimersSub.unsubscribe();
    }

    let stopRunning = 'false';

    if (this.loginUser.tenantTier.tierName == 'Emerging') {
      stopRunning = 'true';

      timers.forEach((a) => {
        a.isRunning = false;
      });
    }

    this.timersService
      .v1TimersStartTimerStopRunningPost$Json({
        stopRunning: stopRunning as any,
        body: timers,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (suc) => {
          const res: any = suc;
          this.bindToList(res);
        },
        (err) => {}
      );
  }

  getTimeString(time: number) {
    let hour = Math.floor(time / 3600);
    let min = Math.floor((time - hour * 3600) / 60);

    if (this.timeFormat === 'standard') {
      this.totalTime = hour + ':' + padNumber(+min);
    } else if (this.timeFormat === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      this.totalTime = (hours + minutes / 60).toFixed(2);
    } else {
      this.totalTime = hour + 'h' + ' ' + min + 'm';
    }
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

  startTimer() {
    this.interval = setInterval(() => {
      this.getTotalTime();
    }, 1000);
  }

  getTotalTime() {
    this.listOfTimers.forEach((timer) => {
      if (timer.isRunning) {
        timer.totalSeconds += 1;
        this.totalTimeInSeconds += 1;
      }
    });
    this.getTimeString(this.totalTimeInSeconds);
  }

  updateTimer(timer: vwTimer, onSuccess = () => {}) {
    timer.isRunning = false;
    let body = {
      clientId: timer.client ? timer.client.id : null,
      matterId: timer.matter
        ? timer.matter.id > 0
          ? timer.matter.id
          : null
        : null,
      id: timer.id,
      isRunning: timer.isRunning,
      totalSeconds: timer.totalSeconds,
    } as vwUpdateTimer;

    this.timersService.v1TimersTimerPut$Json({ body: body }).subscribe((_) => {
      onSuccess();
    });
  }

  pause(timer: vwTimer) {
    let timers = this.listOfTimers;

    timers.forEach((a) => {
      if (a.id == timer.id) {
        a.isRunning = false;
      }
    });

    this.loading = true;

    if (this.updateTimersSub) {
      this.updateTimersSub.unsubscribe();
    }

    this.timersService
      .v1TimersPlayPausePut$Json({ body: timers })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (suc) => {
          const res: any = suc;
          if (res) {
            this.bindToList(res);
          }
        },
        (err) => {}
      );
  }

  play(timer: vwTimer) {
    let timers = this.listOfTimers;

    if (this.loginUser.tenantTier.tierName == 'Emerging') {
      timers.forEach((a) => {
        if (a.id == timer.id) {
          a.isRunning = true;
        } else {
          a.isRunning = false;
        }
      });
    } else {
      timers.forEach((a) => {
        if (a.id == timer.id) {
          a.isRunning = true;
        }
      });
    }

    this.loading = true;

    if (this.updateTimersSub) {
      this.updateTimersSub.unsubscribe();
    }

    this.timersService
      .v1TimersPlayPausePut$Json({ body: timers })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (suc) => {
          const res: any = suc;
          if (res) {
            this.bindToList(res);
          }
        },
        (err) => {}
      );
  }

  private startUpdateTimer() {
    this.timerSyncSub = interval(this.configService.appConfig.timerSyncInterval).subscribe(() => {
      this.update();
    });
  }

  /**
   * Use this method to update db entries, call on 'document:click'
   */
  update() {
    if (this.updateTimersSub) {
      this.updateTimersSub.unsubscribe();
    }

    let body = this.getRequestForUpdate();

    if (this.listOfTimers && this.listOfTimers.length > 0) {
      this.updateTimersSub = this.timersService
        .v1TimersPut$Json({ body: body })
        .subscribe((suc) => {
          const res: any = suc;
          this.bindToList(res);
        });
    } else {
      this.getTimers(false);
    }
  }

  /**
   *
   * Fetch searchResult
   */
  public getsearchResult(search, isNewReq: boolean = false) {
    this.searchClientLoading = true;

    search = search.trim();
    this.searchMatter = '';
    if (this.clientSubscribe) {
      this.clientSubscribe.unsubscribe();
    }
    if (search && search != '' && search.length >= 1) {
      this.isSearchLoading = true;
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
              this.searchClientLoading = false;
            }
            this.isSearchLoading = false;
          },
          (err) => {}
        );
    } else {
      this.clientListPopUp = [];
      this.clientListCopyPopUp = [];
      this.loading = false;
      this.searchClientLoading = false;
      this.isSearchLoading = false;
    }
  }

  public selectClient(item) {
    this.matterListPopUp = [];
    if (item.isCompany) {
      this.searchedClient = item.companyName;
    } else if (!item.isCompany && item.firstName) {
      this.searchedClient = item.lastName + ', ' + item.firstName;
    } else {
      this.searchedClient = item.lastName;
    }
    this.clientListPopUp = [];
    this.searchMatter = null;
    this.matterDetail = null;
    this.selectedClient = item;
    this.selectedSearchClient = item.id;
    this.clientError = null;

    if (this.selectedClient.role != 'Potential Client') {
      this.loading = true;
      this.matterBasedOnClients({ clientId: item.id });
    } else {
      this.matterError = null;
      this.loading = false;
    }
  }

  public updateMatterFilter(event) {
    if (event == 'clearMatter') {
      return;
    }
    this.loading = false;
    let searchValue = event.target.value;
    searchValue = searchValue.trim();

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

    if (searchValue && searchValue != '' && searchValue.length >= 1) {
      let param = {};
      if (!!this.selectedSearchClient) {
        param = { search: searchValue, clientId: +this.selectedSearchClient };
      } else if (!!this.selectedSearchClient) {
        param = { search: searchValue, clientId: +this.selectedSearchClient };
      } else {
        param = { search: searchValue };
      }

      if (this.matterSubscribe) {
        this.matterSubscribe.unsubscribe();
      }
      this.isMatterSearchLoading=true;
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
            this.matterListPopUp = sortedList;
            this.isMatterSearchLoading=false;
          },
          (err) => {
            this.isMatterSearchLoading=false;
          }
        );
    } else {
      this.matterList = [];
      this.matterListPopUp = [];
      this.matterDetail = null;
      this.matterDetailfilter = null;
      this.isMatterSearchLoading=false;
    }
  }

  public selectMatter(item, type?) {
    this.searchMatter = item.matterNumber + ' - ' + item.matterName;
    this.matterListPopUp = [];

    if (item['client'] != null && !this.selectedClient) {
      this.selectedClient = item['client'];
      this.searchedClient = item['client'].isCompany
        ? item['client'].companyName
        : item['client'].lastName + ', ' + item['client'].firstName;
      this.searchResultList = [item['client']];
      this.selectedSearchClient = item['client']['id'];
      this.clientError = null;
    }

    this.matterDetail = item;
    this.matterListPopUp = [];
    this.matterError = null;
  }

  @HostListener('scroll', ['$event']) onScroll(event: any) {
    if (
      event.target.offsetHeight + event.target.scrollTop >=
        event.target.scrollHeight - 5 &&
      !this.noResultFound
    ) {
      let index = this.searchResultList.length / 5;
      this.pageIndex = Math.ceil(index + 1);
    }
  }

  openMenu(): void {
    setTimeout(() => {
      this.currentActive = !this.currentActive;
    }, 50);
  }

  /**
   * fetch matter list associated with client.
   * @param clientId
   */
  public async matterBasedOnClients(clientId: any) {
    try {
      this.matterDetail = null;
      this.disabled = false;
      let resp: any = await this.matterService
        .v1MatterClientClientIdGet(clientId)
        .toPromise();
      if (resp != null) {
        let response = [...(JSON.parse(resp).results as Array<any>)];
        if (response.length === 1) {
          this.matterDetail = response[0];
          this.searchMatter =
            this.matterDetail.matterNumber +
            ' - ' +
            this.matterDetail.matterName;
          this.disabled = true;
          this.matterError = null;
        } else if (response.length > 1) {
          this.matterListPopUp = response;
          this.disabled = false;
        }

        this.loading = false;
      }
    } catch (error) {
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
      this.clientListPopUp = [];
      if (this.clientSubscribe) {
        this.clientSubscribe.unsubscribe();
      }
    }

    if (this.matterListPopUp.length) {
      this.selectMatter(this.matterListPopUp[0]);
      this.matterListPopUp = [];
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
        if (this.selectedClient && this.searchedClient) {
          if (this.selectedClient.isCompany) {
            this.searchedClient = this.selectedClient.companyName;
          } else if (
            !this.selectedClient.isCompany &&
            this.selectedClient.firstName
          ) {
            this.searchedClient =
              this.selectedClient.lastName +
              ', ' +
              this.selectedClient.firstName;
          } else {
            this.searchedClient = this.selectedClient.lastName;
          }
          this.selectedSearchClient = this.selectedClient.id;
        } else {
          if (!this.searchedClient) {
            this.selectedClient = null;
            this.selectedSearchClient = null;
            this.searchMatter = null;
            this.matterDetail = null;
            this.matterListPopUp = [];
            this.disabled = false;
          }
        }
        break;
      }
      case 'matterListPopUp': {
        this.matterListPopUp = [];
        break;
      }
    }
  }

  filterListOnPermissions() {
    if (!this.clientPermission || !this.contactPermission) {
      this.searchResultList = this.searchResultList.filter(
        (item) =>
          item.resultType.toLowerCase() != 'client' &&
          item.resultType.toLowerCase() != 'contact'
      );
    }
  }

  public changeFilter(type: string) {
    this.clientType = type;
    switch (this.clientType.key) {
      case 0: {
        this.clientListPopUp = [...this.clientListCopyPopUp];
        break;
      }
      case 1: {
        this.clientListPopUp =
          this.clientListCopyPopUp && this.clientListCopyPopUp.length
            ? this.clientListCopyPopUp.filter((v) => v.role == 'Client')
            : [];
        break;
      }
      case 2: {
        this.searchMatter = null;
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

  updateTimerDetails() {
    this.clientError = null;
    this.matterError = null;

    if (this.selectedSearchClient < 0 || !this.selectedClient) {
      this.clientError = this.error_data.client_error;
    }

    if (this.selectedClient && (!this.matterDetail || !this.searchMatter)) {
      this.matterError = this.error_data.matter_error;
    }

    if (!this.selectedClient && !this.matterDetail) {
      this.matterError = this.error_data.matter_error;
    }

    if (this.clientError || this.matterError) {
      return;
    }

    let item = {
      id: this.editTimer.id,
      matterId: this.matterDetail ? this.matterDetail.id : 0,
      clientId: this.selectedSearchClient,
      totalSeconds: this.editTimer.totalSeconds,
      isRunning: this.editTimer.isRunning,
    };

    this.loading = true;
    this.timersService.v1TimersTimerPut$Json({ body: item }).subscribe(
      (suc) => {
        const res: any = suc;
        this.loading = false;
        if (res) {
          this.getTimers(false);
          this.displayTimers = !this.displayTimers;
          this.disabled = false;
          this.clientType = { key: 0, value: 'All' };
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  editDetails(item: vwTimer) {
    this.editTimer = item;
    this.displayTimers = !this.displayTimers;
    this.matterDetail = null;
    this.selectedSearchClient = null;
    this.searchMatter = null;
    this.searchedClient = null;
    this.searchResultList = [];
    this.matterListPopUp = [];
    this.matterError = null;
    this.clientError = null;
    this.clientListPopUp = [];
  }

  clear(type) {
    if (type == 'client') {
      this.searchedClient = null;
      this.searchResultList = [];
      this.selectedSearchClient = null;
      this.selectedClient = null;
      this.clientListPopUp = [];
      this.getsearchResult('', false);
      if (this.matterDetail) {
        this.matterDetail = [];
        this.disabled = false;
        this.searchMatter = null;
      }
    }

    if (type == 'matter') {
      this.searchMatter = null;
      this.matterDetail = null;
      this.matterListPopUp = [];
      this.updateMatterFilter('clearMatter');
    }
  }

  deleteTimer(item: vwTimer, deletModal) {
    this.modalService
      .open(deletModal, {
        size: 'sm',
        centered: true,
        container: '#timerWidget',
        backdrop: 'static',
      })
      .result.then((result) => {
        if (result) {
          this.loading = true;

          if (this.updateTimersSub) {
            this.updateTimersSub.unsubscribe();
          }

          let body = this.listOfTimers.map((a) => {
            return {
              clientId: a.client ? a.client.id : null,
              matterId: a.matter
                ? a.matter.id > 0
                  ? a.matter.id
                  : null
                : null,
              id: a.id,
              isRunning: a.isRunning,
              totalSeconds: a.totalSeconds,
            } as vwUpdateTimer;
          });

          this.timersService
            .v1TimersDelete$Json({
              body: {
                timerIds: [item.id],
                timers: body,
              },
            })
            .pipe(
              finalize(() => {
                this.loading = false;
              })
            )
            .subscribe((success) => {
              let res: any = success;
              this.bindToList(res);
            });
        }
      });
  }

  private bindToList(res: any) {
    this.listOfTimers = JSON.parse(res).results.reverse();
    this.runningTimers = this.listOfTimers.filter((a) => a.isRunning).length;
    this.stoppedTimers = this.listOfTimers.filter((a) => !a.isRunning).length;
    this.getTotalSeconds(false);
  }

  openTimesheet() {
    if (this.loginUser) {
      this.router.navigate(['/timekeeping/my-timesheet']);
    }
  }

  get remainingTime() {
    if (this.remainingTimer) {
      let minutes = this.remainingTimer.totalSeconds / 60;

      if (this.billingSettings && this.billingSettings.timeRoundingInterval) {
        minutes =
          Math.ceil(minutes / this.billingSettings.timeRoundingInterval) *
          this.billingSettings.timeRoundingInterval;
      }

      return minutes - this.remainingTimer.previousTotalTimeWorked;
    } else {
      return 0;
    }
  }

  enterTime(timer: vwTimer) {
    this.loading = true;

    this.timersService
      .v1TimersTimeEntryCheckTimerIdGet({
        timerId: timer.id,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res) {
            if (timer.isRunning) {
              this.updateTimer(timer, () => {
                this.loading = false;
                this.openTimeEntryDialog(timer);
              });
            } else {
              this.loading = false;
              this.openTimeEntryDialog(timer);
            }
          } else {
            this.loading = false;
            this.toastr.showError(this.error_data.time_entry_already_exists);
            this.getTimers(false);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  private openTimeEntryDialog(timer: vwTimer) {
    let modalRef = this.modalService.open(AddTimeEntryComponent, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-xlg',
    });

    modalRef.componentInstance.timer = { ...timer };
    modalRef.componentInstance.billingSettings = { ...this.billingSettings };

    this.remainingTimer = null;

    modalRef.result.then((res: any) => {
      if (res) {
        if (res == 'discard') {
          this.showDiscardSuccess = true;

          setTimeout(() => {
            this.showDiscardSuccess = false;
          }, 5000);
        } else {
          this.submitTimeEntry(res);
        }
      }
    });
  }

  private submitTimeEntry(res: vwAddTimeEntryResponse) {
    if (!res.remainingTimer) {
      this.showWarning = false;
    } else {
      this.remainingTimer = res.remainingTimer;
    }

    this.loading = true;

    if (this.updateTimersSub) {
      this.updateTimersSub.unsubscribe();
    }

    this.timersService
      .v1TimersSubmitTimerPost$Json({
        body: res.submitTimer,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (timerRes) => {
          if (timerRes && timerRes.length > 0) {
            if (this.updateTimersSub) {
              this.updateTimersSub.unsubscribe();
            }

            const body = this.getRequestForUpdate();

            this.timersService
              .v1TimersPut$Json({
                body: body,
              })
              .subscribe(
                (success) => {
                  let response: any = success;
                  this.bindToList(response);
                  this.showSuccess = true;
                  this.loading = false;

                  setTimeout(() => {
                    this.showSuccess = false;
                  }, 5000);

                  if (res.remainingTimer) {
                    this.showWarning = true;
                  }

                  this.sharedService.refreshTimekeeping$.next([
                    res.submitTimer.matterId,
                  ]);
                },
                () => {
                  this.loading = false;
                }
              );
          } else {
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  private getRequestForUpdate() {
    let body = (this.listOfTimers || []).map((a) => {
      return {
        clientId: a.client ? a.client.id : null,
        matterId: a.matter ? (a.matter.id > 0 ? a.matter.id : null) : null,
        id: a.id,
        isRunning: a.isRunning,
        totalSeconds: a.totalSeconds,
      } as vwUpdateTimer;
    });

    return body;
  }

  allocateTime() {
    this.showSuccess = false;
    this.showWarning = false;
    this.openTimeEntryDialog(this.remainingTimer);
  }

  @HostListener('window:beforeunload', ['$event']) onBeforeUnload($event) {
    this.update();
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
