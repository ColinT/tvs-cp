import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Process } from 'types/Process';

enum EmulatorListState {
  LOADING = 1,
  LOADED,
}

enum EmulatorState {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  PATCHING = 'PATCHING',
  PATCHED = 'PATCHED',
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
      .get<Process[]>('http://localhost:3000/api/emulator/list')
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
      .get('http://localhost:3000/api/emulator/status', { responseType: 'text' })
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
      .post<{ baseAddress: number }>('http://localhost:3000/api/emulator/process-id', process.th32ProcessID, {
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
      .post('http://localhost:3000/api/emulator/patch', {})
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
