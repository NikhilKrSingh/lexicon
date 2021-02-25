import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { IEmployeeCreateStepEvent, IOffice } from 'src/app/modules/models';
import { vwDesignatedContact } from 'src/app/modules/models/vw-office-details';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper.js';
import { MiscService, OfficeService, PlacesService } from 'src/common/swagger-providers/services';
import { vwAddressDetails } from '../../../../../common/swagger-providers/models.js';
import * as errorData from '../../../shared/error.json';
import { debounceTime, finalize, map } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
  selector: 'app-basic',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss']
})

export class BasicComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<IEmployeeCreateStepEvent>();
  officeAdminForm: FormGroup;
  errorData: any = (errorData as any).default;
  isExist = false;
  titlePracticeArea: string = Constant.OfficeConstant.SelectPracticeAreas;
  retainerPracticeArea: Array<number> = [];
  practiceList: Array<IOffice> = [];
  filterName = 'Apply';
  officeStatus: Array<any> = [];
  stateList: Array<any> = [];
  phone1Blur = false;
  phone2Blur = false;
  faxBlur = false;
  zipCodeBlur = false;
  statusselected: any;
  stateselected: any;
  timeZoneselected: any;
  info: any = {};
  timeZoneDetails: {
    timeZone?: string;
    dayLightSavings?: boolean;
    timeZoneName?: string;
    timeZoneDisplayName?: string
  } = { timeZone: null, dayLightSavings: false, timeZoneName: '', timeZoneDisplayName: '' };
  officeLocation: any = {lat: null, lon: null};
  previousEnteredAddress: any = '';

  designatedContact: vwDesignatedContact;
  isDesignatedContactOther: boolean;
  selectedStateName: string;
  formSubmitted = false;
  public timeZones: any;
  stateCitySubscription: any;
  cityList: any[];
  singleState: any;
  validZipErr= false;

  constructor(
    private builder: FormBuilder,
    private officeService: OfficeService,
    private misc: MiscService,
    private placesService: PlacesService
  ) { }

  ngOnInit() {
    this.initForm();
    this.getOfficeStatus();
    this.getPractices();
    // this.getState();
    this.loadTimeZones();
    const info = UtilsHelper.getObject('office');
    this.info = info && info.basicDetails && Object.keys(info.basicDetails).length ? info.basicDetails : '';
    if (this.info) {
      this.officeAdminForm.patchValue(this.info);
      if(this.info.zipCode){
        this.getCityState(this.info.zipCode);
      }
      this.retainerPracticeArea = this.info.practiceAreaIds || [];
      this.stateselected = this.info.state ? this.info.state : '';
      this.statusselected = this.info.statusId ? this.info.statusId : '';
      this.retainerSelected(this.info.practiceAreaIds);
    }

    if (info && info.designatedContactDetails) {
      this.designatedContact = info.designatedContactDetails.contact;
      this.isDesignatedContactOther = info.designatedContactDetails.isOther;
    }
  }
  public loadTimeZones() {
    this.misc
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
        }
      });
  }

  initForm() {
    this.officeAdminForm = this.builder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      openingDate: [''],
      statusId: ['', [Validators.required]],
      acceptsInitialConsultation: [true],
      street: ['', [Validators.required]],
      address2: ['', [Validators.maxLength(100)]],
      city: [null, [Validators.required, Validators.maxLength(100)]],
      state: [null, [Validators.required]],
      zipCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(6)]],
      phone1: ['', [Validators.required, Validators.maxLength(10)]],
      phone2: ['', [Validators.maxLength(10)]],
      fax: ['', [Validators.maxLength(10)]],
      timeZone:[null, [Validators.required]]
    });
  }

  public getOfficeStatus() {
    this.officeService.v1OfficeOfficeStatusGet({}).subscribe(suc => {
      const res: any = suc;
      this.officeStatus = JSON.parse(res).results;
    });
  }

  public getPractices() {
    this.misc.v1MiscPracticesGet$Response({}).subscribe((res: any) => {
      this.practiceList = JSON.parse(res.body).results;
      if (this.info && this.info.practiceAreaIds) {
        const selections = this.info.practiceAreaIds;
        this.practiceList.forEach(item => {
          if (selections.indexOf(item.id) > -1) {
            item.checked = true;
          }
        });
      }
    });
  }

  get f() {
    return this.officeAdminForm.controls;
  }

  // public getState() {
  //   this.misc.v1MiscStatesGet$Response({}).subscribe((res: any) => {
  //     this.stateList = JSON.parse(res.body).results;
  //   });
  // }

  public retainerSelected(event) {
    this.titlePracticeArea = '';
    this.titlePracticeArea = (event && event.length) ? event.length : Constant.OfficeConstant.PracticeArea;
  }

  public onMultiSelectSelectedOptions() {
  }

  public clearFilterRetainer() {
    this.retainerPracticeArea = [];
    this.practiceList.forEach(item => (item.checked = false));
    this.titlePracticeArea = Constant.OfficeConstant.PracticeArea;
  }

  public applyFilter() { }

  public getTimeZone() {
    const addressDetails: vwAddressDetails = {};
    let addressString: string;
    addressDetails.address1 = this.officeAdminForm.get('street').value;
    addressDetails.address2 = this.officeAdminForm.get('address2').value;
    addressDetails.state = this.officeAdminForm.get('state').value;
    addressDetails.city = this.officeAdminForm.get('city').value;
    addressDetails.zipCode = this.officeAdminForm.get('zipCode').value;

    addressString = addressDetails.address1;
    if (addressDetails.address2) {
      addressString += ',' + addressDetails.address2;
    }
    addressString += ',' + addressDetails.city;
    addressString += ',' + addressDetails.state;
    addressString += ',' + addressDetails.zipCode;
    if (addressString !== this.previousEnteredAddress) {
      this.previousEnteredAddress = addressString;
      this.placesService.v1PlacesAddressAddressGet({ address: addressString }).subscribe((res: any) => {
        if (res) {
          const places = JSON.parse(res).results;
          if (places.length) {
            this.officeLocation.placeId = places[0].place_Id;
            this.placesService.v1PlacesDetailsPlaceIdGet({placeId : this.officeLocation.placeId}).subscribe((data: any) => {
              if (data) {
                const location = JSON.parse(data).results;
                if (location) {
                  this.officeLocation.lat = location.lat;
                  this.officeLocation.lon = location.lng;
                  this.placesService.v1PlacesTimezoneGet(this.officeLocation).subscribe((timezoneData: any) => {
                    this.timeZoneDetails = JSON.parse(timezoneData).results;
                  });
                }
              }
            });
          }
        }
      });
    }
  }

  public next() {
    this.formSubmitted = true;
    if (this.officeAdminForm.invalid || !this.designatedContact || !this.retainerPracticeArea.length) {
      return;
    }
    const data = { ...this.officeAdminForm.value };
    data.name = (data.name) ? data.name.trim() : '';
    if (this.retainerPracticeArea.length > 0) {
      data.practiceAreaIds = this.retainerPracticeArea;
    }
    data.openingDate = (this.officeAdminForm.value.openingDate) ?
      moment(this.officeAdminForm.value.openingDate).format(Constant.SharedConstant.DateFormat) + Constant.SharedConstant.TimeFormat : null;
    data.statusId = +data.statusId;

    // data.lat = Number(this.officeLocation.lat);
    // data.lon = Number(this.officeLocation.lon);
    // data.googlePlaceId = this.officeLocation.placeId;
    // data.timezone = this.timeZoneDetails.timeZone;

    const tmp: any = UtilsHelper.getObject('office') ? UtilsHelper.getObject('office') : {} ;
    tmp.basicDetails = data;

    if (this.designatedContact) {
      this.isDesignatedContactOther = this.designatedContact.id <= 0;

      tmp.designatedContactDetails = {
        contact: this.designatedContact,
        isOther: this.isDesignatedContactOther
      };
    }


    UtilsHelper.setObject('office', tmp);
    this.nextStep.emit({
      nextStep: 'employee',
      currentStep: 'basic',
    });
  }

  checkNumber(event) {
    const k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57 || k === 8 || k === 9);
  }

  setZipCodeBlur(event) {
    if (this.checkNumber(event)) {
      this.zipCodeBlur = false;
    }
  }

  onBlurMethod(val: any, type: string) {
    const blurKey = type + 'Blur';
    this[blurKey] = type === 'zipCode' ? this.checkZip(val) : this.isBlur(val);
  }

  private checkZip(val) {
    return !(val && val.trim().value !== '' && val.trim().length >= 5 && val.trim().length <= 7);
  }

  private isBlur(val: string | any[]) {
    return (val.length === 10) ? false : (val.length !== 0);
  }

  stateSelected() {
    this.stateList.forEach(state => {
      if (state.code === this.stateselected) {
        this.selectedStateName = state.name;
      }
    });
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription) 
          this.stateCitySubscription.unsubscribe();
      if(input.length >= 3) {
        this.validZipErr = false;
        this.stateCitySubscription =  this.placesService.v1PlacesZipcodeInputGet({input})
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if(res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if(res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) => this.stateList.push({name: state, code: res.state[index]}))
            if(res.city && res.city.length)
              this.cityList = [...res.city]
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if(this.stateList.length == 1)
              this.singleState = this.stateList[0].name;
            this.officeAdminForm.controls.state.setValue(this.stateList.length ? this.stateList[0].code : null);
            this.officeAdminForm.controls.city.setValue(this.cityList.length ? this.cityList[0] : null);
            this.stateselected = this.stateList.length ? this.stateList[0].code : null;
            this.stateSelected();
            if (!this.stateList.length || !this.cityList.length) {
              setTimeout(() => {
                this.validZipErr = true;
              }, 100)
            }
          }
        });
        return;
      }
    this.stateList = [];
    this.cityList = [];
    this.singleState = null;
    this.validZipErr = false;
    this.officeAdminForm.controls.state.setValue(null);
    this.officeAdminForm.controls.city.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }
}
