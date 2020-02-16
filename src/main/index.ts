import { app, BrowserWindow } from 'electron';

import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';

import { Main } from './main';
const main = new Main();

try {
  main.startUp();
} catch {
  console.error('Error starting up main process.');
}

// function createWindow() {
//   let win = new BrowserWindow({
//     width: 1200,
//     height: 600,
//     title: `Twitch versus Streamer - Channel Points v${process.env.VERSION}`,
//     webPreferences: {
//       nodeIntegration: true,
//     },
//   });

//   win.loadURL(path.normalize(`file://${__dirname}/index.html`));
//   win.webContents.openDevTools();
// }

// app.whenReady().then(createWindow);

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });
