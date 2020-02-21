import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MatCheckboxModule } from '@angular/material/checkbox';

import { OAuthRoutingModule } from './oauth-routing.module';
import { OAuthComponent } from './oauth.component';

@NgModule({
  declarations: [ OAuthComponent ],
  imports: [ OAuthRoutingModule, MatCheckboxModule ],
  bootstrap: [ OAuthComponent ],
  providers: [ HttpClient ],
})
export class OAuthModule {}
