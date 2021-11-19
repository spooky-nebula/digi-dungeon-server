import * as socketIO from 'socket.io';
import * as ddapi from 'digi-dungeon-api';
import PartyMember from 'digi-dungeon-api/dist/party';
import { SimpleShardData } from 'digi-dungeon-api/dist/shard';

import Database from '../database/index';

import { sanitize } from '../util/stringExtensions';
import { hashIt } from '../util/cryptography';
import { ProtoBufCringe, PackedSocketData } from 'digi-dungeon-protobuf';

export default class Communications {
  static io: socketIO.Server;
  static logPrefix: string;

  static init(io: socketIO.Server) {
    this.io = io;
    this.logPrefix = '[Communications]';
  }

  static handshakeHandler(
    socket: socketIO.Socket,
    data: ddapi.Auth.Handshake.HandshakeData | PackedSocketData
  ) {
    // Unpack data in case the Handshake data is in a Uint8Array buffer
    ProtoBufCringe.unpack_data<ddapi.Auth.Handshake.HandshakeData>(
      data as PackedSocketData
    ).then((data) => {
      // Should add a check for data structure but whatever DONE!
      if (data.shardID.trim() == '') {
        socket.disconnect();
        return;
      }
      if (data.token.trim() == '') {
        socket.disconnect();
        return;
      }

      // Retrieve user
      Database.mongo
        .getUserFromToken(data.token)
        .then((userData) => {
          // Sanitize the shard ID given because we create shards on demand
          let sanitizedShardId = sanitize(data.shardID);
          let partyMember = new PartyMember();
          partyMember.userID = userData.userId;

          // Save this socket to the database with some cached user info
          Database.redis.setToken(socket, userData.token);
          Database.redis.setUserId(socket, userData.userId);
          Database.redis.setUsername(socket, userData.username);
          Database.redis.setShardId(socket, sanitizedShardId);

          // Check if the shard already exists and send the data over
          Database.redis.getShard(sanitizedShardId).then((shard) => {
            if (shard == undefined || shard == null) {
              console.log(
                this.logPrefix,
                sanitizedShardId,
                "didn't exist, creating fresh shard"
              );
              shard = new ddapi.Shard.default();
              shard.id = sanitizedShardId;
            }

            // Check if player already exists (In case of reconnection)
            let partyMemberExists =
              shard.partyList.find((existingPartyMember) => {
                return existingPartyMember.userID == partyMember.userID;
              }) != undefined;

            if (!partyMemberExists) {
              partyMember.playerID = hashIt(userData.userId).substring(0, 6);
              shard.partyList.push(partyMember);
            }

            let simpleData = {
              shardData: new SimpleShardData(shard)
            } as ddapi.Auth.Handshake.HandshakeResponseData;

            let packed_type = 'dd.auth.HandshakeResponseData';

            let packed_data = ProtoBufCringe.encode_request(
              simpleData,
              packed_type
            );

            let sent_data = {
              type: packed_type,
              body: packed_data
            };

            Database.redis.saveShard(shard).then(() => {
              // WARNING: Might break something lol
              this.io.to(sanitizedShardId).emit('forced-resync', sent_data);
              socket.emit('handshake-ack', sent_data);
              socket.join(sanitizedShardId);
              console.log(
                this.logPrefix,
                userData.username,
                '(' + userData.userId.substring(0, 6) + ')',
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
    });
  }

  static boardEventHandler(
    socket: socketIO.Socket,
    original_data: PackedSocketData
  ) {
    ProtoBufCringe.unpack_data<ddapi.Event.Event>(
      original_data as PackedSocketData
    ).then((eventData) => {
      Database.redis.getShardId(socket).then((shardId) => {
        if (shardId == null) {
          return;
        }

        Database.redis.getShard(shardId).then((shard) => {
          if (shard == null || shard == undefined) {
            console.log(
              this.logPrefix,
              'Shard',
              shardId,
              "doesn't exist, skipping event"
            );

            return;
          }

          Communications.decideAndHandleBoardEvent(socket, eventData).then(
            (result) => {
              Database.redis.getUserId(socket).then((userId) => {
                let new_event = result.decided;
                let event_type = result.encode_type || original_data.type;
                new_event.sender = userId || eventData.sender;
                new_event.timestamp = Date.now();

                console.log(
                  this.logPrefix,
                  userId?.substring(0, 6),
                  'sent',
                  eventData.name,
                  'on',
                  shardId
                );

                let sent_type = event_type;
                let sent_package = ProtoBufCringe.encode_request(
                  new_event,
                  event_type
                );
                let sent_data = {
                  type: sent_type,
                  body: sent_package
                };

                this.io.to(shardId).emit('board-event', sent_data);
                socket.emit('board-event-sent');

                shard.gamelog.push(new_event);

                // Save the shard and unmark for deletion
                Database.redis.saveShard(shard);
                Database.redis.unmarkShardForDeletion(shard.id);
              });
            }
          );
        });
      });
    });
  }

  private static decideAndHandleBoardEvent(
    socket: socketIO.Socket,
    eventData: ddapi.Event.default
  ): Promise<{ decided: ddapi.Event.default; encode_type?: string }> {
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
              resolve({
                decided: rollEvent,
                encode_type: 'dd.event.DiceRollRequestEvent'
              });
            });
          }

          break;

        default:
          resolve({ decided: eventData });
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
            this.logPrefix,
            userData.username,
            '(' + userData.userId.substring(0, 6) + ')',
            'left',
            shardId
          );

          // Reset the cached userdata
          Database.redis.deleteToken(socket);
          Database.redis.deleteUserId(socket);
          Database.redis.deleteUsername(socket);
          Database.redis.deleteShardId(socket);

          // Remove the plauer from the shard
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

            // If the shard is empty delete it lol
            if (shard.partyList.length == 0) {
              // Delete shard in 5 minutes
              Database.redis.markShardForDeletion(shard.id);
            } else {
              Database.redis.saveShard(shard);
              // WARNING: Might break something lol
              this.io
                .to(shardId)
                .emit('forced-resync', new SimpleShardData(shard));
            }
          });
        });
      });
    });
  }
}
