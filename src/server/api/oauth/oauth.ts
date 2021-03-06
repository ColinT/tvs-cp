import * as express from 'express';
const router = express.Router();

import { oAuthManager, settingsManager } from 'server/app';
import { coerceBoolean } from 'server/utils';
import { SettingsManager } from 'server/SettingsManager';

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
    let requestScopes: string | undefined;
    if (!req.query.scopes) {
      requestScopes = undefined;
    } else if (Array.isArray(req.query.scopes)) {
      requestScopes = req.query.scopes.join(' ');
    } else {
      requestScopes = req.query.scopes.toString();
    }
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
      const tokenPath =
        (settingsManager.get('oAuthTokenPath') as string | undefined) ||
        SettingsManager.getDefaultSettings().oAuthTokenPath;
      oAuthManager.setPath(tokenPath);
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
