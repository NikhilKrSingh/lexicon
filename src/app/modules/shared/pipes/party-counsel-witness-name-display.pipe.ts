import { Pipe, PipeTransform } from '@angular/core';
import { vwAttorneyViewModel } from 'src/common/swagger-providers/models';

@Pipe({
  name: 'partyCounselWitnessNameDisplay'
})
export class PartyCounselWitnessNameDisplayPipe implements PipeTransform {

  transform(associationArray: any): any {
    if (associationArray) {
      return associationArray.map(a =>
        a.isCompany ? `${a.company}` : `${a.lastName}, ${a.firstName}`
      );
    } else {
      return [];
    }
  }

}
