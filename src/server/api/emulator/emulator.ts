import * as express from 'express';
const router = express.Router();

import { EmulatorState } from 'common/states/EmulatorState';

import { Emulator } from 'server/Emulator';
import { setEmulator, getEmulator } from 'server/app';

router.get('/list', (_req, res) => {
  try {
    const emulatorList = Emulator.getAllProcesses(/project64/i);
    res.status(200).send(emulatorList);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.post('/process-id', (req, res) => {
  try {
    const emulator = new Emulator(parseInt(req.body, 10));
    setEmulator(emulator);
    res.status(200).send({
      baseAddress: emulator.baseAddress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.post('/patch', async (req, res) => {
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

router.get('/status', (_req, res) => {
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

export default router;
