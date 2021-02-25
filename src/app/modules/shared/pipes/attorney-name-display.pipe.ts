import { Pipe, PipeTransform } from '@angular/core';
import { vwAttorneyViewModel } from 'src/common/swagger-providers/models';

@Pipe({
  name: 'attorneyNameDisplay'
})
export class AttorneyNameDisplayPipe implements PipeTransform {

  transform(user: any): any {
    if (user) {
      let name = user.lastName;

      if (name) {
        name += ', ';
      }

      name += user.firstName;

      return name || 'N/A';
    } else {
      return 'N/A';
    }
  }

}
