import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditEventComponent implements OnInit {

  constructor(
    private activatedRoute:ActivatedRoute
  ) { }
    public eventID:any;
  ngOnInit() {
    this.eventID=this.activatedRoute.snapshot.paramMap.get('eventId');
    this.eventID=parseInt(this.eventID);
  }

  public afterSave(event) {
  }



}
