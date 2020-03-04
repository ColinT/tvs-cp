import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'oauth',
    loadChildren: () => import('./oauth/oauth.module').then((m) => m.OAuthModule),
  },
  {
    path: 'emulator',
    loadChildren: () => import('./emulator/emulator.module').then((m) => m.EmulatorModule),
  },
  {
    path: 'twitch',
    loadChildren: () => import('./twitch/twitch.module').then((m) => m.TwitchModule),
  },
  { path: '', redirectTo: './oauth', pathMatch: 'full' },
  { path: '**', redirectTo: '/oauth', pathMatch: 'full' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {}
