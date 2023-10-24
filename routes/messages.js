"use strict";

const Router = require("express").Router;
const router = new Router();
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")
const { create, markRead, get } = require("../models/message");
const { UnauthorizedError } = require("../expressError");

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
router.get("/:id",ensureLoggedIn, async function (req, res, next) {
  const currentUser = res.locals.user.username
  const id = req.params.id

  const message = await get(id)

  if (message.from_user.username === currentUser  || message.to_user.username === currentUser){
    return res.json({ message })
  } throw new UnauthorizedError("Must be an associated user")

})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/


module.exports = router;