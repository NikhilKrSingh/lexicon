import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImportExportGuard } from 'src/app/guards/permission-guard.service';
import { DetailsComponent } from './details/details.component';
import { ImportListComponent } from './import-list/import-list.component';
import { RunImportComponent } from './run-import/run-import.component';

const routes: Routes = [
  { path: '', component: ImportListComponent, pathMatch: 'full', canActivate: [ImportExportGuard] },
  {path: 'list', component: ImportListComponent, canActivate: [ImportExportGuard]},
  {path: 'details', component: DetailsComponent, canActivate: [ImportExportGuard]},
  {path: 'run', component: RunImportComponent, canActivate: [ImportExportGuard]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImportRoutingModule { }
