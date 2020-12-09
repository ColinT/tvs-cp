import { Overlay } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ],
  providers: [ MatSnackBar, Overlay ],
})
export class AppComponent {}
