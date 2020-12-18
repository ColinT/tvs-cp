import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { GlobalAngularMaterialModule } from '../global-angular-material.module';

import { EmulatorRoutingModule } from './emulator-routing.module';
import { EmulatorComponent } from './emulator.component';
import { ClearSavedFlagsDialogComponent } from './dialogs/clear-saved-flags-dialog/clear-saved-flags-dialog.component';

@NgModule({
  declarations: [ EmulatorComponent, ClearSavedFlagsDialogComponent ],
  imports: [ CommonModule, GlobalAngularMaterialModule, EmulatorRoutingModule ],
  bootstrap: [ EmulatorComponent ],
  providers: [ HttpClient ],
})
export class EmulatorModule {}
