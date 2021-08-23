import { Db, MongoClient, MongoError } from 'mongodb';
import { cryptography } from '../util';

export default class MongoAccess {
  logPrefix = '[Mongo Access]';

  client?: MongoClient;
  hostname: string;
  userDBName: string;
  homebrewDBName: string;
  private url?: string;
  private username?: string | undefined;
  private password?: string | undefined;

  constructor(
    hostname: string,
    userDBName: string,
    homebrewDBName: string,
    username: string | undefined,
    password: string | undefined
  ) {
    this.hostname = hostname;
    this.userDBName = userDBName;
    this.homebrewDBName = homebrewDBName;
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
  connect(
    dbName: 'userdata' | 'homebrew' = 'userdata'
  ): Promise<ConnectionResponse> {
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

  userExists(username: string): Promise<boolean> {
    return new Promise((resolve) => {
      let query = { username: username };
      this.retrieveOne('auth/userdata', query)
        .then((userData) => {
          if (userData == null) {
            resolve(false);
            return;
          }
          resolve(true);
        })
        .catch((err) => {
          console.error(err);
          resolve(false);
        });
    });
  }

  passwordMatches(username: string, plainpassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getSalt(username)
        .then((salt) => {
          let { hashedPassword } = cryptography.saltPassword(
            plainpassword,
            salt
          );

          let query = { username: username };
          this.retrieveOne('auth/userdata', query)
            .then((userData) => {
              if (userData == null) {
                resolve(false);
                return;
              }
              if (userData.password == hashedPassword) {
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch((err) => {
              console.error(err);
              resolve(false);
            });
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  getSalt(username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let query = { username: username };
      this.retrieveOne('auth/userdata', query)
        .then((userData) => {
          if (userData == null) {
            reject();
            return;
          }
          resolve(userData.salt);
        })
        .catch((err) => {
          console.error(err);
          reject();
        });
    });
  }

  getUserFromToken(token: string): Promise<UserDataSchema> {
    return new Promise((resolve, reject) => {
      let query = { token: token };
      this.retrieveOne('auth/userdata', query)
        .then((userData) => {
          if (userData == null) {
            reject('Token is Invalid');
            return;
          }
          resolve(userData);
        })
        .catch((err) => {
          console.error(err);
          reject('Database Error');
        });
    });
  }

  getUserFromId(id: string): Promise<UserDataSchema> {
    return new Promise((resolve, reject) => {
      let query = { userId: id };
      this.retrieveOne('auth/userdata', query)
        .then((userData) => {
          if (userData == null) {
            reject('UserData was not found');
            return;
          }
          resolve(userData);
        })
        .catch((err) => {
          console.error(err);
          reject('Database Error');
        });
    });
  }

  login(username: string, newToken: string): Promise<void> {
    return new Promise((resolve) => {
      let filter = { username: username };
      let document = { $set: { token: newToken } };
      this.updateOne('auth/userdata', filter, document)
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }

  logout(username: string): Promise<void> {
    return new Promise((resolve) => {
      let filter = { username: username };
      let document = { $set: { token: 'photon_cock' } };
      this.updateOne('auth/userdata', filter, document)
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }

  register(userData: UserDataSchema): Promise<void> {
    return new Promise((resolve, reject) => {
      this.insertOne('auth/userdata', userData)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          console.error(err);
          reject();
        });
    });
  }

  private retrieveOne(
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

  private updateOne(
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

  private insertOne(collectionId: string, document: Object): Promise<void> {
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
  // Replace the document according to the filter
  //collection.updateOne(filter, document)
  //.then(result => {
  //    resolve(result.ok === 1);
  //})
  //.catch(err => {
  //    reject(err);
  //})
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
