import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { GlobalAngularMaterialModule } from '../global-angular-material.module';

import { CommandsRoutingModule } from './commands-routing.module';
import { CommandsComponent } from './commands.component';

@NgModule({
  declarations: [ CommandsComponent ],
  imports: [ CommonModule, ReactiveFormsModule, GlobalAngularMaterialModule, CommandsRoutingModule ],
  bootstrap: [ CommandsComponent ],
  providers: [ HttpClient ],
})
export class CommandsModule {}
