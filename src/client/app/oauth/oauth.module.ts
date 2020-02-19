import { NgModule } from '@angular/core';

import { OAuthRoutingModule } from './oauth-routing.module';
import { OAuthComponent } from './oauth.component';

@NgModule({
  declarations: [ OAuthComponent ],
  imports: [ OAuthRoutingModule ],
  bootstrap: [ OAuthComponent ],
})
export class OAuthModule {}
