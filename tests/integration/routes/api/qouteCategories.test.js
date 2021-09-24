const request = require("supertest");
const mongoose = require("mongoose");

const QouteCategory = require("../../../../models/QouteCategory");
const Qoutation = require("../../../../models/Qoutation");

const {
  generateUserSession,
  cleanUserSession,
} = require("../../test_helpers/userSessionHelper");
const { ADMIN } = require("../../../../enums/roles");

let server;
describe("/api/qoute_categories/", () => {
  beforeEach(() => {
    server = require("../../../../index");
  });
  afterEach(async () => {
    server.close();
    await QouteCategory.deleteMany({});
    await Qoutation.deleteMany({});
  });

  describe("GET /api/qoute_categories/:id", () => {
    const route = "/api/qoute_categories/";

    it("should return 404 response and error body if qoute category of given id is not available", async () => {
      const result = await request(server).get(
        route + mongoose.Types.ObjectId().toHexString()
      );
      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 200 response and qoute category of given id", async () => {
      const category = await new QouteCategory({
        name: "category",
        isFree: true,
      }).save();

      const result = await request(server).get(
        route + category._id.toHexString()
      );
      expect(result.status).toBe(200);

      expect(result.body._id).toEqual(category._id.toHexString());
    });
  });

  describe("GET /api/qoute_categories", () => {
    const route = "/api/qoute_categories/";

    it("should return 200 response and qoute categories array", async () => {
      const category = await new QouteCategory({
        name: "category",
        isFree: true,
      }).save();

      const result = await request(server).get(route);
      expect(result.status).toBe(200);

      expect(
        result.body.some((cat) => cat._id === category._id.toHexString())
      ).toBeTruthy();
    });
  });

  describe("POST /api/qoute_categories", () => {
    const route = "/api/qoute_categories/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {
        isFree: "1234567",
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return response with 200 status code and qoute category", async () => {
      const body = {
        name: "category",
        isFree: true,
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject(body);
    });

    it("should create a new new qoute category.", async () => {
      const body = {
        name: "category",
        isFree: true,
      };
      const result = await request(server)
        .post(route)
        .set("x-auth-token", authToken)
        .send(body);
      const category = await QouteCategory.findOne(body);
      expect(category._id.toHexString()).toEqual(result.body._id);
    });
  });

  describe("PUT /api/qoute_categories/:id", () => {
    const route = "/api/qoute_categories/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 400 response with error if request body is not valid", async () => {
      const body = {
        isFree: "1234567",
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(400);
      expect(result.body.error).not.toBeNull();
    });

    it("should return 404 response and error body if qoute category of given id is not available", async () => {
      const body = {
        name: "category",
        isFree: true,
      };
      const result = await request(server)
        .put(route + mongoose.Types.ObjectId().toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      expect(result.status).toBe(404);
      expect(result.body.error).not.toBeNull();
    });

    it("should update the category of given id an also the qoutaions of that id", async () => {
      const category = await new QouteCategory({
        name: "category",
        isFree: true,
      }).save();

      const qoutation = await new Qoutation({
        qoutation: "this is a test qoutation.",
        category,
      }).save();

      const body = {
        name: "updated name",
        isFree: false,
      };

      await request(server)
        .put(route + category._id.toHexString())
        .set("x-auth-token", authToken)
        .send(body);

      const updatedCategory = await QouteCategory.findById(category._id);

      const updatedQoutation = await Qoutation.findById(qoutation._id);

      expect(updatedCategory).toMatchObject(body);
      expect(category._id.toHexString()).toEqual(
        updatedCategory._id.toHexString()
      );

      expect(updatedQoutation.category.name).toBe(body.name);
      expect(updatedQoutation.category.isFree).toBe(body.isFree);
    });

    it("should return 200 status code with updated category", async () => {
      const category = await new QouteCategory({
        name: "category",
        isFree: true,
      }).save();

      const updateData = {
        name: "updated name",
        isFree: true,
      };

      const result = await request(server)
        .put(route + category._id.toHexString())
        .set("x-auth-token", authToken)
        .send(updateData);

      expect(result.body).toMatchObject(updateData);
      expect(result.body._id).toEqual(category._id.toHexString());
    });
  });

  describe("DELETE /api/qoute_categories/:id", () => {
    const route = "/api/qoute_categories/";

    let authToken = "";

    beforeEach(async () => {
      const { token } = await generateUserSession(ADMIN);
      authToken = token;
    });

    afterEach(cleanUserSession);

    it("should return 200 status code with deleted category", async () => {
      const category = await new QouteCategory({
        name: "category",
        isFree: true,
      }).save();

      const result = await request(server)
        .delete(route + category._id.toHexString())
        .set("x-auth-token", authToken);

      expect(result.status).toBe(200);
      expect(result.body._id).toEqual(category._id.toHexString());
    });

    it("should deleted the category of the given id", async () => {
      const category = await new QouteCategory({
        name: "category",
        isFree: true,
      }).save();

      await request(server)
        .delete(route + category._id.toHexString())
        .set("x-auth-token", authToken);

      const deleted = await QouteCategory.findById(category._id);
      expect(deleted).toBeNull();
    });
  });
});
