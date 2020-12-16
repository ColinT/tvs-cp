import * as express from 'express';
const router = express.Router();

import { EmulatorState } from 'common/states/EmulatorState';

import { Emulator } from 'server/Emulator';
import { setEmulator, getEmulator, settingsManager } from 'server/app';
import { isProcessAlive } from 'server/utils';

const PATH_IS_AUTO_PATCHING_ENABLED = 'emulator/isAutoPatchingEnabled';

router.get('/list', async (_req, res) => {
  try {
    const emulatorList = Emulator.getAllProcesses(/project64/i);
    res.status(200).send(emulatorList);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.post('/process-id', async (req, res) => {
  try {
    const processId = parseInt(req.body, 10);
    if (isProcessAlive(processId)) {
      const emulator = new Emulator(parseInt(req.body, 10), settingsManager.getBoolean(PATH_IS_AUTO_PATCHING_ENABLED));
      await setEmulator(emulator);
      res.status(200).send({
        baseAddress: emulator.baseAddress,
      });
    } else {
      res.status(404).send();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.post('/patch', async (_req, res) => {
  // TODO accept list of patches to apply
  // For now apply all available patches
  try {
    const emulator = getEmulator();
    if (!emulator) {
      res.status(400).send(EmulatorState.NOT_CONNECTED);
    } else {
      const currentState = emulator.getState();
      if (currentState === EmulatorState.CONNECTING || currentState === EmulatorState.PATCHING) {
        res.status(400).send(currentState);
      } else {
        await emulator.patchMemory();
        res.status(204).send();
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/is-auto-patching-enabled', async (_req, res) => {
  try {
    const emulator = getEmulator();
    if (emulator) {
      res.status(200).send(emulator.isAutoPatchingEnabled);
      settingsManager.set(PATH_IS_AUTO_PATCHING_ENABLED, emulator.isAutoPatchingEnabled);
    } else {
      res.status(200).send(settingsManager.getBoolean(PATH_IS_AUTO_PATCHING_ENABLED));
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.post('/is-auto-patching-enabled', async (req, res) => {
  try {
    console.log(req.body);
    const isAutoPatchingEnabled = req.body === 'true';
    console.log(isAutoPatchingEnabled);
    const emulator = getEmulator();
    if (emulator) {
      emulator.isAutoPatchingEnabled = isAutoPatchingEnabled;
    }
    settingsManager.set(PATH_IS_AUTO_PATCHING_ENABLED, isAutoPatchingEnabled);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/status', async (_req, res) => {
  try {
    const emulator = getEmulator();
    if (!emulator) {
      res.status(200).send(EmulatorState.NOT_CONNECTED);
    } else {
      res.status(200).send(emulator.getState());
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/version', async (_req, res) => {
  try {
    const emulator = getEmulator();
    if (!emulator) {
      res.status(400).send('Emulator not connected');
    } else {
      res.status(200).send(emulator.emulatorVersion);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

export default router;
