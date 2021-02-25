import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

export class UtilsHelper {
  /**
   *
   * Get token
   * @public
   * @memberof UtilsHelper
   */
  public static getToken() {
    let token = localStorage.getItem('token');
    if (!!token) {
      return token;
    }
    return false;
  }

  public static matchName(item: any, searchValue: string, fieldName): boolean {

    let searchName
    if (fieldName === 'responsibleAttorney' || fieldName === 'practiceArea') {
      searchName =
        item[fieldName] && item[fieldName].length > 0 && item[fieldName][0]
          ? item[fieldName][0]['name'] ? item[fieldName][0]['name'].toString().toUpperCase() : ''
          : '';
    } else if (fieldName === 'primaryOffice' || fieldName === 'createdBy') {
      searchName = item[fieldName] && item[fieldName]['name'] ? item[fieldName]['name'].toString().toUpperCase() : '';
    }
    else {
      searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    }
    // return searchName.search(searchValue.toUpperCase()) > -1;
    return searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ',')) > -1;
  }

  public static matchFullEmployeeName(item: any, searchValue: string) {
    if (item) {
      let fullNames: string[] = [];

      if (item.firstName && item.lastName) {
        fullNames.push(`${item.firstName} ${item.lastName}`);
        fullNames.push(`${item.lastName}, ${item.firstName}`);
        fullNames.push(`${item.lastName},${item.firstName}`);
        fullNames.push(`${item.lastName} ${item.firstName}`);
      }
      return fullNames.some(a => a.toLowerCase().includes(searchValue.toLowerCase()));;
    }
  }

  /**
   *
   * Convert video duration into fancy time formate
   * @public
   * @memberof UtilsHelper
   */
  public static fancyTimeFormat(time) {
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60;
    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = '';

    if (hrs > 0) {
      ret += '' + hrs + ':' + (mins < 10 ? '0' : '');
    }
    ret += '' + mins + ':' + (secs < 10 ? '0' : '');
    ret += '' + secs;
    return ret;
  }

  public static onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  public static getIndex(value, arr) {
    if (arr && arr.length > 0) {
      return arr.indexOf(value);
    } else {
      return -1;
    }
  }

  /**
   *  Get login user details
   */
  public static getLoginUser() {
    let user = localStorage.getItem('profile');
    if (user) {
      return JSON.parse(user);
    } else {
      return {};
    }
  }

  public static getLogo() {
    let logo = localStorage.getItem('logo');
    if (logo !== 'null') {
      return logo
    } else {
      return null;
    }
  }


  public static checkPermissionOfRepBingAtn(matterDetails): boolean {
    let loginUserAttorny: boolean = false;
    let loggedInUser = this.getLoginUser();
    if (
      matterDetails && matterDetails.billingAttorney &&
      matterDetails.billingAttorney.length > 0 &&
      loggedInUser && loggedInUser.id === matterDetails.billingAttorney[0].id
    ) {
      loginUserAttorny = true;
    }
    if (
      matterDetails && matterDetails.responsibleAttorney &&
      matterDetails.responsibleAttorney.length > 0 &&
      loggedInUser && loggedInUser.id === matterDetails.responsibleAttorney[0].id
    ) {
      loginUserAttorny = true;
    }
    return loginUserAttorny;
  }

  public static checkPermissionOfConsultAtn(clientDetails): boolean {
    let loginUserAttorny: boolean = false;
    let loggedInUser = this.getLoginUser();
    if (
      clientDetails && clientDetails.consultAttorney && loggedInUser
    ) {
      if (
        clientDetails.consultAttorney.length
      ) {
        loginUserAttorny = loggedInUser.id == clientDetails.consultAttorney[0].id
      } else {
        loginUserAttorny = loggedInUser.id == clientDetails.consultAttorney.id
      }
    }
    return loginUserAttorny;
  }

  /**
   *
   * Convert date to working Hours Time
   * @public
   * @memberof UtilsHelper
   */
  public static workingHoursFormat(date: string) {
    if (date) {
      let d1 = date.split('+')[0];
      return new Date(d1).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });
    } else {
      return '';
    }
  }

  public static getworkingHoursFormat(date: string) {
    if (date) {
      let d1 = date.split('+')[0];
      return d1.split('T')[1];
    } else {
      return '';
    }
  }

  public static isValidImageFile(file: File) {
    return /\.(jpe?g|png|gif|bmp)$/i.test(file.name);
  }

  public static isValidProfileImage(file: File) {
    return /\.(jpe?g|png)$/i.test(file.name);
  }

  public static isValidFaviconImage(file: File) {
    return /\.(jpe?g|png)$/i.test(file.name);
  }

  public static permission = ['isEdit', 'isNoVisibility', 'isViewOnly', 'isAdmin'];

  public static addkeysIncolumnlist(keys: any[] | string[]) {
    const returnList = [];
    for (let i = 0; i < keys.length; i++) {
      returnList.push({ Name: keys[i], DisplayName: this.capitalize(keys[i]) });
    }

    return returnList;
  }

  public static capitalize(s) {
    if (typeof s !== 'string') { return ''; }
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  public static dateObjectToDatepicker(dateString: string) {
    if (dateString) {
      let d = dateString.split('T')[0];
      let date = new Date(d);
      return <NgbDateStruct>{
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };
    } else {
      return null;
    }
  }

  public static datepickerToDateobject(date: NgbDateStruct) {
    if (date) {
      return new Date(date.year, date.month - 1, date.day);
    } else {
      return null;
    }
  }

  public static datepickerToDateString(date: NgbDateStruct, seperator = '-') {
    if (date) {
      return (
        date.year +
        seperator +
        padNumber(date.month) +
        seperator +
        padNumber(date.day)
      );
    } else {
      return null;
    }
  }

  public static dateToDateString(date: Date, seperator = '-') {
    if (date) {
      return (
        date.getFullYear() +
        seperator +
        padNumber(date.getMonth() + 1) +
        seperator +
        padNumber(date.getDate())
      );
    } else {
      return null;
    }
  }

  public static dataURLtoFile(url: string, fileName) {
    let byteString = atob(url);
    let length = byteString.length;
    let uArray = new Uint8Array(length);

    while (length--) {
      uArray[length] = byteString.charCodeAt(length);
    }

    return new File([uArray], fileName);
  }

  /**
  * function to return suffix list
  */
  public static returnsuffixList() {
    let suffixList: Array<{ val: string, text: string }>;
    suffixList = [
      { val: 'JD', text: 'J.D' },
      { val: 'llm', text: 'LL.M' },
      { val: 'jsd', text: 'J.S.D' },
      { val: 'llb', text: 'LL.B' }
    ];
    return suffixList;
  }

  /**
   *  function to return do not contact resion
   */
  public static returndoNotContactReasonArr() {
    let doNotContactReasonArr: Array<{ name: string }>;
    doNotContactReasonArr = [
      { name: 'PC request' },
      { name: 'Bankruptcy' },
      { name: 'Confidentiality' },
      { name: 'Firm requset' }
    ]
    return doNotContactReasonArr;
  }

  /**
   *  function to return gender list
   */
  public static returndoGenderList() {
    let genderArr: Array<{ val: string, text: string }>;
    genderArr = [
      { val: 'Male', text: 'Male' },
      { val: 'Female', text: 'Female' },
      { val: 'Other', text: 'Other' }
    ];
    return genderArr;
  }

  /**
   * function to return salutation list
   */
  public static returnSalutationList() {
    let salutationArr: Array<{ name: string }>;
    salutationArr = [
      { name: 'Mr.' },
      { name: 'Mrs.' },
      { name: 'Ms.' }
    ];
    return salutationArr;
  }

  /**
   * Downloads the given blob file
   * @param blob
   * @param fileName
   */
  public static downloadFile(blob: Blob, fileName: string) {
    let anchor = document.createElement('a');
    const newBlob = new Blob([blob], { type: 'text/csv' });
    anchor.href = window.URL.createObjectURL(newBlob);
    anchor.target = '_blank';
    anchor.download = fileName + '.csv';
    anchor.click();
  }

  /**
   * return dys list array
   * @param blob
   * @param fileName
   */
  public static getDayslist() {
    return [
      { value: 'Monday', name: 'Monday' },
      { value: 'Tuesday', name: 'Tuesday' },
      { value: 'Wednesday', name: 'Wednesday' },
      { value: 'Thursday', name: 'Thursday' },
      { value: 'Friday', name: 'Friday' },
      { value: 'Saturday', name: 'Saturday' },
      { value: 'Sunday', name: 'Sunday' }
    ];
  }

  /**
   * return dys list array
   * @param blob
   * @param fileName
   */
  public static getGrneratePreBilllist() {
    return [
      {id : 1, name: 'Generate pre-bills and invoices on that date'},
      {id : 2, name: 'Generate pre-bills and invoices on the last working day before that date'},
      {id : 3, name: 'Generate pre-bills and invoices on the first working day after that date'}
    ];
  }

  public static getGeneratePaymentPlanBillList() {
    return [
      {id : 1, name: 'Bill the client on that date'},
      {id : 2, name: 'Bill the client on the last working day before that date'},
      {id : 3, name: 'Bill the client on the first working day after that date'}
    ];
  }

  /**
   * return dys list array
   * @param blob
   * @param fileName
   */
  public static getDayslistn() {
    return [
      { value: 0, name: 'Sunday' },
      { value: 1, name: 'Monday' },
      { value: 2, name: 'Tuesday' },
      { value: 3, name: 'Wednesday' },
      { value: 4, name: 'Thursday' },
      { value: 5, name: 'Friday' },
      { value: 6, name: 'Saturday' }
    ];
  }


  /**
   * return dys list array
   * @param blob
   * @param fileName
   */
  public static getCalendarIcon() {
    return { 'apple': 'icloud-1.png', 'exchange': 'exchange-1.png', 'google': 'calendar-1.png', 'office365': 'office-1.png', 'live_connect': 'outlook-1.png' };
  }
  public static cardImageIcon = {
    "VISA": '/assets/images/visa.png',
    "AMEX": '/assets/images/american-express.png',
    "DISC": '/assets/images/discover.png',
    "MSTR": '/assets/images/master-card.png',
  };

  public static validateEmail(val: string): boolean {
    let regex = /^(([\w-]+\.)+[\w-]+|([a-zA-Z]{1}|[\w-]{2,}))@((([0-1]?[0-9]{1,2}|25[0-5]|2[0-4][0-9])\.([0-1]?[0-9]{1,2}|25[0-5]|2[0-4][0-9])\.([0-1]?[0-9]{1,2}|25[0-5]|2[0-4][0-9])\.([0-1]?[0-9]{1,2}|25[0-5]|2[0-4][0-9])){1}|([a-zA-Z0-9]+[\w-]+\.)+[a-zA-Z]{1}[a-zA-Z0-9-]{1,23})$/;
    return regex.test(String(val).toLowerCase()) ? true : false;
  }

  public static mapData<T = any>(res: any): T {
    return JSON.parse(res as any).results;
  }

  public static addWeeks(date: string, weeks: number) {
    let d = new Date(date);
    d.setDate(d.getDate() + 7 * weeks);

    while (+d < +new Date()) {
      d.setDate(d.getDate() + 7 * weeks);
    }
    return d.toJSON();
  }

  public static addDays(date: string, days: number) {
    let d = new Date(date);
    d.setDate(d.getDate() + days);

    while (+d < +new Date()) {
      d.setDate(d.getDate() + days);
    }
    return d.toJSON();
  }

  public static addMonths(date: string, months: number) {
    let d = new Date(date);
    d.setMonth(d.getMonth() + months);

    while (+d < +new Date()) {
      d.setMonth(d.getMonth() + months);
    }
    return d.toJSON();
  }

  public static getDocExtensions(): string[] {
    return ['pdf', 'docx', 'doc', 'xls', 'csv', 'ppt', 'rtf', 'jpg', 'jpeg', 'png'];
  }
  public static getFinalEffectiveDate(startDate, billData) {
    let currentDate = moment();
    let previosEffectiveDate = startDate;
    let newEffectiveDate = this.getEffectiveDateUpcoming(startDate, billData);
    if (startDate && billData && billData.billFrequencyQuantity) {
      while (currentDate.isAfter(moment(newEffectiveDate))) {
        previosEffectiveDate = newEffectiveDate;
        newEffectiveDate = this.getEffectiveDateUpcoming(newEffectiveDate, billData);
      }
    }
    return {newEffectiveDate, previosEffectiveDate};
  }

  public static  getEffectiveDateUpcoming(startDate, billData) {
    if (billData.billFrequencyDurationType === 'WEEKS') {
      return this.addWeeksForBillPeriod(startDate, +billData.billFrequencyDay, +billData.billFrequencyQuantity);
    } else if (billData.billFrequencyDurationType === 'MONTHS' && billData.billFrequencyRecursOn) {
      if (+billData.repeatType === 2) {
        if (billData.billFrequencyRecursOn == moment(startDate).add(billData.billFrequencyQuantity, 'M').format('DD')) {
          return moment(startDate).add(billData.billFrequencyQuantity, 'M').format('MM/DD/YYYY');
        } else {
          return moment(startDate).add(billData.billFrequencyQuantity, 'M').endOf('month').format('MM/DD/YYYY');
        }
      } else {
        return this.addMonthForBillPeriod(startDate, +billData.billFrequencyQuantity, +billData.billFrequencyDay, +billData.billFrequencyRecursOn);
      }
    }
  }

  public static addWeeksForBillPeriod(lastBillDate, days: number, billFrequencyQuantity: number) {
    let endDate;
    let nextDate = moment(lastBillDate).day(days + ((billFrequencyQuantity) * 7)).format('MM/DD/YYYY');
    if (billFrequencyQuantity == 1) {
      nextDate = moment(lastBillDate).day(days + ((billFrequencyQuantity - 1) * 7)).format('MM/DD/YYYY');
      if (lastBillDate == nextDate) {
        endDate = moment(lastBillDate).day(days + ((billFrequencyQuantity) * 7)).format('MM/DD/YYYY');
      } else if (lastBillDate > nextDate) {
        endDate = moment(lastBillDate).day(days + ((billFrequencyQuantity) * 7)).format('MM/DD/YYYY');
      } else {
        endDate = nextDate;
      }
    } else if (lastBillDate > nextDate) {
      endDate = moment(lastBillDate).day(days + (billFrequencyQuantity * 7)).format('MM/DD/YYYY');
    } else {
      if (days <= moment(lastBillDate).day()) {
        endDate = nextDate;
      } else {
        endDate = moment(lastBillDate).day(days + ((billFrequencyQuantity - 1) * 7)).format('MM/DD/YYYY');
      }
    }
    return endDate;
  }

  public static addMonthForBillPeriod(lastBillDate, billFrequencyQuantity, days, recursDay) {
    let recursDay1 = this.checkWeekExistinMonth(lastBillDate, 0, days, recursDay);
    let nextDate = this.getNextDate(lastBillDate, billFrequencyQuantity, days, recursDay);
    let currentMonthDayDate = moment(lastBillDate).startOf('month').day(days + (recursDay1 * 7)).format('MM/DD/YYYY');
    if (lastBillDate < currentMonthDayDate) {
      return this.getNextDate(lastBillDate, billFrequencyQuantity - 1, days, recursDay);
    } else {
      return nextDate;
    }
  }

  public static getNextmonthDate(lastBillDate, billFrequencyQuantity, days, recursDay) {
    let currentDay = moment(lastBillDate).format('DD');
    let totalDays = moment().daysInMonth();
    if (totalDays < +recursDay) {
      return moment(lastBillDate).endOf('month').format('MM/DD/YYYY');
    } else if (+recursDay >= +currentDay) {
      return moment(lastBillDate).startOf('month').add(+recursDay-1, 'd').format('MM/DD/YYYY');
    } else {
      return moment(lastBillDate).add(billFrequencyQuantity, 'M').startOf('month').add(+recursDay-1, 'd').format('MM/DD/YYYY');
    }
  }

  public static getNextDate(lastBillDate, quantity, days, recursDay) {
    recursDay = this.checkWeekExistinMonth(lastBillDate, quantity, days, recursDay);
    return moment(lastBillDate).add(quantity, 'M').startOf('month').day(days + (recursDay * 7)).format('MM/DD/YYYY');
  }

  public static checkWeekExistinMonth(lastBillDate, quantity, days, recursDay) {
    let daysofMonth = moment(lastBillDate).add(quantity, 'M').startOf('month').day() - 1;
    let todayDaysInWeek = this.getAmountOfWeekDaysInMonth(moment(lastBillDate).add(quantity, 'M').startOf('month'), days);
    if (recursDay === 5 && todayDaysInWeek !== 5) {
      recursDay = 4;
    }
    return (daysofMonth >= days) ? recursDay : recursDay - 1;
  }

  public static getAmountOfWeekDaysInMonth(date, weekday) {
    date.date(1);
    var dif = (7 + (weekday - date.weekday())) % 7 + 1;
    return Math.floor((date.daysInMonth() - dif) / 7) + 1;
  }

  /**
   * get scroll width
   *
   * @static
   * @returns {number}
   * @memberof UtilsHelper
   */
  public static getScrollbarWidth(): number {
    // Creating invisible container
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);
    // Creating inner element and placing it in the container
    const inner = document.createElement('div');
    outer.appendChild(inner);
    // Calculating difference between container's full width and the child width
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);
    return scrollbarWidth;
  }

  /**
   * apply scroool width in table
   *
   * @static
   * @memberof UtilsHelper
   */
  public static aftertableInit() {
    setTimeout(() => {
      let positionClass = document.querySelectorAll(".datatable-row-right");
      let scrollLength = UtilsHelper.getScrollbarWidth();
      let totalLength = positionClass.length;
      if (positionClass && totalLength > 0) {
        for (let i = 1; i < totalLength; i++) {
          (positionClass[i] as HTMLElement).style.right = "-" + scrollLength + "px";
        }
      }
    }, 1);
  }

  /**
   * Function to download zip
   */
  public static downloadZip(data: any, fileName: string) {
    const type = 'application/zip';
    const blob = new Blob([data], { type });
    const blobURL = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = fileName;
    anchor.href = blobURL;
    anchor.click();
  }

  public static base64toFile(b64Data, filename, contentType) {
    let sliceSize = 512;
    let byteCharacters = atob(b64Data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);
      let byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      let byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    let file = new File(byteArrays, filename, { type: contentType });
    return file;
  }

  static downloadStringAsFile(text, fileType, fileName) {
    const blob = new Blob([text], { type: fileType });

    const a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  public static setObject(key, value) {
    if (this.lsSpaceAvailable(key, value) === true) {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      sessionStorage.setItem(key, JSON.stringify(value))
    }
  }

  public static getObject(key) {
    if (localStorage.getItem(key)) {
      return JSON.parse(localStorage.getItem(key));
    } else {
      return JSON.parse(sessionStorage.getItem(key));
    }
  }

  public static removeObject(key) {
    if (localStorage.getItem(key)) {
      return localStorage.removeItem(key);
    } else {
      return sessionStorage.removeItem(key);
    }
  }

  public static lsSpaceAvailable(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static getAssociationUsername(data) {
    let time = new Date();
    let email = data.Email || data.email;
    if (!email) {
      if (data.IsCompany) {
        email = (data.CompanyName.substr(0, 3));
      } else {
        email = (data.FirstName.substr(0, 3)) + (data.LastName.substr(0, 3));
      }
    }
    return time.getTime().toString() + '_' + email;
  }

  /* To copy Text from Textbox */
  public static copyInputMessage(inputElement) {
    inputElement.select();
    document.execCommand("copy");
    inputElement.setSelectionRange(0, 0);
  }

  /* To copy any Text */
  public static copyText(val: string) {
    let selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }

  /***** function to return valid tenant tier */
  public static validTenantTier(): Array<any> {
    return ['Ascending', 'Iconic'];
  }

  public static clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  public static dateUtcToLocaLe(date: string): string {
    return moment.utc(date).local().format();
  }

  public static ordinal_suffix_of_number(i: number) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
  }

  public static getTenantTierDetails() {
    const profile = UtilsHelper.getObject('profile');
    return (
      profile && profile.tenantTier && profile.tenantTier.tierName &&
      (profile.tenantTier.tierName === 'Ascending' || profile.tenantTier.tierName === 'Iconic')
    ) ? true : false;
  }

  public static invoiceStatusCodes(): Array<string> {
    return ['GENERATED', 'CANCELED'];
  }

  public static timeList(): Array<{key: string, value: string}> {
    return [
      {key: '12:00 AM', value: '00:00:00'},
      {key: '12:30 AM', value: '00:30:00'},
      {key: '1:00 AM', value: '01:00:00'},
      {key: '1:30 AM', value: '01:30:00'},
      {key: '2:00 AM', value: '02:00:00'},
      {key: '2:30 AM', value: '02:30:00'},
      {key: '3:00 AM', value: '03:00:00'},
      {key: '3:30 AM', value: '03:30:00'},
      {key: '4:00 AM', value: '04:00:00'},
      {key: '4:30 AM', value: '04:30:00'},
      {key: '5:00 AM', value: '05:00:00'},
      {key: '5:30 AM', value: '05:30:00' },
      {key: '6:00 AM', value: '06:00:00' },
      {key: '6:30 AM', value: '06:30:00' },
      {key: '7:00 AM', value: '07:00:00' },
      {key: '7:30 AM', value: '07:30:00' },
      {key: '8:00 AM', value: '08:00:00' },
      {key: '8:30 AM', value: '08:30:00' },
      {key: '9:00 AM', value: '09:00:00' },
      {key: '9:30 AM', value: '09:30:00' },
      {key: '10:00 AM', value: '10:00:00' },
      {key: '10:30 AM', value: '10:30:00' },
      {key: '11:00 AM', value: '11:00:00' },
      {key: '11:30 AM', value: '11:30:00' },
      {key: '12:00 PM', value: '12:00:00'},
      {key: '12:30 PM', value: '12:30:00'},
      {key: '1:00 PM', value: '13:00:00'},
      {key: '1:30 PM', value: '13:30:00'},
      {key: '2:00 PM', value: '14:00:00'},
      {key: '2:30 PM', value: '14:30:00'},
      {key: '3:00 PM', value: '15:00:00'},
      {key: '3:30 PM', value: '15:30:00'},
      {key: '4:00 PM', value: '16:00:00'},
      {key: '4:30 PM', value: '16:30:00'},
      {key: '5:00 PM', value: '17:00:00'},
      {key: '5:30 PM', value: '17:30:00'},
      {key: '6:00 PM', value: '18:00:00'},
      {key: '6:30 PM', value: '18:30:00'},
      {key: '7:00 PM', value: '19:00:00'},
      {key: '7:30 PM', value: '19:30:00'},
      {key: '8:00 PM', value: '20:00:00'},
      {key: '8:30 PM', value: '20:30:00'},
      {key: '9:00 PM', value: '21:00:00'},
      {key: '9:30 PM', value: '21:30:00'},
      {key: '10:00 PM', value: '22:00:00'},
      {key: '10:30 PM', value: '22:30:00'},
      {key: '11:00 PM', value: '23:00:00'},
      {key: '11:30 PM', value: '23:30:00'},
    ];
  }

  public static parseMinutes(minutes: number, hours: number) {
    let isNegative = minutes < 0;
    minutes = Math.abs(minutes);

    const nhours = minutes / 60;
    const rhours = Math.floor(Math.abs(nhours));
    const nminutes = (nhours - rhours) * 60;
    const rminutes = Math.round(nminutes);
    hours = hours + rhours;
    minutes = rminutes;

    if (isNegative) {
      if (hours > 0) {
        hours = hours * -1;
      } else {
        if (minutes > 0) {
          minutes = minutes * -1;
        }
      }
    }

    return {
      hours,
      minutes
    }
  }

  /**** function to dynamically add Frozen on datatable */
  public static checkDataTableScroller(tables: any) {
    setTimeout(() => {
      if(tables.tableArr && tables.frozenRightArr) {
        tables.tableArr.forEach((table, index) => {
          if(table.bodyComponent && table.bodyComponent.innerWidth
              && table.bodyComponent.scroller && table.bodyComponent.scroller.scrollWidth) {
            const tableWidth = table.bodyComponent.innerWidth;
            const tableScrollWidth = table.bodyComponent.scroller.scrollWidth;
            tables.frozenRightArr[index] = (tableWidth < tableScrollWidth);
          }
        });
      }
    }, 20);
  }
  /*** Function to check number*/
  public static checkNumber = (event:any) => {
    const allowedKey = [8, 9, 77, 72, 104, 109, 32, 46, 45, 58];
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return ((k >= 48 && k <= 57) || allowedKey.some(x =>  x == +k ));
  }

  /***Function to format the phne number */
  public static formatPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '')
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    }
    return null
    }
}

export function padNumber(value: number) {
  if (!isNaN(value)) {
    return `0${value}`.slice(-2);
  } else {
    return '';
  }
}

export function isNumber(value: any): boolean {
  return !isNaN(toInteger(value));
}

export function toInteger(value: any): number {
  return parseInt(`${value}`, 10);
}

export function nearestMinutes(interval, someMoment) {
  const roundedMinutes = Math.round(someMoment.clone().minute() / interval) * interval;
  return someMoment.clone().minute(roundedMinutes).second(0);
}

export function nearestPastMinutes(interval, someMoment) {
  const roundedMinutes = Math.floor(someMoment.minute() / interval) * interval;
  return someMoment.clone().minute(roundedMinutes).second(0);
}

export function nearestFutureMinutes(interval, someMoment) {
  const roundedMinutes = Math.ceil(someMoment.minute() / interval) * interval;
  return someMoment.clone().minute(roundedMinutes).second(0);
}

/**
 * Add Blue border to ngx-datatable row on expand
 */
export function addBlueBorder($event) {
  try {
    $event.target
      .closest('datatable-body-row')
      .style.boxShadow = '0 0 0 2px var(--blue) inset';
  } catch { }
}

/**
 * Remove blue border from ngx-datatble row on collapse
 */
export function removeBlueBorder($event) {
  try {
    $event.target
      .closest('datatable-body-row')
      .style.boxShadow = 'none';
  } catch { }
}

/**
 * Remove blue border from ngx-datatble all rows
 */
export function removeAllBorders(component) {
  const rows: HTMLDivElement[] = Array.from(document.querySelectorAll(`${component} .datatable-body-row`));
  rows.forEach(row => {
    row.style.boxShadow = 'none';
  });
}

var sessionStorage_transfer = function (event) {
  if (!event) { event = window.event; } // ie suq
  if (!event.newValue) return;          // do nothing if no value to work with
  if (event.key == 'getSessionStorage') {
    // another tab asked for the sessionStorage -> send it
    localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
    // the other tab should now have it, so we're done with it.
    localStorage.removeItem('sessionStorage'); // <- could do short timeout as well.
  } else if (event.key == 'sessionStorage' && !sessionStorage.length) {
    // another tab sent data <- get it
    var data = JSON.parse(event.newValue);
    for (var key in data) {
      sessionStorage.setItem(key, data[key]);
    }
  }
};



// listen for changes to localStorage
if (window.addEventListener) {
  window.addEventListener("storage", sessionStorage_transfer, false);
} else {
};


/**
 * Sleep time expects milliseconds
*/
export function sleep (time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
