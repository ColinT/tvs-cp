import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { baseUrl } from 'client/config';

enum OAuthTokenState {
  LOADING = 1,
  VALID,
  INVALID,
}

enum TokenSaveState {
  LOADING = 1,
  SAVED,
  NOT_SAVED,
}

@Component({
  selector: 'oauth',
  templateUrl: './oauth.component.html',
  styleUrls: [ './oauth.component.scss' ],
})
export class OAuthComponent implements OnInit {
  public OAuthTokenState = OAuthTokenState;
  public state = OAuthTokenState.LOADING;

  public TokenSaveState = TokenSaveState;
  public tokenSaveState = TokenSaveState.LOADING;

<<<<<<< HEAD
  public newTokenUrl = 'https://id.twitch.tv/oauth2/authorize?client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=https%3A%2F%2Ftwitchapps.com%2Ftmi%2F&response_type=token&scope=channel%3Aread%3Aredemptions';
=======
  public newTokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=https%3A%2F%2Ftwitchapps.com%2Ftmi%2F&response_type=token&scope=channel%3Aread%3Aredemptions`;
>>>>>>> master

  public oAuthTokenForm = new FormGroup({
    token: new FormControl('', Validators.required),
  });

  constructor(private http: HttpClient) {}

<<<<<<< HEAD
  ngOnInit(): void {
=======
  ngOnInit() {
>>>>>>> master
    this.checkTokenValidity();
    this.checkTokenSaveStatus();
  }

<<<<<<< HEAD
  async checkTokenValidity(): Promise<boolean> {
=======
  async checkTokenValidity() {
>>>>>>> master
    return this.http
      .get<boolean>(`${baseUrl}/api/oauth/token-validity?scope=channel:read:redemptions`)
      .toPromise()
      .then((result) => {
        this.state = result ? OAuthTokenState.VALID : OAuthTokenState.INVALID;
        return result;
      })
      .catch((error) => {
        console.error(error);
        this.state = OAuthTokenState.INVALID;
<<<<<<< HEAD
        return false;
      });
  }

  async checkTokenSaveStatus(): Promise<void> {
=======
      });
  }

  async checkTokenSaveStatus() {
>>>>>>> master
    return this.http
      .get<boolean>(`${baseUrl}/api/oauth/token-save-status`)
      .toPromise()
      .then((tokenIsSaved) => {
        this.tokenSaveState = tokenIsSaved ? TokenSaveState.SAVED : TokenSaveState.NOT_SAVED;
      })
      .catch((error) => {
        console.error(error);
        this.tokenSaveState = TokenSaveState.NOT_SAVED;
      });
  }

<<<<<<< HEAD
  async submitOAuthToken(form: FormGroup): Promise<void> {
=======
  async submitOAuthToken(form: FormGroup) {
>>>>>>> master
    if (form.invalid) {
      return;
    } else {
      try {
        await this.http.post(`${baseUrl}/api/oauth/token`, form.value.token).toPromise();
        await this.checkTokenValidity();
      } catch (error) {
        console.error(error);
      }
    }
  }

<<<<<<< HEAD
  async toggleTokenSaveStatus(): Promise<void> {
=======
  async toggleTokenSaveStatus() {
>>>>>>> master
    const previousTokenSaveState = this.tokenSaveState;
    this.tokenSaveState = TokenSaveState.LOADING;
    try {
      if (previousTokenSaveState === TokenSaveState.SAVED) {
        await this.http.post(`${baseUrl}/api/oauth/token-save-status`, 'false').toPromise();
      } else if (previousTokenSaveState === TokenSaveState.NOT_SAVED) {
        await this.http.post(`${baseUrl}/api/oauth/token-save-status`, 'true').toPromise();
      }
      await this.checkTokenSaveStatus();
    } catch (error) {
      console.error(error);
    }
  }
}
