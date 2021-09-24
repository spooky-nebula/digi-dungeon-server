import MongoAccess from './mongoaccess';
import RedisAccess from './redisaccess';

export default class Database {
  static mongo: MongoAccess;
  static redis: RedisAccess;

  constructor() {}

  static init() {
    this.mongo = new MongoAccess(
      process.env.MONGO_HOSTNAME || 'localhost:27017',
      process.env.MONGO_USER_DATABASE || 'dd-userdata',
      process.env.MONGO_HOMEBREW_DATABASE || 'dd-homebrewdata',
      process.env.MONGO_MAPPINGTOOLS_DATABASE || 'dd-mappingtools',
      process.env.MONGO_USERNAME,
      process.env.MONGO_PASSWORD
    );
    this.mongo.init();
    this.redis = new RedisAccess(
      process.env.REDIS_HOSTNAME || 'localhost:6379'
    );
    this.redis.init();
  }

  static dispose(): Promise<void[]> {
    let d = [this.mongo.dispose(), this.redis.dispose()];
    return Promise.all(d);
  }
}

export { MongoAccess, RedisAccess };
