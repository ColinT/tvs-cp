import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';

const modules = [
  MatButtonModule,
  MatCheckboxModule,
  MatIconModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatSidenavModule,
];

@NgModule({
  imports: modules,
  exports: modules,
})
export class GlobalAngularMaterialModule {}
