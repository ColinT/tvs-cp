import * as WebSocket from 'ws';
import { default as axios } from 'axios';

import { Emulator } from './Emulator';
import { ChannelPointsWebSocket } from './ChannelPointsWebSocket';

export class Main {
  private socket: WebSocket;

  public async startUp() {
    return Promise.all([ this.connectToEmulator(), this.getChannelId() ])
      .then(([ emulator, channelId ]) => {
        console.log('Retrieving channel ID successful: ' + channelId);
        console.log('Connecting to channel points websocket');
        this.generateGlobalWebSocket(channelId, emulator);
        console.log('Websocket established. Have fun!');
      })
      .catch((error) => {
        console.error('Error starting up');
        console.error(error);
        throw error;
      });
  }

  public async connectToEmulator() {
    const emulatorList = Emulator.getAllProcesses(/project64/i);
    if (emulatorList.length > 0) {
      const emulator = new Emulator(emulatorList[0].th32ProcessID);
      console.log('Emulator connection successful. Base address: ' + emulator.baseAddress.toString(16));
      // await emulator.patchMemory();
      // console.log('Emulator RAM patched successfully! You can now select a file.');
      return emulator;
    } else {
      throw new Error('No emulators found');
    }
  }

  public async getChannelId(): Promise<string> {
    return axios
      .get('https://api.twitch.tv/kraken', {
        headers: {
          Accept: `application/vnd.twitchtv.v5+json`,
          Authorization: `OAuth ${process.env.OAUTH_TOKEN}`,
        },
        responseType: 'json',
      })
      .then((res) => res.data.token.user_id as string);
  }

  private generateGlobalWebSocket(channelId: string, emulator: Emulator) {
    this.socket = ChannelPointsWebSocket.generateWebSocket(
      channelId,
      (message) => this.handleRedemption(message, emulator),
      () => {
        console.log('Twitch server requested websocket reconnect. Automatically reconnecting...');
        this.generateGlobalWebSocket(channelId, emulator);
      }
    );
  }

  private handleRedemption(redemptionData, emulator: Emulator) {
    const command: string = redemptionData.data.redemption.reward.title;
    const userInput: string = redemptionData.data.redemption.user_input;
    console.log('Executing command: ' + command);
    if (command.charAt(0) === '!') {
      emulator.doEffect(`${command}${!!userInput ? ` ${userInput}` : ''}`);
    }
  }
}
