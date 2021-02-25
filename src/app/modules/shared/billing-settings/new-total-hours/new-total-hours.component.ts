import {Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { Observable, Subscription } from "rxjs";
import * as fromPermissions from "../../../../store/reducers/permission.reducer";
import { Store } from "@ngrx/store";
import * as fromRoot from "../../../../store";
import { ClockService } from "../../../../../common/swagger-providers/services/clock.service";
import { map } from "rxjs/operators";
import { padNumber, UtilsHelper } from "../../utils.helper";
import { Color, Label, MultiDataSet } from "ng2-charts";
import { ChartOptions, ChartType } from "chart.js";
import * as Chart from "chart.js";


@Component({
  selector: 'app-new-total-hours',
  templateUrl: './new-total-hours.component.html',
  styleUrls: ['./new-total-hours.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewTotalHoursComponent implements OnInit {
  @ViewChild('doughnutChart', {static: false}) doughnutChart: ElementRef

  @Input() matterDetails: any;
  @Input() isResponsibleOrBillingAttorney: boolean;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isMyTime = false;
  public chartDataLoading = true;
  public doughnutChartLabels: Label[] = ['Current', 'Previous'];
  public doughnutChartData: MultiDataSet = [];
  public doughnutChartType: ChartType = 'doughnut';

  public doughnutChartOptions: ChartOptions = {
    responsive: true,
    cutoutPercentage: 55,
    tooltips: {
      enabled: false,
      mode: 'single',
      position: 'custom',
      intersect: false,
      custom: (tooltipModel) => {
        let tooltipEl = document.getElementById('total-hour-tooltip');
        // Create element on first render
        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.id = 'total-hour-tooltip';
          tooltipEl.innerHTML =
            `<div class='tooltip total-hours'>
               <div class='info-hover'>
                 <div class='tooltip-inner'>
                   <p></p>
                 </div>
               </div>
            </div>`;
            document.body.appendChild(tooltipEl);
          // this.doughnutChart.nativeElement.appendChild(tooltipEl);
        } else {
          let tooltipInner = tooltipEl.querySelector(
            '.tooltip-inner'
          ) as HTMLDivElement;
          if (tooltipInner) {
            tooltipInner.style.left = '0px';
          }
        }

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
          tooltipEl.style.opacity = '0';
          return;
        }

        // Set caret Position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
          tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
          tooltipEl.classList.add('no-transform');
        }

        function getBody(bodyItem) {
          return bodyItem.lines;
        }

        // Set Text
        if (tooltipModel.body) {
          var titleLines = tooltipModel.title || [];
          var bodyLines = tooltipModel.body.map(getBody);

          var innerHtml = '';

          bodyLines.forEach(function(body, i) {
            innerHtml += body;
          });

          if (innerHtml) {
            var tableRoot = tooltipEl.querySelector('p');
            tableRoot.innerHTML = innerHtml;
          } else {
            tooltipEl.remove();
          }

        }

        // `this` will be the overall tooltip
        // const positionY = this.doughnutChart.nativeElement.offsetTop;
        // const positionX = this.doughnutChart.nativeElement.offsetLeft;

        let position = this.doughnutChart.nativeElement.getBoundingClientRect();
        const positionY = position.top;
        const positionX = position.left;

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = positionX+window.pageXOffset + tooltipModel.caretX - 20 + 'px';
        tooltipEl.style.top = positionY +window.pageYOffset+ tooltipModel.caretY - 18 + 'px';
        tooltipEl.style.fontFamily = 'Roboto Regular';
        tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
        tooltipEl.style.pointerEvents = 'none';

        let tooltipInner = tooltipEl.querySelector(
          '.tooltip-inner'
        ) as HTMLDivElement;
        let pos = tooltipInner.getBoundingClientRect();

        if (pos.left + pos.width > window.innerWidth) {
          tooltipInner.style.position = 'relative';
          let leftPos = pos.left + pos.width - window.innerWidth + 50;

          tooltipInner.style.left = -leftPos + 'px';
        } else {
          tooltipInner.style.left = '0px';
        }
      },
      callbacks: {
        label: (tooltipItem, data) => {
          const tooltipData = data.datasets[tooltipItem.datasetIndex];
          let index = tooltipItem.index;
          let tooltipHtml = '';
          let titleClass;
          let label;
          if (this.currentBillAmount > 0 && this.previousBillAmount < 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 0) {
              titleClass = 'current-positive-title';
              label = 'Current'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
            if (tooltipItem.datasetIndex === 2 && tooltipItem.index === 1) {
              titleClass = 'previous-negative-title';
              label = 'Previous'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount < 0 && this.previousBillAmount > 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 0) {
              titleClass = 'previous-positive-title';
              label = 'Previous'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
            if (tooltipItem.datasetIndex === 2 && tooltipItem.index === 1) {
              titleClass = 'current-negative-title';
              label = 'Current'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount < 0 && this.previousBillAmount < 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 0) {
              titleClass = 'previous-negative-title';
              label = 'Previous'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
            if (tooltipItem.datasetIndex === 2 && tooltipItem.index === 1) {
              titleClass = 'current-negative-title';
              label = 'Current'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount > 0 && this.previousBillAmount > 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 1) {
              titleClass = 'current-positive-title';
              label = 'Current'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 0) {
              titleClass = 'previous-positive-title';
              label = 'Previous'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount > 0 && this.previousBillAmount == 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 1) {
              titleClass = 'current-positive-title';
              label = 'Current'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount < 0 && this.previousBillAmount == 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 1) {
              titleClass = 'current-negative-title';
              label = 'Current'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount == 0 && this.previousBillAmount > 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 1) {
              titleClass = 'previous-positive-title';
              label = 'Previous'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          if (this.currentBillAmount == 0 && this.previousBillAmount < 0) {
            tooltipHtml = '';
            if (tooltipItem.datasetIndex === 1 && tooltipItem.index === 1) {
              titleClass = 'previous-negative-title';
              label = 'Previous'
              let totalTime = +tooltipData.data[index] * 3600;
              tooltipHtml += '<div class="text-center ' + titleClass +' ">' + this.getTimeString(totalTime) + '</div>'
              tooltipHtml += '<div class="text-center tooltip-label">' + label + '</div>'
            }
          }
          return tooltipHtml
        }
      }
    }
  };

  public doughnutChartColors: Color[] = [
    {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0},
    {backgroundColor: ['#63BFCD', '#4756CE'], borderWidth: 0},
    {backgroundColor: ['#D23025', '#F44236'], borderWidth: 0},
  ]

  public timeFormat: string = localStorage.getItem('timeformat');
  currentBillAmount: any;
  previousBillAmount: any;


  constructor(
    private store: Store<fromRoot.AppState>,
    private clockService: ClockService
  ) {
    this.permissionList$ = this.store.select('permissions');
    /**
   * Custom positioner
   * @function Chart.Tooltip.positioners.custom
   * @param elements {Chart.Element[]} the tooltip elements
   * @param eventPosition {Point} the position of the event in canvas coordinates
   * @returns {Point} the tooltip position
   */
  Chart.Tooltip.positioners.custom = function(elements, eventPosition) {
    /** @type {Chart.Tooltip} */
    var tooltip = this;
    /* ... */
    return {
        x: eventPosition.x,
        y: eventPosition.y
    };
  };
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          this.isMyTime = !this.isResponsibleOrBillingAttorney &&
            !this.permissionList.TIMEKEEPING_OTHERSisAdmin &&
            !this.permissionList.TIMEKEEPING_OTHERSisEdit &&
            !this.permissionList.TIMEKEEPING_OTHERSisViewOnly &&
            !this.permissionList.BILLING_MANAGEMENTisAdmin &&
            !this.permissionList.BILLING_MANAGEMENTisEdit
          this.getTotalHours();
        }
      }
    });
  }

  getTotalHours() {
    this.chartDataLoading = true;
    this.clockService.v1ClockHoursbreakdownMatterIdGet({matterId: this.matterDetails.id, isMyTime: this.isMyTime})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((totalHours) => {
        this.setChartData(totalHours);
      }, () => {
        this.chartDataLoading = false;
      })

  }

  setChartData(totalHours) {
    this.currentBillAmount = totalHours.currBillNegative + totalHours.currBillPositive;
    this.previousBillAmount = totalHours.prevBillNegative + totalHours.prevBillPositive;
    const isCurrentGreaterThanPrevious = Math.abs(this.currentBillAmount) > Math.abs(this.previousBillAmount);
    if (this.currentBillAmount > 0 && this.previousBillAmount > 0) {
      this.doughnutChartData[0] = [this.previousBillAmount, this.currentBillAmount];
      this.doughnutChartData[1] = [this.previousBillAmount, this.currentBillAmount];
      this.doughnutChartData[2] = [0, 0];
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['#4756CE', '#63BFCD'], borderWidth: 0},
        {backgroundColor: ['transparent','#D23025'], borderColor: ['transparent','#D23025'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount > 0 && this.previousBillAmount < 0) {
      let dummyValue = Math.abs(this.currentBillAmount + this.previousBillAmount);
      if (isCurrentGreaterThanPrevious) {
        this.doughnutChartData[0] = [this.currentBillAmount, 0];
        this.doughnutChartData[1] = [this.currentBillAmount, 0];
        this.doughnutChartData[2] = [dummyValue * -1, this.previousBillAmount];
      } else {
        this.doughnutChartData[0] = [0, this.previousBillAmount];
        this.doughnutChartData[1] = [this.currentBillAmount, dummyValue];
        this.doughnutChartData[2] = [0, this.previousBillAmount];
      }
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['#63BFCD', 'transparent'], borderColor: ['#63BFCD','transparent'], borderWidth: 0},
        {backgroundColor: ['transparent','#D23025'], borderColor: ['transparent','#D23025'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount < 0 && this.previousBillAmount > 0) {
      let dummyValue = Math.abs(this.currentBillAmount + this.previousBillAmount);
      if (isCurrentGreaterThanPrevious) {
        this.doughnutChartData[0] = [0, this.currentBillAmount];
        this.doughnutChartData[1] = [this.previousBillAmount, dummyValue];
        this.doughnutChartData[2] = [0, this.currentBillAmount];
      } else {
        this.doughnutChartData[0] = [this.previousBillAmount, 0];
        this.doughnutChartData[1] = [this.previousBillAmount, 0];
        this.doughnutChartData[2] = [dummyValue * -1, this.currentBillAmount];
      }
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['#4756CE', 'transparent'], borderColor: ['#4756CE', 'transparent'], borderWidth: 0},
        {backgroundColor: ['transparent', '#F44236'], borderColor: ['transparent','#F44236'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount < 0 && this.previousBillAmount < 0) {
      let dummyValue = this.currentBillAmount + Math.abs(this.previousBillAmount);
      if (isCurrentGreaterThanPrevious) {
        this.doughnutChartData[0] = [0, this.currentBillAmount];
        this.doughnutChartData[1] = [this.previousBillAmount, dummyValue * -1];
        this.doughnutChartData[2] = [0, this.currentBillAmount];
      } else {
        this.doughnutChartData[0] = [this.previousBillAmount, 0];
        this.doughnutChartData[1] = [this.previousBillAmount, 0];
        this.doughnutChartData[2] = [dummyValue * -1, this.currentBillAmount];
      }
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['#D23025', 'transparent'], borderColor: ['#D23025', 'transparent'], borderWidth: 0},
        {backgroundColor: ['transparent', '#F44236'], borderColor: ['transparent','#F44236'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount > 0 && this.previousBillAmount == 0) {
      this.doughnutChartData[0] = [0, this.currentBillAmount];
      this.doughnutChartData[1] = [0, this.currentBillAmount];
      this.doughnutChartData[2] = [0, 0];
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['transparent', '#63BFCD'], borderWidth: 0},
        {backgroundColor: ['transparent','transparent'], borderColor: ['transparent','transparent'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount < 0 && this.previousBillAmount == 0) {
      this.doughnutChartData[0] = [0, this.currentBillAmount];
      this.doughnutChartData[1] = [0, this.currentBillAmount];
      this.doughnutChartData[2] = [0, 0];
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['transparent', '#F44236'], borderWidth: 0},
        {backgroundColor: ['transparent','transparent'], borderColor: ['transparent','transparent'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount == 0 && this.previousBillAmount > 0) {
      this.doughnutChartData[0] = [0, this.previousBillAmount];
      this.doughnutChartData[1] = [0, this.previousBillAmount];
      this.doughnutChartData[2] = [0, 0];
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['transparent', '#4756CE'], borderWidth: 0},
        {backgroundColor: ['transparent','transparent'], borderColor: ['transparent','transparent'], borderWidth: 0},
      ]
    }
    if (this.currentBillAmount == 0 && this.previousBillAmount < 0) {
      this.doughnutChartData[0] = [0, this.previousBillAmount];
      this.doughnutChartData[1] = [0, this.previousBillAmount];
      this.doughnutChartData[2] = [0, 0];
      this.doughnutChartColors = [
        {backgroundColor: ['#FFFFFF', '#FFFFFF'], borderWidth: 0, hoverBackgroundColor: ['#FFFFFF', '#FFFFFF']},
        {backgroundColor: ['transparent', '#D23025'], borderWidth: 0},
        {backgroundColor: ['transparent','transparent'], borderColor: ['transparent','transparent'], borderWidth: 0},
      ]
    }
    this.chartDataLoading = false;
  }

  getTimeString(timeData) {
    const isNegative = timeData < 0;
    const time = Math.abs(timeData);
    let hour = Math.floor(time / 3600);
    let min = Math.floor((time - hour * 3600) / 60);
    let timeString = '';
    if (this.timeFormat === 'standard') {
      timeString = hour + ':' + padNumber(+min);
    } else if (this.timeFormat === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      timeString = (hours + minutes / 60).toFixed(2);
    } else {
      timeString =  hour + 'h' + ' ' + min + 'm';
    }
    return isNegative ? '-' + timeString : timeString;
  }
}
