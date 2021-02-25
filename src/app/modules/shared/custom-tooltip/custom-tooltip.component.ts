import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-custom-tooltip',
  templateUrl: './custom-tooltip.component.html',
  styleUrls: ['./custom-tooltip.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class CustomTooltipComponent implements OnInit {
  @Input() text: string;
  @Input() maxLength = 20;
  @Input() position = 'top';

  constructor() {}

  ngOnInit() {}
}
