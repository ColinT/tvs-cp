import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [ AppComponent, SideBarComponent ],
  imports: [ BrowserModule, AppRoutingModule, NgbModule, HttpClientModule, BrowserAnimationsModule ],
  providers: [],
  bootstrap: [ AppComponent, SideBarComponent ],
})
export class AppModule {}
