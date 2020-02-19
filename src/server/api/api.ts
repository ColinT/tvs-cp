import * as express from 'express';
const router = express.Router();

import oauth from './oauth/oauth';
router.use('/oauth', oauth);

export default router;
