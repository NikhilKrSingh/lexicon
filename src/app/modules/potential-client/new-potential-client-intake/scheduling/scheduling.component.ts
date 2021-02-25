import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { scheduling_Hours } from 'src/app/modules/models/office-data';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CalendarService, MiscService, OfficeService } from 'src/common/swagger-providers/services';
import { Page } from '../../../models/page';

@Component({
  selector: 'app-scheduling',
  templateUrl: './scheduling.component.html',
  styleUrls: ['./scheduling.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SchedulingComponent implements OnInit, OnChanges {
  @Input() matterDetails: any;
  @Output() readonly schedulingDetails = new EventEmitter<any>();
  @Output() readonly showHideLoader = new EventEmitter();

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('availablityRequiredPopup', { static: false }) availablityRequiredPopup: any;
  modalOptions: NgbModalOptions;
  closeResult: string;

  public schedulingForm: FormGroup;

  public desiredTimeList: Array<any> = [];
  public minimiumTimeList: Array<any> = [{ id: 1, name: "30m" }, { id: 2, name: "60m" }, { id: 3, name: "90m" }, { id: 4, name: "120m" }];
  public officeList: Array<any> = [];
  public attorneyList: Array<any> = [];
  public oriattorneyList: Array<any> = [];
  public selectedAttorneys: Array<any> = [];
  public selectedOffices: Array<any> = [];
  public selectedDesiredTime: Array<any> = [];
  public eventsList: Array<any> = [];
  public datesArray: Array<any> = [];
  public availabilityLists: Array<any> = [];

  public desiredTimeTitle: string = "Select desired time";
  public consultationOfficetitle: string = "Select office";
  public attorneyTitle: string = "Select attorney";
  public showSchedulingForm: boolean = true;
  public viewAvailablityisSubmit = false;

  private selectedstartDateTime: any;
  private selectedendDateTime: any;
  public selectedDate: any;
  public selectedTime: any;
  public inviteesArr: Array<any> = [];
  public selectedAtt: any;
  public userDetails: any;
  public selectedOffice: any;

  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pangeSelected = 1;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public counter = Array;
  private previousSelectedOffice: Array<any> = [];
  public requiredTitle = '';
  public selectedObject: any;
  public selectedDatesValid = true;
  private daysList: Array<string> = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  viewAvailabilityLoading = false;
  disableAvailabilityBtn = false;
  constructor(
    private builder: FormBuilder,
    private officeService: OfficeService,
    private miscService: MiscService,
    private calendarService: CalendarService,
    private modalService: NgbModal,
    private toastDisplay: ToastDisplay
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.createschedulingForm();
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    let desiredTimeList = scheduling_Hours;
    desiredTimeList.forEach((obj: any, index) => {
      let data = {
        id: obj.key,
        name: obj.key,
        value: obj.value
      }
      this.desiredTimeList.push(data);
    });
  }

  ngOnChanges(changes: any) {
    this.showSchedulingForm = (this.matterDetails.matterTypeId && this.matterDetails.practiceId) ? true : false;
    if (changes.hasOwnProperty('matterDetails')) {
      if (changes.matterDetails.currentValue && changes.matterDetails.previousValue && (changes.matterDetails.currentValue.practiceId != changes.matterDetails.previousValue.practiceId || changes.matterDetails.currentValue.matterTypeId != changes.matterDetails.previousValue.matterTypeId) && this.showSchedulingForm) {
        this.matterDetails = changes.matterDetails.currentValue;
        this.createschedulingForm();
        this.getOffices();
      }
      if (changes.matterDetails.currentValue && changes.matterDetails.currentValue.initialConsultLawOffice && (changes.matterDetails.currentValue.initialConsultLawOffice != changes.matterDetails.previousValue.initialConsultLawOffice) && this.showSchedulingForm) {
        this.officeList.filter(item => {
          if (item.id === changes.matterDetails.currentValue.initialConsultLawOffice) {
            return item.checked = true;
          } else {
            return item.checked = false;
          }
        });
        this.selectedOffices = [changes.matterDetails.currentValue.initialConsultLawOffice];
        this.previousSelectedOffice = [...this.selectedOffices];
        this.consultationOfficetitle = '1';
        this.getAttorneyList(false);
      }

      if (changes.matterDetails.currentValue && changes.matterDetails.currentValue.initialConsultAttoney && (changes.matterDetails.currentValue.initialConsultAttoney != changes.matterDetails.previousValue.initialConsultAttoney) && this.showSchedulingForm) {
        this.attorneyList.filter(item => {
          if (item.id === changes.matterDetails.currentValue.initialConsultAttoney) {
            return item.checked = true;
          } else {
            return item.checked = false;
          }
        });
        this.selectedAttorneys = [changes.matterDetails.currentValue.initialConsultAttoney];
        this.attorneyTitle = '1';
      }
    }
  }

  /**
   * Function to open the modals
   * @param content
   * @param className
   * @param winClass
   */
  open(content: any, className: any, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
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

  /**
   * Function to get the dismiss reasons for the modals
   * @param reason
   */
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }


  createschedulingForm() {
    this.schedulingForm = this.builder.group({
      nextAppointment: [null],
      earlydesiredDate: [null],
      lastDesiredDate: [null],
      desiredTimes: [null],
      mintimeavilable: [null]
    });
    this.prepopulatedData();
  }

  /***** function to pre populated scheduling form */
  prepopulatedData(): void {
    const earlyDate: any = moment(new Date()).format('YYYY-MM-DD[T]HH:mm:ss');
    const lastDate = moment(new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000))).format('YYYY-MM-DD[T]HH:mm:ss');
    this.schedulingForm.patchValue({
      earlydesiredDate: earlyDate,
      lastDesiredDate: lastDate,
      mintimeavilable: 1
    });
    this.desiredTimeList.forEach(item => (item.checked = true));
    this.selectedDesiredTime = this.desiredTimeList.map(item => item.id);
    this.desiredTimeTitle = 'All';
  }

  /**
   * Function to get the Consultation Office List
   *
   */
  public getOffices() {
    if (!this.matterDetails.practiceId) {
      return;
    }
    let data: any = {};
    data['practiceId'] = this.matterDetails.practiceId;
    this.miscService.v1MiscJurisdictionOfficesPracticeIdGet(data).subscribe(
      suc => {
        let res: any = suc;
        let list = JSON.parse(res).results;
        this.officeList = list;
        if (this.officeList && this.officeList.length) {
          this.officeList.forEach(item => {
            switch (item.timezone.standardName) {
              case 'Hawaiian Standard Time':
                item.timezone.name = 'Hawaiian Time';
                item.timezone.abbrev = 'HT';
                break;
              case 'Alaskan Standard Time':
                item.timezone.name = 'Alaskan Time';
                item.timezone.abbrev = 'AT';
                break;
              case 'Pacific Standard Time':
                item.timezone.name = 'Pacific Time';
                item.timezone.abbrev = 'PT';
                break;
              case 'Mountain Standard Time':
                item.timezone.name = 'Mountain Time';
                item.timezone.abbrev = 'MT';
                break;
              case 'Central Standard Time':
                item.timezone.name = 'Central Time';
                item.timezone.abbrev = 'CT';
                break;
              case 'Eastern Standard Time':
                item.timezone.name = 'Eastern Time';
                item.timezone.abbrev = 'ET';
                break;
            }
          });
          this.getAttorneyList(true);
        }
      },
      err => {
        console.log(err);
      }
    );
  }


  changeOffice(event: any) {

  }

  getAttorneyList(allSelected?: boolean) {
    if (!this.matterDetails.practiceId || !this.selectedOffices.length) {
      return;
    }
    this.attorneyList = [];
    const data: any = {
      practiceId: this.matterDetails.practiceId,
      body: this.selectedOffices
    };
    if (this.matterDetails.juridictionState) {
      data.stateId = this.matterDetails.juridictionState;
    }
    this.emitShowHideLoader(true);
    this.disableAvailabilityBtn = true;
    this.officeService.v1OfficeConsultattroneyMultiplePost$Json$Response(data).subscribe(res => {
      let list = JSON.parse(res.body as any).results;
      this.oriattorneyList = list;
      this.emitShowHideLoader(false);
      this.disableAvailabilityBtn = false;
      list.forEach(element => {
        if (!this.attorneyList.some(obj => obj.id == element.id)) {
          this.attorneyList.push(element);
        }
      });
      this.attorneyList = this.attorneyList.filter(list => !list.doNotSchedule);
      this.attorneyList = this.attorneyList.filter(list => list.isVisible);
      this.attorneyList.map(d => {
        d['tempSorting'] = (d.name) ? d.name.toLowerCase() : '';
      });
      this.attorneyList = _.sortBy(this.attorneyList, ['tempSorting']);
      if (this.attorneyList.length && allSelected) {
        this.attorneyList.forEach(item => (item.checked = true));
        this.selectedAttorneys = this.attorneyList.map(item => item.id);
        this.attorneyTitle = 'All';
      }
    }, err => {
      this.emitShowHideLoader(false);
      this.disableAvailabilityBtn = false;
    })
  }
  getdesiredTimeSelected(event: any) {
    this.selectedDesiredTime = [];
    if (!event.length) {
      this.desiredTimeTitle = 'Select desired time';
    } else {
      this.selectedDesiredTime = event;
      this.desiredTimeTitle = (event.length == this.desiredTimeList.length) ? 'All' : event.length;
    }
  }

  getOfficesSelected(event: any) {
    this.selectedOffices = [];
    if (!event.length) {
      this.consultationOfficetitle = 'Select office';
    } else {
      this.selectedOffices = event;
      this.consultationOfficetitle = (event.length == this.officeList.length) ? 'All' : event.length;
    }
  }

  getAttorneysSelected(event: any) {
    this.selectedAttorneys = [];
    if (!event.length) {
      this.attorneyTitle = 'Select attorney';
    } else {
      this.selectedAttorneys = event;
      this.attorneyTitle = (event.length == this.attorneyList.length) ? 'All' : event.length;
    }
  }

  clrDesiredtime() {
    this.selectedDesiredTime = [];
    this.desiredTimeTitle = 'Select desired time';
    this.desiredTimeList.forEach(item => (item.checked = false));
  }

  clrOffices() {
    this.selectedOffices = [];
    this.selectedAttorneys = this.attorneyList = []
    this.attorneyTitle = 'Select attorney';
    this.consultationOfficetitle = 'Select office';
    this.officeList.forEach(item => (item.checked = false));
    this.previousSelectedOffice = [];
  }

  clrAttorneys() {
    this.selectedAttorneys = [];
    this.attorneyTitle = 'Select attorney';
    this.attorneyList.forEach(item => (item.checked = false));
  }

  applytimeFilter(event: any) {

  }

  applyofficeFilter(event: any) {
    if (this.selectedOffices.length && !this.arraysEqual(this.selectedOffices, this.previousSelectedOffice)) {
      this.selectedAttorneys = [];
      this.attorneyList = [];
      this.attorneyTitle = 'Select attorney';
      this.getAttorneyList();
    }
    setTimeout(() => {
      this.previousSelectedOffice = [...this.selectedOffices];
    }, 200);
  }

  applyattorneyFilter(event: any) {

  }

  onMultiSelectSelectedOptions(event: any) {

  }

  checkAvailablity() {
    if (this.selectedDatesValid) {
      this.viewAvailablityisSubmit = false;
      this.requiredTitle = '';

      if ((this.selectedDesiredTime && !this.selectedDesiredTime.length) || !this.schedulingForm.value.earlydesiredDate || !this.schedulingForm.value.lastDesiredDate) {
        this.requiredTitle = 'Desired Time';
        this.desiredTimeList.forEach(item => (item.checked = true));
        this.selectedDesiredTime = this.desiredTimeList.map(item => item.id);
        this.desiredTimeTitle = 'All';
        this.open(this.availablityRequiredPopup, 'sm', '');
        this.datesArray = [];
        return;
      }

      if (this.selectedOffices && !this.selectedOffices.length) {
        this.requiredTitle = 'Office';
        this.officeList.forEach(item => (item.checked = true));
        this.selectedOffices = this.officeList.map(item => item.id);
        this.consultationOfficetitle = 'All';
        this.getAttorneyList(false);
        this.open(this.availablityRequiredPopup, 'sm', '');
        this.datesArray = [];
        return;
      }

      if (this.selectedAttorneys && !this.selectedAttorneys.length) {
        this.requiredTitle = 'Attorney';
        this.attorneyList.forEach(item => (item.checked = true));
        this.selectedAttorneys = this.attorneyList.map(item => item.id);
        this.attorneyTitle = 'All';
        this.open(this.availablityRequiredPopup, 'sm', '');
        this.datesArray = [];
        return;
      }

      this.datesArray = [];
      this.selectedDate = this.selectedTime = null;
      this.selectedendDateTime = this.selectedendDateTime = null;
      let attornyList = [];

      if (this.selectedAttorneys && this.selectedAttorneys.length > 0) {
        this.selectedAttorneys.map(item => {
          let attorny = this.attorneyList.find(obj => item === obj.id);
          if (attorny) {
            attornyList.push({personId: attorny.id, officeId: attorny.officeId});
          }
        });
      }

      let data = {
        startDate: moment(this.schedulingForm.value.earlydesiredDate).format('YYYY-MM-DD'),
        endDate: moment(this.schedulingForm.value.lastDesiredDate).add(1, 'days').format('YYYY-MM-DD'),
        personIds: attornyList
      };

      this.emitShowHideLoader(true);
      this.calendarService.v1CalendarPersonsAvailabilityPost$Json({ body: data }).subscribe(res => {
        let list = JSON.parse(res as any).results;
        this.emitShowHideLoader(false);
        this.viewAvailablityisSubmit = true;
        list.forEach(element => {
          if (element.events) {
            this.eventsList = this.eventsList.concat(element.events);
          }
        });
        this.availabilityLists = list;

        console.time('createDatesArray');
        this.createDatesArray(this.eventsList);
        console.timeEnd('createDatesArray');

        this.updateDatatableFooterPage();
      }, err => {
        this.emitShowHideLoader(false);
        this.viewAvailablityisSubmit = true;
      });
    }
  }

  createDatesArray(arr: Array<any>) {
    let offices = UtilsHelper.clone(this.getOfficeDetails());
    const formData = this.schedulingForm.value;

    arr.map((obj, i) => {
      let date = obj.startDateTime.split('T');
      date = date[0];
      if (!(moment(date).isBefore(formData.earlydesiredDate, 'day') || moment(date).isAfter(formData.lastDesiredDate, 'day'))) {
        if (!this.datesArray.some(ele => ele.dateName == date)) {
          let data = {
            eventId: obj.id,
            dateName: date,
            showOffices: false,
          };
          data['offices'] = UtilsHelper.clone(offices);
          this.datesArray.push(data);
        }
      }
    });

    let currentDate = moment(formData.earlydesiredDate).set({'hour': 0, 'minute': 0, 'second': 0, 'millisecond': 0});
    let startDate = moment(formData.earlydesiredDate).add(-1, 'days');
    let endDate = moment(formData.lastDesiredDate);

    while (currentDate.isBetween(startDate, endDate) || currentDate.isSame(moment(formData.earlydesiredDate)) || currentDate.isSame(moment(formData.lastDesiredDate))) {
      if (!this.datesArray.some(ele => ele.dateName == currentDate.format('YYYY-MM-DD'))) {
        let data = {
          eventId: null,
          dateName: currentDate.format('YYYY-MM-DD'),
          showOffices: false,
        };
        data['offices'] = UtilsHelper.clone(offices);
        this.datesArray.push(data);
      }
      currentDate.add(1, 'days');
    }

    this.datesArray = _.orderBy(this.datesArray, 'dateName');
    this.addAttorneyAvailability();
  }

  public getOfficeDetails() {
    let offices = [];
    this.selectedOffices.map(obj => {
      const office: any = this.officeList.filter(off => off.id == obj);
      let attorneys = [];
      this.selectedAttorneys.map(att => {
        let attorney: any = this.oriattorneyList.filter(el => el.id == att);
        if (attorney.length) {
          let at = attorney.filter(obj => obj.officeId == office[0].id);
          if (at && at.length) {
            attorney = at[0];
          } else {
            attorney = null;
          }
        } else {
          attorney = null;
        }
        let desiredTimes: any = [];
        this.selectedDesiredTime.map(time => {
          let desiredtime = this.desiredTimeList.filter(obj => obj.id == time);
          desiredtime = desiredtime[0];
          desiredTimes.push(desiredtime);
        })
        if (attorney) {
          attorney['desiredTimes'] = clone(desiredTimes);
          attorney['availableTimes'] = clone(desiredTimes);
          attorney['showTimes'] = false;
          attorneys.push(attorney);
        }
      })
      if (attorneys) {
        attorneys = _.orderBy(attorneys, 'rank')
      }
      office[0]['attorneys'] = clone(attorneys);;
      office[0]['showAttorneys'] = false;
      office[0]['displayOffice'] = true;
      if (office[0].attorneys.length) {
        offices.push(office[0]);
      }
    });
    return offices;
  }

  /**** function to emit show/hide loader event */
  emitShowHideLoader(loader?: boolean) {
    this.viewAvailabilityLoading = loader || false;
  }

  addAttorneyAvailability() {
    if (this.datesArray.length > 0) {
      if (this.selectedOffices.length > 60) {
        let remainingDates = this.datesArray.slice(1);

        this.processDateData(this.datesArray[0]);

        if (this.datesArray && this.datesArray.length > 0 && this.datesArray[0].offices && this.datesArray[0].offices.length > 0) {
          this.datesArray = [this.datesArray[0], ...remainingDates];
          this.datesArray = this.datesArray.filter(item => item.offices.length > 0);

          if (this.datesArray && this.datesArray.length > 0) {
            this.datesArray[0].showOffices = true;
          }
        } else {
          this.datesArray = [...remainingDates];
          this.addAttorneyAvailability();
        }
      } else {
        this.datesArray.forEach(d => {
          this.processDateData(d);
        });

        this.datesArray = this.datesArray.filter(item => item.offices.length > 0);

        if (this.datesArray && this.datesArray.length > 0) {
          this.datesArray[0].showOffices = true;
        }
      }
    }
  }

  processDateData(date: any) {
    if (!date.processed) {
      date.processed = true;
      let openTime, closeTime, startTimeOffice, endTimeOffice;
      date.offices.forEach(office => {
        let holiday;
        if (
          office.attorneys && office.attorneys.length > 0 &&
          office.attorneys[0].officeHoliday && office.attorneys[0].officeHoliday.length > 0
        ) {
          holiday = office.attorneys[0].officeHoliday.find(item => moment(item.date).format('YYYY-MM-DD') === date.dateName);
        }
        office['displayOffice'] = (holiday) ? false : true;
        office.attorneys.map(attorney => {
          let momentDay = this.daysList[moment(date.dateName).day()];

          openTime = (attorney['attorney'+ momentDay+ 'OpenHours']) ?
                      attorney['attorney'+ momentDay+ 'OpenHours'] : '2020-07-16T14:00:00+00:00';

          closeTime = (attorney['attorney'+ momentDay+ 'CloseHours']) ?
                      attorney['attorney'+ momentDay+ 'CloseHours'] : '2020-07-16T14:00:00+00:00';

          startTimeOffice = moment((openTime.split('T').pop()).split('+')[0], 'HH:mm:ss');
          endTimeOffice = moment((closeTime.split('T').pop()).split('+')[0], 'HH:mm:ss');

          if (attorney.availableTimes) {
            attorney.availableTimes.map(time => {
              time['availableTimesStatus'] = this.getSelectedStatus(date, office, attorney, time);

              let tm = moment(time.value, 'HH:mm:ss');
              let events = this.getevents(attorney.id, date.dateName);
              if (events && events.length) {
                events.map(eve => {
                  let startTime = moment((eve.startDateTime.split('T').pop()), 'HH:mm:ss');
                  let endTime = moment((eve.endDateTime.split('T').pop()), 'HH:mm:ss');
                  time['isAvailable'] = (time['isAvailable'] === false) ? time['isAvailable'] :
                  (tm.isBetween(startTimeOffice, endTimeOffice) || tm.isSame(startTimeOffice)) ? ((tm.isBetween(startTime, endTime) || tm.isSame(startTime)) ? false: true) : false;
                });
              } else {
                time['isAvailable'] = (tm.isBetween(startTimeOffice, endTimeOffice) || tm.isSame(startTimeOffice)) ? true : false;
              }
            });
          }
        });

        office.attorneys = office.attorneys.filter(attorney => attorney.availableTimes && attorney.availableTimes.filter(item => item.isAvailable).length > 0);
        date.offices = date.offices.filter(office => (office.attorneys.length > 0));
      });
    }
  }

  toggleShowOffice(date: any) {
    this.emitShowHideLoader(true);
    this.processDateData(date);
    date.showOffices = !date.showOffices;
    this.emitShowHideLoader(false);
  }

  getevents(id?: any, date?: any) {
    let events: Array<any> = [], eventsList: Array<any> = [];
    this.availabilityLists.map(obj => {
      if (obj.personId == id) {
        eventsList = obj.events;
      }
    });
    eventsList.map(eve => {
      let eventDate = eve.startDateTime.split('T');
      eventDate = eventDate[0];
      if (date == eventDate) {
        events.push(eve);
      }
    });
    return events;
  }

  selectTime($event, UpdateConsultationInformation, date, time, attorney, office?: any) {
    this.selectedDate = date;
    this.selectedTime = time;
    this.selectedAtt = attorney;
    this.selectedOffice = office;
    let selectedTime = time.value;
    if (this.schedulingForm.value.mintimeavilable) {
      let min = this.getMinutes();
      selectedTime = moment(selectedTime, 'HH:mm:ss').add(min, 'minutes').format('HH:mm:ss');
    }
    if (this.selectedendDateTime) {
      let startDate = this.getDateFromDatetime(this.selectedstartDateTime, 'date');
      let startTime = this.getDateFromDatetime(this.selectedstartDateTime, 'time');
      let endDate = this.getDateFromDatetime(this.selectedendDateTime, 'date');
      let endTime = this.getDateFromDatetime(this.selectedendDateTime, 'time');
      if (startDate == date.dateName && startTime == time.value && endDate == date.dateName && endTime == selectedTime && attorney.id == this.selectedObject.attorney && office.id == this.selectedObject.office) {
        this.selectedendDateTime = null;
        this.selectedstartDateTime = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedAtt = null;
        this.selectedOffice = null;
        this.selectedObject = {};
        return
      }
    }
    if (this.matterDetails && office && (this.matterDetails.initialConsultAttoney !== attorney.id || this.matterDetails.initialConsultLawOffice !== office.id)) {
      $event.target.closest('datatable-body-cell').blur();
      this.open(UpdateConsultationInformation, '', 'modal-sch-lg');
    } else {
      this.setConsultaionTime(selectedTime, date, time, attorney, office);
      this.sendData(false);
    }
    this.resetTimeSlot(attorney.availableTimes);
    time.availableTimesStatus = !time.availableTimesStatus;
  }

  resetTimeSlot(allData) {
    for(const data of allData) {
      data.availableTimesStatus = false;
    }
  }

  setSelectedTimeDateValues(isUpdate, date, time, attorney, office?: any) {
    let item = false;
    if (isUpdate) {
      item = true;
      let selectedTime = time.value;
      if (this.schedulingForm.value.mintimeavilable) {
        let min = this.getMinutes();
        selectedTime = moment(selectedTime, 'HH:mm:ss').add(min, 'minutes').format('HH:mm:ss');
      }
      this.setConsultaionTime(selectedTime, date, time, attorney, office);
    } else {
      this.selectedAtt = this.selectedDate = this.selectedOffice = this.selectedTime = null;
    }
    this.modalService.dismissAll();
    this.sendData(item);
  }

  getMinutes() {
    let min: any;
    switch (this.schedulingForm.value.mintimeavilable) {
      case 1:
        min = 30;
        break;
      case 2:
        min = 60;
        break;
      case 3:
        min = 90;
        break;
      case 4:
        min = 120;
        break;
    }
    return min;
  }

  getDateFromDatetime(datetime?: any, type?: any) {
    let dateTime = datetime.split('T');
    let date = dateTime[0];
    let time = dateTime[1];
    let format = type == 'date' ? date : time;
    return format;
  }


  getInvitee(id: any, isHost: boolean, isRequired: boolean, isOrganiser: boolean) {
    let data = {
      "person": {
        "id": id,
      },
      "isOrganiser": false,
      "isHost": false,
      "isRequired": false,
      "isOptional": false,
    }
    if (isHost) {
      data.isHost = true;
    }
    if (isRequired) {
      data.isRequired = true;
    }
    if (isOrganiser) {
      data.isOrganiser = true;
    }
    return data;
  }

  sendData(item) {
    let data = {
      startDateTime: this.selectedstartDateTime,
      endDateTime: this.selectedendDateTime,
      invitees: this.inviteesArr,
      office: { id: (this.selectedOffice) ? this.selectedOffice.id: 0 },
      updateOfficeAttorny: item,
      attorney: this.selectedAtt
    }
    this.schedulingDetails.emit(data);
  }

  /**
   * Change per page size
   *
   * @memberof ListComponent
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.datesArray.length;
    this.page.totalPages = Math.ceil(this.datesArray.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    if (this.table) {
      this.table.offset = 0;
    }
  }

  /***** function to check if two array are identical or not */
  arraysEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    // tslint:disable-next-line:triple-equals
    if (a.length != b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  getSelectedStatus(date, office, att, time) {
    if (this.selectedObject && (date.dateName == this.selectedObject.date) && (office.id == this.selectedObject.office) && (this.selectedObject.time == time.value) && (this.selectedObject.attorney == att.id)) {
      return true;
    }
    return false;
  }

  onDateChange(): void {
    const formData = this.schedulingForm.value;
    const earlydesiredDate = moment(formData.earlydesiredDate).format('DD-MM-YYYY');
    const lastDesiredDate = moment(formData.lastDesiredDate).format('DD-MM-YYYY');
    this.selectedDatesValid = (earlydesiredDate <= lastDesiredDate) ? true : false;
  }

  setConsultaionTime(selectedTime, date, time, attorney, office) {
    this.selectedstartDateTime = date.dateName + 'T' + time.value;
    this.selectedendDateTime = date.dateName + 'T' + selectedTime;
    if (!this.selectedObject) {
      this.selectedObject = {};
    }
    this.selectedObject['attorney'] = attorney.id;
    this.selectedObject['date'] = date.dateName;
    this.selectedObject['time'] = time.value;
    this.selectedObject['office'] = office.id;
    this.inviteesArr = [];
    if (attorney && attorney.email) {
      this.inviteesArr.push(this.getInvitee(attorney.id, true, false, false));
      this.inviteesArr.push(this.getInvitee(this.userDetails.id, false, false, true));
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
