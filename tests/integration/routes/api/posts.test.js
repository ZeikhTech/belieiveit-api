const request = require("supertest");
const mongoose = require("mongoose");

const Post = require("../../../../models/Post");

const {
  generateUserSession,
  cleanUserSession,
} = require("../../test_helpers/userSessionHelper");
const { ADMIN } = require("../../../../enums/roles");

let server;
describe("/api/posts/", () => {
  beforeEach(() => {
    server = require("../../../../index");
  });
  afterEach(async () => {
    server.close();
    await Post.deleteMany({});
  });

  describe("GET /api/posts/:id", () => {
    const route = "/api/posts/";

    it("should return 404 response and error body if post of given id is not available", async () => {
      const result = await request(server).get(
        route + mongoose.Types.ObjectId().toHexString()
      );
      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 200 response and post of given id", async () => {
      const post = await new Post({
        title: "this is a test youtube video",
        type: "youtube_video",
        youtubeVideo: "youtube_video",
      }).save();

      const result = await request(server).get(route + post._id.toHexString());
      expect(result.status).toBe(200);
      expect(result.body._id).toEqual(post._id.toHexString());
    });
  });

  describe("GET /api/posts", () => {
    const route = "/api/posts/";

    it("should return 200 response and posts array", async () => {
      const post = await new Post({
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      }).save();

      const result = await request(server).get(route);
      expect(result.status).toBe(200);

      expect(
        result.body.some((cat) => cat._id === post._id.toHexString())
      ).toBeTruthy();
    });
  });

  describe("POST /api/posts", () => {
    const route = "/api/posts/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {};
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return response with 200 status code and post", async () => {
      const body = {
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject(body);
    });

    it("should create a new new post.", async () => {
      const body = {
        title: "this is a test post",
        type: "blog",
        htmlContent: "this is html content",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);
      const post = await Post.findOne(body);
      expect(post._id.toHexString()).toEqual(result.body._id);
    });
  });

  describe("PUT /api/posts/:id", () => {
    const route = "/api/posts/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {};
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 404 response and error body if post of given id is not available", async () => {
      const body = {
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should update the category of given id", async () => {
      const post = await new Post({
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      }).save();

      const body = {
        title: "this is a test post",
        type: "blog",
        htmlContent: "this is html content",
      };

      await request(server)
        .put(route + post._id.toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      const updatedPost = await Post.findById(post._id);

      expect(updatedPost).toMatchObject(body);
      expect(post._id.toHexString()).toEqual(updatedPost._id.toHexString());
    });

    it("should return 200 status code with updated post", async () => {
      const post = await new Post({
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      }).save();

      const updateData = {
        title: "this is a test post",
        type: "blog",
        htmlContent: "this is html content",
      };

      const result = await request(server)
        .put(route + post._id.toHexString())
        .set("x-auth-token", authToken)
        .send(updateData);

      expect(result.body).toMatchObject(updateData);
      expect(result.body._id).toEqual(post._id.toHexString());
    });
  });

  describe("DELETE /api/posts/:id", () => {
    const route = "/api/posts/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 200 status code with deleted category", async () => {
      const post = await new Post({
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      }).save();

      const result = await request(server)
        .delete(route + post._id.toHexString())
        .set("x-auth-token", authToken);

      expect(result.status).toBe(200);
      expect(result.body._id).toEqual(post._id.toHexString());
    });

    it("should deleted the category of the given id", async () => {
      const post = await new Post({
        title: "this is a test post",
        type: "youtube_video",
        youtubeVideo: "video_id",
      }).save();

      await request(server)
        .delete(route + post._id.toHexString())
        .set("x-auth-token", authToken);

      const deleted = await Post.findById(post._id);
      expect(deleted).toBeNull();
    });
  });
});
