import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rankDisplay'
})
export class RankDisplayPipe implements PipeTransform {

  transform(row: any): any {
    if (row) {
      if (
        row.rankingView &&
        row.rankingView !== null &&
        row.rankingView !== ''
      ) {
        if (row.rank > 0) {
          return row.rank;
        } else {
          return '-';
        }
      } else {
        return '-';
      }
    } else {
      return '-';
    }
  }

}
