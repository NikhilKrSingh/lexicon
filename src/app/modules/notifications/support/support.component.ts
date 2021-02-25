import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { vwSupport } from '../../../../common/swagger-providers/models';
import { SupportService } from '../../../../common/swagger-providers/services';
import { ToastDisplay } from '../../../guards/toast-service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})

export class SupportComponent implements OnInit {

    public msg = new FormControl('', [Validators.required, Validators.maxLength(1000)]);
    public content = new FormControl('', [Validators.required, Validators.maxLength(4000)]);

    constructor(
        private SupService: SupportService,
        private builder: FormBuilder, 
        private toastDisplay: ToastDisplay, 
        private router: Router,
        private pagetitle: Title
        ) {  }

    ngOnInit() {
        this.pagetitle.setTitle("Support");

    }

    public supportForm: FormGroup = this.builder.group({
        msg: this.msg,
        content: this.content
    });

    public onSupportRequestSubmit() {
        let request: vwSupport = {};
        request.message = this.msg.value;
        request.content = this.content.value;

        this.msg.setValue("");
        this.content.setValue("");
        this.SupService.v1SupportPost$Json$Response({ body: request }).subscribe(s => {
            this.toastDisplay.showSuccess("Thanks for reaching out! Someone will be in touch shortly.");
            this.router.navigate(['/dashboard']);
        }, err => {
        });

    }


}
