import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { GlobalAngularMaterialModule } from '../global-angular-material.module';

import { OAuthRoutingModule } from './oauth-routing.module';
import { OAuthComponent } from './oauth.component';

@NgModule({
  declarations: [ OAuthComponent ],
  imports: [ CommonModule, ReactiveFormsModule, GlobalAngularMaterialModule, OAuthRoutingModule ],
  bootstrap: [ OAuthComponent ],
  providers: [ HttpClient ],
})
export class OAuthModule {}
