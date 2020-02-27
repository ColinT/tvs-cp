import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TwitchComponent } from './twitch.component';

const routes: Routes = [
  {
    path: '',
    component: TwitchComponent,
  },
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ],
})
export class TwitchRoutingModule {}
