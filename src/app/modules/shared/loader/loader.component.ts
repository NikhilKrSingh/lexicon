import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class LoaderComponent implements OnInit {
  activeTimeout: any;

  @Input() set active(active: boolean) {
    if (!active) {
      if (this.activeTimeout) {
        clearTimeout(this.activeTimeout);
      }
      this.isActive = false;
    } else {
      this.activeTimeout = setTimeout(() => {
        this.isActive = active;
      }, 1500);
    }
  }

  @Input() diameter: number;
  @Input() mode: string;
  @Input() strokeWidth: number;
  @Input() value: number;

  public isActive: boolean;

  constructor() {}

  ngOnInit() {}
}
