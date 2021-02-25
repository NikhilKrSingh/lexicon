import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { AccountingGuard } from 'src/app/guards/permission-guard.service';
import { AccountingTransferQueueComponent } from './transfer-queue/accounting-transfer-queue/accounting-transfer-queue.component';
import { NewTrustTransferComponent } from './transfer-queue/new-trust-transfer/new-trust-transfer.component';
import { ReviewTrustTranferComponent } from './transfer-queue/review-trust-tranfer/review-trust-tranfer.component';

const routes: Routes = [
  {path: 'transfer-queue', component: AccountingTransferQueueComponent, canActivate: [AccountingGuard]},
  { path: 'new-trust-transfer', component: NewTrustTransferComponent, canActivate: [AccountingGuard], canDeactivate: [BackButtonRouteGuard] },
  {path: 'review-trust-transfer', component: ReviewTrustTranferComponent, canActivate: [AccountingGuard], canDeactivate: [BackButtonRouteGuard]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountingRoutingModule { }
