import express from 'express';
import * as socketIO from 'socket.io';
import http from 'http';
import * as ddapi from 'digi-dungeon-api';
import cors from 'cors';
import Database from './database/index';

import dotenv from 'dotenv';
import ProtoBufEncoder, { PackedSocketData } from 'digi-dungeon-protobuf';

import Communications from './core/communications';
import CDN from './core/cdn';
import Authentication from './core/authentication';
import WebAPI from './core/webapi';

class DigiDungeonServer {
  app: express.Express;
  server: http.Server;
  io: socketIO.Server;
  PORT: number | string;

  constructor() {
    //#region Config and Initialization
    dotenv.config();

    this.app = express();
    this.app.use(cors());
    this.server = http.createServer(this.app);
    this.io = new socketIO.Server(this.server, {
      cors: {
        origin: /\\https?:\/\/(.*)|(127\.0\.0\.1)|(localhost):3000/,
        methods: ['GET', 'POST'],
        allowedHeaders: ['digi-dungeon-server'],
        credentials: true
      }
    });

    this.PORT = process.env.SERVER_PORT || 8080;

    Database.init();
    Communications.init(this.io);
    Authentication.init();
    CDN.init();
    WebAPI.init();

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    //#endregion
  }

  start() {
    //#region HTTP POST/GET STUFF
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.status(200).json({
        message:
          'Socket Server for Digi-Dungeon, please use the a client to connect to the server',
        status: 'Online'
      });
    });

    // CDN Related
    this.app.get('/cdn', CDN.GET_cdn);

    // Web API Related
    this.app.get('/api/user', WebAPI.GET_apiUser);

    // Authentication Related
    this.app.post('/register', Authentication.POST_register);
    this.app.post('/login', Authentication.POST_login);
    this.app.post('/logout', Authentication.POST_logout);
    //#endregion

    //#region Socket IO Stuff
    this.io.on('connection', (socket: socketIO.Socket) => {
      socket.on('handshake', (data: ddapi.Auth.Handshake.HandshakeData) => {
        Communications.handshakeHandler(socket, data);
      });

      socket.on('board-event', (eventData: PackedSocketData) => {
        Communications.boardEventHandler(socket, eventData);
      });

      socket.on('disconnect', () => {
        Communications.disconnectHandler(socket);
      });
    });
    //#endregion

    //#region Start and Finish
    this.server.listen(this.PORT, () => {
      console.log('Listening on port:', this.PORT);
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
  }

  run = this.start;
}

export default DigiDungeonServer;
export { DigiDungeonServer, DigiDungeonServer as dds };

if (typeof require !== 'undefined' && require.main === module) {
  let dds = new DigiDungeonServer();
  dds.start();
}
