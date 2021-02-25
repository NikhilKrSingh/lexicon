import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clientNameSlice'
})
export class ClientNameSlicePipe implements PipeTransform {

  transform(clientDetails: any, sliceLength: number): any {
    if (clientDetails && clientDetails.isCompany) {
      if (clientDetails.companyName) {
        if (clientDetails.companyName.length < sliceLength) {
          return clientDetails.companyName;
        } else {
          return `${clientDetails.companyName.slice(0, sliceLength)}...`;
        }
      } else {
        return null;
      }
    } else {
      if (clientDetails && (clientDetails.firstName || clientDetails.lastName)) {
        let clientFullName = `${clientDetails.firstName} ${clientDetails.lastName}`;
        if (clientFullName.length < sliceLength) {
          return clientFullName;
        } else {
          return `${clientFullName.slice(0, sliceLength)}...`;
        }
      } else {
        return null;
      }
    }
  }

}
