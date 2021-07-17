import * as socketIO from 'socket.io';
import * as ddapi from 'digi-dungeon-api';

import Database from '../database/index';

import dotenv from 'dotenv';
import { sanitize } from '../util/stringExtensions';
import PartyMember from 'digi-dungeon-api/dist/party';
import e from 'express';
import { SimpleShardData } from 'digi-dungeon-api/dist/shard';
dotenv.config();
// import * as redis from 'redis';
// import { randomColour } from './core/random';

// import * as RedisAccess from './core/redisaccess';

// // Create the database client
// let RedisClient = redis.createClient({
//   host: 'open360-redis-socket',
//   port: 6379
// });

// // Listen for any database errors
// RedisClient.on('error', function (error) {
//   console.error(error);
// });

export default class Communications {
  static io: socketIO.Server;

  static init(io: socketIO.Server) {
    this.io = io;
  }

  static handshakeHandler(
    socket: socketIO.Socket,
    data: ddapi.Auth.Handshake.HandshakeData
  ) {
    Database.mongo
      .getUserFromToken(data.token)
      .then((userData) => {
        let sanitizedShardId = sanitize(data.shardID);
        let partyMember = new PartyMember();
        partyMember.userID = userData.userId;
        Database.redis.setToken(socket, userData.token);
        Database.redis.setUserId(socket, userData.userId);
        Database.redis.setUsername(socket, userData.username);
        Database.redis.setShardId(socket, sanitizedShardId);

        Database.redis.getShard(sanitizedShardId).then((shard) => {
          if (shard == undefined || shard == null) {
            console.log(sanitizedShardId, "didn't exist, creating fresh shard");
            shard = new ddapi.Shard.default();
            shard.id = sanitizedShardId;
            partyMember.playerID = 0;
          } else {
            partyMember.playerID = shard.partyList.length - 1;
          }
          // Check if player already exists (In case of reconnection)
          let existingPartyMember = shard.partyList.find(
            (existingPartyMember) => {
              return existingPartyMember.userID == partyMember.userID;
            }
          );
          if (existingPartyMember == undefined) {
            shard.partyList.push(partyMember);
          }

          let simpleData = new SimpleShardData(shard);

          Database.redis.saveShard(shard).then(() => {
            // WARNING: Might break something lol
            this.io.to(sanitizedShardId).emit('forced-resync', simpleData);
            socket.emit('handshake-ack', simpleData);
            socket.join(sanitizedShardId);
            console.log(
              userData.username,
              '(' + userData.userId + ')',
              'joined',
              sanitizedShardId
            );
          });
        });
      })
      .catch((err) => {
        socket.emit('handshake-error', err);
        socket.disconnect();
        console.log(err);
      });
  }

  static boardEventHandler(
    socket: socketIO.Socket,
    eventData: ddapi.Event.default
  ) {
    Database.redis.getShardId(socket).then((shardId) => {
      if (shardId == null) {
        return;
      }

      console.log(eventData.name, 'on', shardId);

      Database.redis.getShard(shardId).then((shard) => {
        if (shard == null || shard == undefined) {
          console.log('Shard', shardId, "doesn't exist, skipping event");

          return;
        }

        Communications.decideAndHandleBoardEvent(socket, eventData).then(
          (eventDataToSend) => {
            Database.redis.getUsername(socket).then((username) => {
              eventDataToSend.sender = username || eventData.sender;

              this.io.to(shardId).emit('board-event', eventDataToSend);
              socket.emit('board-event-sent');

              shard.gamelog.push(eventDataToSend);

              Database.redis.saveShard(shard);
            });
          }
        );
      });
    });
  }

  private static decideAndHandleBoardEvent(
    socket: socketIO.Socket,
    eventData: ddapi.Event.default
  ): Promise<ddapi.Event.default> {
    return new Promise((resolve) => {
      switch (eventData.name) {
        case 'roll-dice-request':
          if ((eventData as ddapi.Event.DiceRollRequestEvent).roll) {
            let rollRequestEvent =
              eventData as ddapi.Event.DiceRollRequestEvent;
            ddapi.Util.dice.roll(rollRequestEvent.roll).then((result) => {
              let rollEvent = new ddapi.Event.DiceRollEvent(
                rollRequestEvent.sender
              );
              rollEvent.roll = result;
              resolve(rollEvent);
            });
          }

          break;

        default:
          resolve(eventData);
          break;
      }
    });
  }

  static disconnectHandler(socket: socketIO.Socket) {
    Database.redis.getToken(socket).then((token) => {
      if (token == null) {
        return;
      }

      Database.mongo.getUserFromToken(token).then((userData) => {
        Database.redis.getShardId(socket).then((shardId) => {
          if (shardId == null) {
            return;
          }

          socket.leave(shardId);
          console.log(
            userData.username,
            '(' + userData.userId + ')',
            'left',
            shardId
          );

          Database.redis.setToken(socket, '');
          Database.redis.setUserId(socket, '');
          Database.redis.setUsername(socket, '');
          Database.redis.setShardId(socket, '');
          Database.redis.getShard(shardId).then((shard) => {
            if (shard == null || shard == undefined) {
              return;
            }

            let playerIsInShard = shard.partyList.filter((partyMember) => {
              return partyMember.userID == userData.userId;
            });
            if (playerIsInShard.length == 0) {
              return;
            }

            let indexOfPlayer = shard.partyList.indexOf(playerIsInShard[0]);

            shard.partyList.splice(indexOfPlayer, 1);

            Database.redis.saveShard(shard);
            // WARNING: Might break something lol
            this.io
              .to(shardId)
              .emit('forced-resync', new SimpleShardData(shard));
          });
        });
      });
    });
  }
}
