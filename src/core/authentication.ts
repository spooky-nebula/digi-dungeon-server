import express from 'express';
import {
  AuthResponse,
  UserLoginData,
  UserLogoutData,
  UserRegisterData
} from 'digi-dungeon-api/dist/auth/userdata';

import Database from '../database';

import { UserDataSchema } from '../database/mongoaccess';
import { saltPassword } from '../util/cryptography';
import { bufferize, sanitize } from '../util/stringExtensions';
import { random } from '../util';

import * as proto from 'digi-dungeon-protobuf';

export default class Authentication {
  static logPrefix: string;

  static init() {
    this.logPrefix = '[Authentication]';
  }

  private static checkRegisterBody(
    username: string,
    password: string
  ): AuthResponse {
    if (password.length <= 8) {
      return { success: false, message: 'Password too short' };
    }
    if (sanitize(username) != username) {
      return { success: false, message: 'Username not sanitized' };
    }
    return { success: true };
  }

  static POST_register(
    req: express.Request<{}, {}, { data: Uint8Array }>,
    res: express.Response<Uint8Array>
  ) {
    proto.ProtoBufCringe.decode_request_typed<UserRegisterData>(
      bufferize(req.body.data),
      'dd.auth.UserRegisterData'
    )
      .then((body) => {
        const { username, password } = body;

        if (username == '' || password == '') {
          let data = new AuthResponse(
            false,
            undefined,
            'No password or username given'
          );
          proto.ProtoBufCringe.encode_request(
            data,
            'dd.auth.AuthResponse'
          ).then((pack) => {
            res.status(400).send(pack);
          });
          return;
        }
        const check = Authentication.checkRegisterBody(username, password);
        if (!check.success) {
          let data = new AuthResponse(check.success, undefined, check.message);
          proto.ProtoBufCringe.encode_request(
            data,
            'dd.auth.AuthResponse'
          ).then((pack) => {
            res.status(200).send(pack);
          });
          return;
        }
        Database.mongo.userExists(username).then((exists) => {
          if (exists) {
            let data = new AuthResponse(
              false,
              undefined,
              'Username already exists'
            );
            proto.ProtoBufCringe.encode_request(
              data,
              'dd.auth.AuthResponse'
            ).then((pack) => {
              res.status(200).send(pack);
            });
          } else {
            let { hashedPassword, salt } = saltPassword(password);
            let userData: UserDataSchema = {
              userId: random.generateString(32),
              username: username,
              password: hashedPassword,
              salt: salt,
              token: 'photon_cock'
            };
            Database.mongo.register(userData);
            let data = new AuthResponse(true, undefined, undefined);
            proto.ProtoBufCringe.encode_request(
              data,
              'dd.auth.AuthResponse'
            ).then((pack) => {
              res.status(200).send(pack);
            });
          }
          return;
        });
      })
      .catch((err) => {
        let data = new AuthResponse(false, undefined, 'Server Error');
        proto.ProtoBufCringe.encode_request(data, 'dd.auth.AuthResponse').then(
          (pack) => {
            res.status(500).send(pack);
          }
        );
        console.log(err);
      });
  }

  static POST_login(
    req: express.Request<{}, {}, { data: Object }>,
    res: express.Response<Uint8Array>
  ) {
    proto.ProtoBufCringe.decode_request_typed<UserLoginData>(
      bufferize(req.body.data),
      'dd.auth.UserLoginData'
    )
      .then((body) => {
        const { username, password } = body;
        // We technically don't need to check if the username exists since
        // `passwordMatches` resolves false if the user is not found
        Database.mongo.passwordMatches(username, password).then((matches) => {
          if (matches) {
            // Create a token for the logged in user and save it
            let newToken = random.generateString(64);
            Database.mongo.login(username, newToken).then(() => {
              let data = new AuthResponse(true, newToken, undefined);
              proto.ProtoBufCringe.encode_request(
                data,
                'dd.auth.AuthResponse'
              ).then((pack) => {
                res.status(200).send(pack);
              });
            });
          } else {
            let data = new AuthResponse(
              false,
              undefined,
              'Check username/password combination'
            );
            proto.ProtoBufCringe.encode_request(
              data,
              'dd.auth.AuthResponse'
            ).then((pack) => {
              res.status(200).send(pack);
            });
          }
        });
      })
      .catch((err) => {
        let data = new AuthResponse(false, undefined, 'Server Error');
        proto.ProtoBufCringe.encode_request(data, 'dd.auth.AuthResponse').then(
          (pack) => {
            res.status(500).send(pack);
          }
        );
        console.log(err);
      });
  }

  static POST_logout(
    req: express.Request<{}, {}, { data: Uint8Array }>,
    res: express.Response<Uint8Array>
  ) {
    proto.ProtoBufCringe.decode_request_typed<UserLogoutData>(
      bufferize(req.body.data),
      'dd.auth.UserLogoutData'
    )
      .then((body) => {
        const { token } = body;

        Database.mongo
          .getUserFromToken(token)
          .then((userData) => {
            Database.mongo.logout(userData.username).then(() => {
              let data = new AuthResponse(true, undefined, undefined);
              proto.ProtoBufCringe.encode_request(
                data,
                'dd.auth.AuthResponse'
              ).then((pack) => {
                res.status(200).send(pack);
              });
            });
          })
          .catch((err) => {
            let data = new AuthResponse(
              false,
              undefined,
              'Token missmatch, error follows:' + err
            );
            proto.ProtoBufCringe.encode_request(
              data,
              'dd.auth.AuthResponse'
            ).then((pack) => {
              res.status(403).send(pack);
            });
          });
      })
      .catch((err) => {
        let data = new AuthResponse(false, undefined, 'Server Error');
        proto.ProtoBufCringe.encode_request(data, 'dd.auth.AuthResponse').then(
          (pack) => {
            res.status(500).send(pack);
          }
        );
        console.log(err);
      });
  }
}
