import express from 'express';
import * as socketIO from 'socket.io';
import http from 'http';
import * as ddapi from 'digi-dungeon-api';
import cors from 'cors';
import Database from './database/index';
import { UserDataSchema } from './database/mongoaccess';
import { random } from './util';

import dotenv from 'dotenv';
import { generateString } from './util/random';
import { sanitize } from './util/stringExtensions';
import { saltPassword } from './util/cryptography';

import Communications from './core/communications';

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

app.use(express.json());
//#endregion

//#region HTTP POST/GET STUFF

app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    message:
      'Socket Server for Digi-Dungeon, please use the a client to connect to the server',
    status: 'Online'
  });
});

app.get('/cdn', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    message: 'CDN not yet implemented',
    status: 'Offline'
  });
});

app.post(
  '/register',
  (
    req: express.Request<{}, {}, ddapi.Auth.User.UserRegisterData>,
    res: express.Response
  ) => {
    const { username, password } = req.body;
    if (username == '' || password == '') {
      res.status(400).json({ message: 'No password or username given' });
      return;
    }
    if (password.length <= 8) {
      res
        .status(200)
        .json(
          new ddapi.Auth.User.AuthRequestResponse(false, 'Password too short')
        );
      return;
    }
    if (sanitize(username) != username) {
      res
        .status(200)
        .json(
          new ddapi.Auth.User.AuthRequestResponse(
            false,
            'Username not sanitized!'
          )
        );
      return;
    }
    Database.mongo.userExists(username).then((exists) => {
      if (exists) {
        res
          .status(200)
          .json(
            new ddapi.Auth.User.AuthRequestResponse(
              false,
              'Username already exists'
            )
          );
      } else {
        let { hashedPassword, salt } = saltPassword(password);
        let userData: UserDataSchema = {
          userId: generateString(32),
          username: username,
          password: hashedPassword,
          salt: salt,
          token: 'photon_cock'
        };
        Database.mongo.register(userData);
        res.status(200).json(new ddapi.Auth.User.AuthRequestResponse(true));
      }
      return;
    });
  }
);

app.post(
  '/login',
  (
    req: express.Request<{}, {}, ddapi.Auth.User.UserLoginData>,
    res: express.Response
  ) => {
    const username = req.body.username;
    Database.mongo.userExists(username).then((exists) => {
      if (exists) {
        Database.mongo
          .passwordMatches(username, req.body.password)
          .then((matches) => {
            if (matches) {
              let newToken = random.generateString(64);
              Database.mongo.login(username, newToken).then(() => {
                res
                  .status(200)
                  .json(
                    new ddapi.Auth.User.AuthRequestResponse(true, newToken)
                  );
              });
            } else {
              res
                .status(200)
                .json(
                  new ddapi.Auth.User.AuthRequestResponse(
                    false,
                    'Check username/password combination'
                  )
                );
            }
          });
      } else {
        res
          .status(200)
          .json(
            new ddapi.Auth.User.AuthRequestResponse(
              false,
              'Check username/password combination'
            )
          );
      }
    });
  }
);

app.post(
  '/logout',
  (
    req: express.Request<{}, {}, ddapi.Auth.User.UserLogoutData>,
    res: express.Response
  ) => {
    const { username, token } = req.body;
    Database.mongo
      .getUserFromToken(token)
      .then((userData) => {
        Database.mongo.logout(username).then(() => {
          res.status(200).json(new ddapi.Auth.User.AuthRequestResponse(true));
        });
      })
      .catch((err) => {
        //res.status(200).json(new ddapi.Auth.User.AuthRequestResponse(true));
        res.status(403).json({ message: 'Token missmatch', actualError: err });
      });
  }
);

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

server.listen(PORT, () => {
  console.log('Listening on port:', PORT);
});
