import redis from 'redis';
import JSONCache from 'redis-json';
import { RedisClient } from 'redis';

import * as socketIO from 'socket.io';

import { Shard } from 'digi-dungeon-api';

export default class RedisAccess {
  client?: RedisClient;
  hostname: string;
  private url?: string;

  constructor(hostname: string) {
    this.hostname = hostname;
  }

  init() {
    // Connection URL
    this.url = 'redis://' + this.hostname;
    this.client = redis.createClient(this.url);

    // Clear database because fuck presistance
    this.client.flushdb(function (err, succeeded) {
      console.log('[Redis Access]', 'Memory Flushed');
    });

    this.client.once('connect', () => {
      console.log('[Redis Access]', 'Connected successfully to session server');
    });

    this.client.on('error', (err) => {
      console.log('[Redis Access]', err);
    });
  }

  connect(): Promise<RedisClient> {
    return new Promise((resolve, reject) => {
      if (this.client == undefined) {
        reject();
        return;
      }

      resolve(this.client);
    });
  }

  getTokenKey(socket: socketIO.Socket) {
    return 'token/' + socket.id;
  }

  getToken(socket: socketIO.Socket): Promise<string | null> {
    return this.getKey(this.getTokenKey(socket));
  }

  setToken(socket: socketIO.Socket, newToken: string): Promise<void> {
    return this.setKey(this.getTokenKey(socket), newToken);
  }

  getUserIdKey(socket: socketIO.Socket) {
    return 'userId/' + socket.id;
  }

  getUserId(socket: socketIO.Socket): Promise<string | null> {
    return this.getKey(this.getUserIdKey(socket));
  }

  setUserId(socket: socketIO.Socket, newUserId: string): Promise<void> {
    return this.setKey(this.getUserIdKey(socket), newUserId);
  }

  getUsernameKey(socket: socketIO.Socket) {
    return 'username/' + socket.id;
  }

  getUsername(socket: socketIO.Socket): Promise<string | null> {
    return this.getKey(this.getUsernameKey(socket));
  }

  setUsername(socket: socketIO.Socket, newUsername: string): Promise<void> {
    return this.setKey(this.getUsernameKey(socket), newUsername);
  }

  getShardIdKey(socket: socketIO.Socket) {
    return 'shardId/' + socket.id;
  }

  getShardId(socket: socketIO.Socket): Promise<string | null> {
    return this.getKey(this.getShardIdKey(socket));
  }

  setShardId(socket: socketIO.Socket, newShardId: string): Promise<void> {
    return this.setKey(this.getShardIdKey(socket), newShardId);
  }

  saveShard(shard: Shard.default): Promise<void> {
    return this.setShardKey(shard.id, shard);
  }

  getShard(shardId: string): Promise<Shard.default | undefined | null> {
    return this.getShardKey(shardId);
  }

  private setKey(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.set(key, value, (err, reply) => {
          resolve();
        });
        c.unref();
      });
    });
  }

  private getKey(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.get(key, (err, reply) => {
          resolve(reply);
        });
        c.unref();
      });
    });
  }

  private setShardKey(key: string, value: Shard.default): Promise<void> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        // REDIS CONFIG
        let jsonShardCache = new JSONCache<Shard.default>(c, {
          prefix: 'shard/'
        });
        jsonShardCache
          .set(key, value)
          .then((result) => {
            resolve();
          })
          .catch((err) => {
            console.log('[Redis Access] Error with JSON Cache', err);
            resolve();
          });
        c.unref();
      });
    });
  }

  private getShardKey(key: string): Promise<Shard.default | undefined | null> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        // REDIS CONFIG
        let jsonShardCache = new JSONCache<Shard.default>(c, {
          prefix: 'shard/'
        });
        jsonShardCache
          .get(key)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            console.log('[Redis Access] Error with JSON Cache', err);
            resolve(null);
          });
        c.unref();
      });
    });
  }
}
