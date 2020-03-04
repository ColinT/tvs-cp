import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EmulatorComponent } from './emulator.component';

const routes: Routes = [
  {
    path: '',
    component: EmulatorComponent,
  },
];

@NgModule({
  imports: [ RouterModule.forChild(routes) ],
  exports: [ RouterModule ],
})
export class EmulatorRoutingModule {}
