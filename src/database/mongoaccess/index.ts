import { Db, MongoClient, MongoError } from 'mongodb';
import * as UserAccess from './useraccess';

type Database = 'userdata' | 'homebrew' | 'mappingtools';

export default class MongoAccess {
  logPrefix = '[Mongo Access]';

  client?: MongoClient;
  hostname: string;
  userDBName: string;
  homebrewDBName: string;
  mappingtoolsDBName: string;
  private url?: string;
  private username?: string | undefined;
  private password?: string | undefined;

  constructor(
    hostname: string,
    userDBName: string,
    homebrewDBName: string,
    mappingtoolsDBName: string,
    username: string | undefined,
    password: string | undefined
  ) {
    this.hostname = hostname;
    this.userDBName = userDBName;
    this.homebrewDBName = homebrewDBName;
    this.mappingtoolsDBName = mappingtoolsDBName;
    this.username = username;
    this.password = password;
  }

  init() {
    // Connection URL
    this.url = 'mongodb://' + this.hostname;

    if (this.username == undefined && this.password == undefined) {
      this.client = new MongoClient(this.url);
    } else {
      this.client = new MongoClient(this.url, {
        auth: { username: this.username, password: this.password }
      });
    }

    let logPrefix = this.logPrefix;

    this.client.once('serverOpening', () => {
      console.log(logPrefix, 'Connected successfully to database server');
    });

    this.client.on('error', (err) => {
      console.log(logPrefix, err);
    });
  }

  // Don't forget to close the connection with client.close()
  connect(dbName: Database = 'userdata'): Promise<ConnectionResponse> {
    return new Promise((resolve, reject) => {
      if (this.client == undefined) {
        reject();
        return;
      }

      this.client
        .connect()
        .then((client: MongoClient) => {
          this.client = client;
          let biConnect: string;
          switch (dbName) {
            case 'userdata':
              biConnect = this.userDBName;
              break;
            case 'homebrew':
              biConnect = this.homebrewDBName;
              break;
            case 'mappingtools':
              biConnect = this.mappingtoolsDBName;
              break;
          }
          const db = client.db(biConnect);
          resolve({ MongoClient: client, db: db });
        })
        .catch((err) => {
          console.error(err);
          reject();
        });
    });
  }

  userExists = UserAccess.userExists;
  passwordMatches = UserAccess.passwordMatches;
  getSalt = UserAccess.getSalt;
  getUserFromToken = UserAccess.getUserFromToken;
  getUserFromId = UserAccess.getUserFromId;
  login = UserAccess.login;
  logout = UserAccess.logout;
  register = UserAccess.register;

  dispose(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client != undefined) {
        this.client.close().then(() => {
          console.log(this.logPrefix, 'Client successfully disconnected.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  protected retrieveOne(
    collectionId: string,
    query: Object
  ): Promise<UserDataSchema | null> {
    return new Promise((resolve, reject) => {
      this.connect()
        .then((c: ConnectionResponse) => {
          let collection = c.db.collection(collectionId);
          collection
            .findOne<UserDataSchema>(query)
            .then((userData) => {
              c.MongoClient.close();
              if (userData == undefined) {
                resolve(null);
                return;
              }
              resolve(userData);
            })
            .catch((err: MongoError) => {
              reject(err);
            });
        })
        .catch(() => {
          reject();
        });
    });
  }

  protected updateOne(
    collectionId: string,
    filter: Object,
    document: Object
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connect()
        .then((c: ConnectionResponse) => {
          let collection = c.db.collection(collectionId);
          collection
            .updateOne(filter, document)
            .then(() => {
              c.MongoClient.close();
              resolve();
            })
            .catch((err: MongoError) => {
              reject(err);
            });
        })
        .catch(() => {
          reject();
        });
    });
  }

  protected insertOne(collectionId: string, document: Object): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connect()
        .then((c: ConnectionResponse) => {
          let collection = c.db.collection(collectionId);
          collection
            .insertOne(document)
            .then(() => {
              c.MongoClient.close();
              resolve();
            })
            .catch((err: MongoError) => {
              reject(err);
            });
        })
        .catch(() => {
          reject();
        });
    });
  }
}

export interface ConnectionResponse {
  MongoClient: MongoClient;
  db: Db;
}

export interface UserDataSchema {
  userId: string;
  username: string;
  password: string;
  salt: string;
  token: string;
}
