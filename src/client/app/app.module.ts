import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { GlobalAngularMaterialModule } from './global-angular-material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SideBarComponent } from './side-bar/side-bar.component';

@NgModule({
  declarations: [ AppComponent, SideBarComponent ],
  imports: [
    BrowserModule,
    RouterModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    GlobalAngularMaterialModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [ AppComponent, SideBarComponent ],
})
export class AppModule {}
