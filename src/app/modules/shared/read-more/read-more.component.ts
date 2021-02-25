import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-read-more',
  templateUrl: './read-more.component.html',
  styleUrls: ['./read-more.component.scss']
})
export class ReadMoreComponent implements OnChanges {
  @Input() maxLength = 100;
  @Input() text: string;
  @Input() showMoreLabel = '... Show More';
  @Input() showLessLabel = 'Show Less';

  @Input() maxLines = 2;

  @ViewChild('content', { static: false }) content: ElementRef<HTMLDivElement>;

  @ViewChild('btn', { static: false }) btn: ElementRef<HTMLButtonElement>;
  showEllipsis = true;
  elementHeight = this.maxLines * 20;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.maxLines && changes.maxLines.currentValue) {
      this.elementHeight = this.maxLines * 20;
    }
  }
}
