import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrustAccountGuard } from 'src/app/guards/permission-guard.service';
import { SettingComponent } from './setting/setting.component';

const routes: Routes = [
  { path: '', component: SettingComponent, pathMatch: 'full', canActivate: [TrustAccountGuard] },
  {path: 'setting', component: SettingComponent, canActivate: [TrustAccountGuard]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrustAccountRoutingModule { }
