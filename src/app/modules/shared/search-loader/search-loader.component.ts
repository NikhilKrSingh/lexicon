import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-search-loader',
  templateUrl: './search-loader.component.html',
  styleUrls: ['./search-loader.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SearchLoaderComponent implements OnInit {
  @Input() set active(active: boolean) {
    this.isActive = active;
  }
  @Input() diameter: number;
  @Input() mode: string;
  @Input() strokeWidth: number;
  @Input() value: number;
  @Input() loaderMessage: string;
  public isActive: boolean;

  constructor() { }

  ngOnInit() {
  }

}
