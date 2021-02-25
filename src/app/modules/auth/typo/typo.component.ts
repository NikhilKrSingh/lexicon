import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-typo',
  templateUrl: './typo.component.html',
  styleUrls: ['./typo.component.scss']
})
export class TypoComponent {
  mytab: string[] = ['tab 1', 'tab 2', 'tab 3', 'tab 4', 'tab 5'];
  selecttabs = this.mytab[0];

  @HostListener('document:keydown.escape', ['$event.target']) onClick(btn) {
    this.isTest = false;
  }

  public isTest = false;

  constructor() { }


  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
