import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/pages/login/login.component';
import { DashboardComponent } from './modules/pages/dashboard/dashboard.component';
import { RegisterComponent } from './modules/pages/register/register.component';
import { IgcfFormComponent } from './modules/pages/igcf-form/igcf-form.component';
import { SubmittedFormComponent } from './modules/components/submitted-form/submitted-form.component';
import { canExitRegistrationPage } from './core/guards/canExitRegistration.guard';
import { canActivate } from './core/guards/checkAccess.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'register',
    component: RegisterComponent,
    canDeactivate: [canExitRegistrationPage],
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    // canActivate: [canActivate],
    children: [
      {
        path: '',
        redirectTo: 'submitted-forms',
        pathMatch: 'full',
        outlet: 'dashboardContent',
      },
      {
        path: 'submitted-forms',
        component: SubmittedFormComponent,
        outlet: 'dashboardContent',
      },
      {
        path: 'igcf-form/:id',
        component: IgcfFormComponent,
        outlet: 'dashboardContent',
      },
    ],
  },
  { path: '**', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
