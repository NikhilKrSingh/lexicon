import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import * as errorData from 'src/app/modules/shared/error.json';

@Component({
  selector: 'app-validation-message',
  templateUrl: './validation-message.component.html',
  styleUrls: ['./validation-message.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ValidationMessageComponent implements OnInit {
  @Input() errorMessage: string;
  public errorData: any = (errorData as any).default;

  constructor() { }

  ngOnInit() {
    this.errorData.first_name_error
  }

}
