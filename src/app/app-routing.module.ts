import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './employee/login/login.component';
import { DashboardComponent } from './employee/dashboard/dashboard.component';
import { AuthGuard } from './backend/auth.guard';
import { AdminGuard } from './backend/admin.guard';
import { BrandGuard } from './backend/brand-guard';
import { AdminDashboardComponent } from './employee/admin-dashboard/admin-dashboard.component';
import { SearchDeckComponent } from './employee/search-deck/search-deck.component';
import { ChooseBrandComponent } from './employee/choose-brand/choose-brand.component';
import { UploadDeckComponent } from './employee/upload-deck/upload-deck.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'search-deck', component: SearchDeckComponent, canActivate: [AuthGuard] },
  { path: 'choose-brand', component: ChooseBrandComponent, canActivate: [AuthGuard, BrandGuard] },
  { path: 'upload-deck', component: UploadDeckComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
