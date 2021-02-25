import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CalendarService, MiscService, WorkFlowService } from 'src/common/swagger-providers/services';
import { SharedService } from '../sharedService';

enum AssigneRoles {
  LawOfficeAdmin = 1,
  FundingCordinator = 2,
  Attorney = 3,
  ClientServiceCoordinator = 4,
  ParaLegal = 5
}
@Component({
  selector: 'app-task-builder',
  templateUrl: './task-builder.component.html',
  styleUrls: ['./task-builder.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TaskBuilderComponent implements OnInit, OnDestroy {
  @Input() matterId: number;
  @Input() type: string;
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  modalOptions: NgbModalOptions;
  closeResult: string;

  public statusList:any;
  public taskSttusList:any;
  public estateList:any;
  public mattertasksList:any;
  public workflowEstateList:any;
  private oriMatterSubTaskList:Array<any>=[];
  public taskFilterList = [{id:1, name:"View all tasks"},{id:2, name:"View all incomplete tasks"},{id:3, name:"View all completed tasks"}]
  public taskFilterSelection: Array<number>=[];
  public compleStatusId:number;
  public compleTaskStatusId:number;
  public currentStepId:number;
  public nextSteps:any;
  public selectedStep:number;
  public selectedStepName:number;
  public selectedId: number;
  public linearWorkFlowArray:Array<any>=[];
  public workflowAdditionalInfo:any;
  public selectedAssignee:any = {};
  public selectedAssigneeId:number;
  public selectedEvent:any;
  public assigneList:Array<any> = [];
  public eventList: Array<any> = [];
  public previewTasksArray: Array<any>;
  public oripreviewTasksArray: Array<any>;
  public sleectedEventDetails: any;
  public isInitialStep:boolean = true;
  public markCompleteStepId:number;
  public isAllStepCompleted: boolean = false;
  public isLastStepCompleted: boolean = false;
  public assigneeInfo: any;
  public lawofficeadminList: Array<any> =[];
  public fundingcordinatorList: Array<any> =[];
  public attorneyassigneeList: Array<any> =[];
  public clientservicecoordinatorList: Array<any> =[];
  public paralegalList: Array<any> =[];
  public selectedLawOfficeAdminId:number;
  public selectedFundingCordinatorId:number;
  public selectedClientServiceCoordinatorId: number;
  public selectedParaLegalId: number;
  private userDetails:any;
  public localTimeZone: any;
  public timeZoneList: Array<any> =[];
  public notStartedStatusId: number;
  public inprogressStatusId: number;
  public noPreviewTasksForStep: boolean = false;
  public isFundingCordRequired: boolean = false;
  public loading = false;
  public eventType: string = null;

  public selectedCalendarMeetingId: number = null;
  public multipleEventsForStep: boolean = false;
  public isCalendarEventRequired: boolean = false;

  public workFlowMonth;

  public selected_events_Details_array: Array<any> =[];
  public assignee_roles_array: Array<any> =[];
  public selected_assignes_array: Array<any> =[];
  private statusSubscription: any;
  public AdditionalInfoLoading: boolean;
  constructor(private modalService: NgbModal,
    private http:HttpClient,
    private workflowService: WorkFlowService,
    private toastr: ToastDisplay,
    private miscService: MiscService,
    private calendarService: CalendarService,
    private sharedService: SharedService) { }

  ngOnInit() {
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: "right",
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true,
      alwaysPreventDefaultScroll: false
    }
    this.getMatterTasks();
    this.statusSubscription = this.sharedService.taskBuilderStatuses$.subscribe(val=> {
      if(val){
        this.taskSttusList = val.workFlowTaskStatuses;
        this.statusList = val.workFlowStatuses;
        this.getStatuses();
        this.getTaskStatuses();
      }
    });
  }

  ngOnDestroy(){
    if(this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
  /*
  *Function to open modals
  */
  openPersonalinfo(content: any, className, winClass) {
    this.modalService.dismissAll();
    this.modalService
      .open(content, {
        size: className,
        windowClass:winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.selectedId = null;
          this.closeResult = this.getDismissReason(reason);
          if(this.closeResult){
            this.noPreviewTasksForStep = false;
            this.selectedEvent=this.selectedStep=null;
            this.selectedAssigneeId=null;
            this.selectedLawOfficeAdminId=null;
            this.selectedFundingCordinatorId=null;
            this.selectedClientServiceCoordinatorId = null;
            this.selectedParaLegalId = null;
            this.selectAssignee(null);
            this.attorneyassigneeList = this.lawofficeadminList = this.fundingcordinatorList = this.clientservicecoordinatorList = this.paralegalList =[];
            this.assignee_roles_array = this.selected_events_Details_array = []
          }
        }
      );
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return reason;
    }
  }


  /*
  *Function to fetch the current tasks for the matters
  */
  getMatterTasks(){
    this.loading = true;
    this.workflowService.v1WorkFlowMattertasksMatterIdGet$Response({matterId:this.matterId}).subscribe((res:any)=>{
      this.mattertasksList=JSON.parse(res.body).results.allTasks;
      this.processMatterTasks();
      this.loading = false;
    },err=>{
      this.loading = false;
    });
  }

  /**
   * Process matter tasks Data
   */
  processMatterTasks(){
    if(this.mattertasksList.length > 1 || this.mattertasksList[0].status!='NotStarted'){
      this.isInitialStep = false;
    }
    let currentStep:number = this.mattertasksList[0].workFlowId, executionIndex=this.mattertasksList[0].executionIndex ;
    this.mattertasksList.sort(function(a,b){return b.executionIndex - a.executionIndex });
    this.mattertasksList.forEach((obj, index)=>{
      this.mattertasksList[index]["showSubTasks"]=false;
      this.oriMatterSubTaskList[index]=this.mattertasksList[index].tasks;
      this.taskFilterSelection[index]=1;
      if(obj.executionIndex > executionIndex){
        currentStep=obj.workFlowId;
        executionIndex= obj.executionIndex;
      }
    });
    if(this.mattertasksList.some(obj => obj.status != 'Completed') && this.mattertasksList[0].status!='NotStarted'){
      this.isAllStepCompleted = false;
    }else{
      this.isAllStepCompleted=true;
    }
    if(this.isAllStepCompleted && this.mattertasksList.some(obj => obj.isLast == true)){
      this.isLastStepCompleted=true
    }else{
      this.isLastStepCompleted=false;
    }
    this.currentStepId=currentStep;
    this.checkCompletedSubtasks();
  }

  /*
  *Function to fetch the stuaus list
  */
  async getStatuses(){
      let row = this.statusList.filter(obj => obj.name.toLowerCase()==='completed');
      this.compleStatusId=row[0].id;
      row = this.statusList.filter(obj => obj.name.toLowerCase() === 'inprogress');
      this.inprogressStatusId = row[0].id;
      row = this.statusList.filter(obj => obj.name.toLowerCase() === 'notstarted');
      this.notStartedStatusId = row[0].id;
  }

  /*
  *Function to fetch the Workflow estate step list
  */
  getWorkFlowEstates(templateContent?:any){
    this.loading = true;
    this.linearWorkFlowArray=[];
    this.workflowService.v1WorkFlowEstateMatterIdGet$Response({matterId:this.matterId}).pipe(finalize(() => {
      this.loading = false;
    }))
    .subscribe((res:any)=>{
      this.workflowEstateList = JSON.parse(res.body as any).results;
      let data = this.workflowEstateList.nodes, incompleteStepIndex:number=-1;
      data.forEach((obj, index)=>{
        if(obj.workFlowStatusId == this.inprogressStatusId){
          obj['isCurrentStep']=true;
          incompleteStepIndex=index;
        }
      });
      if(incompleteStepIndex != -1){// used -1 because 0 can also be the index
        let childs = data.filter(obj => obj.parentId == data[incompleteStepIndex].id);
        childs.sort((a,b) => {
          let aId = a.cloneParentId ? a.cloneParentId : a.id;
          let bId = b.cloneParentId ? b.cloneParentId : b.id; 
          return aId - bId;
        });
        if (childs && childs.length > 0) {
          childs.map((item) => {
            item['isArrowHide'] = true;
          })
        }
        data[incompleteStepIndex].children = childs;
      }
      data = data.filter(obj=> obj.workFlowStatusId != this.notStartedStatusId);
      data.sort(function(a,b){return a.executionIndex - b.executionIndex });
      this.linearWorkFlowArray= data;
      this.openPersonalinfo(templateContent,'','modal-lmd');
    },err=>{
    });
  }

  /*
  *Function to filter the sub task of the main tasks
  */
  filterSubtasks(event:any,i:number){
    if(event && (event.id==2 || event.id==3)){
      let selection=event.id;
      if(selection==2){
        this.mattertasksList[i].tasks=this.oriMatterSubTaskList[i].filter(obj=> obj.taskStatusId !== this.compleTaskStatusId);
      }
      if(selection==3){
        this.mattertasksList[i].tasks=this.oriMatterSubTaskList[i].filter(obj=> obj.taskStatusId === this.compleTaskStatusId);
      }
      this.checkCompletedSubtasks();
    }else{
      setTimeout(()=>{
        this.mattertasksList[i].tasks=this.oriMatterSubTaskList[i];
        this.taskFilterSelection[i]=1;
        this.checkCompletedSubtasks();
      },50);
    }
  }

  /*
  *Function to chek the completed sub tasks of the main tasks
  */
  checkCompletedSubtasks(){
    this.mattertasksList.forEach((obj, index)=>{
        let completedTasks=0;
        if(this.mattertasksList[index].tasks.length){
        this.mattertasksList[index].tasks.forEach(obj=>{
          if(obj.taskStatusId===this.compleTaskStatusId){
            completedTasks++;
          }
        });
      }
      this.mattertasksList[index]["completedTasks"]=completedTasks;
      });
  }

  /*
  *Function to fetch task status list
  */
  async getTaskStatuses(){
      let row = this.taskSttusList.filter(obj => obj.name.toLowerCase() === 'completed');
      this.compleTaskStatusId= row[0].id;
  }


  /*
  *Function to open warning Modal if there are incomplete tasks in the step
  */
  openWarningModal(content, SelectStepContent, BeginNextStepContent , markCompleteStepId?:number){
    let isAllTasksCompleted:boolean=true, index:number;
    this.markCompleteStepId =markCompleteStepId;

    this.mattertasksList.forEach((obj, i) =>{
      if(obj.workFlowId ==  this.markCompleteStepId){
        index=i;
      }
    });
    if(this.oriMatterSubTaskList[index].length){
      this.oriMatterSubTaskList[index].map(obj=>{
        if(obj.taskStatusId!==this.compleTaskStatusId){
          isAllTasksCompleted=false;
        }
      })
    }
    if(!isAllTasksCompleted){
      this.openPersonalinfo(content,'','');
    }else{
      this.markTaskAsComplete(markCompleteStepId);
    }
  }

  /**
  *Function to mark Task as complete
  */
  markTaskAsComplete(selectedStep?:number){
    let data = {
      workflowId: (selectedStep) ? selectedStep : (this.markCompleteStepId && !this.isInitialStep) ? this.markCompleteStepId : this.currentStepId,
      matterId: this.matterId
      };
      this.loading=true;
      this.workflowService.v1WorkFlowCompleteMatterIdWorkflowIdPost(data).subscribe(res=>{
        this.loading = false;
        this.getMatterTasks();
        this.modalService.dismissAll();
        this.markCompleteStepId = null;
        this.noPreviewTasksForStep=false;
        this.selectedStep=null;
        },err=>{
          this.loading = false;
      });
    }

  /*
  *Function to get the next steps
  */
 getNextStep(SelectNextStep, BeginNextStepContent?:any,NoEventsTemplate ?:any, currentStepId?:number, PreviewTaskTemplate?: any){
    if(this.isInitialStep){
      this.getAssigneeList(BeginNextStepContent, NoEventsTemplate, PreviewTaskTemplate);
      return;
    }
    this.loading = true;
    let data= {
      currentWorkFlowId: this.currentStepId,
      matterId: this.matterId
    };
    this.workflowService.v1WorkFlowNextMatterIdCurrentWorkFlowIdGet(data).subscribe(res=>{
      let list = JSON.parse(res as any).results;
      list.sort((a,b) => {
        let aId = a.cloneParentId ? a.cloneParentId : a.id;
        let bId = b.cloneParentId ? b.cloneParentId : b.id; 
        return aId - bId;
      });
      this.nextSteps = list;
      
      this.openPersonalinfo(SelectNextStep, '', '');
      this.loading = false;
    },err=>{
      this.loading = false;
    })
  }

  /*
  *Function triggered when we click on the step history
  */
  clickProgressStep(event:any, item:any){
    this.workflowAdditionalInfo=null;
    if(this.selectedId && this.selectedId == item.id){
        this.selectedId=null;
      }else{
      this.selectedId=item.id;
      }
    if(item.workFlowStatusId == this.compleStatusId){
        if(this.selectedId){
          this.getAdditionalInfo(item.id);
          this.AdditionalInfoLoading = true;
        }
        item.showInfo = this.selectedId ? true: false;
      }else{
      item.showChild = this.selectedId ? true: false;
      }
  }


  /*
  *Function to get Additional info for completed step
  */
  getAdditionalInfo(workflowId:number){
    let data={
      matterId: this.matterId,
      workFlowId: workflowId
    }
    this.workflowService.v1WorkFlowWorkFlowStepMatterIdWorkFlowIdGet$Response(data).subscribe(res=>{
      const info = JSON.parse(res.body as any).results.workFlowHistory;
      this.workflowAdditionalInfo = info[0];
      let completerDate  = this.workflowAdditionalInfo.completer.date+'Z';
      let initiatorDate  = this.workflowAdditionalInfo.initiator.date+'Z';
      this.workflowAdditionalInfo.completer.date = new Date(completerDate);
      this.workflowAdditionalInfo.initiator.date = new Date(initiatorDate);
      this.workFlowMonth = this.workflowAdditionalInfo.initiator.date.getMonth();
      this.AdditionalInfoLoading = false;
    },err=>{
    })
  }

  /*
  *Function to get the Assignee list for next step
  */
  getAssigneeList(templateContent:any, NoEventsTemplate?:any, PreviewTasksTemplate?:any){
    let data = {
      matterId: this.matterId,
      workflowId: this.isInitialStep ? this.currentStepId : this.selectedStep
    }
    this.loading = true;
    this.workflowService.v1WorkFlowTasksAssigneeOptionsGet$Response(data).subscribe(res=>{
      const list = JSON.parse(res.body as any).results;
      //For Assigning the step name
      if(this.isInitialStep){
        this.selectedStepName = this.mattertasksList[0].workFlowTaskName
      }else{
        let row = this.nextSteps.filter(obj => obj.id === this.selectedStep);
        this.selectedStepName = row[0].displayName;
      }
      list.assigneeOptions.forEach(item => {
        item.name = (item.name || '').trim();
      });
      this.assignee_roles_array = list.requiredAssigneeRoles;
      //For Assignees
      if(list.requiredAssigneeRoles && list.requiredAssigneeRoles.length){
        //Law office amin
        if(list.requiredAssigneeRoles.some(obj => obj.id == AssigneRoles.LawOfficeAdmin)){
          this.lawofficeadminList = list.assigneeOptions;
        }

        //funding cordinator
        if(list.requiredAssigneeRoles.some(obj => obj.id == AssigneRoles.FundingCordinator)){
          this.fundingcordinatorList = list.assigneeOptions;

          let row = list.requiredAssigneeRoles.filter(obj => obj.id == AssigneRoles.FundingCordinator);//for marking required/optional
          if(row && row.length){
            row = row[0];
            this.isFundingCordRequired = (row.taskRequiredModeId==1) ? true : false;
          } else {
            this.isFundingCordRequired = false;
          }
        }

        //Attorneys
        if(list.requiredAssigneeRoles.some(obj => obj.id == AssigneRoles.Attorney)){
          this.attorneyassigneeList = list.attorneys;
          this.attorneyassigneeList.forEach(item => {
            item.name = (item.name || '').trim();
          });
        }
        if(this.attorneyassigneeList && this.attorneyassigneeList.some(obj=> obj.type == (this.type !== 'matter') ? 'Consult Attorney' : 'Responsible Attorney')){
          let row = this.attorneyassigneeList.filter(obj => obj.type == (this.type !== 'matter') ? 'Consult Attorney' : 'Responsible Attorney' );
          this.selectedAssigneeId = row[0].id;
          this.selectAssignee(row[0], 'Attorney');
        }else{
          this.selectedAssigneeId = null;
        }

        //Client Service Provider
        if(list.requiredAssigneeRoles.some(obj => obj.id == AssigneRoles.ClientServiceCoordinator)){
          this.clientservicecoordinatorList = list.assigneeOptions;
        }

        //Para lega
        if(list.requiredAssigneeRoles.some(obj => obj.id == AssigneRoles.ParaLegal)){
          this.paralegalList = list.assigneeOptions;
        }
      this.getEvents(templateContent, NoEventsTemplate);
    }else{
      this.noPreviewTasksForStep=true;
      this.openPersonalinfo(PreviewTasksTemplate,'','');
    }
    setTimeout(() => {
      this.loading = false;
    }, 3000);
    },err=>{
      this.loading = false;
    });
  }

  /*
  *Function to get the event list for next step
  */
  getEvents(BeginNextStep:any, NoEventsTemplate?:any, PreviewTasksTemplate?:any){
    let data ={
      matterId: this.matterId,
      workflowId: this.isInitialStep ? this.currentStepId : this.selectedStep
    }
    this.loading = true;
    this.selected_events_Details_array = []
    this.workflowService.v1WorkFlowScheduledTasksGet$Response(data).subscribe(res=>{
      const events = JSON.parse(res.body as any).results;
      this.isCalendarEventRequired = events.isCalendarEventRequired;
      if(this.isCalendarEventRequired){
        if(events.matterEventType) {
          this.eventType = events.matterEventType;
        }
        this.eventList = events.workflowScheduledTasks;
        this.eventList.forEach(obj=>{
          let eventDate = obj.eventDueDate;
          obj.eventDueDate = moment.utc(eventDate).local().format('YYYY-MM-DD[T]HH:mm:ss');
        })
        if(!this.eventList.length && events.isCalendarEventRequired){
          this.openPersonalinfo(NoEventsTemplate,'','');
          return;
        }
          let calendarMeetingList = events.worklflowTaskCalendarEventDetails
            && events.worklflowTaskCalendarEventDetails.length ? [...events.worklflowTaskCalendarEventDetails] : [];
          if(calendarMeetingList.every(x => x.calendarEventSubTypeName == null)){
           let singleCalendar = calendarMeetingList[0];
           singleCalendar.calendarEventSubTypeName = "Event-1";
           singleCalendar.calendarEventTypeName = (singleCalendar.calendarEventTypeName) ? singleCalendar.calendarEventTypeName : events.matterEventType
           let temp = [singleCalendar]
           calendarMeetingList = temp;
          } else {
            calendarMeetingList = _.filter(calendarMeetingList, item => item.calendarEventSubTypeName);
          }
          calendarMeetingList = _.uniqBy(calendarMeetingList, x => x.calendarEventSubTypeName);
          this.multipleEventsForStep = (calendarMeetingList.length > 1) ? true : false;
          this.selectedCalendarMeetingId = calendarMeetingList.length === 1 ? calendarMeetingList[0].calendarEventId : null;
          calendarMeetingList.forEach(event => {
            event['requiredAssignees'] = this.assignee_roles_array.map(role => {
              role["selectedAssigneId"] = null;
              role["selectedAssigne"] = {};
              role['isAssigneeRequired'] = (role.taskRequiredModeId==1) ? true : false;
              let list = [];
              switch(role.id){
                case 1:
                  list = this.lawofficeadminList;
                  break;
                case 2:
                  list = this.fundingcordinatorList;
                  break;
                case 3:
                  list = this.attorneyassigneeList;
                  let row = list.filter(obj => obj.type == (this.type !== 'matter') ? 'Consult Attorney' : 'Responsible Attorney' );
                  let attorneyDetails = list.find(x => x.id == row[0].id);
                  role.selectedAssigneId = row[0].id;
                  role.selectedAssigne = attorneyDetails;
                  break;
                case 4:
                  list = this.clientservicecoordinatorList;
                  break;
                case 5:
                  list = this.paralegalList;
                  break;
              }
              role['assigneeList'] = list;
              role['displayName'] = _.startCase(role.name);
              return role;
            })
            if(this.eventList && this.eventList.some(x  => x.eventTypeName == event.calendarEventTypeName)){
              event['eventsList'] = this.eventList.filter(x => x.eventTypeName == event.calendarEventTypeName);
            } else if(this.eventList && this.eventList.length && !this.eventList.some(x  => x.eventTypeName == event.calendarEventTypeName)){
              event['eventsList'] = this.eventList;
            } else {
              event['eventsList'] = [];
            }
            event['selectedEventId'] = null;
            this.selected_events_Details_array.push(_.cloneDeep(event));
          });
          let showNoEventPopup: boolean = false;
          this.selected_events_Details_array.forEach(event => {
            if(!event.eventsList.length){
              if(event.calendarEventTypeName){
                this.eventType = event.calendarEventTypeName;
              }
              showNoEventPopup = true;
            }
          })
        if(showNoEventPopup || (!this.eventList.length && events.isCalendarEventRequired)){
          this.openPersonalinfo(NoEventsTemplate,'','');
          return;
        }
      }
      this.openPersonalinfo(BeginNextStep,'','');
      this.loading = false;
    },err=>{
      this.loading = false;
    })
  }

  /*
  *Function triggered when we select the assigne from dropdown
  */
  selectAssignee(event:any, type?:string){
    setTimeout(()=>{
      if(event){
        switch(type){
          case 'Attorney':
            this.selectedAssignee['attorney'] = event;
            break;
          case 'lawOfficeAdmin':
            this.selectedAssignee['lawOfficeAdmin'] = event;
            break;
          case 'Funding_Cordinator':
            this.selectedAssignee['FundingCordinator'] = event;
            break;
          case 'Client_Service_Coordinator':
            this.selectedAssignee['clientserviceprovider'] = event;
            break;
          case 'Para_Legal':
            this.selectedAssignee['paralegal'] = event;
            break;
        }
    }else{
      this.selectedAssignee.attorney = null;
      this.selectedAssignee.lawOfficeAdmin = null;
      this.selectedAssignee.FundingCordinator = null;
      this.selectedAssignee.clientserviceprovider = null;
      this.selectedAssignee.paralegal = null;
    };
  },100);
  }

  /*
  *Function to fetch the list of previewe tasks
  */
  previewTasks(templateContent?:any){
    let data={
      matterId: this.matterId,
      nextWorkflowId: this.isInitialStep ? this.currentStepId : this.selectedStep,
    };
    let row = this.eventList.filter(obj => obj.id === +this.selectedEvent);
    this.sleectedEventDetails = row[0];
    this.loading = true;
    this.workflowService.v1WorkFlowTasksAssignmentsPreviewMatterIdNextWorkflowIdGet$Response(data).subscribe(res=>{
      this.previewTasksArray = JSON.parse(res.body as any).results;
      this.previewTasksArray.forEach(obj=>{
        obj.assigneeId = (this.isCalendarEventRequired) ? this.getAssignedTonameForEvents(obj, 'id') : this.getAssinedToName(obj, 'id');
        let  date = (obj.dueDaysCalculatorBasedOnEventName == 'CalendarEvent' ) ? this.getEventDateForTasks(obj) : obj.rawDueDateUTC;
        let dueDate = moment(date).format('YYYY-MM-DD') + 'T' + moment(date).format('HH:mm:ss') + '.000Z';
        let calculatedDueDate = moment(dueDate, 'YYYY-MM-DD').add(obj.dueDateOffset, obj.dueDateOffsetUnit);
        obj.calculatedDueDate = moment(calculatedDueDate).format('YYYY-MM-DD')+ 'T' + moment(date).format('HH:mm:ss');
        obj.assignToName = this.isCalendarEventRequired ? this.getAssignedTonameForEvents(obj, 'name') : this.getAssinedToName(obj, 'name');
      });
      this.oripreviewTasksArray = this.previewTasksArray;
      let shouldfilterPreviewTasks: boolean = false;
      if(this.isCalendarEventRequired){
        this.selected_events_Details_array.forEach(event => {
          event.requiredAssignees.forEach(element => {
            if(!element.selectedAssigneId && !element.isAssigneeRequired && element.id == AssigneRoles.FundingCordinator){
              shouldfilterPreviewTasks = true;
            }
          });
        })
      } else {
        if(!this.isCalendarEventRequired && this.fundingcordinatorList && this.fundingcordinatorList.length && !this.selectedFundingCordinatorId && !this.isFundingCordRequired ){
          shouldfilterPreviewTasks = true;
        }
      }
      if(shouldfilterPreviewTasks){
        this.previewTasksArray = this.previewTasksArray.filter(obj => obj.taskRequiredModeId ==1);
      }
      this.openPersonalinfo(templateContent,'','modal-lmd');
      this.loading = false;
    },err=>{
      this.loading = false;
    })
  }

  /*
  *Function to finalize and assign the tasks
  */
  assignTasks(){
    let taskToAssign =[];
    this.oripreviewTasksArray.forEach(obj=>{
      let taskInfo ={
      taskId: obj.taskId,
      calculatedDueDate: `${obj.calculatedDueDate}.000Z`,
      assigneeId: obj.assigneeId,
      taskRequiredModeId: obj.taskRequiredModeId,
      taskVisibilityModeId: (obj.assigneeRoleId==2 && obj.taskRequiredModeId==2 && !obj.assigneeId) ? 2 : 1,
      taskStatusId: (obj.assigneeRoleId==2 && obj.taskRequiredModeId==2 && !obj.assigneeId) ? 8 : 2
      };
      taskToAssign.push(taskInfo);
    })
    let data = {
      matterId: this.matterId,
      nextWorkflowId:this.isInitialStep ? this.currentStepId : this.selectedStep,
      taskToAssign:taskToAssign
    };
    this.loading = true;
    this.workflowService.v1WorkFlowTasksFinalizeassignmentsPost$Json({body : data}).subscribe(res=>{
      this.modalService.dismissAll();
      this.selectedStep = this.selectedAssigneeId = this.selectedStepName = this.sleectedEventDetails = this.selectedEvent = null;
      this.fundingcordinatorList = this.lawofficeadminList = this.attorneyassigneeList = this.clientservicecoordinatorList = this.paralegalList = [];
      this.selectedLawOfficeAdminId = this.selectedFundingCordinatorId = this.selectedParaLegalId = this.selectedClientServiceCoordinatorId = null;
      this.isFundingCordRequired = false;
      this.assignee_roles_array = this.selected_events_Details_array = []
      this.selectAssignee(null);
      // this.loading = true;
      this.getMatterTasks();
    },err=>{
      this.loading = false
    })
  }

  getAssinedToName(task:any, choice?:string){
    let name:any;
    switch(task.assigneeRoleId){
      case 1:
        name = (choice == 'id') ? this.selectedAssignee.lawOfficeAdmin.id : this.selectedAssignee.lawOfficeAdmin.name;
        break
      case 2:
        if(this.selectedAssignee.FundingCordinator && this.selectedAssignee.FundingCordinator.id){
          name = (choice == 'id') ? this.selectedAssignee.FundingCordinator.id : this.selectedAssignee.FundingCordinator.name;
        }else{
          name = (choice == 'id') ? 0 : null;
        }
        break;
      case 3:
        name = (choice == 'id') ? this.selectedAssignee.attorney.id : this.selectedAssignee.attorney.name;
        break;
      case 4:
        name = (choice == 'id') ? this.selectedAssignee.clientserviceprovider.id : this.selectedAssignee.clientserviceprovider.name;
        break;
      case 5:
        name = (choice == 'id') ? this.selectedAssignee.paralegal.id : this.selectedAssignee.paralegal.name;
        break;
    }
    return name;
  }

  private loadTimeZones() {
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZoneList = res;
          this.loadCalendarSettings();
        }
      });
  }

  private loadCalendarSettings() {
    this.calendarService
      .v1CalendarPersonIdGet$Response({ personId: this.userDetails.id })
      .subscribe(
        res => {
           let data = JSON.parse(res.body as any).results[0]
          let localTimezone = this.timeZoneList.filter(obj => obj.id == data.timeZoneId);
          this.localTimeZone = localTimezone[0];
        },err=>{
        });
  }
  customSearchFn(term: string, item: any)
  {
    return (item.name || '').replace(/[, ]+/g, ' ').toLowerCase().includes((term || '').replace(/[, ]+/g, ' ').toLocaleLowerCase()) || (item.name || '').split(',').reverse().join(' ').toLowerCase().includes((term || '').replace(/[, ]+/g, ' ').toLocaleLowerCase());
  }

  selectAssigneeForEvent(event, role, eventIndex, roleIndex){
    this.selected_events_Details_array[eventIndex].requiredAssignees[roleIndex].selectedAssigne = event;
  }

  getAssignedTonameForEvents(task: any, choice?:any){
    let eventDetails = this.selected_events_Details_array.find(x => x.taskId == task.taskId);
    let name: any;
    if(!eventDetails){
      eventDetails = this.selected_events_Details_array[0];
    }
    let roleDetails = eventDetails.requiredAssignees.find(x => x.id == task.assigneeRoleId);
    if(roleDetails){
      name = (choice=='name') ? roleDetails.selectedAssigne.name : roleDetails.selectedAssigne.id
    }
    return name;
  }

  getEventDateForTasks(task){
    let eventDetails = this.selected_events_Details_array.find(x => x.taskId == task.taskId);
    if(!eventDetails){
      eventDetails = this.selected_events_Details_array[0];
    }
    const selectedEventId = +eventDetails.selectedEventId;
    let eventDate: any = eventDetails.eventsList.find(x => x.id == selectedEventId);
    return eventDate.eventDueDate;
  }

  get checkBeginNextStepValid(){
    let isValid= true;
    if(!this.selected_events_Details_array){
      return false;
    }
    this.selected_events_Details_array.forEach(event => {
      event.requiredAssignees.forEach(element => {
        if(element.isAssigneeRequired && !element.selectedAssigneId){
          isValid = false;
        }
      });
      if(!event.selectedEventId){
        isValid = false;
      }
    });
    return isValid;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
