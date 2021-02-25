import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appAutoCloseOutsideClick]'
})
export class AutoCloseOutsideClickDirective {
  @Output() readonly outsideClick = new EventEmitter();

  private _el: ElementRef<HTMLDivElement>;

  constructor(elementRef: ElementRef) {
    this._el = elementRef;
  }

  @HostListener('document:click', ['$event']) onDocumentClick($event) {
    if (this._el && this._el.nativeElement) {
      if (!this._el.nativeElement.contains($event.target)) {
        if(document.getElementsByClassName("datatable-row-wrapper") && document.getElementsByClassName("datatable-row-wrapper").length) {
          for(let i=0; i< document.getElementsByClassName("datatable-row-wrapper").length; i++)  {
            if(document.getElementsByClassName("datatable-row-wrapper")[i].classList) {
              document.getElementsByClassName("datatable-row-wrapper")[i].classList.remove("datatable-row-hover")
            }
          }
        }
        this.outsideClick.emit($event);
      }
    }
  }
}
