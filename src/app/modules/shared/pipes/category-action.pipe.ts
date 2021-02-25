import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryAction'
})
export class CategoryActionPipe implements PipeTransform {

  transform(category?: any): any {
    let actionName = '';
    switch (category) {
      case 'Matter':
        actionName = 'View Matter';
        break;
      case 'Matters':
        actionName = 'View Matter';
        break;
      case 'Matter Ledger':
        actionName = 'View Matter';
        break;
      case 'Client':
        actionName = 'View Client';
        break;
      case 'Potential Client':
        actionName = 'View Potential Client';
        break;
      case 'Potential Clients':
        actionName = 'View Potential Client';
        break;
      case 'Employee':
        actionName = 'View Employee';
        break;
      case 'Calendar':
        actionName = 'View Calendar';
        break;
      case 'Office':
        actionName = 'View Office';
        break;
      case 'Profile Billing':
        actionName = 'View Billing';
        break;
      case 'Pre Bill':
        actionName = 'View Pre-Bill';
        break;
      case 'Calendar Event':
        actionName = 'View Calendar';
        break;
      case 'Timesheet':
        actionName = 'View Timesheet';
        break;
      case 'JobFamily':
        actionName = 'Edit Job Family';
        break;
      case 'DMS Path':
        actionName = 'View Document';
        break;
      case 'DMS Matter Folder':
        actionName = 'View Document';
        break;

    }
    return actionName;
  }

}
