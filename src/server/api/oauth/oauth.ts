import * as express from 'express';
const router = express.Router();

import { settingsManager } from '../../app';

router.get('/token-save-status', (_req, res) => {
  res.status(200).send(!!settingsManager.get('oauth/tokenSaveStatus'));
});
router.post('/token-save-status', (req, res) => {
  settingsManager.set('oauth/tokenSaveStatus', req.body);
  res.status(201).send();
});

export default router;
