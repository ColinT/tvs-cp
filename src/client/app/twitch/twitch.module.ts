import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { GlobalAngularMaterialModule } from '../global-angular-material.module';

import { TwitchRoutingModule } from './twitch-routing.module';
import { TwitchComponent } from './twitch.component';

@NgModule({
  declarations: [ TwitchComponent ],
  imports: [ CommonModule, ReactiveFormsModule, GlobalAngularMaterialModule, TwitchRoutingModule ],
  bootstrap: [ TwitchComponent ],
  providers: [ HttpClient ],
})
export class TwitchModule {}
