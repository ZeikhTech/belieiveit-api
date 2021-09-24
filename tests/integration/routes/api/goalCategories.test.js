const request = require("supertest");
const mongoose = require("mongoose");

const GoalCategory = require("../../../../models/GoalCategory");

const {
  generateUserSession,
  cleanUserSession,
} = require("../../test_helpers/userSessionHelper");
const { ADMIN } = require("../../../../enums/roles");

let server;
describe("/api/goal_categories/", () => {
  beforeEach(() => {
    server = require("../../../../index");
  });
  afterEach(async () => {
    server.close();
    await GoalCategory.deleteMany({});
  });

  describe("GET /api/goal_categories/:id", () => {
    const route = "/api/goal_categories/";

    it("should return 404 response and error body if goal category of given id is not available", async () => {
      const result = await request(server).get(
        route + mongoose.Types.ObjectId().toHexString()
      );
      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 200 response and goal category of given id", async () => {
      const category = await new GoalCategory({
        name: "category",
        color: "#ffffff",
      }).save();

      const result = await request(server).get(
        route + category._id.toHexString()
      );
      expect(result.status).toBe(200);

      expect(result.body._id).toEqual(category._id.toHexString());
    });
  });

  describe("GET /api/goal_categories", () => {
    const route = "/api/goal_categories/";

    it("should return 200 response and goal categories array", async () => {
      const category = await new GoalCategory({
        name: "category",
        color: "#ffffff",
      }).save();

      const result = await request(server).get(route);
      expect(result.status).toBe(200);

      expect(
        result.body.some((cat) => cat._id === category._id.toHexString())
      ).toBeTruthy();
    });
  });

  describe("POST /api/goal_categories", () => {
    const route = "/api/goal_categories/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {
        color: "1234567",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return response with 200 status code and goal category", async () => {
      const body = {
        name: "category",
        color: "#ffffff",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject(body);
    });

    it("should create a new new goal category.", async () => {
      const body = {
        name: "category",
        color: "#ffffff",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);
      const category = await GoalCategory.findOne(body);
      expect(category._id.toHexString()).toEqual(result.body._id);
    });
  });

  describe("PUT /api/goal_categories/:id", () => {
    const route = "/api/goal_categories/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {
        color: "1234567",
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 404 response and error body if goal category of given id is not available", async () => {
      const body = {
        name: "category",
        color: "#ffffff",
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should update the category of given id", async () => {
      const category = await new GoalCategory({
        name: "category",
        color: "#ffffff",
      }).save();

      const body = {
        name: "updated name",
        color: "#000000",
      };

      await request(server)
        .put(route + category._id.toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      const updatedCategory = await GoalCategory.findById(category._id);

      expect(updatedCategory).toMatchObject(body);
      expect(category._id.toHexString()).toEqual(
        updatedCategory._id.toHexString()
      );
    });

    it("should return 200 status code with updated category", async () => {
      const category = await new GoalCategory({
        name: "category",
        color: "#ffffff",
      }).save();

      const updateData = {
        name: "updated name",
        color: "#000000",
      };

      const result = await request(server)
        .put(route + category._id.toHexString())
        .set("x-auth-token", authToken)
        .send(updateData);

      expect(result.body).toMatchObject(updateData);
      expect(result.body._id).toEqual(category._id.toHexString());
    });
  });

  describe("DELETE /api/goal_categories/:id", () => {
    const route = "/api/goal_categories/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 200 status code with deleted category", async () => {
      const category = await new GoalCategory({
        name: "category",
        color: "#ffffff",
      }).save();

      const result = await request(server)
        .delete(route + category._id.toHexString())
        .set("x-auth-token", authToken);

      expect(result.status).toBe(200);
      expect(result.body._id).toEqual(category._id.toHexString());
    });

    it("should deleted the category of the given id", async () => {
      const category = await new GoalCategory({
        name: "category",
        color: "#ffffff",
      }).save();

      await request(server)
        .delete(route + category._id.toHexString())
        .set("x-auth-token", authToken);

      const deleted = await GoalCategory.findById(category._id);
      expect(deleted).toBeNull();
    });
  });
});
