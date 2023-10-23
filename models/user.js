"use strict";

/** User of the site. */
const { NotFoundError, UnauthorizedError } = require("../expressError");
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const moment = require("moment");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    // const currentTime = new Date();
    const currentTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    const result = await db.query(`
    INSERT INTO users (username, password, first_name, last_name, phone, join_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone, currentTime]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`
    SELECT password FROM users WHERE username = $1`, [username]);

    const user = result.rows[0];
    if (user) {
      return await bcrypt.compare(password, user.password);
    }
    throw new UnauthorizedError("Invalid username");
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    // const currentTime = new Date();
    const currentTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    await db.query(`
    UPDATE users SET last_login_at = $1 WHERE username = $2`, [currentTime, username]);

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(`
    SELECT username, first_name, last_name FROM users`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username = $1`, [username]);

    const user = result.rows[0];

    if (user) {
      return user;
    }
    throw new NotFoundError(`${username} does not exist.`);
  }

  /** Return messages from this user.
   *
   * [{id, {username, first_name, last_name, phone}, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`
    SELECT m.id,
           t.username,
           t.first_name,
           t.last_name,
           t.phone,
           m.body,
           m.sent_at,
           m.read_at
    FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
    WHERE m.from_username = $1`, [username]);

    let messageList = result.rows;

    if (!messageList) throw new NotFoundError(`No messages from ${username}`);

    let messages = messageList.map(m => ({
      id: m.id,
      to_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`
    SELECT m.id,
           f.username,
           f.first_name,
           f.last_name,
           f.phone,
           m.body,
           m.sent_at,
           m.read_at
    FROM messages AS m
          JOIN users AS f ON m.from_username = f.username
          JOIN users AS t ON m.to_username = t.username
    WHERE m.to_username = $1`, [username]);

    let messageList = result.rows;

    if (!messageList) throw new NotFoundError(`No messages from ${username}`);

    let messages = messageList.map(m => ({
      id: m.id,
      from_user: {
        username: m.username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
    return messages;
  }
}


module.exports = User;
