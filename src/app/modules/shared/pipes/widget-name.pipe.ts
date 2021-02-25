import { Pipe, PipeTransform } from '@angular/core';
import { Widget } from '../../models/dashboard.model';

@Pipe({
  name: 'widgetName',
})
export class WidgetNamePipe implements PipeTransform {
  transform(widgets: Widget[]): string {
    try {
      let name = '';

      widgets.forEach((w, index) => {
        if (index == 0) {
          name = `${w.name}`;
        } else {
          name = `${name}, ${w.name}`;
        }
      });

      return name;
    } catch {
      return '';
    }
  }
}
