import User from '../db/models/user.js';
import bcrypt from 'bcryptjs';


export default class UserService {
  /**
   * Creates a user and returns it when successful, otherwise undefined
   * is returned.
   * @param {any} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError: boolean}} options
   * @returns {Promise<any>}
   */
  static async create(data, options) {
    try {
      if ((data.password || '').trim()) {
        if (process.env.SECURITY_PASSWORD_ENCRYPT === 'true') {
          // Let's encrypt password before inserting to DB
          data.password = bcrypt.hashSync(data.password, 8);
        }
      } else {
        // This will make it fail on purpose (password is required in DB)
        data.password = undefined;
      }
      const user = await User.create(data);
      return options?.returnPlain ? user.get({ plain: true }) : user;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }

  static async authenticate(username, password, options) {
    try {
      const user = await User.findOne({ where: { username } });

      let authenticated = false;
      if (process.env.SECURITY_PASSWORD_ENCRYPT === 'true') {
        authenticated = bcrypt.compareSync(password, user.password);
      } else {
        authenticated = password === user.password;
      }

      return authenticated ? user.get({ plain: true }) : undefined;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }
}
