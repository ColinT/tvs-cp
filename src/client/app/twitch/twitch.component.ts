import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EmulatorState } from 'common/states/EmulatorState';

import { baseUrl } from 'client/config';

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

<<<<<<< HEAD
  async ngOnInit(): Promise<void> {
    await Promise.all([ this.checkTokenValidity(), this.getEmulatorStatus(), this.getTwitchSocketStatus() ]);
  }

  async checkTokenValidity(): Promise<void> {
=======
  async ngOnInit() {
    await Promise.all([ this.checkTokenValidity(), this.getEmulatorStatus(), this.getTwitchSocketStatus() ]);
  }

  async checkTokenValidity() {
>>>>>>> master
    return this.http
      .get<boolean>(`${baseUrl}/api/oauth/token-validity?scope=channel:read:redemptions`)
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
      .get(`${baseUrl}/api/emulator/status`, { responseType: 'text' })
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
      .post(`${baseUrl}/api/twitch/open-socket`, undefined, { responseType: 'text' })
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
      .get(`${baseUrl}/api/twitch/socket-status`, { responseType: 'text' })
      .toPromise()
      .then((response) => {
        this.twitchSocketState = response as TwitchSocketState;
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
