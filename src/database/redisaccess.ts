import redis from 'redis';
import JSONCache from 'redis-json';
import { RedisClient } from 'redis';

import * as socketIO from 'socket.io';

import { Shard } from 'digi-dungeon-api';

export default class RedisAccess {
  logPrefix = '[Redis Access]';

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

    let logPrefix = this.logPrefix;

    // Clear database because fuck presistance
    this.client.flushdb(function (err, succeeded) {
      console.log(logPrefix, 'Memory Flushed');
    });

    this.client.once('connect', () => {
      console.log(logPrefix, 'Connected successfully to session server');
    });

    this.client.on('error', (err) => {
      console.log(logPrefix, err);
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

  dispose(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client != undefined) {
        this.client.quit((err, reply) => {
          console.log(this.logPrefix, 'Client successfully disconnected.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getTokenKey(socket: socketIO.Socket) {
    return 'token/' + socket.id;
  }

  getToken(socket: socketIO.Socket): Promise<string | null> {
    return this.getKey(this.getTokenKey(socket));
  }

  deleteToken(socket: socketIO.Socket): Promise<number> {
    return this.deleteKey(this.getTokenKey(socket));
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

  deleteUserId(socket: socketIO.Socket): Promise<number> {
    return this.deleteKey(this.getUserIdKey(socket));
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

  deleteUsername(socket: socketIO.Socket): Promise<number> {
    return this.deleteKey(this.getUsernameKey(socket));
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

  deleteShardId(socket: socketIO.Socket): Promise<number> {
    return this.deleteKey(this.getShardIdKey(socket));
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

  deleteShard(shardId: string): Promise<number> {
    return this.deleteKey('shard/' + shardId);
  }

  markShardForDeletion(shardId: string, expire?: number): Promise<number> {
    // Delete shard in 5 minutes
    return this.markForDeletion('shard/' + shardId, expire || 300);
  }

  unmarkShardForDeletion(shardId: string): Promise<number> {
    return this.unmarkForDeletion('shard/' + shardId);
  }

  private setKey(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.set(key, value, (err, reply) => {
          resolve();
        });
        //c.quit();
      });
    });
  }

  private getKey(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.get(key, (err, reply) => {
          resolve(reply);
        });
        //c.quit();
      });
    });
  }

  private deleteKey(key: string): Promise<number> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.del(key, (err, reply) => {
          resolve(reply);
        });
        //c.quit();
      });
    });
  }

  private markForDeletion(key: string, expire: number): Promise<number> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.expire(key, expire, (err, reply) => {
          resolve(reply);
        });
        //c.quit();
      });
    });
  }

  private unmarkForDeletion(key: string): Promise<number> {
    return new Promise((resolve) => {
      this.connect().then((c: RedisClient) => {
        c.persist(key, (err, reply) => {
          resolve(reply);
        });
        //c.quit();
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
        //c.quit();
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
        //c.quit();
      });
    });
  }
}
