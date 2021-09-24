import { cryptography } from '../../util';
import MongoAccess, { UserDataSchema } from '.';

export function userExists(
  this: MongoAccess,
  username: string
): Promise<boolean> {
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

export function passwordMatches(
  this: MongoAccess,
  username: string,
  plainpassword: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    this.getSalt(username)
      .then((salt) => {
        let { hashedPassword } = cryptography.saltPassword(plainpassword, salt);

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

export function getSalt(this: MongoAccess, username: string): Promise<string> {
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

export function getUserFromToken(
  this: MongoAccess,
  token: string
): Promise<UserDataSchema> {
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

export function getUserFromId(
  this: MongoAccess,
  id: string
): Promise<UserDataSchema> {
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

export function login(
  this: MongoAccess,
  username: string,
  newToken: string
): Promise<void> {
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

export function logout(this: MongoAccess, username: string): Promise<void> {
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

export function register(
  this: MongoAccess,
  userData: UserDataSchema
): Promise<void> {
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
