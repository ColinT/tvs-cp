import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { GlobalAngularMaterialModule } from '../global-angular-material.module';

import { EmulatorRoutingModule } from './emulator-routing.module';
import { EmulatorComponent } from './emulator.component';

@NgModule({
  declarations: [ EmulatorComponent ],
  imports: [ CommonModule, GlobalAngularMaterialModule, EmulatorRoutingModule ],
  bootstrap: [ EmulatorComponent ],
  providers: [ HttpClient ],
})
export class EmulatorModule {}
