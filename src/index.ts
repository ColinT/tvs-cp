import * as dotenv from 'dotenv';
dotenv.config();

import * as WebSocket from 'ws';
import * as request from 'request-promise';

import { Emulator } from './Emulator';
import { ChannelPointsWebSocket } from './ChannelPointsWebSocket';

let socket: WebSocket;

console.log('Please wait for RAM patches to be complete before selecting a file...');

const emulatorList = Emulator.getAllProcesses(/project64/i);
console.log(emulatorList);

if (emulatorList.length > 0) {
  (async () => {
    const emulator = new Emulator(emulatorList[0].th32ProcessID);
    console.log('Emulator connection successful. Base address: ' + emulator.baseAddress.toString(16));
    await emulator.patchMemory();
    console.log('Emulator RAM patched successfully! You can now select a file.');

    console.log('Retrieving channel ID');
    // Get channel id
    const channelId = await request('https://api.twitch.tv/kraken', {
      headers: {
        Accept: `application/vnd.twitchtv.v5+json`,
        Authorization: `OAuth ${process.env.OAUTH_TOKEN}`,
      },
      json: true,
    }).then((res) => res.token.user_id);

    generateGlobalWebSocket(channelId, emulator);
  })().catch((error) => {
    console.error('An error has occured. Program will now exit.');
    console.error(error);
    throw error;
  });
}

function generateGlobalWebSocket(channelId: string, emulator: Emulator) {
  socket = ChannelPointsWebSocket.generateWebSocket(
    channelId,
    (message) => handleRedemption(message, emulator),
    () => generateGlobalWebSocket(channelId, emulator)
  );
}

function handleRedemption(redemptionData, emulator: Emulator) {
  const command: string = redemptionData.data.redemption.reward.title;
  const userInput: string = redemptionData.data.redemption.user_input;
  console.log('Executing command: ' + command);
  if (command.charAt(0) === '!') {
    emulator.doEffect(`${command}${!!userInput ? ` ${userInput}` : ''}`);
  }
}
