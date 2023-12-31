import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ComponentsModule as CoreModuleComponents } from 'src/app/core/components/components.module';
import { RouterModule } from '@angular/router';
import { IgcfFormComponent } from './igcf-form/igcf-form.component';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule as SharedeModuleComponents } from 'src/app/shared/components/components.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AngularSignaturePadModule } from '@almothafar/angular-signature-pad';
import { ComponentsModule } from '../components/components.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    IgcfFormComponent,
  ],
  exports: [LoginComponent, RegisterComponent, DashboardComponent],
  imports: [
    CommonModule,
    CoreModuleComponents,
    SharedeModuleComponents,
    ComponentsModule,
    MatIconModule,
    MatInputModule,
    MatStepperModule,
    MatButtonModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AngularSignaturePadModule,
    MatButtonModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterModule,
    HttpClientModule,
  ],
})
export class PagesModule {}
