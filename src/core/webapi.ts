import express from 'express';
import Database from '../database';

export default class WebAPI {
  static logPrefix: string;

  static init() {
    this.logPrefix = '[WebAPI]';
  }

  static GET_apiUser(
    req: express.Request<{}, {}, {}, { userId: string }>,
    res: express.Response
  ) {
    const { userId } = req.query;
    if (userId == '') {
      res.status(400).json({
        message: 'Bad user request, format should be' + '{userId: string}'
      });
      return;
    }
    Database.mongo
      .getUserFromId(userId)
      .then((user) => {
        res.status(200).json({ userId: user.userId, username: user.username });
        return;
      })
      .catch((err) => {
        res.status(404).json({ message: 'User not found' });
        return;
      });
  }
}
