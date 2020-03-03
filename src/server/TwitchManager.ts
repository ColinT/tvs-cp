import { default as axios } from 'axios';
import * as WebSocket from 'ws';
import * as levenshtein from 'fast-levenshtein';

import { Emulator } from 'server/Emulator';
import { OAuthManager } from 'server/OAuthManager';
import { ChannelPointsWebSocket } from 'server/ChannelPointsWebSocket';

/**
 * This class handles all non-auth related Twitch API requests.
 */
export class TwitchManager {
  private static characterDict = {
    mario: 0,
    luigi: 1,
    yoshi: 2,
    wario: 3,
    peach: 4,
    toad: 5,
    waluigi: 6,
    rosalina: 7,
    sonic: 8,
    knuckles: 9,
    // goomba: 10,
    kirby: 11,
  };

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
    const command: string = redemptionData.data.redemption.reward.title.toLowerCase();
    const userInput: string = redemptionData.data.redemption.user_input;
    console.log('Executing command: ' + command);
    if (command.charAt(0) === '!') {
      switch (command) {
        case '!changecharacter': {
          const id = this.getCharacterIdFromName(userInput);
          console.log('Changing to character id:', id);
          emulator.changeCharacter(id);
        }
        default: {
          emulator.doEffect(`${command}${!!userInput ? ` ${userInput}` : ''}`);
        }
      }
    }
  }

  private static getCharacterIdFromName(query: string): number {
    // Return the closest character id based on levenshtein distance
    const characterEntries = Object.entries(this.characterDict);
    // Set initial condition
    let distance = levenshtein.get(characterEntries[0][0], query);
    let id = characterEntries[0][1];
    if (distance === 0) {
      return id;
    }
    // Loop through all names for minimum distance
    for (let i = 1; i < characterEntries.length; i++) {
      const newDistance = levenshtein.get(characterEntries[i][0], query);
      if (newDistance === 0) {
        return characterEntries[i][1];
      }
      if (newDistance < distance) {
        distance = newDistance;
        id = characterEntries[i][1];
      }
    }
    return id;
  }
}
