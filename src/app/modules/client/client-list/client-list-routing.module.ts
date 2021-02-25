import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactGuard } from 'src/app/guards/permission-guard.service';
import { ListComponent } from './list/list.component';

const routes: Routes = [
  { path: '', component: ListComponent, pathMatch: 'full' },
  { path: 'list', component: ListComponent, canActivate: [ContactGuard], data: { type: 'view' } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientListRoutingModule { }
