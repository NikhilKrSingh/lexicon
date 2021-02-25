import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-multiitem-list',
    templateUrl: './multiitem-list.component.html',
    styleUrls: ['./multiitem-list.component.scss']
})
export class MultiitemListComponent {
    showMoreItemsToggle = true;

    @Input() items: Array<string>
    @Input() maxItems: number = 3;

    toggle() {
        this.showMoreItemsToggle = !this.showMoreItemsToggle;
    }
    trackByFn(index: number,obj: any) {
        return obj ? obj['id'] || obj : index ;
      }
}
