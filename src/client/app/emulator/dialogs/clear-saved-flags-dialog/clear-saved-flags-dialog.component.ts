import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { baseUrl } from 'client/config';

import { take } from 'rxjs/operators';

@Component({
  selector: 'clear-saved-flags-dialog',
  templateUrl: './clear-saved-flags-dialog.component.html',
})
export class ClearSavedFlagsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ClearSavedFlagsDialogComponent>,
    private http: HttpClient
  ) {}

  async handleConfirm(): Promise<void> {
    await this.http.delete(`${baseUrl}/api/emulator/flags/fileA`).pipe(take(1)).toPromise();
    this.dialogRef.close();
  }
}