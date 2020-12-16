import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import type { Process } from 'memoryjs';
import { EmulatorState } from 'common/states/EmulatorState';

import { baseUrl } from 'client/config';
import { coerceBoolean } from 'server/utils';
import { EmulatorService } from 'client/services/emulator.service';
import { take } from 'rxjs/operators';

enum EmulatorListState {
  LOADING = 1,
  LOADED,
}

@Component({
  selector: 'emulator',
  templateUrl: './emulator.component.html',
  styleUrls: [ './emulator.component.scss' ],
})
export class EmulatorComponent implements OnInit, OnDestroy {
  public EmulatorListState = EmulatorListState;
  public emulatorListState = EmulatorListState.LOADING;

  public EmulatorState = EmulatorState;
  public emulatorState = EmulatorState.NOT_CONNECTED;

  public emulatorList: Process[] = [];

  public isAutoPatchingEnabled: boolean;

  private checkEmulatorStatusInterval: NodeJS.Timeout;

  constructor(private http: HttpClient, private snackBar: MatSnackBar, private emulatorService: EmulatorService) {}

  ngOnInit(): void {
    this.getEmulatorList();
    this.getEmulatorStatus();
    this.getIsAutoPatchingEnabled();

    this.checkEmulatorStatusInterval = setInterval(() => {
      this.getEmulatorStatus();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.checkEmulatorStatusInterval);
  }

  async getEmulatorList(): Promise<void> {
    this.emulatorListState = EmulatorListState.LOADING;
    return this.http
      .get<Process[]>(`${baseUrl}/api/emulator/list`)
      .toPromise()
      .then((value) => {
        this.emulatorListState = EmulatorListState.LOADED;
        return value;
      })
      .then((list) => {
        this.emulatorList = list;
      });
  }

  async getEmulatorStatus(): Promise<void> {
    try {
      this.emulatorState = await this.emulatorService.getEmulatorState$().pipe(take(1)).toPromise();
    } catch (error) {
      console.error(error);
    }
  }

  async setEmulator(process: Process): Promise<void> {
    this.emulatorState = EmulatorState.CONNECTING;
    return this.http
      .post<{ baseAddress: number }>(`${baseUrl}/api/emulator/process-id`, process.th32ProcessID, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
      .toPromise()
      .then((response) => {
        this.emulatorState = EmulatorState.CONNECTED;
        response.baseAddress;
      })
      .catch((error: HttpErrorResponse) => {
        if (error.error instanceof ErrorEvent) {
          console.error(error);
          throw error;
        } else {
          if (error.status === 404) {
            // Selected emulator process died
            // Remove the selected process from the emulator list
            const index = this.emulatorList.findIndex((emulator) => emulator === process);
            this.emulatorList.splice(index, 1);
            this.snackBar.open('The selected emulator could not be found.', undefined, { duration: 4000 });
          } else {
            console.error(error);
            throw error;
          }
        }
      });
  }

  async patchEmulator(): Promise<void> {
    this.emulatorState = EmulatorState.PATCHING;
    return this.http
      .post(`${baseUrl}/api/emulator/patch`, {})
      .toPromise()
      .then((_response) => {
        // TODO use response
        this.emulatorState = EmulatorState.PATCHED;
      })
      .catch((error) => {
        console.error(error);
        throw error; // TODO Let the user know why the patch request failed.
      });
  }

  async getIsAutoPatchingEnabled(): Promise<void> {
    return this.http
      .get(`${baseUrl}/api/emulator/is-auto-patching-enabled`)
      .toPromise()
      .then((response: string | boolean) => {
        this.isAutoPatchingEnabled = coerceBoolean(response);
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  async setIsAutoPatchingEnabled(value: boolean): Promise<void> {
    this.http
      .post(`${baseUrl}/api/emulator/is-auto-patching-enabled`, value)
      .toPromise()
      .then(() => {
        this.isAutoPatchingEnabled = value;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }
}
