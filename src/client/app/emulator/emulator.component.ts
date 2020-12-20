import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import type { Process } from 'memoryjs';
import { EmulatorState } from 'common/states/EmulatorState';

import { baseUrl } from 'client/config';
import { coerceBoolean } from 'server/utils';
import { EmulatorService } from 'client/services/emulator.service';
import { take } from 'rxjs/operators';
import { ClearSavedFlagsDialogComponent } from './dialogs/clear-saved-flags-dialog/clear-saved-flags-dialog.component';

enum EmulatorListState {
  LOADING = 1,
  LOADED,
}

enum SettingsPaths {
  SKIP_INTRO = 'is-skip-intro-enabled',
  AUTO_PATCH = 'is-auto-patching-enabled',
  RESTORE_FILE_A = 'is-restoring-file-a-flags-enabled',
  INFINITE_LIVES = 'is-infinite-lives-enabled',
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

  public SettingsPaths = SettingsPaths;
  public settings: {
    [setting in SettingsPaths]: boolean;
  } = {
    [SettingsPaths.SKIP_INTRO]: true,
    [SettingsPaths.AUTO_PATCH]: true,
    [SettingsPaths.RESTORE_FILE_A]: false,
    [SettingsPaths.INFINITE_LIVES]: true,
  };

  private checkEmulatorStatusInterval: NodeJS.Timeout;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private emulatorService: EmulatorService
  ) {}

  async ngOnInit(): Promise<void> {
    this.getEmulatorList();
    this.getEmulatorStatus();

    this.checkEmulatorStatusInterval = setInterval(() => {
      this.getEmulatorStatus();
    }, 1000);

    await Promise.all(Object.keys(this.settings).map(async (settingPath) => {
      await this.getSettingEnabled((settingPath));
    }));
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

  async getSettingEnabled(settingPath: string): Promise<void> {
    return this.http
      .get(`${baseUrl}/api/emulator/${settingPath}`)
      .toPromise()
      .then((response: string | boolean) => {
        this.settings[settingPath] = coerceBoolean(response);
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  async setSettingEnabled(settingPath: string, value: boolean): Promise<void> {
    return this.http
      .post(`${baseUrl}/api/emulator/${settingPath}`, value)
      .toPromise()
      .then(() => {
        this.settings[settingPath] = value;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  async handleRestoreFlags(): Promise<void> {
    await this.http.post(`${baseUrl}/api/emulator/flags/fileA/restore`, {}).pipe(take(1)).toPromise();
  }

  async handleClearSavedFlags(): Promise<void> {
    await this.dialog.open(ClearSavedFlagsDialogComponent).afterClosed().toPromise();
  }
}
