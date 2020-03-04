import * as express from 'express';
const router = express.Router();

import oauth from './oauth/oauth';
router.use('/oauth', oauth);

import emulator from './emulator/emulator';
router.use('/emulator', emulator);

import twitch from './twitch/twitch';
router.use('/twitch', twitch);

export default router;
