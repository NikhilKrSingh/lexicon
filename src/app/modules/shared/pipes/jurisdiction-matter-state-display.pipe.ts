import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jurisdictionMatterStateDisplay'
})
export class JurisdictionMatterStateDisplayPipe implements PipeTransform {

  transform(jurisdictionStateList: any[], jurisdictionStateId: any): any {
    let state: any = jurisdictionStateList.filter(
      obj => obj.id == jurisdictionStateId
    );
    state = state[0];
    return state ? state.name : '';
  }

}
