"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
let token = '';
let m2Id;
let m1Id;

describe("Auth Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550000",
    });

    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "Message 1"
    });
    m1Id = m1.id;

    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "Message 2"
    });
    m2Id = m2.id;

    let response = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });

    token = response.body.token;
  });

  /** POST /auth/register => token  */

  describe("GET /users/", function () {
    test("can get all users", async function () {
      let response = await request(app).get(`/users/?_token=${token}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        users:
        [{
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1"
        },
        {
          username: "test2",
          first_name: "Test2",
          last_name: "Testy2"
        }]
      });
    });

    /** POST /auth/login => token  */

    describe("GET /users/:username", function () {
      test("can get a user by username", async function () {
        let response = await request(app).get(`/users/test1?_token=${token}`);
        expect(response.statusCode).toEqual(200);
        console.log("TYPE",typeof response.body.user.join_at)
        expect(response.body).toEqual({
          user:
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
            join_at: expect.any(String),
            last_login_at: expect.any(String)
          }
        });

      });

      test("fail can get a user by username (doesn't exist)", async function () {
        let response = await request(app).get("/users/DoesNotExist");
        expect(response.statusCode).toEqual(401);
        expect(response.body).toEqual({
          error: {
            message: "Unauthorized",
            status: 401
          }
        });

      });

    });

  });
  describe("GET /users/:username/to", function () {
    test("can get messages to a user", async function () {
      let response = await request(app).get(`/users/test1/to?_token=${token}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        messages: [
          {
            id: m2Id,
            body: "Message 2",
            sent_at: expect.any(String),
            read_at: null,
            from_user:
            {
              username: "test2",
              first_name: "Test2",
              last_name: "Testy2",
              phone: "+14155550000"
            }
          }
        ]
      }
      );
    });
  });

  describe("GET /users/:username/from", function () {
    test("can get messages from a user", async function () {
      let response = await request(app).get(`/users/test1/from?_token=${token}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        messages: [
          {
            id: m1Id,
            body: "Message 1",
            sent_at: expect.any(String),
            read_at: null,
            to_user:
            {
              username: "test2",
              first_name: "Test2",
              last_name: "Testy2",
              phone: "+14155550000"
            }
          }
        ]
      }
      );
    });
  })
});
afterAll(async function () {
  await db.end();
});



