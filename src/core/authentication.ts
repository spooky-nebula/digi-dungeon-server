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
import { sanitize } from '../util/stringExtensions';
import { random } from '../util';

import ProtoBufEncoder from 'digi-dungeon-protobuf';

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
    req: express.Request<{}, {}, Uint8Array>,
    res: express.Response<Uint8Array>
  ) {
    const { username, password } =
      ProtoBufEncoder.decodeResponse<UserRegisterData>(
        'dd.auth.UserRegisterData',
        req.body
      );
    if (username == '' || password == '') {
      res.status(400).send(
        ProtoBufEncoder.encodeResponse('AuthResponse', {
          success: false,
          message: 'No password or username given'
        })
      );
      return;
    }
    const check = Authentication.checkRegisterBody(username, password);
    if (!check.success) {
      res
        .status(200)
        .send(ProtoBufEncoder.encodeResponse('AuthResponse', check));
      return;
    }
    Database.mongo.userExists(username).then((exists) => {
      if (exists) {
        res.status(200).send(
          ProtoBufEncoder.encodeResponse('AuthResponse', {
            success: false,
            message: 'Username already exists'
          })
        );
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
        res
          .status(200)
          .send(
            ProtoBufEncoder.encodeResponse('AuthResponse', { success: true })
          );
      }
      return;
    });
  }

  static POST_login(
    req: express.Request<{}, {}, Uint8Array>,
    res: express.Response<Uint8Array>
  ) {
    const { username, password } =
      ProtoBufEncoder.decodeResponse<UserLoginData>(
        'dd.auth.UserLoginData',
        req.body
      );

    // We technically don't need to check if the username exists since
    // `passwordMatches` resolves false if the user is not found
    Database.mongo.passwordMatches(username, password).then((matches) => {
      if (matches) {
        // Create a token for the logged in user and save it
        let newToken = random.generateString(64);
        Database.mongo.login(username, newToken).then(() => {
          res.status(200).send(
            ProtoBufEncoder.encodeResponse('AuthResponse', {
              success: true,
              token: newToken
            })
          );
        });
      } else {
        res.status(200).send(
          ProtoBufEncoder.encodeResponse('AuthResponse', {
            success: false,
            message: 'Check username/password combination'
          })
        );
      }
    });
  }

  static POST_logout(
    req: express.Request<{}, {}, Uint8Array>,
    res: express.Response<Uint8Array>
  ) {
    const { token } = ProtoBufEncoder.decodeResponse(
      'dd.auth.UserLogoutData',
      req.body
    );
    Database.mongo
      .getUserFromToken(token)
      .then((userData) => {
        Database.mongo.logout(userData.username).then(() => {
          res
            .status(200)
            .send(
              ProtoBufEncoder.encodeResponse('AuthResponse', { success: true })
            );
        });
      })
      .catch((err) => {
        res.status(403).send(
          ProtoBufEncoder.encodeResponse('AuthResponse', {
            success: false,
            message: 'Token missmatch, error follows:' + err
          })
        );
      });
  }
}
