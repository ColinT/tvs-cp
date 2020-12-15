import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { EmulatorState, EmulatorVersion } from 'common/states/EmulatorState';
import { baseUrl } from 'client/config';
import { Observable, of, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EmulatorService {
  constructor(private http: HttpClient) {}

  getEmulatorState$(pollingInterval = 1000): Observable<EmulatorState> {
    return timer(0, pollingInterval).pipe(
      switchMap(() => this.http.get(`${baseUrl}/api/emulator/status`, { responseType: 'text' })),
      map((response) => response as EmulatorState),
      distinctUntilChanged()
    );
  }

  getEmulatorVersion$(pollingInterval = 1000): Observable<EmulatorVersion | undefined> {
    return this.getEmulatorState$(pollingInterval).pipe(
      switchMap((emulatorState) => {
        if (emulatorState !== EmulatorState.NOT_CONNECTED) {
          return this.http.get(`${baseUrl}/api/emulator/version`, { responseType: 'text' });
        } else {
          return of(undefined);
        }
      }),
      map((response) => {
        if (response) {
          return response as EmulatorVersion;
        } else {
          return undefined;
        }
      }),
      distinctUntilChanged()
    );
  }

  async getEmulatorVersion(): Promise<EmulatorVersion> {
    return this.http
      .get(`${baseUrl}/api/emulator/version`, { responseType: 'text' })
      .toPromise()
      .then((response) => response as EmulatorVersion);
  }
}
