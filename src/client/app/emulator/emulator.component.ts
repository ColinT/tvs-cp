import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Process } from 'common/types/Process';
import { EmulatorState } from 'common/states/EmulatorState';

import { baseUrl } from 'client/config';

enum EmulatorListState {
  LOADING = 1,
  LOADED,
}

@Component({
  selector: 'emulator',
  templateUrl: './emulator.component.html',
  styleUrls: [ './emulator.component.scss' ],
})
export class EmulatorComponent {
  public EmulatorListState = EmulatorListState;
  public emulatorListState = EmulatorListState.LOADING;

  public EmulatorState = EmulatorState;
  public emulatorState = EmulatorState.NOT_CONNECTED;

  public emulatorList: Process[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getEmulatorList();
    this.getEmulatorStatus();
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
    return this.http
      .get(`${baseUrl}/api/emulator/status`, { responseType: 'text' })
      .toPromise()
      .then((response) => {
        this.emulatorState = response as EmulatorState;
      })
      .catch((error) => {
        console.error(error);
      });
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
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  async patchEmulator(): Promise<void> {
    this.emulatorState = EmulatorState.PATCHING;
    return this.http
      .post(`${baseUrl}/api/emulator/patch`, {})
      .toPromise()
      .then((response) => {
        this.emulatorState = EmulatorState.PATCHED;
      })
      .catch((error) => {
        console.error(error);
        throw error; // TODO Let the user know why the patch request failed.
      });
  }
}
