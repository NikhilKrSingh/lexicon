import { Pipe, PipeTransform } from '@angular/core';
import { orderBy, sortBy } from 'lodash';

@Pipe({ name: 'orderBy' })
export class OrderByPipe implements PipeTransform {

  /**
   * Sort array used in multiselect component
   * @param value Array
   * @param order Sorting order
   */
  transform(value: any[], order?) {
    order = order ? order : 'asc';
    if (!value) { return value; }
    if (value.length <= 1) { return value; }
    const key = value[0].name ? 'name' : value[0].title ? 'title' : '';

    if (key) {
      const objSorter = obj => obj[key] ? obj[key].toLowerCase() : '';
      const arr = orderBy(value, objSorter, [order]);
      return arr;
    } else {
      return sortBy(value);
    }
  }
}
