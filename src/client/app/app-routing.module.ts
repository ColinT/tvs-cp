import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

<<<<<<< HEAD
import { OAuthModule } from './oauth/oauth.module';
import { EmulatorModule } from './emulator/emulator.module';
import { TwitchModule } from './twitch/twitch.module';

const routes: Routes = [
  {
    path: 'oauth',
    loadChildren: (): Promise<OAuthModule> => import('./oauth/oauth.module').then((m) => m.OAuthModule),
  },
  {
    path: 'emulator',
    loadChildren: (): Promise<EmulatorModule> => import('./emulator/emulator.module').then((m) => m.EmulatorModule),
  },
  {
    path: 'twitch',
    loadChildren: (): Promise<TwitchModule> => import('./twitch/twitch.module').then((m) => m.TwitchModule),
=======
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
>>>>>>> master
  },
  { path: '', redirectTo: './oauth', pathMatch: 'full' },
  { path: '**', redirectTo: '/oauth', pathMatch: 'full' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {}
