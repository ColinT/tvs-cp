import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SideBarComponent } from './side-bar/side-bar.component';

@NgModule({
  declarations: [ AppComponent, SideBarComponent ],
  imports: [ BrowserModule, AppRoutingModule, NgbModule ],
  providers: [],
  bootstrap: [ AppComponent, SideBarComponent ],
})
export class AppModule {}
