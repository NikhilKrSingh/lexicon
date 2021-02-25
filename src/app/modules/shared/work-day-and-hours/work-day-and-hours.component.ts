import { Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { vwCalendarSettings } from 'src/common/swagger-providers/models';
import { getWorkingHour, ICustomizeHoursResponse, IWorkingDay, WORKING_DAYS } from '../../models/office-data';
import { UtilsHelper } from '../utils.helper';
import { CustomizeDayAndHourComponent } from './customize-hour/customize-hour.component';

@Component({
  selector: 'app-work-day-and-hours',
  templateUrl: './work-day-and-hours.component.html',
  styleUrls: ['./work-day-and-hours.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WorkDayAndHoursComponent implements OnChanges {
  ColumnMode = ColumnMode;
  workingHoursList: Array<IWorkingDay> = [];
  selectedWorkingHourList: Array<IWorkingDay> = [];

  @Input() headerText = 'Personal Work Days & Hours';
  @Input() calendarSettings: vwCalendarSettings;
  @Input() personId: number;

  @Output() readonly save = new EventEmitter<vwCalendarSettings>();
  
  public loading: boolean = false;;

  constructor(private modalService: NgbModal) {}

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('calendarSettings')) {
      this.calendarSettings = changes.calendarSettings.currentValue
    } 
    if (this.calendarSettings) {
      this.calendarSettings.personId = this.personId;
      this.createWorkingHoursList();
    }
  }

  private createWorkingHoursList() {
    this.loading = true;
    if (this.calendarSettings) {
      this.workingHoursList = Object.values(WORKING_DAYS).map((day, index) => {
        let hr = getWorkingHour(day);

        let isOff = false;

        if (this.calendarSettings[hr.open] == this.calendarSettings[hr.close]) {
          isOff = true;
        }

        return {
          index: index,
          name: day,
          open: (this.calendarSettings[hr.open]) ? this.calendarSettings[hr.open] : 'Off',
          openDisplay: isOff
            ? 'Off'
            : UtilsHelper.workingHoursFormat(this.calendarSettings[hr.open]),
          close: (this.calendarSettings[hr.close]) ? this.calendarSettings[hr.close] : 'Off',
          closeDisplay: isOff
            ? 'Off'
            : UtilsHelper.workingHoursFormat(this.calendarSettings[hr.close]),
          isCustom: this.calendarSettings[`is${day}Custom`]
        } as IWorkingDay;
      });

      this.selectedWorkingHourList = [];
      this.loading = false;
    } else {
      this.workingHoursList = [];
      this.selectedWorkingHourList = [];
      this.loading = false;
    }
  }

  public onSelect({ selected }) {
    this.selectedWorkingHourList.splice(0, this.selectedWorkingHourList.length);
    this.selectedWorkingHourList.push(...selected);
  }

  customizeHours() {
    let modalRef = this.modalService.open(CustomizeDayAndHourComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
      windowClass: 'modal-xlg'
    });

    let workingHoursList = JSON.parse(JSON.stringify(this.workingHoursList));

    workingHoursList.forEach(a => {
      let index = this.selectedWorkingHourList.findIndex(
        s => s.index == a.index
      );
      if (index > -1) {
        a.isCustom = true;
      }
    });

    modalRef.componentInstance.workingHoursList = workingHoursList;
    modalRef.componentInstance.calendarSettings = this.calendarSettings;

    modalRef.result.then((res: ICustomizeHoursResponse) => {
      if (res) {
        this.assignWorkingHours(res.workingHours);
      }
    });
  }

  private assignWorkingHours(workingHours: Array<IWorkingDay>) {
    workingHours.forEach(a => {
      this.calendarSettings[`${a.name.toLowerCase()}OpenHours`] = a.open;
      this.calendarSettings[`${a.name.toLowerCase()}CloseHours`] = a.close;
      this.calendarSettings[`is${a.name}Custom`] = a.isCustom;
    });

    this.save.emit(this.calendarSettings);
  }
}
