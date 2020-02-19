import * as request from 'request-promise';

/**
 * @class This class manages all OAuth related resources and requests
 * for the Twitch API. Only one token is stored. The user can choose
 * whether or not to save the OAuth token.
 */
export class OAuthManager {
  /** The OAuth token */
  private static _oAuthToken: string | null;
}
