import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';

import * as express from 'express';
const app = express();

import * as cors from 'cors';
app.use(cors());

import * as http from 'http';
const server = new http.Server(app);
const port = 3000;
server.listen(port, () => console.log(`Listening on port ${port}`));

app.use('/', express.static(path.join(__dirname, '../client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

import { Main } from './Main';
const main = new Main();
try {
  main.startUp();
} catch (error) {
  console.error(error);
}
