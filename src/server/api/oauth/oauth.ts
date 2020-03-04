import * as express from 'express';
const router = express.Router();

import { oAuthManager, settingsManager } from 'server/app';
import { coerceBoolean } from 'server/utils';

router.put('/token', (_req, _res, next) => next());
router.post('/token', async (req, res) => {
  try {
    oAuthManager.setToken(req.body);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/token-validity', async (req, res) => {
  try {
    const requestScopes: string | undefined = req.query.scopes;
    const scopes = requestScopes ? requestScopes.split(' ') : undefined;
    res.status(200).send(await oAuthManager.getTokenValidity(scopes));
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

router.get('/token-save-status', async (_req, res) => {
  try {
    res.status(200).send(!!settingsManager.get('oauth/tokenSaveStatus'));
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});
router.post('/token-save-status', async (req, res) => {
  try {
    const tokenSaveStatus = coerceBoolean(req.body);
    settingsManager.set('oauth/tokenSaveStatus', tokenSaveStatus);
    if (tokenSaveStatus) {
      oAuthManager.setPath(settingsManager.get('oAuthTokenPath'));
    } else {
      oAuthManager.deleteTokenSync();
    }
    res.status(201).send();
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

export default router;
