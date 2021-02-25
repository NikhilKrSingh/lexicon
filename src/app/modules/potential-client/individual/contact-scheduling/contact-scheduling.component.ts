import { Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-contact-scheduling',
  templateUrl: './contact-scheduling.component.html',
  styleUrls: ['./contact-scheduling.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ContactSchedulingComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<{next?:string; current?: string}>();
  @Output() readonly prevStep = new EventEmitter<string>();

  constructor() { }
  public clientId: number;
  public attorneyDetail: any;

  ngOnInit() {
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.initialConsultAttoney) {
      this.attorneyDetail = contactDetails.initialConsultAttoney;
    }
    if (contactDetails && contactDetails.createDetails) {
      this.clientId = contactDetails.createDetails.clientId;
    }
  }

  next(event:any) {
    if (event) {
      this.nextStep.emit({next:'notes', current: 'scheduling'});
    }
  }

  prev() {
    this.prevStep.emit('attorney');
  }
  goBack(){
    this.prev();
  }

}
