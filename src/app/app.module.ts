import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { environment } from '../app/backend/environment';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 

import { LoginComponent } from './employee/login/login.component';
import { DashboardComponent } from './employee/dashboard/dashboard.component';
import { AdminDashboardComponent } from './employee/admin-dashboard/admin-dashboard.component';
import { SearchDeckComponent, LinkifyPipe } from './employee/search-deck/search-deck.component';
import { ChooseBrandComponent } from './employee/choose-brand/choose-brand.component';
import { UploadDeckComponent } from './employee/upload-deck/upload-deck.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    AdminDashboardComponent,
    SearchDeckComponent,
    ChooseBrandComponent,
    UploadDeckComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    HttpClientModule,
    FormsModule,
    LinkifyPipe
],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }