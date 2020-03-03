import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EmulatorState } from 'common/states/EmulatorState';

enum OAuthTokenState {
  LOADING = 1,
  VALID,
  INVALID,
}

enum TwitchSocketState {
  NOT_CONNECTED = 'NOT_CONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

@Component({
  selector: 'twitch',
  templateUrl: './twitch.component.html',
  styleUrls: [ './twitch.component.scss' ],
})
export class TwitchComponent implements OnInit {
  public OAuthTokenState = OAuthTokenState;
  public oAuthTokenState = OAuthTokenState.LOADING;

  public EmulatorState = EmulatorState;
  public emulatorState = EmulatorState.NOT_CONNECTED;

  public TwitchSocketState = TwitchSocketState;
  public twitchSocketState = TwitchSocketState.NOT_CONNECTED;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await Promise.all([ this.checkTokenValidity(), this.getEmulatorStatus(), this.getTwitchSocketStatus() ]);
  }

  async checkTokenValidity() {
    return this.http
      .get<boolean>('http://localhost:3000/api/oauth/token-validity?scope=channel:read:redemptions')
      .toPromise()
      .then((result) => {
        this.oAuthTokenState = result ? OAuthTokenState.VALID : OAuthTokenState.INVALID;
      })
      .catch((error) => {
        console.error(error);
        this.oAuthTokenState = OAuthTokenState.INVALID;
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

  async openTwitchSocket(): Promise<void> {
    return this.http
      .post('http://localhost:3000/api/twitch/open-socket', undefined, { responseType: 'text' })
      .toPromise()
      .then((_response) => {
        this.twitchSocketState = TwitchSocketState.CONNECTED;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async getTwitchSocketStatus(): Promise<void> {
    return this.http
      .get('http://localhost:3000/api/twitch/socket-status', { responseType: 'text' })
      .toPromise()
      .then((response) => {
        this.twitchSocketState = response as TwitchSocketState;
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
