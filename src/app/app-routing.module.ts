import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AccessDeniedComponent } from './common-component/access-denied/access-denied.component';
import { LayoutComponent } from './common-component/layout/layout.component';
import { PageNotFoundComponent } from './common-component/page-not-found/page-not-found.component';
import { AuthGuard } from './guards/auth-guard.service';
import { BulkDownloadComponent } from './modules/billing/bulk-download/bulk-download.component';
import { DashComponent } from './modules/dashboard/dash/dash.component';
import { DashmainComponent } from './modules/dashboard/dashmain/dashmain.component';
import { DashGuard } from './guards/permission-guard.service';
import { ESignPopupComponent } from './common-component/e-sign-popup/e-sign-popup.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    redirectTo: 'timekeeping',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'usioowner',
    loadChildren: () =>
      import('./modules/owner-information/owner-information.module').then((m) => m.OwnerInformationModule),
  },
  {
    path: 'dashboard-main',
    canActivate: [AuthGuard],
    component: DashmainComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashComponent, canActivate: [AuthGuard,DashGuard] },
      {
        path: 'employee',
        loadChildren: () =>
          import('./modules/employee-admin/employee-admin.module').then(
            (m) => m.EmployeeAdminModule
          ),
      },
      {
        path: 'office',

        loadChildren: () =>
          import('./modules/office-admin/office-admin.module').then(
            (m) => m.officeAdminModule
          ),
      },
      {
        path: 'search',

        loadChildren: () =>
          import('./modules/search/search.module').then((m) => m.SearchModule),
      },
      {
        path: 'matter',

        loadChildren: () =>
          import('./modules/matter/matter.module').then((m) => m.MatterModule),
      },
      {
        path: 'firm',

        loadChildren: () =>
          import('./modules/firm/firm.module').then((m) => m.FirmModule),
      },
      {
        path: 'access-management',
        loadChildren: () =>
          import('./modules/access-management/access-management.module').then(
            (m) => m.AccessManagementModule
          ),
      },
      {
        path: 'client-list',

        loadChildren: () =>
          import('./modules/client/client-list/client-list.module').then(
            (m) => m.ClientListModule
          ),
      },
      {
        path: 'client-create',

        loadChildren: () =>
          import('./modules/client/creating/create-client.module').then(
            (m) => m.CreateClientModule
          ),
      },
      {
        path: 'client-view',
        loadChildren: () =>
          import('./modules/client/client-view/client-view.module').then(
            (m) => m.ClientViewModule
          ),
      },
      {
        path: 'potential-client',
        loadChildren: () =>
          import('./modules/potential-client/potential-client.module').then(
            (m) => m.PotentialClientModule
          ),
      },
      {
        path: 'contact',
        loadChildren: () =>
          import('./modules/contact/contact.module').then(
            (m) => m.ContactModule
          ),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./modules/notifications/notifications.module').then(
            (m) => m.NotificationsModule
          ),
      },
      {
        path: 'timekeeping',
        loadChildren: () =>
          import('./modules/timekeeping/timekeeping.module').then(
            (m) => m.TimekeepingModule
          ),
      },
      {
        path: 'import',
        loadChildren: () =>
          import('./modules/import/import.module').then((m) => m.ImportModule),
      },
      {
        path: 'billing',
        loadChildren: () =>
          import('./modules/billing/billing.module').then(
            (m) => m.BillingModule
          ),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./modules/calendar/calendar.module').then(
            (m) => m.CalendarModule
          ),
      },
      {
        path: 'manage-folders',
        loadChildren: () =>
          import('./modules/manage-folders/manage-folders.module').then(
            (m) => m.ManageFoldersModule
          ),
      },
      {
        path: 'trust-account',
        loadChildren: () =>
          import('./modules/trust-account/trust-account.module').then(
            (m) => m.TrustAccountModule
          ),
      },
      {
        path: 'usio',
        loadChildren: () =>
          import('./modules/usio-setup/usio-setup.module').then(
            (m) => m.UsioSetupModule
          ),
      },
      {
        path: 'billing-2',
        loadChildren: () =>
          import('./modules/billing-2/billing-2.module').then(
            (m) => m.Billing2Module
          ),
      },
      {
        path: 'accounting',

        loadChildren: () =>
          import('./modules/accounting/accounting.module').then(
            (m) => m.AccountingModule
          ),
      },
      {
        path: 'change-tenant',

        loadChildren: () =>
          import('./modules/change-tenant/change-tenant.module').then(
            (m) => m.ChangeTenantModule
          ),
      },
      {
        path: 'reporting',
        loadChildren: () =>
          import('./modules/reporting/reporting.module').then(
            (m) => m.ReportingModule
          ),
      },
      {
        path: 'access-denied',
        component: AccessDeniedComponent,
      },
      {
        path: 'page-not-found',
        component: PageNotFoundComponent,
      },
    ],
  },
  {
    path: 'dmsportal',
    loadChildren: () =>
      import('./modules/external-dms/external-dms.module').then(
        (m) => m.ExternalDmsModule
      ),
  },
  {
    path: 'd/:id/:tenantId',
    loadChildren: () =>
      import('./modules/external-dms/external-dms.module').then(
        (m) => m.ExternalDmsModule
      ),
  },
  {
    path: 'bulk-download-invoices',
    canActivate: [AuthGuard],
    component: BulkDownloadComponent,
  },
  {
    path: 'get-e-signature/:id',
    component:ESignPopupComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
