import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: './oauth', pathMatch: 'full' },
  { path: '**', redirectTo: '/oauth', pathMatch: 'full' },
  {
    path: 'oauth',
    loadChildren: () => import('./oauth/oauth.module').then((m) => m.OAuthModule),
  },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {}
