import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { vwAddOnService } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-add-on-service',
  templateUrl: './add-on-service.component.html',
  styleUrls: ['./add-on-service.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddOnServiceComponent implements OnInit {
  addOnServiceForm: FormGroup;

  addOnService: vwAddOnService;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.addOnServiceForm = this.fb.group({
      serviceName: ['', [Validators.required]],
      serviceAmount: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    if (this.addOnService) {
      this.addOnServiceForm.patchValue({
        serviceName: this.addOnService.serviceName,
        serviceAmount: this.addOnService.serviceAmount
      });

      this.addOnServiceForm.updateValueAndValidity();
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    if (this.addOnServiceForm.valid) {
      this.activeModal.close(this.addOnServiceForm.value);
    }
  }
}
