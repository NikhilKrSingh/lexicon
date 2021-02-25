import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-display-reverse-charge',
  templateUrl: './display-reverse-charge.component.html',
  styleUrls: ['./display-reverse-charge.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DisplayReverseChargeComponent implements OnInit {

  public displayChargeForm: FormGroup = this.fb.group({
    billNarrative: [null, Validators.required],
    noteToFile: [null, Validators.required],
    visibleToClient: [false, Validators.required],
    nextInvoicePreference: ['lump sum']
  });
  submitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    public modalService: NgbActiveModal,
  ) { }

  ngOnInit() {
  }

  close() {
    this.modalService.close(null);
  }

  save() {
    this.submitted = true;
    if (this.displayChargeForm.invalid) {
      return;
    }
    this.modalService.close(this.displayChargeForm.value);
  }

    /**
   * Function to copy Billing Narative to Notes
   */
  public copytoNote() {
    if (!this.displayChargeForm.value.noteToFile || this.displayChargeForm.value.noteToFile.trim() === '') {
      this.displayChargeForm.patchValue({
        noteToFile: this.displayChargeForm.value.billNarrative
      });
    }
  }

}
