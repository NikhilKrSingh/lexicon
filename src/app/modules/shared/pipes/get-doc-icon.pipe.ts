import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getDocIcon'
})
export class GetDocIconPipe implements PipeTransform {

  transform(category?: any): any {
    let ext = category.split('.').pop();
    let icon;
    switch (ext) {
      case 'pdf':
        icon = '../../../../../../assets/images/dms/pdffilled.svg';
        break;
      case 'xls':
      case 'xlsx':
        icon = '../../../../../../assets/images/dms/excel.png';
        break;
      case 'docx':
      case 'doc':
      case 'rtf':
        icon = '../../../../../../assets/images/dms/worddoc.png';
        break;
      case 'ppt':
        icon = '../../../../../../assets/images/dms/powerpoint.png';
        break;
      default:
        icon = '../../../../../../assets/images/dms/document.png';
    }
    return icon;
  }

}
