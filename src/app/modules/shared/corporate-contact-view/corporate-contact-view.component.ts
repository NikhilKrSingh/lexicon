import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ClientAssociationService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';

@Component({
  selector: 'app-corporate-contact-view',
  templateUrl: './corporate-contact-view.component.html',
  styleUrls: ['./corporate-contact-view.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CorporateContactViewComponent implements OnInit, OnChanges {
  @Input() clientId: number;

  public ColumnMode = ColumnMode;
  public page = new Page();
  public corporateContactLoading = false;

  constructor(
    private clientAssociationService: ClientAssociationService,
  ) { }

  public corporateContactList: Array<any> = [];

  ngOnInit() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.getCorporateContact();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.clientId.currentValue !== this.clientId) {
      this.getCorporateContact();
    }
  }

  public getCorporateContact() {
    this.corporateContactList = [];
    this.corporateContactLoading = true;
    this.clientAssociationService
      .v1ClientAssociationClientIdGet({ clientId: this.clientId })
      .subscribe(
        suc => {
          const res: any = suc;
          let list = JSON.parse(res).results;
          list = list.filter(item => {
            return item.isPrimary || item.isBilling || item.generalCounsel
          });
          for (let i = 0; i < list.length; i++) {
            if (i === 0) {
              this.corporateContactList.push(list[i]);
            } else {
              const contact = this.corporateContactList.filter(
                (obj: { personId: any }) => obj.personId === list[i].personId
              );
              if (contact.length !== 0) {
                if (list[i].isPrimary) {
                  contact[0].isPrimary = true;
                }
                if (list[i].isBilling) {
                  contact[0].isBilling = true;
                }
                if (list[i].generalCounsel) {
                  contact[0].generalCounsel = true;
                }
              } else {
                this.corporateContactList.push(list[i]);
              }
            }
          }
          this.page.size = this.corporateContactList.length;
          this.corporateContactList = [...this.corporateContactList];
          this.corporateContactLoading = false;
        },
        err => {
          console.log(err);
          this.corporateContactLoading = false;
        }
      );
  }

}
