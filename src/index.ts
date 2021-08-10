import express from 'express';
import * as socketIO from 'socket.io';
import http from 'http';
import * as ddapi from 'digi-dungeon-api';
import cors from 'cors';
import Database from './database/index';

import dotenv from 'dotenv';

import Communications from './core/communications';
import CDN from './core/cdn';
import Authentication from './core/authentication';
import WebAPI from './core/webapi';

//#region Config and Initialization
dotenv.config();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new socketIO.Server(server, {
  cors: {
    origin: /\\https?:\/\/(.*)|(127\.0\.0\.1)|(localhost):3000/,
    methods: ['GET', 'POST'],
    allowedHeaders: ['digi-dungeon-server'],
    credentials: true
  }
});

const PORT = 8080;

Database.init();
Communications.init(io);
Authentication.init();
CDN.init();
WebAPI.init();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//#endregion

//#region HTTP POST/GET STUFF

app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    message:
      'Socket Server for Digi-Dungeon, please use the a client to connect to the server',
    status: 'Online'
  });
});

// CDN Related
app.get('/cdn', CDN.GET_cdn);

// Web API Related
app.get('/api/user', WebAPI.GET_apiUser);

// Authentication Related
app.post('/register', Authentication.POST_register);
app.post('/login', Authentication.POST_login);
app.post('/logout', Authentication.POST_logout);

//#endregion

//#region Socket IO Stuff

io.on('connection', (socket: socketIO.Socket) => {
  socket.on('handshake', (data: ddapi.Auth.Handshake.HandshakeData) => {
    Communications.handshakeHandler(socket, data);
  });

  socket.on('board-event', (eventData: ddapi.Event.default) => {
    Communications.boardEventHandler(socket, eventData);
  });

  socket.on('disconnect', () => {
    Communications.disconnectHandler(socket);
  });
});

//#endregion

//#region Start and Finish
server.listen(PORT, () => {
  console.log('Listening on port:', PORT);
});

let exiting = false;

function exitGracefully() {
  if (!exiting) {
    exiting = true;
    console.info('\nExiting Gracefully.');
    Database.dispose().then(() => {
      process.exit(0);
    });
  }
}

process.on('SIGINT', exitGracefully);
process.on('SIGTERM', exitGracefully);
process.on('SIGHUP', exitGracefully);
//#endregion
