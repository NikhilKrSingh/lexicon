
import { Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/Rx';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { DmsService } from 'src/common/swagger-providers/services';
import { Page } from '../../../../models/page';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-document-categories',
  templateUrl: './document-categories.component.html',
  styleUrls: ['./document-categories.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentCategoriesComponent implements OnInit {
@ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
@Output() public readonly messageEvent = new EventEmitter<any>();
public categoryList:any = [];
public page = new Page();
public pangeSelected: number = 1;
public pageSelector = new FormControl('10');
public ColumnMode = ColumnMode;
public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
public categoryForm: FormGroup;
public closeResult: string;
public errorData: any = (errorData as any).default;
public limitArray: Array<number> = [10, 30, 50, 100];
public counter = Array;
public IsExist = false;
public cat_exist: string;
public disable: boolean = false;
public loading: boolean = true;

  constructor(
     private dmsService: DmsService,
     private toastDisplay: ToastDisplay,
     private router: Router,
     private modalService: NgbModal,
     private dialogService: DialogService,
     private fb: FormBuilder ) {
      this.page.pageNumber = 0;
      this.page.size = 10;
    }

  ngOnInit() {
    this.cat_exist = this.errorData.category_already_exist;
    this.getCategories();
    this.categoryForm = this.fb.group({
      id: new FormControl(0),
      name: ['', [Validators.required]],
    });
    this.disable =false;
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }
  public getCategories(){
    this.loading = true;
    this.dmsService.v1DmsFileCategoriesGet$Response({}).subscribe(suc => {
      const res: any = suc;
      this.categoryList = JSON.parse(res.body).results;
      this.loading = false;
      this.updateDatatableFooterPage();
    }, err => {
      this.loading = false;
      console.log(err);
    });
  }
  updateDatatableFooterPage() {
    this.page.totalElements = this.categoryList.length;
    this.page.totalPages = Math.ceil(this.categoryList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }
  public resetCategoryForm(){
    this.categoryForm = this.fb.group({
      id: new FormControl(0),
      name: ['', [Validators.required]],
    });
    this.IsExist = false;
  }
  public openAddCategoryModal(content){
    this.open(content,'md');
  }
  public openEditCategoryModal(item,content){
    this.open(content,'md');
    this.categoryForm.patchValue({
      id:item.id,
      name:item.name
    });
  }
  public cancel(){
    this.resetCategoryForm();
   }

  private open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static',
        keyboard : false
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }


  public saveCategory(){
    this.validateCategory();
    if(!this.IsExist){
      this.disable = true;
      let categoryName= this.categoryForm.value.name;
      const param = { id: this.categoryForm.value.id,  name:this.categoryForm.value.name };
      this.dmsService.v1DmsCategoryInsertPost$Json$Response({body: param}).subscribe(suc => {
        const res: any = suc;
        const sucess = JSON.parse(res.body).results;
        if(sucess){
          this.modalService.dismissAll();
          this.getCategories();
          // this.showTostMessage(categoryName, 'New Category Added', 'added');
         this.toastDisplay.showSuccess(
          'The category '+categoryName+' has been added.'
        );
          this.resetCategoryForm();
        }
        else{
          this.disable = false;
          this.toastDisplay.showError(this.errorData.server_error);
        }
      }, err => {
        this.disable = false;
        console.log(err);
      });
    }
}
public updateCategory(){
  this.validateCategory();
  if(!this.IsExist){
    this.disable = true;
    let categoryName= this.categoryForm.value.name;
    const param = { id: this.categoryForm.value.id,  name:this.categoryForm.value.name };
    this.dmsService.v1DmsCategoryUpdatePut$Json$Response({body: param}).subscribe(suc => {
      const res: any = suc;
      const sucess = JSON.parse(res.body).results;
      if(sucess){
        this.modalService.dismissAll();
        this.toastDisplay.showSuccess(
          'The category '+categoryName+' has been updated.'
        );
        this.getCategories();
        this.resetCategoryForm();
      }
      else{
        this.disable = false;
        this.toastDisplay.showError(this.errorData.server_error);
      }
    }, err => {
      this.disable = false;
      console.log(err);
    });
  }
}
public deleteCategoryConfirmationModal(row, $event) {
  $event.target.closest('datatable-body-cell').blur();
  this.dialogService
    .confirm(this.errorData.delete_category_confirm, 'Yes, Delete category','Cancel','Delete Category',true)
    .then(res => {
      if (res) {
        this.deleteCategory(row);
      }
    });
}

private deleteCategory(category) {
  let categoryName= category.name;
  const param = { id: category.id };
  this.dmsService.v1DmsCategoryDeleteIdDelete$Response(param).subscribe(suc => {
    const res: any = suc;
    const sucess = JSON.parse(res.body).results;
    if(sucess){
      this.toastDisplay.showSuccess(
        'The category '+categoryName +' deleted.'
      );
      this.getCategories();
      this.resetCategoryForm();
    }
    else{
      this.toastDisplay.showError(this.errorData.server_error);
    }
  }, err => {
    console.log(err);
  });
}
public showTostMessage(categoryName, title, action){
  this.messageEvent.emit({value:true, name:categoryName,title:title, action:action})
}

public validateCategory() {
 this.IsExist = false;
 let count = this.categoryList.filter(item => {
      if(!this.categoryForm.value.id){
        return item.name == this.categoryForm.value.name;
      }
      else{
        if(item.id != this.categoryForm.value.id){
          return item.name == this.categoryForm.value.name;
        }
      }
 })
 if(count.length > 0 ){
   this.IsExist = true;
 }
 else{
   this.IsExist = false;
 }
}
trackByFn(index: number,obj: any) {
  return obj ? obj['id'] || obj : index ;
}

  get footerHeight() {
    if (this.categoryList) {
      return this.categoryList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
