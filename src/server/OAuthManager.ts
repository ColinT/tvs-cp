import * as fs from 'fs';

import { default as axios } from 'axios';

/**
 * @class This class manages all OAuth related resources and requests
 * for the Twitch API. Only one token is stored. The user can choose
 * whether or not to save the OAuth token.
 */
export class OAuthManager {
  /** The OAuth token */
  private _oAuthToken: string | null;
  /** The path of the file to save and load the token */
  private _path?: string;

  private static readonly twitchValidationUrl = 'https://id.twitch.tv/oauth2/validate';

  constructor(path?: string) {
    this._path = path;

    this.loadTokenSync();
  }

  /**
   * Checks if the currently loaded token is valid.
   * @param scopes - A list of requested scopes to check for in the token.
   */
  public async getTokenValidity(scopes?: string[]): Promise<boolean> {
    if (!this._oAuthToken) {
      return false;
    } else {
      try {
        const response = await axios.get<TwitchValidationResponse>(OAuthManager.twitchValidationUrl, {
          headers: {
            Authorization: `OAuth ${this._oAuthToken}`,
          },
          responseType: 'json',
        });
        if (!!scopes) {
          return scopes.every((scope) => response.data.scopes.includes(scope));
        } else {
          return true;
        }
      } catch (error) {
        return false;
      }
    }
  }

  private loadTokenSync() {
    if (!!this._path && fs.existsSync(this._path)) {
      // If the file exists, load the token
      this._oAuthToken = fs.readFileSync(this._path).toString().replace(new RegExp(/^oauth:/i), '');
    }
  }

  public saveTokenSync(token: string) {
    token = token.replace(new RegExp(/^oauth:/i), '');
    if (!!this._path) {
      // Save token to file
      fs.writeFileSync(this._path, token);
    }
    this._oAuthToken = token;
  }

  public deleteTokenSync() {
    if (!!this._path && fs.existsSync(this._path)) {
      fs.unlinkSync(this._path);
    }
    this._path = undefined;
  }

  public setToken(token: string) {
    token = token.replace(new RegExp(/^oauth:/i), '');
    this._oAuthToken = token;
  }

  public setPath(path: string) {
    this._path = path;
    if (!!this._oAuthToken) {
      this.saveTokenSync(this._oAuthToken);
    }
  }
}

interface TwitchValidationResponse {
  /** Id of the client application this token was issued for. */
  client_id: string;
  /** Login name of the user this token belongs to. */
  login: string;
  /** List of requested scopes granted to this token. */
  scopes: string[];
  /** Id of the user this token belongs to. */
  user_id: string;
}
