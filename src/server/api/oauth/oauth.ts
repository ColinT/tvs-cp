import * as express from 'express';
const router = express.Router();

import { oAuthManager, settingsManager } from 'server/app';
import { coerceBoolean } from 'server/utils';

router.put('/token', (_req, _res, next) => next());
router.post('/token', (req, res) => {
  oAuthManager.setToken(req.body);
  res.status(204).send();
});

router.get('/token-validity', async (req, res) => {
  const requestScopes: string | undefined = req.query.scopes;
  const scopes = requestScopes ? requestScopes.split(' ') : undefined;
  try {
    res.status(200).send(await oAuthManager.getTokenValidity(scopes));
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/token-save-status', (_req, res) => {
  res.status(200).send(!!settingsManager.get('oauth/tokenSaveStatus'));
});
router.post('/token-save-status', (req, res) => {
  const tokenSaveStatus = coerceBoolean(req.body);
  settingsManager.set('oauth/tokenSaveStatus', tokenSaveStatus);
  if (tokenSaveStatus) {
    oAuthManager.setPath(settingsManager.get('oAuthTokenPath'));
  } else {
    oAuthManager.deleteTokenSync();
  }
  res.status(201).send();
});

export default router;
