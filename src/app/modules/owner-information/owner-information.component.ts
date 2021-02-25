import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsioService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-owner-information',
  templateUrl: './owner-information.component.html',
  styleUrls: ['./owner-information.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class OwnerInformationComponent implements OnInit {

  public loading: boolean = false;
  public params: {bankAccountId?: number; email?: string;} = null;
  constructor(
    private usioService: UsioService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(param => {
      this.params = {
        bankAccountId: +param.Id,
        email: param.email
      }
    })
  }
}
