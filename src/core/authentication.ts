import express from 'express';
import Database from '../database';
import { UserDataSchema } from '../database/mongoaccess';
import { saltPassword } from '../util/cryptography';
import { sanitize } from '../util/stringExtensions';
import { random } from '../util';
import { AuthRequestResponse } from 'digi-dungeon-api/dist/auth/userdata';

export default class Authentication {
  static logPrefix: string;

  static init() {
    this.logPrefix = '[Authentication]';
  }

  private static checkRegisterBody(
    username: string,
    password: string
  ): AuthRequestResponse {
    if (password.length <= 8) {
      return { success: false, token: 'Password too short' };
    }
    if (sanitize(username) != username) {
      return { success: false, token: 'Username not sanitized' };
    }
    return { success: true };
  }

  static POST_register(
    req: express.Request,
    res: express.Response<AuthRequestResponse>
  ) {
    const { username, password } = req.body;
    if (username == '' || password == '') {
      res
        .status(400)
        .json({ success: false, token: 'No password or username given' });
      return;
    }
    const check = this.checkRegisterBody(username, password);
    if (!check.success) {
      res.status(200).json(check);
    }
    Database.mongo.userExists(username).then((exists) => {
      if (exists) {
        res
          .status(200)
          .json({ success: false, token: 'Username already exists' });
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
        res.status(200).json({ success: true });
      }
      return;
    });
  }

  static POST_login(
    req: express.Request,
    res: express.Response<AuthRequestResponse>
  ) {
    const username = req.body.username;

    // We technically don't need to check if the username exists since
    // `passwordMatches` resolves false if the user is not found
    Database.mongo
      .passwordMatches(username, req.body.password)
      .then((matches) => {
        if (matches) {
          // Create a token for the logged in user and save it
          let newToken = random.generateString(64);
          Database.mongo.login(username, newToken).then(() => {
            res.status(200).json({ success: true, token: newToken });
          });
        } else {
          res.status(200).json({
            success: false,
            token: 'Check username/password combination'
          });
        }
      });
  }

  static POST_logout(
    req: express.Request,
    res: express.Response<AuthRequestResponse | any>
  ) {
    const { token } = req.body;
    Database.mongo
      .getUserFromToken(token)
      .then((userData) => {
        Database.mongo.logout(userData.username).then(() => {
          res.status(200).json({ success: true });
        });
      })
      .catch((err) => {
        res.status(403).json({
          success: false,
          token: 'Token missmatch, error follows:' + err
        });
      });
  }
}
