/**
 * @type UserData
 * @property {UserDataTypes} type - Defines what type this userdata
 * @property {boolean} active - User account is activated
 * @property {string} userId - Unique identifier of the user account
 * @property {string} username - Username
 * @property {string} email - Email
 * @property {string} password - Hashed password
 * @property {string} salt - Salt for password hashing
 * @property {string} displayName - Display Name
 */
class UserData {
  type: UserDataTypes;
  active: boolean;
  userId: string;
  username: string;
  email: string;
  password: string;
  salt: string;
  displayName: string;
  subscriptions: any[];
  following: string[];

  constructor() {
    this.type = UserDataTypes.ALL_INFO;
    this.active = false;
    this.userId = '';
    this.username = '';
    this.email = '';
    this.password = '';
    this.salt = '';
    this.displayName = '';
    this.subscriptions = [];
    this.following = [];
  }

  /**
   * Unboxes object to a UserData instance
   * @param {Object} obj
   * @return {UserData}
   */
  cast(obj: Object): UserData {
    obj && Object.assign(this, obj);
    return this;
  }

  /**
   * Check if this is an empty instance
   */
  empty(): boolean {
    return (
      this.userId === '' &&
      this.username === '' &&
      this.email === '' &&
      this.password === '' &&
      this.salt === '' &&
      this.displayName === '' &&
      this.subscriptions === [] &&
      this.following === []
    );
  }
}

enum UserDataTypes {
  'ALL_INFO' = 0,
  'JUST_AUTH' = 1,
  'JUST_DETAILS' = 2,
  'JUST_HASH' = 3
}

/**
 * @type {Object} ChannelData
 * @property {string} userId - Identifier of the owner of the channel
 * @property {string} username - Username of the owner of the channel
 * @property {ChannelStatus} channelStatus - Online status of the channel
 * @property {ChannelModule[]} modules - Current modules this channel has
 * @property {string} title - Title of the stream
 * @property {string} description - Description of the channel
 * @property {string} streamKey - StreamKey of the channel
 * @property {string[]} tags - Tags of this stream
 * @property {string} directory - Category/Location this channel's stream is
 * @property {number} followers - Number of followers this channel has
 */
class ChannelData {
  userId: string;
  username: string;
  channelStatus: ChannelStatus;
  modules: ChannelModule[];
  title: string;
  description: string;
  streamKey: string;
  tags: string[];
  directory: string;
  followers: number;

  constructor() {
    this.userId = '';
    this.username = '';
    this.channelStatus = ChannelStatus.UNKNOWN;
    this.modules = [];
    this.title = '';
    this.description = '';
    this.streamKey = '';
    this.tags = [];
    this.directory = '';
    this.followers = 0;
  }

  /**
   * Unboxes object to a ChannelData instance
   * @param {Object} obj
   * @return {ChannelData}
   */
  cast(obj: Object): ChannelData {
    obj && Object.assign(this, obj);
    return this;
  }
}

/**
 * @type ChannelModule
 * @property {string} moduleId
 * @property {string} viewPath
 * @property {string} jsPath
 * @property {string[]} params
 */
class ChannelModule {
  moduleId: string;
  viewPath: string;
  jsPath: string;
  params: string[];

  constructor() {
    this.moduleId = '';
    this.viewPath = '';
    this.jsPath = '';
    this.params = [];
  }

  /**
   * Unboxes object to a ChannelModule instance
   * @param {Object} obj
   * @return {ChannelModule}
   */
  cast(obj: Object): ChannelModule {
    obj && Object.assign(this, obj);
    return this;
  }
}

/**
 * @const ChannelStatus
 * @property {number} ONLINE -
 * @type {{UNKNOWN: number, LURKING: number, ONLINE: number, OFFLINE: number}}
 */
enum ChannelStatus {
  'ONLINE' = 0,
  'OFFLINE' = 1,
  'LURKING' = 2,
  'UNKNOWN' = 3
}

/**
 * @type {Object} Settings
 * @property {SettingsType} type
 * @property {Object} channel
 * @property {string} user.title
 * @property {string} user.description
 * @property {string} user.tags
 * @property {string} user.displayName
 * @property {Object} user
 * @property {string} user.directory
 */
class Settings {
  type: SettingsType;
  channel: {
    title: string;
    description: string;
    tags: string;
    directory: string;
  };
  user: {
    displayName: string;
  };

  constructor() {
    this.type = SettingsType.UNDEFINED;
    this.channel = {
      title: '',
      description: '',
      tags: '',
      directory: ''
    };
    this.user = {
      displayName: ''
    };
  }

  /**
   * Unboxes object to a Settings instance
   * @param {Object} obj
   * @return {Settings}
   */
  cast(obj: Object): Settings {
    obj && Object.assign(this, obj);
    return this;
  }
}

/**
 * @const SettingsType
 * @type {{UNDEFINED: number, USER_DATA: number, CHANNEL_DATA: number}}
 */
enum SettingsType {
  UNDEFINED = 0,
  USER_DATA = 1,
  CHANNEL_DATA = 2
}

export {
  UserData,
  UserDataTypes,
  ChannelData,
  ChannelModule,
  ChannelStatus,
  Settings,
  SettingsType
};
