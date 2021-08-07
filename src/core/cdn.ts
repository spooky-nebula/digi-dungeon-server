import express from 'express';
import Database from '../database';

export default class CDN {
  static logPrefix: string;

  static init() {
    this.logPrefix = '[CDN]';
  }

  static GET_cdn(req: express.Request, res: express.Response) {
    res.status(404).json({
      message: 'CDN not yet implemented',
      status: 'Offline'
    });
  }
}
