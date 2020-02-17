import * as dotenv from 'dotenv';
dotenv.config();

import * as WebSocket from 'ws';
import * as request from 'request-promise';
import * as levenshtein from 'fast-levenshtein';

import { Emulator } from './Emulator';
import { ChannelPointsWebSocket } from './ChannelPointsWebSocket';

let socket: WebSocket;

console.log('Please wait for RAM patches to be complete before selecting a file...');

const characterDict = {
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
  goomba: 10,
  kirby: 11,
};

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
    console.log('Retrieving channel ID successful: ' + channelId);

    console.log('Connecting to channel points websocket');
    generateGlobalWebSocket(channelId, emulator);
    console.log('Websocket established. Have fun!');
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
    () => {
      console.log('Twitch server requested websocket reconnect. Automatically reconnecting...');
      generateGlobalWebSocket(channelId, emulator);
    }
  );
}

function handleRedemption(redemptionData, emulator: Emulator) {
  const command: string = redemptionData.data.redemption.reward.title.toLowerCase();
  const userInput: string = redemptionData.data.redemption.user_input;
  console.log('Executing command: ' + command);
  if (command.charAt(0) === '!') {
    switch (command) {
      case '!changecharacter': {
        const id = getCharacterIdFromName(userInput);
        console.log('Changing to character id:', id);
        emulator.changeCharacter(id);
      }
      default: {
        emulator.doEffect(`${command}${!!userInput ? ` ${userInput}` : ''}`);
      }
    }
  }
}

function getCharacterIdFromName(query: string): number {
  // Return the closest character id based on levenshtein distance
  const characterEntries = Object.entries(characterDict);
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
