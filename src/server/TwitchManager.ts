import { default as axios } from 'axios';
import * as WebSocket from 'ws';

import { Emulator } from './Emulator';
import { OAuthManager } from './OAuthManager';
import { ChannelPointsWebSocket } from './ChannelPointsWebSocket';

/**
 * This class handles all non-auth related Twitch API requests.
 */
export class TwitchManager {
  public static async getChannelId(oAuthManager: OAuthManager): Promise<string> {
    const token = oAuthManager.getToken();
    return axios
      .get('https://api.twitch.tv/kraken', {
        headers: {
          Accept: `application/vnd.twitchtv.v5+json`,
          Authorization: `OAuth ${token}`,
        },
        responseType: 'json',
      })
      .then((res) => res.data.token.user_id as string);
  }

  public static generateGlobalWebSocket(channelId: string, oAuthManager: OAuthManager, emulator: Emulator): WebSocket {
    return ChannelPointsWebSocket.generateWebSocket(
      channelId,
      oAuthManager,
      (message) => this.handleRedemption(message, emulator),
      () => {
        console.log('Twitch server requested websocket reconnect. Automatically reconnecting...');
        this.generateGlobalWebSocket(channelId, oAuthManager, emulator);
      }
    );
  }

  private static handleRedemption(redemptionData, emulator: Emulator) {
    // TODO document redeptionData format
    const command: string = redemptionData.data.redemption.reward.title;
    const userInput: string = redemptionData.data.redemption.user_input;
    console.log('Executing command: ' + command);
    if (command.charAt(0) === '!') {
      emulator.doEffect(`${command}${!!userInput ? ` ${userInput}` : ''}`);
    }
  }
}
