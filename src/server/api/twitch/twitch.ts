import * as express from 'express';
const router = express.Router();

import { EmulatorState } from 'common/states/EmulatorState';

import { TwitchManager } from 'server/TwitchManager';
import { oAuthManager, getEmulator, getTwitchSocket, setTwitchSocket } from 'server/app';

router.post('/open-socket', async (_req, res) => {
  try {
    const emulator = getEmulator();
    if (!emulator) {
      res.status(400).send('Emulator not connected');
    } else if (emulator.getState() !== EmulatorState.PATCHED) {
      res.status(400).send('Emulator not patched');
    } else {
      const channelId = await TwitchManager.getChannelId(oAuthManager);
      setTwitchSocket(await TwitchManager.generateGlobalWebSocket(channelId, oAuthManager, emulator));
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send('CONNECTED');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/socket-status', async (_req, res) => {
  try {
    const socket = getTwitchSocket();
    if (!socket) {
      res.status(200).send('NOT_CONNECTED');
    } else {
      res.status(200).send('CONNECTED');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.post('/execute-command', async (req, res) => {
  try {
    const emulator = getEmulator();
    if (!emulator) {
      res.status(400).send('Emulator not connected');
    } else if (emulator.getState() !== EmulatorState.PATCHED) {
      res.status(400).send('Emulator not patched');
    } else {
      TwitchManager.executeCommand(emulator, req.body.command, req.body.userInput);
      res.status(200).send();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

export default router;
