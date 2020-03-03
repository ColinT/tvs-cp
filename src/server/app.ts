import * as dotenv from 'dotenv';
dotenv.config();

export const cwd = process.cwd();

import * as path from 'path';

// spawn server
import * as express from 'express';
const app = express();
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import * as cors from 'cors';
app.use(cors());

import * as http from 'http';
const server = new http.Server(app);
const port = 3000;
server.listen(port, () => console.log(`Listening on port ${port}`));

// Direct all api calls to the api
import api from 'server/api/api';
app.use('/api', api);

// Direct all non-api calls to the SPA
app.use('/', express.static(path.join(__dirname, '../client'))); // Express will serve index.html and supporting resources
app.use('/', (_req, res) => res.sendFile(path.join(__dirname, '../client/index.html'))); // SPA router handles all other paths

// setup settings manager
import { SettingsManager } from 'server/SettingsManager';
export const settingsManager = new SettingsManager(path.join(cwd, './settings.json'));

// setup oauth manager
import { OAuthManager } from 'server/OAuthManager';
export const oAuthManager = new OAuthManager(
  settingsManager.get('oauth/tokenSaveStatus') ? settingsManager.get('oAuthTokenPath') : undefined
);

// set emulator reference
import { Emulator } from 'server/Emulator';
let emulator: Emulator | undefined;
export function setEmulator(value: Emulator | undefined) {
  emulator = value;
}
export function getEmulator(): Emulator | undefined {
  return emulator;
}

// set socket reference
import * as WebSocket from 'ws';
let twitchSocket: WebSocket | undefined;
export function setTwitchSocket(value: WebSocket | undefined) {
  twitchSocket = value;
}
export function getTwitchSocket(): WebSocket | undefined {
  return twitchSocket;
}

// spawn client
const chromium = require('chromium');
import * as os from 'os';
import { execFile } from 'child_process';

const tmp = os.tmpdir();
console.log(tmp);
// download({
//   revision: 694644,
//   installPath: `${tmp}/.local-chromium`,
// })
//   .then((path) => {
    const clientProcess = execFile(chromium.path, [ '--app=http://localhost:3000' ], (error) => {
      if (!!error) {
        console.error(error);
        process.exit(1);
      } else {
        process.exit(0);
      }
    });

    clientProcess.on('close', () => {
      process.exit(0);
    });
  // })
  // .catch((error) => {
  //   console.error(error);
  // });

// import { Main } from './Main';
// const main = new Main();
// try {
//   main.startUp();
// } catch (error) {
//   console.error(error);
// }

// import * as util from 'util';
// import { OAuthManager } from './OAuthManager';
// (async () => {
//   const token = await OAuthManager.getOAuthToken();
//   console.log(util.inspect(token));
// })();
