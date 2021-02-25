import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ClockService } from "../../../../../common/swagger-providers/services/clock.service";
import { UtilsHelper } from "../../utils.helper";
import { map } from "rxjs/operators";
import { ChartDataSets, ChartOptions, ChartType } from "chart.js";
import { Label } from "ng2-charts";
import * as moment from 'moment';
import { CurrencyPipe } from "@angular/common";
import * as Chart from "chart.js";

@Component({
  selector: 'app-new-charges-breakdown',
  templateUrl: './new-charges-breakdown.component.html',
  styleUrls: ['./new-charges-breakdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewChargesBreakdownComponent implements OnInit, OnChanges {
  @ViewChild('barChart', {static: false}) barChart: ElementRef

  @Input() matterDetails: any;

  public barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [{
        gridLines: {
          drawBorder: false,
          borderDash: [8, 4]
        },
        ticks: {
          maxTicksLimit: 5,
          padding: 10,
        },
      }],
      xAxes: [{
        gridLines: {
          drawOnChartArea: false,
          display:  false,
          drawBorder: false,
        },
        ticks: {
          padding: 5,
          maxRotation: 45,
          minRotation: 0
        },
      }]
    },
    tooltips: {
      enabled: false,
      mode: 'single',
      position: 'custom',
      intersect: false,
      custom: (tooltipModel) => {
        let tooltipEl = document.getElementById('charges-breakdown-tooltip');
        // Create element on first render
        if (!tooltipEl) {
          tooltipEl = document.createElement('div');
          tooltipEl.id = 'charges-breakdown-tooltip';
          tooltipEl.innerHTML =
            `<div class='tooltip charges-breakdown'>
               <div class='info-hover'>
                 <div class='tooltip-inner'>
                   <p></p>
                 </div>
               </div>
            </div>`;
          document.body.appendChild(tooltipEl);
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
        let position = this.barChart.nativeElement.getBoundingClientRect();
        const positionY = position.top;
        const positionX = position.left;

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = positionX+window.pageXOffset+ tooltipModel.caretX - 20 + 'px';
        tooltipEl.style.top = positionY +window.pageYOffset+ tooltipModel.caretY - 18+ 'px';
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
          if (tooltipData.label === 'Disbursement' && tooltipData.data[index] != 0) {
            tooltipHtml = '';
            tooltipHtml += '<div class="text-center disbursement-label">' + this.currencyPipe.transform(tooltipData.data[index], 'USD') + '</div>'
            tooltipHtml += '<div class="text-center tooltip-label">Disbursement</div>'
            return tooltipHtml
          } else if (tooltipData.label === 'Time' && tooltipData.data[index] != 0) {
            tooltipHtml = '';
            tooltipHtml += '<div class="text-center time-label">' + this.currencyPipe.transform(tooltipData.data[index], 'USD') + '</div>'
            tooltipHtml += '<div class="text-center tooltip-label">Time</div>'
            return tooltipHtml
          }
        }
      }
    },
  };

  public barChartColors = [
    {backgroundColor: '#4756CE'},
    {backgroundColor: '#63BFCD'}
  ]
  public barChartType: ChartType = 'bar';
  public barChartPlugins = [];
  public barChartLabels: Label[] = [];
  public barChartData: ChartDataSets[];
  public showChartData: boolean;
  public chartDataLoading = true
  isNegativeValuePresent: boolean;


  constructor(private clockService: ClockService,
              private currencyPipe: CurrencyPipe) {
    Chart['elements'].Rectangle.prototype.draw = function() {

      var ctx = this._chart.ctx;
      var vm = this._view;
      var left, right, top, bottom, signX, signY, borderSkipped, radius;
      var borderWidth = vm.borderWidth;

      // If radius is less than 0 or is large enough to cause drawing errors a max
      //      radius is imposed. If cornerRadius is not defined set it to 0.
      var cornerRadius = 5;
      if(cornerRadius < 0){ cornerRadius = 0; }
      if(typeof cornerRadius == 'undefined'){ cornerRadius = 0; }

      if (!vm.horizontal) {
        // bar
        left = vm.x - vm.width / 2;
        right = vm.x + vm.width / 2;
        top = vm.y;
        bottom = vm.base;
        signX = 1;
        signY = bottom > top? 1: -1;
        borderSkipped = vm.borderSkipped || 'bottom';
      } else {
        // horizontal bar
        left = vm.base;
        right = vm.x;
        top = vm.y - vm.height / 2;
        bottom = vm.y + vm.height / 2;
        signX = right > left? 1: -1;
        signY = 1;
        borderSkipped = vm.borderSkipped || 'left';
      }

      // Canvas doesn't allow us to stroke inside the width so we can
      // adjust the sizes to fit if we're setting a stroke on the line
      if (borderWidth) {
        // borderWidth shold be less than bar width and bar height.
        var barSize = Math.min(Math.abs(left - right), Math.abs(top - bottom));
        borderWidth = borderWidth > barSize? barSize: borderWidth;
        var halfStroke = borderWidth / 2;
        // Adjust borderWidth when bar top position is near vm.base(zero).
        var borderLeft = left + (borderSkipped !== 'left'? halfStroke * signX: 0);
        var borderRight = right + (borderSkipped !== 'right'? -halfStroke * signX: 0);
        var borderTop = top + (borderSkipped !== 'top'? halfStroke * signY: 0);
        var borderBottom = bottom + (borderSkipped !== 'bottom'? -halfStroke * signY: 0);
        // not become a vertical line?
        if (borderLeft !== borderRight) {
          top = borderTop;
          bottom = borderBottom;
        }
        // not become a horizontal line?
        if (borderTop !== borderBottom) {
          left = borderLeft;
          right = borderRight;
        }
      }

      ctx.beginPath();
      ctx.fillStyle = vm.backgroundColor;
      ctx.strokeStyle = vm.borderColor;
      ctx.lineWidth = borderWidth;

      // Corner points, from bottom-left to bottom-right clockwise
      // | 1 2 |
      // | 0 3 |
      var corners = [
        [left, bottom],
        [left, top],
        [right, top],
        [right, bottom]
      ];

      // Find first (starting) corner with fallback to 'bottom'
      var borders = ['bottom', 'left', 'top', 'right'];
      var startCorner = borders.indexOf(borderSkipped, 0);
      if (startCorner === -1) {
        startCorner = 0;
      }

      function cornerAt(index) {
        return corners[(startCorner + index) % 4];
      }

      // Draw rectangle from 'startCorner'
      var corner = cornerAt(0);
      ctx.moveTo(corner[0], corner[1]);

      for (var i = 1; i < 4; i++) {
        corner = cornerAt(i);
        let nextCornerId = i+1;
        if(nextCornerId == 4){
          nextCornerId = 0
        }

        let nextCorner = cornerAt(nextCornerId);

        let width = corners[2][0] - corners[1][0];
        let height = corners[0][1] - corners[1][1];
        let  x = corners[1][0];
        let y = corners[1][1];

        radius = cornerRadius;
        // Fix radius being too large
        if(radius > Math.abs(height)/2){
          radius = Math.floor(Math.abs(height)/2);
        }
        if(radius > Math.abs(width)/2){
          radius = Math.floor(Math.abs(width)/2);
        }

        if(height < 0){
          // Negative values in a standard bar chart
          let x_tl = x;
          let x_tr = x+width;
          let y_tl = y+height;
          let y_tr = y+height;

          let x_bl = x;
          let x_br = x+width;
          let y_bl = y;
          let y_br = y;

          // Draw
          ctx.moveTo(x_bl+radius, y_bl);
          ctx.lineTo(x_br-radius, y_br);
          ctx.quadraticCurveTo(x_br, y_br, x_br, y_br-radius);
          ctx.lineTo(x_tr, y_tr+radius);
          ctx.quadraticCurveTo(x_tr, y_tr, x_tr-radius, y_tr);
          ctx.lineTo(x_tl+radius, y_tl);
          ctx.quadraticCurveTo(x_tl, y_tl, x_tl, y_tl+radius);
          ctx.lineTo(x_bl, y_bl-radius);
          ctx.quadraticCurveTo(x_bl, y_bl, x_bl+radius, y_bl);

        } else if(width < 0) {
          // Negative values in a horizontal bar chart
          let x_tl = x+width;
          let x_tr = x;
          let y_tl = y;
          let y_tr = y;

          let x_bl = x+width;
          let x_br = x;
          let y_bl = y+height;
          let y_br = y+height;

          // Draw
          ctx.moveTo(x_bl+radius, y_bl);
          ctx.lineTo(x_br-radius, y_br);
          ctx.quadraticCurveTo(x_br, y_br, x_br, y_br-radius);
          ctx.lineTo(x_tr, y_tr+radius);
          ctx.quadraticCurveTo(x_tr, y_tr, x_tr-radius, y_tr);
          ctx.lineTo(x_tl+radius, y_tl);
          ctx.quadraticCurveTo(x_tl, y_tl, x_tl, y_tl+radius);
          ctx.lineTo(x_bl, y_bl-radius);
          ctx.quadraticCurveTo(x_bl, y_bl, x_bl+radius, y_bl);

        }else{
          //Positive Value
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
        }
      }

      ctx.fill();
      if (borderWidth) {
        ctx.stroke();
      }
    };
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
    // this.getChargesBreakdown();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.matterDetails && changes.matterDetails.currentValue)
      this.getChargesBreakdown()
  }

  getChargesBreakdown() {
    if (this.matterDetails && this.matterDetails.id) {
      this.chartDataLoading = true;
      this.clockService.v1ClockChargesbreakdownMatterIdGet({matterId: this.matterDetails.id})
        .pipe(map(UtilsHelper.mapData))
        .subscribe((chargesBreakdown) => {
          this.showChartData = chargesBreakdown.length > 0;
          this.setChartData(chargesBreakdown);
        }, () => {
          this.chartDataLoading = false;
        })
    } else {
      this.chartDataLoading = false;
    }
  }

  setChartData(chargesData) {
    this.barChartData = [
      { data: [], label: 'Time', stack: 'a', barPercentage: chargesData.length > 3 ? 0.5 : 0.15 },
      { data: [], label: 'Disbursement', stack: 'a', barPercentage: chargesData.length > 3 ? 0.5 : 0.15 }
    ]
    this.isNegativeValuePresent = false;
    this.barChartLabels = [];
    let suggestedMax = 0;
    chargesData.forEach(charge => {
      this.barChartData[0].data.push(charge.totalTimeEntry)
      this.barChartData[1].data.push(charge.totalDisbursements)
      if (charge.totalTimeEntry < 0 || charge.totalDisbursements < 0) {
        this.isNegativeValuePresent = true;
      }
      let summation = Math.abs(charge.totalTimeEntry) + Math.abs(charge.totalDisbursements)
      if (summation > suggestedMax) {
        suggestedMax = summation;
      }
      const barChartLabel = moment(charge.startDate).format('MM/DD') + ' - ' + moment(charge.endDate).format('MM/DD');
      this.barChartLabels.push(barChartLabel);
      if (suggestedMax < 50) {
        this.barChartOptions.scales.yAxes[0].ticks.stepSize = 10;
      } else if (suggestedMax < 100){
        this.barChartOptions.scales.yAxes[0].ticks.stepSize = 25;
      } else if (suggestedMax < 500) {
        this.barChartOptions.scales.yAxes[0].ticks.stepSize = 100;
      } else {
        this.barChartOptions.scales.yAxes[0].ticks.stepSize = 250;
      }
    })
    this.chartDataLoading = false;
  }

}
