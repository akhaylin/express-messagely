"use strict";

const Router = require("express").Router;
const router = new Router();
const { ensureLoggedIn } = require("../middleware/auth");
const User = require("../models/user");
const { create, markRead, get } = require("../models/message");
const { UnauthorizedError, BadRequestError } = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 * Auth requirements: user must be logged in and associated with the given message.
 **/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  const currentUsername = res.locals.user.username;
  const id = req.params.id;

  const message = await get(id);

  if (message.from_user.username === currentUsername ||
    message.to_user.username === currentUsername) {

    return res.json({ message });
  }
  throw new UnauthorizedError("Must be an associated user");
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 * Auth requirements: user must be logged in.
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { to_username, body } = req.body;
  const from_username = res.locals.user.username;

  const message = await create({ from_username, to_username, body });

  if (!message) throw new BadRequestError(`${to_username} not found`);

  return res.json({ message });
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 * Auth requirements: user must be logged in and the message recipient.
 **/
router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {

  const id = req.params.id;
  const msg = await get(id);
  const currentUsername = res.locals.user.username;

  if (!(msg.to_user.username === currentUsername)) {
    throw new UnauthorizedError();
  }
  const message = await markRead(id);

  return res.json({ message });
});


module.exports = router;