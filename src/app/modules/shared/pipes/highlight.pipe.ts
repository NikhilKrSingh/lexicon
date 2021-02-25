import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlightText'
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, search: string): string {
    if (search && text) {
      let pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
      pattern = pattern.split(' ').filter((t) => {
        return t.length > 0;
      }).join('|');

      const regex = new RegExp(pattern, 'gi');

      return text.replace(regex, (match) => `<em class="search-highlight-text">${match}</em>`);
    } else {
      return text;
    }
  }
}
