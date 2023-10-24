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
 **/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  const currentUser = res.locals.user.username;
  const id = req.params.id;

  const message = await get(id);

  if (message.from_user.username === currentUser ||
      message.to_user.username === currentUser) {

    return res.json({ message });
  }
  throw new UnauthorizedError("Must be an associated user");
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { to_username, body } = req.body;
  const from_username = res.locals.user.username;

  if (! await User.get(to_username)) {
    throw new BadRequestError(`${to_username} not found`);
  }

  const message = await create({ from_username, to_username, body });

  return res.json({ message });
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {

  const id = req.params.id;
  const messageData = await get(id);
  const currentUser = res.locals.user.username;

  if (messageData.to_user.username === currentUser) {
    const message = await markRead(id);
    
    return res.json({ message });
  }
  throw new UnauthorizedError;
});


module.exports = router;