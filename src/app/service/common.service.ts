import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  docs = new BehaviorSubject(null);
  clientRetentDocs = new BehaviorSubject(null);
  isLogOutRequest = new BehaviorSubject<any>(null);
  isLoginRequest = new BehaviorSubject<any>(null);
  isDmsRefresh = new BehaviorSubject<any>(null);
  isDMSInetConnection = new BehaviorSubject<any>(null);
  isClearFilter = new BehaviorSubject<any>(null);
  constructor() { }

  getIcons(filename?: string) {
    const ext = filename.substr(filename.lastIndexOf('.') + 1);
    let str = '';
    switch (ext) {
      case 'xls':
      case 'xlsx':
        str = '/assets/images/Calendar/excel.svg';
        break;
      case 'ppt':
        str = '/assets/images/Calendar/presentation.svg';
        break;
      case 'doc':
      case 'docx':
      case 'rtf':
        str = '/assets/images/Calendar/word.svg';
        break;
      case 'pdf':
        str = '/assets/images/Calendar/pdf.svg';
        break;
      case 'png':
      case 'svg':
      case 'jpeg':
      case 'svg':
      case 'gif':
        str = '/assets/images/Calendar/image.svg';
        break;
      case 'mp3':
      case 'mp4':
      case 'wav':
        str = '/assets/images/Calendar/audio.svg';
        break;
      case 'webm':
      case 'flv':
        str = '/assets/images/Calendar/video.svg';
        break;
      default:
        str = '/assets/images/Calendar/file.svg';
        break;
    }
    return str;
  }

  getFileImage(filename?: string, notFilled?: boolean): string {
    const ext = filename.substr(filename.lastIndexOf('.') + 1);
    let str = '';
    switch (ext) {
      case 'xls':
      case 'xlsx':
      case 'csv':
        str = 'assets/images/dms/excel.svg';
        break;
      case 'ppt':
        str = 'assets/images/dms/presentation.svg';
        break;
      case 'doc':
      case 'docx':
      case 'rtf':
        str = 'assets/images/dms/word.svg';
        break;
      case 'pdf':
        str = notFilled ? 'assets/images/dms/pdf.svg' : 'assets/images/dms/pdffilled.svg';
        break;
      case 'png':
      case 'svg':
      case 'jpeg':
      case 'svg':
      case 'gif':
        str = 'assets/images/dms/image.svg';
        break;
      case 'mp3':
      case 'mp4':
      case 'wav':
        str = 'assets/images/dms/audio.svg';
        break;
      case 'webm':
      case 'flv':
        str = 'assets/images/dms/video.svg';
        break;
      default:
        str = 'assets/images/dms/file.svg';
        break;
    }
    return str;
  }

  formatDate(date?): string {
    const time = moment().format('HH:mm:ss');
    return date ? moment(date).format(`YYYY-MM-DD[T]${time}Z`) : moment().add(1, 'year').format(`YYYY-MM-DD[T]${time}Z`);
  }

  formatKiloBytes(value, isByte?) {
    const bytes = !isByte ? value * 1024 : value;
    const decimals = 2;

    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getTruncatedName(name, length = 30): string {
    name = name ? name : '--';
    if (name.length > length) {
      name = name.slice(0, length) + '...';
    }
    return name;
  }

  /**
   *
   * @param bytes
   * Function to check and format file size
   */
  public bytesToSize(bytes) {
    const sizeInBytes = bytes;
    const size = sizeInBytes / Math.pow(1024, 2); // size in new units
    const formattedSize = Math.round(size * 100) / 100; // keep up to 2 decimals
    return formattedSize;
  }
}
