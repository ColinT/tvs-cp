import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';

// spawn server
import * as express from 'express';
const app = express();

import * as cors from 'cors';
app.use(cors());

import * as http from 'http';
const server = new http.Server(app);
const port = 3000;
server.listen(port, () => console.log(`Listening on port ${port}`));
app.use('/', express.static(path.join(__dirname, '../client')));

// setup settings manager
import { SettingsManager } from './SettingsManager';
export const settingsManager = new SettingsManager(path.join(__dirname, './settings.json'));

import api from './api/api';
app.use('/api', api);

// spawn client
import * as download from 'download-chromium';
import * as os from 'os';
import { execFile } from 'child_process';

const tmp = os.tmpdir();
download({
  revision: 694644,
  installPath: `${tmp}/.local-chromium`,
})
  .then((path) => {
    const clientProcess = execFile(path, [ '--app=http://localhost:3000' ], (error) => {
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
  })
  .catch((error) => {
    console.error(error);
  });

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
